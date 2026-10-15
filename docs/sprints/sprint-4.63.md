# Sprint 4.63 — Deterministic Phone API Routing

## Outcome

Forge phone development always sends food and dashboard requests through the working HTTPS origin instead of attempting to contact the phone's own `localhost` interface.

## Trigger

Physical acceptance proved `https://192.168.1.122:4173/api/health` and an authenticated barcode request worked from the computer, while the phone app continued to report a network failure. The remaining development environment contained `VITE_FORGE_SYNC_URL=http://localhost:8787`, which resolves to the iPhone when used by its browser.

## Delivered

- Makes Vite development use same-origin `/api` for food lookup.
- Applies the same routing rule to dashboard synchronization.
- Ignores stale explicit service URLs only while `DEV` is true.
- Preserves configured API origins outside Vite development.
- Documents why direct `localhost` browser URLs cannot support phone testing.
- Adds regression tests for stale local environment configuration.

## Boundaries

- The Vite proxy remains a development facility, not the production gateway.
- Production continues to use its configured API origin and authenticated identity.
- The API still listens on port 8787 behind the development proxy.

## Acceptance

- Development food and dashboard clients resolve to `/api` even when `.env.local` contains `http://localhost:8787`.
- Production-style configuration retains its explicit API origin.
- Type checks, full tests, and production builds pass.
