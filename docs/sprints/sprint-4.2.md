# Sprint 4.2 — Functional Today Dashboard

## Goal

Turn Forge's decision engine into a browser-based coaching experience that users can inspect and interact with.

## Included

- responsive React and Vite application shell
- Today readiness, recovery, activity, nutrition, and training views
- live morning check-in with sleep, soreness, stress, and bodyweight inputs
- immediate Digital Twin recalculation through the production domain packages
- explainable recommendation evidence and confidence
- seven-day weight trend and weekly training progress
- desktop sidebar and mobile bottom navigation
- realistic demonstration history for product review

## Architecture

The web application renders decisions but does not own coaching calculations. Check-in values are normalized into `DailySnapshot`, passed to `buildDigitalTwin`, and evaluated by `CoachService`.

Sprint 4.2 uses in-browser demonstration state. The `CoachRepository` persistence contract remains the boundary for the production database adapter planned next.

## Run locally

```bash
corepack enable
pnpm install
pnpm --filter @forge/web dev
```

Open `http://localhost:4173`.

## Acceptance criteria

- dashboard works at desktop and mobile widths
- readiness and recommendations come from the Forge engine
- changing morning check-in values recalculates guidance
- recommendation reasons, evidence count, and confidence are visible
- workspace lint, typecheck, tests, and production build pass

## Next

- persist profile, goals, history, and decisions in PostgreSQL
- make Today use the authenticated user's local date and stored history
- add workout execution and set logging
- add adaptive calorie and body-composition targets
- add accessibility and browser interaction tests
