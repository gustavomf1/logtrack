import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, Prisma } from "@prisma/client";
import type { State } from "./types";
import { createSeed } from "./seed-data";
export const isDemo = () => process.env.DEMO_MODE === "true" && !process.env.VERCEL;
const root = path.resolve(/*turbopackIgnore: true*/ process.env.DEMO_DATA_DIR || path.join(process.cwd(), "data"));
const file = path.join(root, "demo.json");
const globalStore = globalThis as unknown as { prisma?: PrismaClient; queue?: Promise<unknown> };
function prisma() { return globalStore.prisma ??= new PrismaClient(); }
async function loadDemo(): Promise<State> {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    if (!process.env.SUPERVISOR_PASSWORD) throw new Error("Configure SUPERVISOR_PASSWORD.");
    const seed = await createSeed(process.env.SUPERVISOR_EMAIL || "supervisor@logtrack.local", process.env.SUPERVISOR_PASSWORD);
    await mkdir(root, { recursive: true });
    await writeFile(file, JSON.stringify(seed.state, null, 2));
    await writeFile(path.join(root, "ativacoes.json"), JSON.stringify(seed.activation, null, 2));
    return seed.state;
  }
}
async function loadDb(tx: Prisma.TransactionClient): Promise<State> {
  const [supervisores, zonas, celulares, lotes, movimentacoes, leituras] = await Promise.all([
    tx.supervisor.findMany(), tx.zona.findMany(), tx.celular.findMany(), tx.lote.findMany(), tx.movimentacao.findMany({ orderBy: { timestamp: "desc" } }), tx.leitura.findMany(),
  ]);
  return JSON.parse(JSON.stringify({ supervisores, zonas, celulares, lotes, movimentacoes, leituras }));
}
async function persistDb(tx: Prisma.TransactionClient, before: State, after: State) {
  for (const item of after.zonas) {
    const old = before.zonas.find(x => x.id === item.id);
    if (!old) await tx.zona.create({ data: item });
    else if (JSON.stringify(old) !== JSON.stringify(item)) await tx.zona.update({ where: { id: item.id }, data: item });
  }
  for (const item of after.celulares) {
    const old = before.celulares.find(x => x.id === item.id);
    if (!old) await tx.celular.create({ data: item });
    else if (JSON.stringify(old) !== JSON.stringify(item)) await tx.celular.update({ where: { id: item.id }, data: item });
  }
  for (const item of after.lotes) {
    const data = { ...item, dataValidade: item.dataValidade ? new Date(item.dataValidade) : null };
    const old = before.lotes.find(x => x.id === item.id);
    if (!old) await tx.lote.create({ data });
    else if (JSON.stringify(old) !== JSON.stringify(item)) await tx.lote.update({ where: { id: item.id }, data });
  }
  const movementIds = new Set(before.movimentacoes.map(x => x.id));
  for (const item of after.movimentacoes) if (!movementIds.has(item.id)) await tx.movimentacao.create({ data: item });
  const readIds = new Set(before.leituras.map(x => x.id));
  for (const item of after.leituras) if (!readIds.has(item.id)) await tx.leitura.create({ data: { ...item, resultado: item.resultado as unknown as Prisma.InputJsonValue } });
}
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const job = (globalStore.queue ?? Promise.resolve()).then(fn);
  globalStore.queue = job.catch(() => {});
  return job;
}
export function readState(): Promise<State> {
  if (isDemo()) return serial(loadDemo);
  return prisma().$transaction(tx => loadDb(tx));
}
export function transaction<T>(fn: (state: State) => T | Promise<T>): Promise<T> {
  if (isDemo()) return serial(async () => {
    const state = await loadDemo();
    const result = await fn(state);
    const temporary = file + ".tmp";
    await writeFile(temporary, JSON.stringify(state, null, 2));
    await rename(temporary, file);
    return result;
  });
  return prisma().$transaction(async tx => {
    // Serializa operações do MVP inclusive entre instâncias da Vercel.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(742019)`;
    const state = await loadDb(tx);
    const before = structuredClone(state);
    const result = await fn(state);
    await persistDb(tx, before, state);
    return result;
  }, { maxWait: 10000, timeout: 20000 });
}
