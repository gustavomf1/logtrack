# LogTrack Frontend

Interface Angular do LogTrack. Ela consome a API Quarkus em `../logtrack-backend`.

## Desenvolvimento

Use Node `22.22.3` (`nvm use` na raiz do monorepo), instale as dependências e inicie o servidor:

```bash
npm ci
npm start
```

O frontend abre em http://localhost:4200. O proxy de desenvolvimento encaminha `/api` e `/uploads` para o backend em http://localhost:8080. Inicie antes o backend com `../logtrack-backend/mvnw quarkus:dev`.

Login de desenvolvimento: `supervisor@logtrack.local` / `LogTrack123!`.

## Build

```bash
npm run build
```

## Testes

```bash
npm test
```
