import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "./service";
import { clampNormalized, type MapaUpdateInput } from "./mapa";
import type { MapaData } from "./mapa-client-types";
import { prisma } from "./store";

export async function getMapa(): Promise<MapaData | null> {
  const mapa = await prisma().mapa.findFirst({
    orderBy: { criadoEm: "asc" },
    include: {
      estacoes: { include: { portal: { include: { zona: true } } } },
      textos: true,
    },
  });
  if (!mapa) return null;
  return {
    id: mapa.id,
    nome: mapa.nome,
    imagemUrl: mapa.imagemUrl,
    estacoes: mapa.estacoes.map(e => ({
      id: e.id, portalId: e.portalId, portalNome: e.portal.nome,
      zonaId: e.portal.zonaId, zonaNome: e.portal.zona.nome,
      apelido: e.apelido, x: e.x, y: e.y,
    })),
    textos: mapa.textos.map(t => ({ id: t.id, texto: t.texto, x: t.x, y: t.y })),
  };
}

export async function uploadPlanta(file: File) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ext = file.type === "image/png" ? "png" : "jpg";
  const filename = "mapa-" + Date.now() + "." + ext;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let imagemUrl: string;
  if (url && key) {
    const supabase = createClient(url, key);
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "plantas";
    const { error } = await supabase.storage.from(bucket).upload(filename, bytes, { contentType: file.type, upsert: true });
    if (error) throw new AppError(500, "Falha ao enviar a imagem: " + error.message);
    imagemUrl = supabase.storage.from(bucket).getPublicUrl(filename).data.publicUrl;
  } else if (process.env.NODE_ENV !== "production") {
    // Fallback local de desenvolvimento: sem Supabase configurado, salva em public/uploads.
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    imagemUrl = "/uploads/" + filename;
  } else {
    throw new AppError(500, "Armazenamento de imagens não configurado.");
  }
  const existing = await prisma().mapa.findFirst({ orderBy: { criadoEm: "asc" } });
  const mapa = existing
    ? await prisma().mapa.update({ where: { id: existing.id }, data: { imagemUrl } })
    : await prisma().mapa.create({ data: { nome: "Mapa da empresa", imagemUrl } });
  return { id: mapa.id, imagemUrl: mapa.imagemUrl };
}

export async function updateMapa(input: MapaUpdateInput): Promise<MapaData> {
  const mapa = await prisma().mapa.findFirst({ orderBy: { criadoEm: "asc" } });
  if (!mapa) throw new AppError(409, "Envie a planta antes de posicionar elementos.");
  const keepIds = input.textos.filter(t => t.id).map(t => t.id!);
  await prisma().$transaction([
    ...input.estacoes.map(e => prisma().estacaoMapa.upsert({
      where: { mapaId_portalId: { mapaId: mapa.id, portalId: e.portalId } },
      create: { mapaId: mapa.id, portalId: e.portalId, apelido: e.apelido, x: clampNormalized(e.x), y: clampNormalized(e.y) },
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
