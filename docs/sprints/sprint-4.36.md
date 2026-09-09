# Sprint 4.36 — Movement Quality Comparison

## Goal

Make movement quality part of the workout-to-workout story so users can see whether repeatable range and control improved, held, or need attention.

## Delivered

- Compare movement-quality feedback with the previous completed workout sharing the same title.
- Show **Improved**, **Held**, or **Needs control** beside duration, completed sets, and reported effort.
- Preserve honest gaps: Forge only compares quality when both matching sessions include a rating.
- Use calm, distinct visual tones so a lower rating guides attention without presenting a diagnosis.
- Cover comparison ranking and legacy/unrated history behavior with unit tests.

## Acceptance

- [x] A controlled session following a mixed session reads **Improved**.
- [x] Equal ratings read **Held**.
- [x] A lower rating reads **Needs control**.
- [x] Unrated pairs read **Not comparable** rather than inferring quality.
- [x] Lint, typecheck, tests, build, deployment validation, and release-readiness checks pass in CI.
- [ ] Complete the documented physical desktop/mobile acceptance pass against a deployed candidate.

## Deferred

- Exercise animation refinement and the full AI-character motion library remain scheduled follow-on work and do not block this history slice.
- Live PostgreSQL recovery evidence and Render standby activation require authorized infrastructure and remain release-operations work.
