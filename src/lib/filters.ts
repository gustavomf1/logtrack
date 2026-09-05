import { expiry } from "./format";
import type { DashboardData } from "./types";

export function filterLots(state: Pick<DashboardData, "lotes">, params: URLSearchParams) {
  return state.lotes.filter(lote => {
    const zone = params.get("zona");
    const status = params.get("status");
    const search = (params.get("busca") || "").toLowerCase();
    return !lote.arquivado && (!zone || (zone === "sem-zona" ? lote.zonaAtualId === null : lote.zonaAtualId === zone)) &&
      (!status || (status === "sem-tag" ? !lote.tagGravada : expiry(lote.dataValidade) === status)) &&
      (!search || (lote.codigo + " " + (lote.descricao || "")).toLowerCase().includes(search));
  });
}
