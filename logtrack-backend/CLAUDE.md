# CLAUDE.md (logtrack-backend/)

Backend Java (Quarkus, Java 21 - ver `<quarkus.platform.version>` no `pom.xml` pra versao exata) do LogTrack - rastreamento de lotes via RFID. Substitui as rotas `/api/*` da app Next.js antiga (`../logtrack/`); o frontend Angular fica em `../logtrack-frontend/`. Ver `../logtrack/docs/superpowers/specs/2026-09-22-java-backend-design.md` para o desenho completo e `../logtrack/docs/superpowers/plans/2026-09-22-backend-java-quarkus.md` para o plano de implementacao.

## Rodando localmente

`./mvnw quarkus:dev` - sobe a app em `http://localhost:8080` com live reload. Nao precisa de Postgres configurado manualmente: o Quarkus Dev Services sobe um container Postgres efemero automaticamente (precisa do Docker rodando). Dados de demonstracao sao criados automaticamente (`DevDataSeeder`) - login `supervisor@logtrack.local` / `LogTrack123!`.

## Rodando com Docker Compose

Antes da primeira vez, gere a keypair JWT de dev (uma vez por checkout, os `.pem` sao gitignored - ver `.gitignore`): `./scripts/gen-dev-jwt-keys.sh`. Sem isso o login falha com `SRJWT05021` - `./mvnw quarkus:dev` nao precisa disso porque o Quarkus gera uma chave efemera sozinho em live coding, mas um jar ja empacotado (Docker, `java -jar`) nao tem essa geracao automatica.

`docker compose up -d --build` - sobe o backend empacotado + Postgres persistente (porta 55434 no host), com o mesmo seed de dados de demonstracao. Ver comentario no topo de `docker-compose.yml` para por que o container roda no profile `dev`.

## Testes

`./mvnw test` - unitarios e de integracao (`@QuarkusTest`, Postgres real via Dev Services, nunca mockado). `./mvnw verify` roda tudo e gera cobertura em `target/site/jacoco/index.html`.

## Arquitetura

Pacotes **por camada** sob `com.logtrack.backend` (nao por feature) - segue o padrao do projeto de referencia em `~/Documents/Java Projects/cotacao`:
- `entity/` - entidades JPA planas (Lombok `@Data`, sem heranca de Panache)
- `repository/` - `PanacheRepositoryBase<Entity, UUID>` para a maioria; `Movimentacao`/`Leitura` sao classes proprias (`@Inject EntityManager`) so de insercao/consulta, nunca update/delete - espelha os triggers de imutabilidade do banco
- `service/` - `@ApplicationScoped`/`@Transactional`, toda a logica de negocio e limites de transacao
- `resource/` - endpoints JAX-RS finos, so HTTP (status codes, cookies, headers)
- `dto/` - DTOs Lombok (`@Data @Builder @Jacksonized` para resposta, `@Data` simples para request), sufixo `...DTO`
- `security/` - utilitarios de cookie/token/assinatura de estacao, guarda de `Origin`
- `common/` - `AppException`, os 3 `ExceptionMapper`s, `LogtrackConfig`
- `util/` - logica pura sem estado (`MovementDecision`, `HistoryBuilder`, `LoteFilter`, `ExpiryCalculator`)
- `seed/` - `DevDataSeeder`

## Endpoints

- `POST /api/auth/login` - JWT Bearer para o painel.
- `GET /api/estacao` - estado da estacao vinculada pelo cookie assinado (publico).
- `GET /api/painel` - dashboard agregado (autenticado).
- `GET/POST /api/zonas`, `PATCH/DELETE /api/zonas/{id}` (autenticado).
- `GET/POST /api/portais`, `PATCH/DELETE /api/portais/{id}`, `POST /api/portais/{id}/regenerar-token` (autenticado).
- `GET/POST /api/lotes`, `GET/PATCH/DELETE /api/lotes/{id}`, `POST /api/lotes/{id}/gravar-tag` (autenticado); `GET /api/lotes/publico/{id}` (publico).
- `GET/PUT /api/mapa`, `POST /api/mapa/planta` (autenticado); `GET /uploads/{filename}` (publico).
- `GET /q/health`, `GET /q/openapi` (Swagger UI em `/q/swagger-ui`).

## Contrato com o firmware - NAO QUEBRAR sem coordenar

`POST /api/leituras` e `GET /ativar/{token}` nao usam JWT - usam o cookie de estacao (`logtrack_station`, HMAC-assinado) e checagem do header `Origin` contra `logtrack.backend-origin`. O firmware (`../firmware/`) ja aponta para este backend (ver `firmware/CLAUDE.md`, secao "Backend integration") - os 5 lotes e os tokens de ativacao dos 3 portais de demo em `DevDataSeeder` sao fixos de proposito (nao gerados aleatoriamente) para que o firmware compilado com os defaults de `platformio.ini` continue funcionando entre reseeds. Qualquer mudanca no contrato HTTP (rotas, formato do payload, nome do cookie, exigencia de `Origin`) tem que ser coordenada com o firmware.
