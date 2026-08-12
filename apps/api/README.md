# Forge API

Authenticated snapshot persistence for phone and desktop continuity.

## Local run

The easiest local path is Docker:

```bash
docker compose up --build api
```

The API listens on `http://localhost:8787`. Its health endpoint is `GET /health`.

For a direct Node run, copy `.env.example` to `.env`, provide PostgreSQL, then run:

```bash
pnpm --filter @forge/api build
pnpm --filter @forge/api migrate
pnpm --filter @forge/api start
```

Use the same development token in `apps/api/.env` and `apps/web/.env.local`. Static development tokens are rejected as an authentication strategy when `NODE_ENV=production`; production requires an OIDC issuer, audience, and JWKS URL.

## Data ownership

The verified JWT `sub` claim becomes `dashboard_snapshots.user_id`. No route accepts a user ID from the browser. Updates require the revision returned by the latest successful read or write.
