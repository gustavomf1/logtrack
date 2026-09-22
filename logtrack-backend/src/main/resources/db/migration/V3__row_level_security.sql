-- RLS liga o acesso ao papel do banco: o backend precisa conectar como
-- dono das tabelas (ou com BYPASSRLS) em todo ambiente, senão toda
-- consulta retorna vazio silenciosamente. Ver Global Constraints.
ALTER TABLE supervisores ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE portais ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leituras ENABLE ROW LEVEL SECURITY;
