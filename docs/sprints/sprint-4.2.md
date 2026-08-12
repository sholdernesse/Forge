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
- prior-performance context and progressive-overload targets
- one-tap application of recommended reps and load
- estimated one-rep-max calculations and personal-record detection
- strength-progress dashboard ranked by improvement
- adaptive recovery, upper-strength, and lower-strength plan generation
- plan selection from readiness, recent frequency, and weekly target
- home-gym equipment awareness
- elbow- and lower-back-conscious exercise substitutions
- visible plan rationale and intended intensity
- automatic replanning after check-in while preserving active sessions
- Monday-to-Sunday training schedule with completed and adaptive days
- per-muscle weekly hard-set ledger and volume targets
- completed-session summaries persisted from workout execution
- adaptive upper/lower selection driven by relative muscle-volume deficits
- editable adaptive, training, and rest intentions for current and future days
- persisted schedule overrides with active-workout locking
- multi-signal fatigue scoring from readiness, sleep, soreness, and stress
- formal deloads that reduce strength volume 35% and load 10%
- visible deload explanation while keeping safety authoritative
- adaptive calories from metabolic estimate, goal, weight trend, training demand, and recovery
- protein, carbohydrate, and fat targets that reconcile to the calorie budget
- smoothed multi-day weight trend rather than single-weigh-in reactions
- minimum weigh-in and nutrition-adherence gates before calorie adjustments
- explicit target confidence, safeguards, and daily adjustment explanation
- phone-friendly breakfast, lunch, dinner, and snack logging
- quick-add foods grounded in common athlete meals
- custom calories, protein, carbohydrate, and fat entry
- per-item removal and live daily macro totals
- food log persistence and automatic Digital Twin nutrition updates
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
- loaded sets extend exercise history and update strength trends
- progression targets follow the latest completed performance
- Today explains why the generated session matches current recovery and load
- an active workout is never replaced by a later signal refresh
- finishing sets updates the weekly muscle ledger and subsequent plan selection
- a requested training day cannot override critically low readiness
- incomplete current-day food logging does not distort calorie adaptation
- food changes immediately update Today while completed days drive future adherence
- recommendation reasons, evidence count, and confidence are visible
- workspace lint, typecheck, tests, and production build pass

## Next

- persist profile, goals, history, and decisions in PostgreSQL
- make Today use the authenticated user's local date and stored history
- expand workout planning beyond the current recovery-session template
- expand exercise history into per-movement detail pages
- add formal deload blocks and plan-level progression across mesocycles
- add drag-and-drop session moves and recurring schedule templates
- add mesocycle-level deload timing beyond signal-triggered daily deloads
- add barcode capture, serving scaling, and external food search
- add expenditure calibration from longer weight and intake history
- add adaptive calorie and body-composition targets
- add accessibility and browser interaction tests
