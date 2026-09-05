import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { hashToken, newToken } from "./security";
import type { State } from "./types";
export async function createSeed(email: string, password: string) {
  const now = new Date();
  const iso = now.toISOString();
  const state: State = { supervisores: [{ id: randomUUID(), nome: "Supervisor CTMAQ", email: email.toLowerCase(), senhaHash: await hash(password, 12), criadoEm: iso }], zonas: [], celulares: [], lotes: [], movimentacoes: [], leituras: [] };
  const activation: { nome: string; path: string }[] = [];
  ["Recebimento", "Almoxarifado", "Expedição"].forEach((nome, i) => {
    const zonaId = randomUUID();
    state.zonas.push({ id: zonaId, nome: "Zona " + "ABC"[i] + " — " + nome, descricao: ["Entrada e conferência de materiais", "Armazenamento e controle de estoque", "Preparação e saída de pedidos"][i], ativa: true, criadoEm: iso });
    const token = newToken();
    state.celulares.push({ id: randomUUID(), nome: "Celular " + (i + 1) + " — " + nome, zonaId, tokenCookie: hashToken(token), ativo: true, ultimoUso: null, criadoEm: iso });
    activation.push({ nome: "Celular " + (i + 1), path: "/ativar/" + token });
  });
  ["Rolamentos de precisão", "Chapas de aço inox", "Conectores hidráulicos", "Anéis de vedação", "Parafusos sextavados"].forEach((descricao, i) => {
    const expiry = new Date(now); expiry.setUTCDate(expiry.getUTCDate() + [120, 12, 64, -3, 180][i]);
    state.lotes.push({ id: randomUUID(), codigo: "LT-" + now.getUTCFullYear() + "-" + String(i + 1).padStart(4, "0"), descricao, quantidade: [240, 80, 150, 500, 1200][i], dataValidade: expiry.toISOString().slice(0, 10), zonaAtualId: null, ultimoCelularId: null, tagGravada: false, arquivado: false, criadoEm: iso });
  });
  return { state, activation };
}
