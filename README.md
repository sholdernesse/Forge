# Forge

Forge is an AI-powered fitness coaching platform centered on a persistent Digital Twin, explainable recommendations, and a daily coaching experience.

## Sprint 4.29

Sprint 4.29 adds an explicit Coach symptom safety boundary so pain and injury language cannot be mistaken for ordinary training intent or workout clearance.

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm --filter @forge/web dev
```

Open `http://localhost:4173` to use the dashboard. See `docs/architecture/sprint-4.md` and `docs/sprints/sprint-4.2.md` for the current architecture and scope.
