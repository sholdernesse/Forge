# Sprint 4.2 — Functional Today Dashboard

## Goal

Turn Forge's decision engine into a browser-based coaching experience that users can inspect and interact with.

## Included

- responsive React and Vite application shell
- Today readiness, recovery, activity, nutrition, and training views
- live morning check-in with sleep, soreness, stress, and bodyweight inputs
- versioned on-device persistence so saved check-ins survive refreshes
- draft isolation so dismissing a check-in does not change the active plan
- safe fallback when stored prototype data is invalid or outdated
- full-screen, phone-friendly workout execution mode
- per-set reps, load, duration, and completion logging
- automatic rest countdown with skip control
- resumable workout state across refreshes
- completed workout minutes written back to Digital Twin history
- immediate Digital Twin recalculation through the production domain packages
- explainable recommendation evidence and confidence
- seven-day weight trend and weekly training progress
- desktop sidebar and mobile bottom navigation
- realistic demonstration history for product review

## Architecture

The web application renders decisions but does not own coaching calculations. Check-in values are normalized into `DailySnapshot`, passed to `buildDigitalTwin`, and evaluated by `CoachService`.

Sprint 4.2 uses versioned on-device persistence behind a small storage adapter. The `CoachRepository` contract remains the boundary for the authenticated production database adapter planned next.

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
- workout sets can be edited, completed, paused, and resumed
- finishing a workout updates weekly training progress
- recommendation reasons, evidence count, and confidence are visible
- workspace lint, typecheck, tests, and production build pass

## Next

- persist profile, goals, history, and decisions in PostgreSQL
- make Today use the authenticated user's local date and stored history
- expand workout planning beyond the current recovery-session template
- add exercise history, progression targets, and personal records
- add adaptive calorie and body-composition targets
- add accessibility and browser interaction tests
