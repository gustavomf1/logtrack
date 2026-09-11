-- Renomeia a entidade "Celular" para "Portal" em todo o schema.

ALTER TABLE "celulares" RENAME TO "portais";
ALTER TABLE "portais" RENAME CONSTRAINT "celulares_pkey" TO "portais_pkey";
ALTER TABLE "portais" RENAME CONSTRAINT "celulares_zona_id_fkey" TO "portais_zona_id_fkey";
ALTER INDEX "celulares_token_cookie_key" RENAME TO "portais_token_cookie_key";
ALTER INDEX "celulares_zona_id_idx" RENAME TO "portais_zona_id_idx";

ALTER TABLE "lotes" RENAME COLUMN "ultimo_celular_id" TO "ultimo_portal_id";
ALTER TABLE "lotes" RENAME CONSTRAINT "lotes_ultimo_celular_id_fkey" TO "lotes_ultimo_portal_id_fkey";

ALTER TABLE "movimentacoes" RENAME COLUMN "celular_id" TO "portal_id";
ALTER TABLE "movimentacoes" RENAME CONSTRAINT "movimentacoes_celular_id_fkey" TO "movimentacoes_portal_id_fkey";

ALTER TABLE "leituras" RENAME COLUMN "celular_id" TO "portal_id";

ALTER TABLE "estacoes_mapa" RENAME COLUMN "celular_id" TO "portal_id";
ALTER TABLE "estacoes_mapa" RENAME CONSTRAINT "estacoes_mapa_celular_id_fkey" TO "estacoes_mapa_portal_id_fkey";
ALTER INDEX "estacoes_mapa_mapa_id_celular_id_key" RENAME TO "estacoes_mapa_mapa_id_portal_id_key";

-- Atualiza os nomes de exemplo gerados pelo seed ("Celular 1 — ..." -> "Portal 1 — ...").
UPDATE "portais" SET "nome" = regexp_replace("nome", '^Celular ', 'Portal ') WHERE "nome" LIKE 'Celular %';
