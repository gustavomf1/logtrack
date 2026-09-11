import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { createSeed } from "../src/lib/seed-data";

loadEnvConfig(process.cwd());

async function main() {
  const email = process.env.SUPERVISOR_EMAIL;
  const password = process.env.SUPERVISOR_PASSWORD;
  console.log(`email: ${email}`)
  console.log(`password: ${password}`)
  if (!email || !password) throw new Error("Configure SUPERVISOR_EMAIL e SUPERVISOR_PASSWORD.");
  const folder = path.resolve(process.env.DEMO_DATA_DIR || "data");
  const origin = new URL(process.env.NEXTAUTH_URL || "http://localhost:3000").origin;
  const prisma = new PrismaClient();
  try {
    const { state, activation } = await createSeed(email, password);
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(742019)`;
      if (await tx.supervisor.count() || await tx.zona.count() || await tx.lote.count() || await tx.celular.count() || await tx.leitura.count()) {
        throw new Error("O banco já contém dados. Seed cancelado para preservar os registros existentes.");
      }
      await tx.supervisor.createMany({ data: state.supervisores });
      await tx.zona.createMany({ data: state.zonas });
      await tx.celular.createMany({ data: state.celulares });
      await tx.lote.createMany({ data: state.lotes.map(l => ({ ...l, dataValidade: l.dataValidade ? new Date(l.dataValidade) : null })) });
    });
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, "ativacoes.json"), JSON.stringify(activation, null, 2));
    console.log("Criados: 1 supervisor, 3 zonas, 3 celulares e 5 lotes.");
  } finally { await prisma.$disconnect(); }
  const activations = JSON.parse(await readFile(path.join(folder, "ativacoes.json"), "utf8")) as { nome: string; path: string }[];
  const guide = "# Ativação dos celulares\n\nAbra cada URL somente no celular correspondente. Se um token for regenerado no painel, use o novo link.\n\n" + activations.map(a => "- " + a.nome + ": " + origin + a.path).join("\n") + "\n";
  await writeFile(path.join(folder, "README-ativacoes.md"), guide);
  console.log("Supervisor: " + email + ". Use a senha configurada no .env.");
  console.log("Links de ativação salvos em " + path.join(folder, "README-ativacoes.md"));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
