# Sprint 4.37 — Explainable Comparison Coaching

## Goal

Turn workout comparison data into a clear answer to “what should I do next?” while keeping Forge’s recommendation deterministic, conservative, and easy to understand.

## Delivered

- Add a coaching story beneath the previous-matching-workout comparison.
- Prioritize movement quality before duration, completed sets, or load progression.
- Distinguish improved control, repeatable control, repeatedly mixed quality, declining quality, and form breakdown.
- Recommend one concrete next action: repeat the standard, hold workload, or rebuild form with reduced load and controlled tempo.
- Refuse to infer a quality trend when both workouts were not rated.
- Cover every coaching branch with focused unit tests.

## Acceptance

- [x] Improved movement quality produces a positive, quality-first narrative.
- [x] Controlled quality held across workouts is recognized separately from mixed quality held.
- [x] Declining quality tells the user to hold workload and protect control.
- [x] Form breakdown takes priority over apparent increases in completed work.
- [x] Missing ratings produce a data-collection prompt rather than a fabricated conclusion.
- [x] The story presents one scannable next action in the session detail.
- [x] Lint, typecheck, tests, build, deployment validation, and release-readiness checks pass in CI.
- [ ] Complete the documented physical desktop/mobile acceptance pass against a deployed candidate.

## Deferred

- Full AI-character exercise animation remains scheduled follow-on work and does not block this coaching slice.
- Live PostgreSQL recovery evidence and Render standby activation require authorized infrastructure and remain release-operations work.
