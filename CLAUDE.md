# CLAUDE.md (logtrack-backend/)

Backend Java (Quarkus, Java 21 — ver `<quarkus.platform.version>` no `pom.xml` pra versão exata) do LogTrack — rastreamento de lotes via RFID. Substitui as rotas `/api/*` da app Next.js antiga (`../logtrack/logtrack/`); o frontend é reescrito separadamente em Angular. Pacotes organizados por camada (`entity/`, `repository/`, `service/`, `resource/`, `dto/`), seguindo o padrão do projeto de referência em `~/Documents/Java Projects/cotacao`.

## Rodando localmente

`./mvnw quarkus:dev` — sobe a app em `http://localhost:8080` com live reload. Postgres via Quarkus Dev Services (efêmero, precisa do Docker rodando). Login de dev: ver `DevDataSeeder`.

## Rodando com Docker Compose

`docker compose up -d --build` — sobe o backend empacotado + Postgres persistente.

## Testes

`./mvnw test` — unitários e de integração (`@QuarkusTest`, Postgres real via Dev Services). `./mvnw verify` gera cobertura em `target/site/jacoco/index.html`.

## Contrato com o firmware

`POST /api/leituras` e `GET /ativar/{token}` não usam JWT — usam o cookie de estação (`logtrack_station`) e checagem de header `Origin`. Não altere esse contrato sem atualizar o firmware em `../logtrack/firmware/`.
