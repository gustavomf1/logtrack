import { randomUUID } from "node:crypto";
import { z } from "zod";
import { readState, transaction } from "./store";
import { hashToken, newToken, verifyStation } from "./security";
import { decideMovement } from "./movement";
import { zoneName } from "./format";
import { broadcastMovement } from "./realtime";
export { filterLots } from "./filters";
import type { DashboardData, ReadResult, State } from "./types";
export class AppError extends Error { constructor(public status: number, message: string) { super(message); } }
const idSchema = z.string().uuid();
const text = z.string().trim().min(1, "Preencha o nome.").max(100);
const description = z.string().trim().max(2000).nullable().optional().transform(x => x || null);
const lotSchema = z.object({
  codigo: text,
  descricao: description,
  quantidade: z.number().int().min(0).max(2147483647).nullable(),
  dataValidade: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, "Data inválida.").nullable(),
});
export async function dashboard(): Promise<DashboardData> {
  const state = await readState();
  return { zonas: state.zonas, lotes: state.lotes, movimentacoes: state.movimentacoes.sort((a,b) => b.timestamp.localeCompare(a.timestamp)), portais: state.portais.map(({ tokenCookie: _, ...portal }) => portal), totalLeituras: state.leituras.length };
}
export async function mutate(resource: string, id: string | undefined, action: string | undefined, method: string, body: unknown, origin: string) {
  if (id) idSchema.parse(id);
  return transaction(state => {
    const now = new Date().toISOString();
    if (resource === "zonas") {
      if (method === "POST" && !id) {
        const values = z.object({ nome: text, descricao: description }).parse(body);
        if (state.zonas.some(x => x.nome.toLowerCase() === values.nome.toLowerCase())) throw new AppError(409, "Já existe uma zona com esse nome.");
        const zona = { id: randomUUID(), ...values, ativa: true, criadoEm: now }; state.zonas.push(zona); return zona;
      }
      const zona = state.zonas.find(x => x.id === id);
      if (!zona) throw new AppError(404, "Zona não encontrada.");
      const values = method === "DELETE" ? { ativa: false } : z.object({ nome: text.optional(), descricao: description, ativa: z.boolean().optional() }).partial().parse(body);
      if (values.ativa === false && (state.lotes.some(x => !x.arquivado && x.zonaAtualId === id) || state.portais.some(x => x.zonaId === id && x.ativo))) throw new AppError(409, "Mova os lotes e desative as estações antes de desativar a zona.");
      if ("nome" in values && values.nome && state.zonas.some(x => x.id !== id && x.nome.toLowerCase() === values.nome!.toLowerCase())) throw new AppError(409, "Já existe uma zona com esse nome.");
      Object.assign(zona, values); return zona;
    }
    if (resource === "portais") {
      if (method === "POST" && !id) {
        const values = z.object({ nome: text, zonaId: idSchema }).parse(body);
        if (!state.zonas.some(x => x.id === values.zonaId && x.ativa)) throw new AppError(400, "Selecione uma zona ativa.");
        const token = newToken();
        const portal = { id: randomUUID(), ...values, tokenCookie: hashToken(token), ativo: true, ultimoUso: null, criadoEm: now };
        state.portais.push(portal);
        const { tokenCookie: _, ...safe } = portal;
        return { ...safe, activationUrl: origin + "/ativar/" + token };
      }
      const portal = state.portais.find(x => x.id === id);
      if (!portal) throw new AppError(404, "Portal não encontrado.");
      if (action === "regenerar-token" && method === "POST") {
        const token = newToken(); portal.tokenCookie = hashToken(token);
        return { activationUrl: origin + "/ativar/" + token };
      }
      const values = method === "DELETE" ? { ativo: false } : z.object({ nome: text.optional(), ativo: z.boolean().optional() }).parse(body);
      if (values.ativo && !state.zonas.some(x => x.id === portal.zonaId && x.ativa)) throw new AppError(409, "Reative a zona antes de ativar esta estação.");
      Object.assign(portal, values);
      const { tokenCookie: _, ...safe } = portal; return safe;
    }
    if (resource === "lotes") {
      if (method === "POST" && !id) {
        const values = lotSchema.parse(body);
        if (state.lotes.some(x => x.codigo.toLowerCase() === values.codigo.toLowerCase())) throw new AppError(409, "Esse código já pertence a um lote.");
        const lote = { id: randomUUID(), ...values, zonaAtualId: null, ultimoPortalId: null, tagGravada: false, arquivado: false, criadoEm: now };
        state.lotes.push(lote); return { ...lote, url: origin + "/l/" + lote.id };
      }
      const lote = state.lotes.find(x => x.id === id);
      if (!lote) throw new AppError(404, "Lote não encontrado.");
      if (method === "DELETE") {
        lote.arquivado = true; return lote;
      }
      if (lote.arquivado) throw new AppError(409, "Este lote foi excluído e está disponível apenas para consulta.");
      if (action === "gravar-tag" && method === "POST") { lote.tagGravada = true; return lote; }
      const values = lotSchema.parse(body);
      if (state.lotes.some(x => x.id !== id && x.codigo.toLowerCase() === values.codigo.toLowerCase())) throw new AppError(409, "Esse código já pertence a um lote.");
      Object.assign(lote, values); return lote;
    }
    throw new AppError(404, "Recurso não encontrado.");
  });
}
export function history(state: State, id: string) {
  return state.movimentacoes.filter(x => x.loteId === id).sort((a,b) => b.timestamp.localeCompare(a.timestamp)).slice(0,5).map(x => ({
    id: x.id, origem: zoneName(state.zonas, x.zonaOrigemId), destino: zoneName(state.zonas, x.zonaDestinoId),
    portal: state.portais.find(c => c.id === x.portalId)?.nome || "Estação", timestamp: x.timestamp, tipo: x.tipo,
  }));
}
export async function registerRead(id: string, requestId: string, cookie?: string): Promise<ReadResult> {
  idSchema.parse(id); idSchema.parse(requestId);
  const identity = verifyStation(cookie);
  let movement: { zonaOrigemId: string | null; zonaDestinoId: string | null; portalId: string; tipo: "MOVIMENTO" | "CANCELAMENTO"; timestamp: string } | undefined;
  const result = await transaction(state => {
    const lote = state.lotes.find(x => x.id === id);
    if (!lote) throw new AppError(404, "Lote não encontrado.");
    const portal = identity ? state.portais.find(x => x.id === identity.id && x.tokenCookie === identity.tokenHash && x.ativo && state.zonas.some(z => z.id === x.zonaId && z.ativa)) : undefined;
    const existing = state.leituras.find(x => x.id === requestId);
    if (existing) {
      if (existing.loteId !== id || existing.portalId !== (portal?.id ?? null)) throw new AppError(409, "Identificador de leitura já utilizado.");
      return existing.resultado;
    }
    const timestamp = new Date().toISOString();
    let modo: ReadResult["modo"] = "CONSULTA";
    if (portal && !lote.arquivado) {
      const next = decideMovement(lote, portal);
      state.movimentacoes.push({ id: randomUUID(), loteId: id, portalId: portal.id, zonaOrigemId: next.zonaOrigemId, zonaDestinoId: next.zonaDestinoId, tipo: next.tipo, timestamp });
      lote.zonaAtualId = next.zonaDestinoId; lote.ultimoPortalId = portal.id;
      portal.ultimoUso = timestamp; modo = next.tipo;
      movement = { zonaOrigemId: next.zonaOrigemId, zonaDestinoId: next.zonaDestinoId, portalId: portal.id, tipo: next.tipo, timestamp };
    }
    const zona = zoneName(state.zonas, lote.zonaAtualId);
    const mensagem = modo === "MOVIMENTO" ? "Movido para " + zona : modo === "CANCELAMENTO" ? "Movimentação cancelada — Sem Zona" : lote.arquivado ? "Modo consulta — lote excluído" : "Modo consulta — sem portal vinculado";
    const result: ReadResult = { modo, mensagem, lote: structuredClone(lote), zona, timestamp, historico: history(state, id) };
    state.leituras.push({ id: requestId, loteId: id, portalId: portal?.id ?? null, modo, resultado: result, timestamp });
    return result;
  });
  if (movement) await broadcastMovement({ loteId: id, ...movement });
  return result;
}
