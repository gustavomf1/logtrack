import { PrismaClient } from "@prisma/client";
import type { MapaData } from "./mapa-client-types";
const globalStore = globalThis as unknown as { mapaPrisma?: PrismaClient };
export function mapaPrisma() { return globalStore.mapaPrisma ??= new PrismaClient(); }

export async function getMapa(): Promise<MapaData | null> {
  const mapa = await mapaPrisma().mapa.findFirst({
    orderBy: { criadoEm: "asc" },
    include: {
      estacoes: { include: { celular: { include: { zona: true } } } },
      textos: true,
    },
  });
  if (!mapa) return null;
  return {
    id: mapa.id,
    nome: mapa.nome,
    imagemUrl: mapa.imagemUrl,
    estacoes: mapa.estacoes.map(e => ({
      id: e.id, celularId: e.celularId, celularNome: e.celular.nome,
      zonaId: e.celular.zonaId, zonaNome: e.celular.zona.nome,
      apelido: e.apelido, x: e.x, y: e.y,
    })),
    textos: mapa.textos.map(t => ({ id: t.id, texto: t.texto, x: t.x, y: t.y })),
  };
}
