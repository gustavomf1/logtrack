# CLAUDE.md (firmware/)

This file provides guidance to Claude Code (claude.ai/code) when working with the firmware half of the LogTrack monorepo. See the root `CLAUDE.md` for how this fits together with `logtrack/` (the web app).

## Project overview

This is the Arduino/ESP32 firmware for LogTrack's RFID reading stations, built with PlatformIO and simulated in [Wokwi](https://wokwi.com). Each station reads an RFID tag, authenticates itself against the LogTrack web app, and POSTs the reading to its API — queueing to onboard flash (LittleFS) when Wi-Fi or the API is unavailable, and flushing the queue once connectivity returns.

There are three physical zones (Recebimento/Almoxarifado/Expedição), each running the **same firmware image** with only a build-time `SETUP_URL` flag differing per zone — see `platformio.ini` (`env:zona-a`, `env:zona-b`, `env:zona-c`) and `sim/zona-a|b|c/`. Each zone folder has its own `diagram.json` (identical wiring across zones) and `wokwi.toml` pointing at that zone's build output.

Layout:
- `src/sketch.ino` — the firmware (setup/loop + all logic)
- `platformio.ini` — PlatformIO envs: base `esp32dev` (board, Arduino framework, `lib_deps` for MFRC522 + ArduinoJson) plus one `env:zona-*` per station that extends it and sets `-D PORTAL_TOKEN` (and `-D BACKEND_HOST` for the Wokwi gateway address)
- `scripts/merge_firmware.py` — post-build step that merges bootloader + partition table + app into one flash image per PlatformIO's actual partition table (needed so LittleFS mounts correctly in Wokwi)
- `sim/zona-a/`, `sim/zona-b/`, `sim/zona-c/` — one Wokwi simulation per zone (`diagram.json` wiring + `wokwi.toml` pointing at `.pio/build/zona-x/`, plus `[net] gateway = "ws://localhost:9011"` to enable the Private IoT Gateway — required for `host.wokwi.internal` to work, see below)

## Building and running the simulation

Build with PlatformIO before simulating — Wokwi does not compile the sketch, it just loads the binary named in `wokwi.toml`. Run from `firmware/`:

```
pio run -e zona-a   # or zona-b / zona-c
```

This produces `.pio/build/zona-a/wokwi-firmware.bin` and `firmware.elf` (via `scripts/merge_firmware.py`), which is what `sim/zona-a/wokwi.toml` points at. Re-run after any firmware change, then restart the simulation.

Each `sim/zona-*/wokwi.toml` has `[net] gateway = "ws://localhost:9011"`, which turns on Wokwi for VS Code's bundled Private IoT Gateway. Without this line `host.wokwi.internal` (what `BACKEND_HOST` points at by default — see `platformio.ini`) doesn't resolve to anything and the station's activation request fails with "Connection reset by peer". This is a VS Code–only mechanism — the browser simulator at wokwi.com needs the standalone `wokwigw` binary instead (`F1` → "Enable Private Wokwi IoT Gateway").

To run the simulation:
- **VS Code**: install the "Wokwi for VS Code" and "PlatformIO IDE" extensions (recommended automatically via the repo's `.vscode/extensions.json`), open `sim/zona-a/diagram.json` (or b/c), run `pio run -e zona-a`, then `F1` → `Wokwi: Start Simulator`. No account/token needed.
- **Headless/CI**: [`wokwi-cli`](https://docs.wokwi.com/wokwi-ci/cli-installation) reads the same `wokwi.toml`/`diagram.json` per zone, but requires a personal `WOKWI_CLI_TOKEN` (free, from `wokwi.com/dashboard/ci`) exported in the environment.

There is no test suite or linter here — verification is done by running the simulation and reading Serial Monitor output.

## Firmware architecture (`src/sketch.ino`)

Two input modes, selected at compile time via `USE_BUTTON_SIMULATION` (commented out by default, meaning the real MFRC522 reader path is active):
- **RFID mode** (default): reads UID bytes from the physical/simulated MFRC522 over SPI (pins: SS=5, RST=22).
- **Button-simulation mode**: substitutes a button on pin 4 and a hardcoded tag ID, for testing without an RC522 in the diagram.

A second button (pin 27, `MODE_BUTTON_PIN`) toggles a simulated offline mode independent of real Wi-Fi state, with red/green LEDs (pins 25/26) showing the current mode — useful for exercising the offline queue without touching the network.

Backend integration (points at `../logtrack-backend/`, the Quarkus API — see its `CLAUDE.md`):
- `backendHost` (build flag `BACKEND_HOST`, default `http://localhost:8080`) is the address the ESP32 actually connects to for both activation and readings — override it per env when the default isn't reachable (Wokwi's `host.wokwi.internal`, a tunnel, or a LAN IP for real hardware).
- `portalToken` (build flag `PORTAL_TOKEN`, one per zone — see `platformio.ini`) is that zone's portal activation token, fixed in the backend's `DevDataSeeder`. `setupUrl` is built at runtime as `backendHost + "/ativar/" + portalToken`; `autenticarEstacao()` GETs it and captures the `Set-Cookie` from the 302 redirect as `stationCookie`, sent on every reading.
- `backendOrigin` is the LogTrack backend's *logical* origin — it's sent as the `Origin` header because the API rejects POSTs whose `Origin` doesn't match `logtrack.backend-origin` (`OriginGuard`, CSRF protection). Unlike `backendHost`, this must stay byte-identical to the backend's configured origin even when `backendHost` points at a tunnel/gateway address — mismatch is a silent 403 on every reading.
- `tagsLotes[]` hardcodes a small tag UID → lote UUID table for the demo, matching the fixed lote IDs seeded by `DevDataSeeder`; `buscarLoteParaTag()` looks up the `loteId` for a scanned tag, ignoring unknown tags.

Core flow in `loop()`:
1. If online, ensure the station is authenticated (`autenticarEstacao()` if no cookie yet), then flush any queued offline readings (`reenviarFila()`).
2. Poll for a new tag/button press; resolve it to a `loteId`; build a JSON payload (`montarPayload`: `loteId` + a random `requestId`, used server-side for idempotency).
3. If online, POST via `enviarLeitura()` (`POST {backendOrigin}/api/leituras` with the station cookie); on failure (or if offline), append the payload to the offline queue via `salvarNaFila()`.

Offline queue (`/fila.jsonl` on LittleFS) is a plain newline-delimited JSON log:
- `salvarNaFila()` appends one JSON line per unsent reading.
- `reenviarFila()` reads the file line by line, resends each; once one send fails, it stops attempting further sends that pass and preserves all remaining/failed lines back to the file (so ordering is preserved and it doesn't reorder-and-retry out of sequence).

Wi-Fi credentials default to Wokwi's simulated open network (`Wokwi-GUEST`, no password) and only work inside the simulator; `localhost` doesn't reach your PC from inside the simulator (see the comment in `sketch.ino` about tunnels / `host.wokwi.internal`).

Code comments and log strings are in Portuguese; keep new code consistent with that unless told otherwise.
