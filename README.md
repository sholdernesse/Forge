# Forge

Forge is an AI-powered fitness coaching platform centered on a persistent Digital Twin, explainable recommendations, and a daily coaching experience.

Review the canonical [Forge Product Plan](./docs/PRODUCT-PLAN.md) for product principles, delivered scope, release blockers, and the prioritized roadmap.

## Sprint 4.46

Sprint 4.46 adds a clear starting-plan review, explains which decisions Forge may adapt, and requires explicit approval before setup is activated.

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm --filter @forge/web dev
```

Open `http://localhost:4173` to use the dashboard. Camera barcode scanning on another device requires the [local HTTPS setup](docs/development/local-https.md). See `docs/architecture/sprint-4.md` and `docs/sprints/sprint-4.2.md` for the current architecture and scope.
