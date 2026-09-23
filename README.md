# LogTrack

Rastreamento de lotes via RFID para logística e almoxarifado. A aplicação ativa está organizada como monorepo:

| Pasta | Responsabilidade | Stack |
| --- | --- | --- |
| [`logtrack-frontend/`](logtrack-frontend/README.md) | Interface web do supervisor e das estações | Angular 22, TypeScript, Tailwind |
| [`logtrack-backend/`](logtrack-backend/README.md) | API, autenticação, regras de negócio e persistência | Quarkus, Java 21, PostgreSQL |
| [`firmware/`](firmware/CLAUDE.md) | Firmware ESP32 e simulações Wokwi | Arduino, PlatformIO |
| [`logtrack/`](logtrack/README.md) | Aplicação Next.js anterior, mantida como referência durante a migração | Next.js, Prisma |

## Desenvolvimento local

Requisitos: Node.js `22.22.3`, Java 21 e Docker. Com NVM, execute `nvm use` na raiz.

No primeiro terminal, inicie o backend. O Quarkus Dev Services cria o PostgreSQL e o seeder carrega dados locais:

```bash
cd logtrack-backend
./mvnw quarkus:dev
```

No segundo terminal, inicie o frontend:

```bash
cd logtrack-frontend
npm ci
npm start
```

Abra http://localhost:4200 e entre com `supervisor@logtrack.local` / `LogTrack123!`. Durante o desenvolvimento, o servidor Angular encaminha `/api` e `/uploads` para `http://localhost:8080`.

## Integração

O supervisor autentica em `POST /api/auth/login`; o frontend guarda o JWT e o envia como `Authorization: Bearer` nas rotas protegidas. Estações usam o cookie assinado `logtrack_station` obtido em `/ativar/{token}` e enviam leituras para `POST /api/leituras`.

Para compilar e testar cada parte:

```bash
cd logtrack-frontend && npm run build
cd ../logtrack-backend && ./mvnw verify
```
