# Forge

Forge is an AI-powered fitness coaching platform centered on a persistent Digital Twin, explainable recommendations, and a daily coaching experience.

Review the canonical [Forge Product Plan](./docs/PRODUCT-PLAN.md) for product principles, delivered scope, release blockers, and the prioritized roadmap.

## Sprint 4.42

Sprint 4.42 replaces fixed prototype date and identity assumptions with the user’s local calendar and authenticated display context.

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm --filter @forge/web dev
```

Open `http://localhost:4173` to use the dashboard. See `docs/architecture/sprint-4.md` and `docs/sprints/sprint-4.2.md` for the current architecture and scope.
