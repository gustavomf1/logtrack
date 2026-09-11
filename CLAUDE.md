# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

LogTrack is an RFID-based batch-tracking system for logistics/warehouse operations. The monorepo has two independent parts, each with its own `CLAUDE.md`:

- **`logtrack/`** — the software: a single Next.js app providing both the frontend (supervisor dashboard, public batch pages, station activation flow) and the backend (API routes, auth, Prisma/PostgreSQL). See `logtrack/CLAUDE.md` (which points to `logtrack/AGENTS.md`).
- **`firmware/`** — the hardware: ESP32 Arduino firmware for the RFID reading stations, built with PlatformIO and simulated in Wokwi. See `firmware/CLAUDE.md`.

## How they fit together

Each physical/simulated station runs the same firmware image (one PlatformIO env per zone — `zona-a`/`zona-b`/`zona-c` — differing only in an embedded `SETUP_URL` build flag). On boot, the station authenticates against that per-zone activation link on the `logtrack/` web app and stores the returned session cookie. Each RFID tag read is resolved to a batch (`loteId`) and POSTed to `{backendOrigin}/api/leituras` on the web app, with the station cookie attached. Unsendable readings (offline, or the API unreachable) are queued to onboard flash (LittleFS) and flushed once connectivity returns.

In production the web app is deployed (e.g. Vercel) and the firmware points at that public URL. Locally, the web app runs in a demo mode with no database, and the firmware runs inside the Wokwi simulator.

## Working in this repo

There's no repo-wide build/test command — `logtrack/` and `firmware/` are built, tested, and run independently; `cd` into the relevant one and follow its own `CLAUDE.md`. Don't assume a change in one half requires a change in the other unless it touches their shared contract (the `/api/leituras` request shape, the station cookie/activation flow, or CORS/Origin checks in `logtrack/src/app/api/[...resource]/route.ts`).

Code comments and log/UI strings are in Portuguese throughout both halves; keep new code consistent with that unless told otherwise.
