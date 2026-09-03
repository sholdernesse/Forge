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

## Food data

Authenticated food search uses USDA FoodData Central when `USDA_FOODDATA_API_KEY` is configured on the API server. Package barcode lookup uses Open Food Facts as a community-data fallback. The USDA key must remain server-side and must never be added to the web app environment.

- `GET /v1/foods/search?q=oats` searches USDA and returns normalized Forge food records.
- `GET /v1/foods/barcode/{8-14 digit code}` looks up a packaged product in Open Food Facts.

If USDA is not configured, the web app continues to use its local foods. Provider outages also leave local search and manual nutrition-label entry available.

## Data ownership

The verified JWT `sub` claim becomes `dashboard_snapshots.user_id`. No route accepts a user ID from the browser. Updates require the revision returned by the latest successful read or write.
