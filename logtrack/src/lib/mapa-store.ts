import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { AppError } from "./service";
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

export async function uploadPlanta(file: File) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new AppError(500, "Armazenamento de imagens não configurado.");
  const supabase = createClient(url, key);
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "plantas";
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = "mapa-" + Date.now() + "." + ext;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) throw new AppError(500, "Falha ao enviar a imagem: " + error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const existing = await mapaPrisma().mapa.findFirst({ orderBy: { criadoEm: "asc" } });
  const mapa = existing
    ? await mapaPrisma().mapa.update({ where: { id: existing.id }, data: { imagemUrl: data.publicUrl } })
    : await mapaPrisma().mapa.create({ data: { nome: "Mapa da empresa", imagemUrl: data.publicUrl } });
  return { id: mapa.id, imagemUrl: mapa.imagemUrl };
}
