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

## Next slice

- implement the authenticated API service
- store versioned dashboard snapshots in PostgreSQL
- add per-user authorization and token verification
- return conflict details and offer an explicit refresh/retry path
- add API integration and multi-device browser tests
