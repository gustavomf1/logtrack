-- CreateTable
CREATE TABLE "zonas_mapa" (
    "id" UUID NOT NULL,
    "mapa_id" UUID NOT NULL,
    "zona_id" UUID NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zonas_mapa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zonas_mapa_mapa_id_zona_id_key" ON "zonas_mapa"("mapa_id", "zona_id");

-- AddForeignKey
ALTER TABLE "zonas_mapa" ADD CONSTRAINT "zonas_mapa_mapa_id_fkey" FOREIGN KEY ("mapa_id") REFERENCES "mapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas_mapa" ADD CONSTRAINT "zonas_mapa_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (matches prisma/migrations/20260905000002_private_tables — LogTrack accesses the DB only through the authenticated backend via Prisma; block direct access through Supabase's public API)
ALTER TABLE "zonas_mapa" ENABLE ROW LEVEL SECURITY;
