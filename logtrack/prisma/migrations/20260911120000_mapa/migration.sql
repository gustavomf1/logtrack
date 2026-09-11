-- CreateTable
CREATE TABLE "mapas" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "imagem_url" TEXT,
    "largura_base" INTEGER,
    "altura_base" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estacoes_mapa" (
    "id" UUID NOT NULL,
    "mapa_id" UUID NOT NULL,
    "celular_id" UUID NOT NULL,
    "apelido" VARCHAR(100),
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "rotacao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estacoes_mapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "textos_mapa" (
    "id" UUID NOT NULL,
    "mapa_id" UUID NOT NULL,
    "texto" VARCHAR(200) NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "textos_mapa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estacoes_mapa_mapa_id_celular_id_key" ON "estacoes_mapa"("mapa_id", "celular_id");

-- CreateIndex
CREATE INDEX "textos_mapa_mapa_id_idx" ON "textos_mapa"("mapa_id");

-- AddForeignKey
ALTER TABLE "estacoes_mapa" ADD CONSTRAINT "estacoes_mapa_mapa_id_fkey" FOREIGN KEY ("mapa_id") REFERENCES "mapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estacoes_mapa" ADD CONSTRAINT "estacoes_mapa_celular_id_fkey" FOREIGN KEY ("celular_id") REFERENCES "celulares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "textos_mapa" ADD CONSTRAINT "textos_mapa_mapa_id_fkey" FOREIGN KEY ("mapa_id") REFERENCES "mapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (matches prisma/migrations/20260905000002_private_tables — LogTrack accesses the DB only through the authenticated backend via Prisma; block direct access through Supabase's public API)
ALTER TABLE "mapas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "estacoes_mapa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "textos_mapa" ENABLE ROW LEVEL SECURITY;
