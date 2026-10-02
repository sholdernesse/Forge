# Sprint 4.82 — Reliable Local HTTPS Startup

## Goal

Make the documented one-command phone-review environment start every dependency it actually requires.

## Delivered

- Changed `corepack pnpm dev:https` to start and wait for the Compose PostgreSQL service before launching Forge.
- Published PostgreSQL only on the Windows host loopback interface so the local API can connect without exposing the development database to the LAN.
- Automatically applies the current database schema before starting the API and HTTPS web app.
- Stops a conflicting Compose API container while retaining the local PostgreSQL volume.
- Aligned the API's development fallback credentials with the local Compose database.
- Added actionable database diagnostics to the local HTTPS guide.

## Safety boundary

The launcher uses only the repository's development-only database credentials and binds PostgreSQL to `127.0.0.1`. Production still requires an explicit managed `DATABASE_URL` and does not receive a fallback.

## Acceptance

- With Docker Desktop running, one command prepares PostgreSQL, migration, API, and HTTPS web services.
- A failed or unhealthy database stops startup instead of leaving a partially working Forge interface.
- The phone continues to access API calls only through the HTTPS web proxy.
