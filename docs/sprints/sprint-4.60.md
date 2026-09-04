# Sprint 4.60 — Complete Local Barcode Lookup

## Outcome

A barcode decoded by the HTTPS phone scanner continues into Forge's local food-data gateway and Open Food Facts lookup instead of stopping after capture.

## Root cause

The documented HTTPS command started only the web package. Camera capture and decoding worked, but no API process or food-data client was available locally to resolve the barcode. Calling a separate HTTP API directly from an HTTPS phone page would also be blocked as mixed content.

## Delivered

- Adds a root `dev:https` command that builds and starts the API and HTTPS web app together.
- Proxies `/api` from Vite to the local API so browser requests stay on the trusted HTTPS origin.
- Enables the food-data client against that proxy in Vite development.
- Supplies a development-only client/server token when no local environment file exists.
- Allows the non-production API to start without requiring a configured database URL; database-backed dashboard routes still fail safely if PostgreSQL is unavailable.
- Preserves mandatory OIDC and database configuration in production.
- Updates the phone HTTPS guide to use the complete stack command.

## Boundaries

- Development defaults never activate when `NODE_ENV=production`.
- Production secrets are not embedded in the web bundle.
- The browser still sends only the decoded barcode value, not camera frames.
- Open Food Facts may return no match for products absent from its community database.
- Manual label entry remains available for missing products or provider outages.

## Acceptance

- The HTTPS development origin can reach `/api/health` through the Vite proxy.
- Local food requests receive the matching development authorization token.
- Explicit configured API origins continue to take precedence.
- Production retains its existing identity and database requirements.
- Type checks, focused integration tests, the full suite, and production builds pass.
