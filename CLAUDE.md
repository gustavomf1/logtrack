# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

LogTrack is an RFID-based batch-tracking system for logistics/warehouse operations. The active application is split across these parts:

- **`logtrack-frontend/`** — Angular frontend for the supervisor dashboard and station/public views.
- **`logtrack-backend/`** — Quarkus/Java API with JWT auth, PostgreSQL and the station activation/reading contract. See `logtrack-backend/CLAUDE.md`.
- **`firmware/`** — the hardware: ESP32 Arduino firmware for the RFID reading stations, built with PlatformIO and simulated in Wokwi. See `firmware/CLAUDE.md`.
- **`logtrack/`** — legacy Next.js application kept as migration reference. See `logtrack/CLAUDE.md`.

## How they fit together

Each physical/simulated station runs the same firmware image (one PlatformIO env per zone — `zona-a`/`zona-b`/`zona-c` — differing only in an embedded `SETUP_URL` build flag). On boot, the station authenticates against a per-zone activation link on the Quarkus backend and stores the returned session cookie. Each RFID tag read is resolved to a batch (`loteId`) and POSTed to `{backendOrigin}/api/leituras`, with the station cookie attached. Unsendable readings are queued to onboard flash (LittleFS) and flushed once connectivity returns.

In production the web app is deployed (e.g. Vercel) and the firmware points at that public URL. Locally, the web app runs in a demo mode with no database, and the firmware runs inside the Wokwi simulator.

## Working in this repo

There's no repo-wide build/test command. Build the Angular frontend with `npm run build` under `logtrack-frontend/`, verify the backend with `./mvnw verify` under `logtrack-backend/`, and build firmware independently. Coordinate changes that touch the `/api/leituras` request shape, JWT API contract, station cookie/activation flow, or CORS/Origin checks.

Code comments and log/UI strings are in Portuguese throughout both halves; keep new code consistent with that unless told otherwise.
