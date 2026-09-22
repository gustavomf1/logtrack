CREATE TYPE tipo_movimentacao AS ENUM ('MOVIMENTO', 'CANCELAMENTO');

CREATE TABLE supervisores (
    id UUID NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    senha_hash TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX supervisores_email_key ON supervisores(email);

CREATE TABLE zonas (
    id UUID NOT NULL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativa BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX zonas_nome_key ON zonas(nome);

CREATE TABLE portais (
    id UUID NOT NULL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    zona_id UUID NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    token_cookie TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ultimo_uso TIMESTAMP(3),
    criado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX portais_token_cookie_key ON portais(token_cookie);
CREATE INDEX portais_zona_id_idx ON portais(zona_id);

CREATE TABLE lotes (
    id UUID NOT NULL PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL,
    descricao TEXT,
    quantidade INTEGER,
    data_validade DATE,
    zona_atual_id UUID REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ultimo_portal_id UUID REFERENCES portais(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    tag_gravada BOOLEAN NOT NULL DEFAULT false,
    arquivado BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX lotes_codigo_key ON lotes(codigo);
CREATE INDEX lotes_zona_atual_id_idx ON lotes(zona_atual_id);
CREATE INDEX lotes_data_validade_idx ON lotes(data_validade);

CREATE TABLE movimentacoes (
    id UUID NOT NULL PRIMARY KEY,
    lote_id UUID NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    zona_origem_id UUID REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    zona_destino_id UUID REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    portal_id UUID NOT NULL REFERENCES portais(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    tipo tipo_movimentacao NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX movimentacoes_lote_id_timestamp_idx ON movimentacoes(lote_id, "timestamp");

CREATE TABLE leituras (
    id UUID NOT NULL PRIMARY KEY,
    lote_id UUID NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    portal_id UUID REFERENCES portais(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    modo TEXT NOT NULL,
    resultado JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX leituras_lote_id_timestamp_idx ON leituras(lote_id, "timestamp");
