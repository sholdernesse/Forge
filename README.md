# Forge

Forge is an AI-powered fitness coaching platform centered on a persistent Digital Twin, explainable recommendations, and a daily coaching experience.

## Sprint 4.10

Sprint 4.10 adds a bounded post-workout feedback loop so Forge records experienced effort and discomfort alongside completed training instead of relying on a fixed exertion value.

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm --filter @forge/web dev
```

Open `http://localhost:4173` to use the dashboard. See `docs/architecture/sprint-4.md` and `docs/sprints/sprint-4.2.md` for the current architecture and scope.
