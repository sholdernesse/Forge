# Sprint 4.96 — Deployed Candidate Smoke Gate

## Goal

Make every Forge release prove that the expected immutable candidate—not a stale or partially configured image—is actually serving the public and protected boundaries required for physical acceptance.

## Delivered

- Emits a public, non-secret `/release-config.json` containing the exact release commit and monitored support address.
- Adds a dependency-free deployed-candidate smoke command with bounded request timeouts and optional rollout retries.
- Verifies API health, release identity, support configuration, Privacy/Terms/Support routes, SPA fallback, browser security headers, no-store shell behavior, immutable asset caching, and anonymous dashboard denial.
- Runs the gate after Azure deployment and again before manual release-readiness evidence is accepted.
- Adds the release identity and support configuration to the deliberately dormant Render standby contract.
- Restores route-level security headers on Nginx SPA and asset responses where cache directives otherwise override inherited headers.
- Corrects the production permissions policy so the same-origin barcode scanner can use the camera while microphone and geolocation remain denied.
- Adds deterministic Node tests for URL safety, release configuration, successful candidate validation, and missing-header rejection.

## Release boundary

This gate provides automated evidence about the deployed artifact and unauthenticated boundaries. It does not replace the physical desktop/mobile workflow, authenticated cross-device continuity, account-isolation exercise, PostgreSQL recovery, or Render activation evidence.
