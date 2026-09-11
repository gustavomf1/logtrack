import type { Celular, Lote, Movimentacao } from "./types";
export function decideMovement(lote: Pick<Lote, "zonaAtualId" | "ultimoCelularId">, celular: Pick<Celular, "id" | "zonaId">) {
  const cancelamento = lote.zonaAtualId !== null && lote.ultimoCelularId === celular.id;
  return {
    zonaOrigemId: lote.zonaAtualId,
    zonaDestinoId: cancelamento ? null : celular.zonaId,
    tipo: (cancelamento ? "CANCELAMENTO" : "MOVIMENTO") as Movimentacao["tipo"],
    ultimoCelularId: celular.id,
  };
}
