import type { Portal, Lote, Movimentacao } from "./types";
export function decideMovement(lote: Pick<Lote, "zonaAtualId" | "ultimoPortalId">, portal: Pick<Portal, "id" | "zonaId">) {
  const cancelamento = lote.zonaAtualId !== null && lote.ultimoPortalId === portal.id;
  return {
    zonaOrigemId: lote.zonaAtualId,
    zonaDestinoId: cancelamento ? null : portal.zonaId,
    tipo: (cancelamento ? "CANCELAMENTO" : "MOVIMENTO") as Movimentacao["tipo"],
    ultimoPortalId: portal.id,
  };
}
