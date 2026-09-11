import { test } from "node:test";
import assert from "node:assert/strict";
import { decideMovement } from "../src/lib/movement";

const stations = ["A", "B", "C"].map((zonaId, i) => ({ id: "celular-" + (i + 1), zonaId }));
for (const previous of [null, ...stations]) {
  for (const station of stations) {
    test(`tabela: ${previous?.zonaId || "Sem Zona"}, leitura por ${station.id}`, () => {
      const result = decideMovement({ zonaAtualId: previous?.zonaId ?? null, ultimoCelularId: previous?.id ?? null }, station);
      const cancel = previous?.id === station.id;
      assert.equal(result.zonaOrigemId, previous?.zonaId ?? null);
      assert.equal(result.zonaDestinoId, cancel ? null : station.zonaId);
      assert.equal(result.tipo, cancel ? "CANCELAMENTO" : "MOVIMENTO");
    });
  }
}
test("sequência cronológica de sete leituras da especificação", () => {
  let current: { zonaAtualId: string | null; ultimoCelularId: string | null } = { zonaAtualId: null, ultimoCelularId: null };
  const actual = [0, 0, 1, 2, 2, 2, 0].map(index => {
    const next = decideMovement(current, stations[index]);
    current = { zonaAtualId: next.zonaDestinoId, ultimoCelularId: next.ultimoCelularId };
    return current.zonaAtualId;
  });
  assert.deepEqual(actual, ["A", null, "B", "C", null, "C", "A"]);
});
test("celulares distintos na mesma zona registram movimento, sem cancelamento", () => {
  const result = decideMovement({ zonaAtualId: "A", ultimoCelularId: "outro" }, stations[0]);
  assert.equal(result.tipo, "MOVIMENTO"); assert.equal(result.zonaDestinoId, "A");
});
