-- Registros de auditoria são imutáveis, inclusive para operações SQL diretas.
CREATE FUNCTION logtrack_audit_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria LogTrack não podem ser alterados ou removidos';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movimentacoes_immutable
BEFORE UPDATE OR DELETE OR TRUNCATE ON movimentacoes
FOR EACH STATEMENT EXECUTE FUNCTION logtrack_audit_immutable();

CREATE TRIGGER leituras_immutable
BEFORE UPDATE OR DELETE OR TRUNCATE ON leituras
FOR EACH STATEMENT EXECUTE FUNCTION logtrack_audit_immutable();

ALTER TABLE lotes ADD CONSTRAINT quantidade_nao_negativa CHECK (quantidade IS NULL OR quantidade >= 0);
