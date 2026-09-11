-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('MOVIMENTO', 'CANCELAMENTO');

-- CreateTable
CREATE TABLE "supervisores" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervisores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "celulares" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "zona_id" UUID NOT NULL,
    "token_cookie" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_uso" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "celulares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "quantidade" INTEGER,
    "data_validade" DATE,
    "zona_atual_id" UUID,
    "ultimo_celular_id" UUID,
    "tag_gravada" BOOLEAN NOT NULL DEFAULT false,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id" UUID NOT NULL,
    "lote_id" UUID NOT NULL,
    "zona_origem_id" UUID,
    "zona_destino_id" UUID,
    "celular_id" UUID NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leituras" (
    "id" UUID NOT NULL,
    "lote_id" UUID NOT NULL,
    "celular_id" UUID,
    "modo" TEXT NOT NULL,
    "resultado" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leituras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supervisores_email_key" ON "supervisores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_nome_key" ON "zonas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "celulares_token_cookie_key" ON "celulares"("token_cookie");

-- CreateIndex
CREATE INDEX "celulares_zona_id_idx" ON "celulares"("zona_id");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_codigo_key" ON "lotes"("codigo");

-- CreateIndex
CREATE INDEX "lotes_zona_atual_id_idx" ON "lotes"("zona_atual_id");

-- CreateIndex
CREATE INDEX "lotes_data_validade_idx" ON "lotes"("data_validade");

-- CreateIndex
CREATE INDEX "movimentacoes_lote_id_timestamp_idx" ON "movimentacoes"("lote_id", "timestamp");

-- CreateIndex
CREATE INDEX "leituras_lote_id_timestamp_idx" ON "leituras"("lote_id", "timestamp");

-- AddForeignKey
ALTER TABLE "celulares" ADD CONSTRAINT "celulares_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_zona_atual_id_fkey" FOREIGN KEY ("zona_atual_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_ultimo_celular_id_fkey" FOREIGN KEY ("ultimo_celular_id") REFERENCES "celulares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_zona_origem_id_fkey" FOREIGN KEY ("zona_origem_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_zona_destino_id_fkey" FOREIGN KEY ("zona_destino_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_celular_id_fkey" FOREIGN KEY ("celular_id") REFERENCES "celulares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
