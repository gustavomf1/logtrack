-- O LogTrack acessa o banco pelo backend autenticado, usando Prisma.
-- Bloqueia o acesso direto às tabelas pela API pública do Supabase.
ALTER TABLE "supervisores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zonas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "celulares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "movimentacoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leituras" ENABLE ROW LEVEL SECURITY;
