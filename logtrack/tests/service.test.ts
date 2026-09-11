import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import path from "node:path";

test("serviço: persistência, concorrência, auditoria, permissões e cadastros", async t => {
  process.env.DEMO_MODE = "true";
  delete process.env.VERCEL;
  process.env.DEMO_DATA_DIR = path.resolve("test-results", "unit-" + randomUUID());
  process.env.SUPERVISOR_EMAIL = "test@example.test";
  process.env.SUPERVISOR_PASSWORD = "test-only-password";
  process.env.NEXTAUTH_SECRET = "test-only-secret-with-at-least-32-characters";
  const { readState } = await import("../src/lib/store");
  const { registerRead, mutate, dashboard } = await import("../src/lib/service");
  const { signStation, verifyStation } = await import("../src/lib/security");
  const initial = await readState();
  const lot = initial.lotes[0];
  const station = initial.celulares[0];
  const cookie = signStation(station.id, station.tokenCookie);
  const origin = "http://localhost:3000";

  await t.test("modo consulta não movimenta e gera auditoria", async () => {
    const result = await registerRead(lot.id, randomUUID());
    assert.equal(result.modo, "CONSULTA");
    assert.equal(result.lote.zonaAtualId, null);
    const state = await readState(); assert.equal(state.movimentacoes.length, 0); assert.equal(state.leituras.length, 1);
  });
  await t.test("retries concorrentes registram uma única movimentação", async () => {
    const requestId = randomUUID();
    const results = await Promise.all(Array.from({ length: 5 }, () => registerRead(lot.id, requestId, cookie)));
    for (const result of results) assert.deepEqual(result, results[0]);
    assert.equal(results[0].modo, "MOVIMENTO");
    assert.equal((await readState()).movimentacoes.length, 1);
    await assert.rejects(registerRead(initial.lotes[1].id, requestId, cookie), /já utilizado/);
  });
  await t.test("nova leitura cancela sem modificar o evento anterior", async () => {
    const before = (await readState()).movimentacoes[0];
    const result = await registerRead(lot.id, randomUUID(), cookie);
    assert.equal(result.modo, "CANCELAMENTO"); assert.equal(result.lote.zonaAtualId, null);
    const state = await readState(); assert.equal(state.movimentacoes.length, 2); assert.deepEqual(state.movimentacoes[0], before);
    assert.ok(state.celulares[0].ultimoUso);
  });
  await t.test("rotação revoga cookie anterior e cookie adulterado vira consulta", async () => {
    await mutate("celulares", station.id, "regenerar-token", "POST", {}, origin);
    assert.equal((await registerRead(lot.id, randomUUID(), cookie)).modo, "CONSULTA");
    const forged = cookie.slice(0, -1) + (cookie.endsWith("a") ? "b" : "a");
    assert.equal(verifyStation(forged), null);
    assert.equal((await registerRead(lot.id, randomUUID(), forged)).modo, "CONSULTA");
  });
  await t.test("estação desativada não movimenta", async () => {
    const other = initial.celulares[1];
    await mutate("celulares", other.id, undefined, "PATCH", { ativo: false }, origin);
    assert.equal((await registerRead(lot.id, randomUUID(), signStation(other.id, other.tokenCookie))).modo, "CONSULTA");
  });
  await t.test("não desativa zona ocupada e alteração de status preserva descrição", async () => {
    const zone = initial.zonas[2];
    await assert.rejects(mutate("zonas", zone.id, undefined, "PATCH", { ativa: false }, origin), /desative as estações/);
    await mutate("zonas", zone.id, undefined, "PATCH", { ativa: true }, origin);
    assert.equal((await readState()).zonas[2].descricao, zone.descricao);
  });
  await t.test("valida lotes, normaliza código e preserva projeção nas edições", async () => {
    await assert.rejects(mutate("lotes", undefined, undefined, "POST", { codigo: "INVALID", quantidade: 2, dataValidade: "2026-02-30" }, origin));
    await assert.rejects(mutate("lotes", undefined, undefined, "POST", { codigo: lot.codigo.toLowerCase(), quantidade: 2, dataValidade: null }, origin), /já pertence/);
    await mutate("lotes", lot.id, undefined, "PATCH", { codigo: "EDITADO", descricao: "Peças", quantidade: 10, dataValidade: null, zonaAtualId: "adulterado" }, origin);
    assert.equal((await readState()).lotes[0].zonaAtualId, null);
    await mutate("lotes", lot.id, undefined, "DELETE", {}, origin);
    const third = initial.celulares[2];
    assert.equal((await registerRead(lot.id, randomUUID(), signStation(third.id, third.tokenCookie))).modo, "CONSULTA");
  });
  await t.test("histórico público limitado a cinco; painel mantém auditoria completa sem tokens", async () => {
    const third = initial.celulares[2]; const token = signStation(third.id, third.tokenCookie);
    let last;
    for (let i = 0; i < 7; i++) last = await registerRead(initial.lotes[2].id, randomUUID(), token);
    assert.equal(last?.historico.length, 5);
    const data = await dashboard();
    assert.equal(data.movimentacoes.filter(m => m.loteId === initial.lotes[2].id).length, 7);
    assert.ok(data.celulares.every(c => !("tokenCookie" in c)));
  });
  await t.test("exclusão de lote em zona preserva histórico e impede novas operações", async () => {
    const target = initial.lotes[2];
    const third = initial.celulares[2];
    const before = await readState();
    const original = before.lotes.find(l => l.id === target.id)!;
    assert.ok(original.zonaAtualId);
    await mutate("lotes", target.id, undefined, "DELETE", {}, origin);
    await mutate("lotes", target.id, undefined, "DELETE", {}, origin);
    const after = await readState();
    assert.equal(after.lotes.find(l => l.id === target.id)?.arquivado, true);
    assert.deepEqual(after.movimentacoes, before.movimentacoes);
    assert.equal(after.lotes.find(l => l.id === target.id)?.zonaAtualId, original.zonaAtualId);
    const { filterLots } = await import("../src/lib/filters");
    assert.ok(!filterLots(after, new URLSearchParams()).some(l => l.id === target.id));
    const reading = await registerRead(target.id, randomUUID(), signStation(third.id, third.tokenCookie));
    assert.equal(reading.modo, "CONSULTA");
    assert.match(reading.mensagem, /lote excluído/);
    await assert.rejects(mutate("lotes", target.id, "gravar-tag", "POST", {}, origin), /apenas para consulta/);
    await assert.rejects(mutate("lotes", target.id, undefined, "PATCH", { codigo: "NOVO" }, origin), /apenas para consulta/);
    await mutate("celulares", third.id, undefined, "PATCH", { ativo: false }, origin);
    await mutate("zonas", third.zonaId, undefined, "PATCH", { ativa: false }, origin);
    assert.equal((await readState()).zonas.find(z => z.id === third.zonaId)?.ativa, false);
  });
});
