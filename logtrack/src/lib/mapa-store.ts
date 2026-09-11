import { createClient } from "@supabase/supabase-js";
import { AppError } from "./service";
import { clampNormalized, type MapaUpdateInput } from "./mapa";
import type { MapaData } from "./mapa-client-types";
import { prisma } from "./store";

export async function getMapa(): Promise<MapaData | null> {
  const mapa = await prisma().mapa.findFirst({
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
  const existing = await prisma().mapa.findFirst({ orderBy: { criadoEm: "asc" } });
  const mapa = existing
    ? await prisma().mapa.update({ where: { id: existing.id }, data: { imagemUrl: data.publicUrl } })
    : await prisma().mapa.create({ data: { nome: "Mapa da empresa", imagemUrl: data.publicUrl } });
  return { id: mapa.id, imagemUrl: mapa.imagemUrl };
}

export async function updateMapa(input: MapaUpdateInput): Promise<MapaData> {
  const mapa = await prisma().mapa.findFirst({ orderBy: { criadoEm: "asc" } });
  if (!mapa) throw new AppError(409, "Envie a planta antes de posicionar elementos.");
  const keepIds = input.textos.filter(t => t.id).map(t => t.id!);
  await prisma().$transaction([
    ...input.estacoes.map(e => prisma().estacaoMapa.upsert({
      where: { mapaId_celularId: { mapaId: mapa.id, celularId: e.celularId } },
      create: { mapaId: mapa.id, celularId: e.celularId, apelido: e.apelido, x: clampNormalized(e.x), y: clampNormalized(e.y) },
      update: { apelido: e.apelido, x: clampNormalized(e.x), y: clampNormalized(e.y) },
    })),
    prisma().textoMapa.deleteMany({ where: { mapaId: mapa.id, id: { notIn: keepIds.length ? keepIds : ["00000000-0000-0000-0000-000000000000"] } } }),
    ...input.textos.filter(t => t.id).map(t => prisma().textoMapa.updateMany({
      where: { id: t.id, mapaId: mapa.id }, data: { texto: t.texto, x: clampNormalized(t.x), y: clampNormalized(t.y) },
    })),
    ...input.textos.filter(t => !t.id).map(t => prisma().textoMapa.create({
      data: { mapaId: mapa.id, texto: t.texto, x: clampNormalized(t.x), y: clampNormalized(t.y) },
    })),
  ]);
  return (await getMapa())!;
}
