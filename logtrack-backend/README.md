# LogTrack Backend

API Quarkus do LogTrack, integrada ao Angular em `../logtrack-frontend`.

## Desenvolvimento

Requisitos: Java 21 e Docker. O Dev Services inicia um PostgreSQL efêmero e o seeder cria os dados de demonstração.

```bash
./mvnw quarkus:dev
```

A API fica em http://localhost:8080. Login local: `supervisor@logtrack.local` / `LogTrack123!`.

Endpoints de apoio:

- Health: http://localhost:8080/q/health
- OpenAPI: http://localhost:8080/q/openapi
- Swagger UI: http://localhost:8080/q/swagger-ui

## Testes e build

```bash
./mvnw test
./mvnw verify
```

O relatório de cobertura é gerado em `target/site/jacoco/index.html`.

## Docker Compose

```bash
docker compose up -d --build
```

O compose inicia a API em `8080` e um PostgreSQL persistente na porta `55434` do host.
