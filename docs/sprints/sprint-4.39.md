# Sprint 4.39 — Explicit Today Coach Action

## Goal

Make the primary Today recommendation actionable without requiring users to interpret an unlabeled control or navigate through another layer.

## Product filter

This slice replaces ambiguity in an existing component. It adds no new card, route, storage field, or service.

## Delivered

- Map the leading recommendation category to one direct destination.
- Route training priorities to the workout, nutrition priorities to food logging, and recovery priorities to the morning check-in.
- Change the training label with session state: start, resume, or review.
- Default to the planned workout when no adjustment is required.
- Replace the Coach card’s unlabeled arrow with a readable action label.
- Preserve a compact desktop treatment and a full-width mobile action.
- Cover recommendation categories, workout states, and the no-recommendation fallback with unit tests.

## Acceptance

- [x] The primary Coach card answers “what should I do next?” with explicit language.
- [x] The action opens the relevant existing workflow directly.
- [x] No additional navigation or dashboard module is introduced.
- [x] Training wording reflects the actual workout state.
- [x] The action remains readable on desktop and mobile.
- [x] Lint, typecheck, tests, build, deployment validation, and release-readiness checks pass in CI.
- [ ] Complete the documented physical desktop/mobile acceptance pass against a deployed candidate.

## Deferred

- Full AI-character exercise animation remains scheduled follow-on work and does not block this clarity improvement.
- Live PostgreSQL recovery evidence and Render standby activation require authorized infrastructure and remain release-operations work.
