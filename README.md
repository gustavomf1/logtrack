# LogTrack

Rastreamento de lotes via RFID para logística e almoxarifado. O projeto tem duas partes, cada uma na sua própria pasta:

| Pasta | O que é | Stack |
| --- | --- | --- |
| [`logtrack/`](logtrack/README.md) | **Software** — o app web (frontend + backend em um só projeto Next.js): painel do supervisor, API de leituras, autenticação das estações, banco de dados | Next.js, TypeScript, Tailwind, NextAuth, Prisma |
| [`firmware/`](firmware/CLAUDE.md) | **Hardware** — firmware do ESP32 das estações de leitura RFID, simulado no Wokwi | Arduino (PlatformIO), MFRC522, Wokwi |

## Como as partes se conectam

Cada estação (uma por zona: Recebimento, Almoxarifado, Expedição) roda o mesmo firmware ESP32. Ao ligar, ela se autentica contra um link de ativação gerado pelo app web (`setupUrl`, embutido no firmware por zona) e guarda o cookie de sessão retornado. A cada leitura de etiqueta RFID, o firmware resolve a tag para um lote e envia `POST /api/leituras` para o app web, usando esse cookie. Sem Wi-Fi ou com a API fora do ar, a leitura fica em fila na flash do ESP32 (LittleFS) e é reenviada assim que a conexão volta.

Em produção, o app web fica publicado (ex.: Vercel) e o firmware aponta para essa URL pública. Localmente, o app roda em modo de demonstração (sem banco de dados) e o firmware simulado no Wokwi.

## Para quem acabou de clonar

Requisitos:
- **Node.js 20.9+** e npm — para o app web (`logtrack/`)
- **[PlatformIO](https://platformio.org/)** — para compilar o firmware (`firmware/`). Se for usar VS Code, não precisa instalar nada à parte: abra a pasta no VS Code e aceite a recomendação de extensões (`.vscode/extensions.json`), que já inclui **PlatformIO IDE** e **Wokwi for VS Code**.

Depois de clonar, veja o guia de cada parte:
- [`logtrack/README.md`](logtrack/README.md) — rodar o app web localmente (`npm install`, variáveis de ambiente, seed de dados de demonstração, testes, publicação)
- [`firmware/CLAUDE.md`](firmware/CLAUDE.md) — compilar o firmware e rodar a simulação no Wokwi

### Resumo rápido

**Rodar o app web:**
```bash
cd logtrack
npm install
cp .env.example .env   # preencha as variáveis, veja o README da pasta
npm run db:seed
npm run dev
```
Abra http://localhost:3000.

**Rodar a simulação do firmware (uma zona por vez):**
```bash
cd firmware
pio run -e zona-a
```
No VS Code, abra `firmware/sim/zona-a/diagram.json`, rode o comando acima e use `F1` → `Wokwi: Start Simulator`.

## CLAUDE.md

Cada pasta tem seu próprio `CLAUDE.md` com o contexto específico dessa parte do projeto; veja também o [`CLAUDE.md`](CLAUDE.md) na raiz para uma visão geral do monorepo.
