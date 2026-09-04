# Forge Product Plan

> **Living plan:** This is the canonical product and delivery plan for Forge. Update it whenever scope, priorities, sequencing, or release status changes. Individual sprint files remain the implementation record.

**Current checkpoint:** Sprint 4.59 on PR #2
**Product stage:** Functional responsive prototype moving toward an authenticated release candidate  
**Last reviewed:** September 3, 2026

## 1. North star

Forge is an AI-powered performance operating system that helps people **eat, train, and recover with purpose**.

The product should feel like a calm, knowledgeable coach—not a collection of disconnected dashboards. It should translate the user’s goals, readiness, training history, nutrition, recovery, constraints, and feedback into one understandable next action.

### Primary promise

Within three seconds, a user should understand:

1. How am I doing today?
2. What should I do next?
3. Why is Forge recommending it?
4. What changed because of my feedback?

## 2. Product principles

1. **Clarity first** — one obvious next action; progressive disclosure for detail.
2. **Story, not data** — metrics must become interpretation and direction.
3. **Adaptive and personal** — plans respond to evidence, history, goals, equipment, schedule, and constraints.
4. **Premium and minimal** — high contrast, spacious composition, restrained accents, and no decorative clutter.
5. **Quality before load** — controlled, repeatable movement precedes progression.
6. **Human and non-judgmental** — no hype, guilt, shaming, diagnosis, or invented certainty.
7. **Deterministic decisions, AI explanation** — product engines calculate; AI explains within permitted actions.
8. **Always improving** — small useful changes compound; features must earn their place.

## 3. Intended users

Forge should work for:

- someone new to training who needs clear setup, form, and progression guidance;
- an experienced athlete who wants adaptive planning without manual spreadsheet management;
- a user training at home with specific equipment or movement constraints;
- a user balancing physique, performance, nutrition, recovery, and mental well-being.

The interface should never require fitness expertise to understand the next action.

## 4. Core product loop

1. **Check in** — sleep, soreness, stress, bodyweight, and later connected-device signals.
2. **Understand Today** — readiness, priorities, explanation, and confidence.
3. **Act** — complete training, nutrition, or recovery work.
4. **Reflect** — effort, discomfort, movement quality, and optional mind/body/soul context.
5. **Adapt** — update the Digital Twin, progression, schedule, nutrition, and future coaching.
6. **See the story** — show progress and decisions over time, not isolated numbers.

## 5. Product areas

| Area | User outcome | Current status |
|---|---|---|
| Today | Understand readiness and the next priority quickly | Functional |
| Training | Follow, log, adjust, and complete an adaptive workout | Functional |
| Nutrition | Log food and understand adaptive daily targets | Functional prototype |
| Recovery | Record signals and receive conservative adjustments | Functional |
| Progress | Understand strength, volume, quality, and session trends | Functional |
| Coach | Understand why Forge changed the plan and act directly | Functional prototype |
| Movement guidance | Learn setup, range, tempo, and working muscles visually | Interim still-image system |
| Account and sync | Continue securely across devices | Implemented; physical acceptance pending |

## 6. Architecture guardrails

- The UI displays decisions; services make decisions.
- `@forge/digital-twin` owns canonical derived user state.
- `@forge/recommendation-engine` owns deterministic recommendation policy.
- `@forge/coach` exposes explanations and permitted actions.
- The web client must not invent readiness, calorie, progression, or safety decisions.
- Persisted state remains versioned and validated.
- Safety and account isolation override convenience.
- New services are added only when an existing boundary cannot support the requirement cleanly.
- Design for 100,000+ users, but do not deploy or pay for unused infrastructure prematurely.

See [Sprint 4 architecture](./architecture/sprint-4.md) for package and data-flow details.

## 7. Delivered capability

### Foundation

- Monorepo with shared, Digital Twin, recommendation, coach, API, and web packages.
- Explainable recommendations with evidence and confidence.
- Versioned local persistence and authenticated cross-device sync.
- Conflict detection, account isolation, safe validation, and release checks.
- Azure infrastructure definitions, production web gateway, recovery procedures, and Render standby documentation.
- Reproducible CI covering lint, typecheck, tests, build, security boundaries, release policy, infrastructure compilation, and container builds.
- Shared stack-aware dialog keyboard behavior with targeted focus, Escape, semantic markup, and onboarding-flow tests.

### Today and coaching

- Readiness and recovery factors.
- Adaptive recommendation narrative.
- Explicit direct action for training, nutrition, or recovery.
- Morning check-in and evening mind/body/soul reflection.
- Sync, offline, and conflict states.
- User-local calendar context, time-aware greeting, and authenticated display identity.
- Explicit demo-versus-personal first-run boundary with empty user-owned activity collections.
- Four-step personal plan setup that supplies validated inputs, previews the starting direction, explains adaptation boundaries, and requires explicit approval before activation.

### Training

- Adaptive recovery, upper-strength, and lower-strength planning.
- Readiness, training frequency, muscle-volume, schedule, equipment, and constraint awareness.
- Active-session locking so a plan is not replaced mid-workout.
- Exercise order, working and warm-up sets, reps, load, duration, rest countdown, set editing, and resume.
- Exercise substitutions that preserve training intent.
- Progression targets, estimated one-rep max, personal records, deload protection, and strength history.
- Full comfortable range, tempo, and movement-standard guidance.
- Intentional post-workout effort, discomfort, and movement-quality feedback.
- Quality-gated progression and carry-forward focus from the latest matching workout.
- Session comparison and explainable next-step coaching.

### Nutrition

- Adaptive calories and macros from deterministic policy.
- Food search, quick foods, favorites, quantities, custom foods, saved meals, meal periods, and removal.
- Provider-neutral barcode boundary with safe unknown-food behavior.
- Immediate daily totals and Digital Twin updates.
- Low-friction daily water logging with bounded quick-add entries and cross-device persistence.

### History and progress

- Training history search, filters, sort, range, pagination, detail, previous/next matching workouts, and exports.
- Four-week summaries for sessions, time, effort, feedback coverage, discomfort, and controlled movement.
- Exercise-level set continuity and movement-quality comparison.
- End-of-day reflection history.

### Simplification completed

- Global navigation reduced to Today, Nutrition, Training, Progress, and Coach.
- Duplicate Movement Library entry points removed.
- Movement guidance kept in its relevant workout context.
- Coach recommendation converted from an unlabeled arrow to one explicit action.
- Untouched defaults no longer create false controlled-movement evidence.

## 8. Current release scope

PR #2 should deliver a coherent, testable Forge web candidate with:

- authenticated account access;
- Today, Training, Nutrition, Progress, Recovery, and Coach workflows;
- cross-device persistence and conflict protection;
- explainable deterministic decisions;
- responsive desktop and phone behavior;
- safe empty, offline, invalid-data, and legacy-data handling;
- documented deployment and recovery boundaries.

### Remaining release blockers

1. **Complete physical desktop/mobile acceptance**
   - Run the [physical acceptance checklist](./acceptance/physical-desktop-mobile.md) against the deployed candidate.
   - Record browser/device evidence, cross-device continuity, conflict recovery, account isolation, and responsive behavior.
2. **Record authorized recovery evidence**
   - PostgreSQL restore and Render standby exercises remain operational gates when infrastructure is authorized.

## 9. Prioritized roadmap

### Phase A — Release-candidate truthfulness and acceptance

**Objective:** Make the current experience honest, user-specific, and physically validated.

1. ~~User-local clock and authenticated display identity.~~ Completed in Sprint 4.42.
2. ~~Production-safe first-run/demo-data boundary.~~ Completed in Sprint 4.43.
3. ~~Targeted accessibility and critical interaction coverage.~~ Completed in Sprint 4.45; deployed browser/device validation remains in physical acceptance.
4. Physical desktop/mobile acceptance.
5. Resolve only defects found by those gates.

**Exit:** A new user can sign in, understand Today, complete the core loop on desktop and phone, and see only their own durable data.

### Phase B — Onboarding and personalization

**Objective:** Let users establish the inputs Forge currently demonstrates.

- ~~Primary goal selection.~~ Delivered in Sprint 4.44; secondary-goal prioritization remains.
- ~~Experience level.~~ Delivered in Sprint 4.44; preferred coaching depth remains.
- ~~Training schedule, available time, equipment, and location.~~ Delivered in Sprint 4.44.
- ~~Supported movement considerations and conservative substitutions.~~ Initial lower-back and elbow boundaries delivered in Sprint 4.44; broader preferences remain.
- ~~Nutrition support preference.~~ Delivered in Sprint 4.44; dietary preferences and logging expectations remain.
- ~~Clear review of what Forge will use and what requires user approval.~~ Delivered in Sprint 4.46 with an explicit plan-preview and activation boundary.

**Exit:** Forge can generate the first honest plan without seeded profile assumptions.

### Phase C — Coherent planning blocks

**Objective:** Extend daily adaptation into understandable multi-week direction.

- ~~Visible four-week starting block with goal, duration, exercise intent, and quality-first progression.~~ Delivered in Sprint 4.47; later-block generation remains.
- ~~Evidence-based end-of-block review using adherence, movement quality, and discomfort signals.~~ Delivered in Sprint 4.48; later-block activation remains user-controlled future work.
- ~~User-approved later-block activation that proposes progression or repetition from adherence, movement quality, and discomfort evidence.~~ Delivered in Sprint 4.52; longer mesocycle progression remains.
- Plan-level deload timing across longer mesocycles.
- ~~Bounded weekly calendar browsing and persistent Adaptive, Train, or Rest selections.~~ Delivered in Sprint 4.49; richer templates remain evidence-gated.
- ~~A compact Performance Timeline connecting workouts, nutrition, recovery, reflection, and outcomes without causal overclaiming.~~ Delivered in Sprint 4.50; deeper decision-event history remains evidence-gated.
- ~~Plateau and adherence explanations grounded in sufficient repeated exposure, elapsed time, schedule coverage, and movement quality.~~ Delivered in Sprint 4.51.

**Exit:** Users understand both today’s action and how it advances the larger goal. Initial block continuation is now functional; longer mesocycle programming remains planned.

### Phase D — Forge movement system

**Objective:** Replace interim instructional imagery with a consistent, owned visual teaching system.

Requirements:

- Use Forge-owned AI-generated human characters—never stick figures.
- Maintain consistent characters, clothing, camera angle, environment, lighting, and visual language across exercises.
- Offer male and female character selection where body proportions or presentation may affect how the movement is understood.
- Show setup, slow controlled movement, full comfortable range, finish position, primary muscles, and important secondary muscles.
- Preserve pause, slow playback, reduced-motion behavior, and concise written cues.
- Validate each movement against reviewed exercise standards; generated imagery must not become the source of truth.
- Build reusable motion assets and a content pipeline rather than generating unrelated visuals inside the app at runtime.

Initial delivery order:

1. Overhead press.
2. Squat pattern.
3. Hip hinge/RDL.
4. Bench press.
5. Row.
6. Lateral raise.
7. Face pull.
8. Core and mobility movements.
9. Remaining exercise library by training-plan usage.

**Exit:** The most-used movements have consistent, safe, understandable Forge character demonstrations on desktop and phone.

### Phase E — Nutrition depth

**Objective:** Improve nutrition accuracy without turning Forge into a food-entry spreadsheet.

- ~~Provider-neutral authenticated food search and barcode gateway.~~ Delivered in Sprint 4.54 using USDA FoodData Central with Open Food Facts barcode fallback; production USDA credentials remain an operational configuration step.
- ~~Camera barcode capture with manual fallback.~~ Native secure-camera scanning delivered in Sprint 4.55; Sprint 4.57 makes HTTPS and camera capability failures explicit, Sprint 4.58 provides trusted local HTTPS for physical phone testing, and Sprint 4.59 adds an on-demand decoder for iPhone browsers without the native Barcode Detection API.
- ~~Goal-aware alternate-food suggestions with explicit nutritional tradeoffs.~~ Delivered in Sprint 4.56 for comparable provider results; category, allergy, and dietary-preference depth remains future work.
- ~~Low-friction hydration logging with quick-add amounts.~~ Delivered in Sprint 4.53; evidence-based target context remains future work.
- Optional weekly micronutrient coverage after verified food data is available; avoid deficiency diagnosis or high-dose supplement advice.
- Longer-history expenditure calibration.
- Adaptive body-composition targets and clear adjustment explanations.
- Meal planning only where it reduces logging burden.

**Exit:** Nutrition adaptation is trustworthy, low-friction, and connected to the user’s goal and training demand.

### Phase F — Production operations and scale

**Objective:** Operationalize only what the release and real usage require.

- Authorized PostgreSQL production environment and tested backup/restore.
- Azure deployment as the primary supported path.
- Render standby activation only when cost and recovery objectives justify it.
- Monitoring, error reporting, audit events, privacy retention, and support procedures.
- Load and capacity testing against measured traffic patterns.
- Staged scaling toward 100,000+ users through stateless services, indexed account-scoped data, queues for asynchronous work, and observable limits.

**Exit:** Forge can be operated, recovered, and scaled without compromising account isolation or decision integrity.

## 10. Explicitly not in the immediate build

These ideas require evidence before they earn scope:

- social feed, public leaderboards, or follower mechanics;
- marketplace or trainer-management suite;
- live camera-based form diagnosis;
- autonomous medical or injury diagnosis;
- unrestricted LLM changes to calories, readiness, or training;
- complex drag-and-drop planning before simpler controls are tested;
- real-time generated exercise visuals inside the workout;
- multiple deployment platforms before the primary path is accepted;
- decorative dashboards that do not change a user decision.

## 11. Definition of done for every slice

A slice is complete only when:

- it improves a named user outcome;
- the next action remains clear;
- it reuses existing architecture where reasonable;
- missing evidence does not produce invented certainty;
- persisted data is validated and backward compatible;
- desktop and phone behavior are considered;
- accessibility impact is considered;
- focused tests cover decision logic;
- full CI passes on the exact documented head;
- documentation and this plan are updated when scope or sequencing changes.

## 12. Review cadence

Review this plan:

- after every material product decision;
- when a sprint changes roadmap status;
- before requesting physical acceptance;
- before provisioning paid infrastructure;
- before merging a release PR.

Sprint documents in [`docs/sprints/`](./sprints/) provide the detailed delivery record. The [documentation index](./README.md) links deployment, recovery, and acceptance material.
