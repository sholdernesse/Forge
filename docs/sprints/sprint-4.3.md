# Sprint 4.3 — Authenticated Cross-Device Persistence

## Goal

Move Forge from one-browser prototype state toward authenticated phone and desktop continuity without sacrificing offline use.

## Slice 1: local-first sync client

- browser-local state remains the immediate source for startup and offline use
- an optional remote endpoint hydrates a newer dashboard snapshot
- every local mutation emits one typed persistence event
- background PUT requests synchronize the complete dashboard snapshot
- remote revisions are sent with `If-Match` to prevent silent lost updates
- rapid writes are serialized so each save uses the latest server revision
- invalid remote payloads are rejected at the dashboard validation boundary
- the dashboard displays local, connecting, syncing, synced, and offline states
- missing configuration fails closed to local-only mode

## Remote API contract

`GET /v1/dashboard`

```json
{
  "state": { "history": [], "checkIn": {} },
  "updatedAt": "2026-08-12T12:00:00.000Z",
  "revision": "opaque-revision"
}
```

`PUT /v1/dashboard` accepts `{ state, updatedAt }`. The client sends the last loaded `revision` in `If-Match`. The service returns the stored dashboard envelope with a new opaque revision. `404` means no remote dashboard exists; `409` or `412` means another device won the write.

All requests use `Authorization: Bearer <access-token>`.

## Configuration

Copy `apps/web/.env.example` to `apps/web/.env.local` and set the service URL and a development token. Vite values are embedded in the browser bundle, so a static token is for local integration only.

Production authentication must issue a short-lived, user-scoped token from an identity provider. The persistence service must derive the user ID from the verified token and must never accept a user ID from the request body.

## Slice 2: authenticated persistence API

- Node 22 HTTP adapter around a runtime-neutral Fetch handler
- production JWT validation through issuer, audience, and remote JWKS
- development-only bearer-token verifier for local integration
- PostgreSQL `JSONB` dashboard snapshots keyed by verified token subject
- opaque UUID revisions with atomic conditional updates
- one-megabyte request limit and server-side dashboard validation
- exact-origin CORS policy and unauthenticated health endpoint
- idempotent database migration and container image
- Docker Compose PostgreSQL and API development stack
- integration coverage for authentication, reads, writes, conflicts, validation, and CORS

## Slice 3: interactive customer identity

- Microsoft Entra External ID SPA sign-in through MSAL
- authorization-code flow with PKCE and redirect handling
- silent access-token acquisition and renewal for dashboard sync
- explicit signed-out, signed-in, and local-development modes
- sign-in and sign-out controls in the responsive dashboard header
- delegated `access_as_user` scope enforcement in the API
- issuer, audience, signature, subject, and scope validation before data access
- two-registration Entra setup guide for Forge Web and Forge API

## Remaining deployment work

- return conflict details and offer an explicit refresh/retry path
- provision the hosted web app, Container App, and PostgreSQL Flexible Server
- configure production DNS, TLS, secrets, and exact CORS origin
- create the External ID tenant and app registrations using the recorded values
- add browser coverage for redirect login and two-device synchronization
