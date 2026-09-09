# Sprint 4.62 — Deterministic Local Authorization

## Outcome

The phone web app and local Forge API always use the same development authorization token, so a stale environment override cannot make a healthy barcode service appear unavailable.

## Trigger

Physical phone acceptance proved that the HTTPS proxy health endpoint and an authenticated barcode request both worked. The app still reported an unreachable food service, isolating the remaining failure to its development authorization header.

## Delivered

- Makes Vite development use the API's fixed `forge-local-development` token.
- Ignores stale `VITE_FORGE_SYNC_TOKEN` overrides only while `DEV` is true.
- Preserves explicit token behavior outside Vite development.
- Leaves configured Entra production authentication unchanged.
- Documents the matched local-development identity.
- Adds regression tests for development and production boundaries.

## Boundaries

- The fixed token is for local development only and grants no production access.
- Production still requires a real authenticated session and short-lived access token.
- Certificate trust and API authorization remain separate concerns.

## Acceptance

- A stale local token cannot cause a 401 during Vite development.
- Explicit non-development tokens continue to work.
- No production token is invented when authentication is absent.
- Type checks, full tests, and production builds pass.
