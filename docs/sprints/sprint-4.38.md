# Sprint 4.38 — Carry-Forward Workout Focus

## Goal

Make training history useful at the moment of action by carrying one concise lesson from the latest matching workout into today’s workout player.

## Product filter

This slice intentionally adds one priority cue rather than another dashboard module. It reuses existing feedback, stays deterministic, and disappears when there is no relevant prior session.

## Delivered

- Find the latest earlier completed workout with the same normalized title.
- Surface one compact focus beneath workout progress.
- Prioritize stopped discomfort, form breakdown, and mild discomfort before progression.
- Hold workload after mixed movement quality.
- Allow a small progression cue only after controlled movement, with effort influencing the wording.
- Ask for a movement-quality baseline when prior history is unrated.
- Cover matching, priority order, quality states, and no-history behavior with unit tests.

## Acceptance

- [x] The workout player answers “what should I focus on?” before the first set.
- [x] Safety and movement quality outrank workload progression.
- [x] The cue comes from the most recent earlier matching workout.
- [x] No irrelevant or future workout is used.
- [x] Missing history does not create an empty or speculative UI element.
- [x] The cue remains compact on desktop and mobile.
- [x] Lint, typecheck, tests, build, deployment validation, and release-readiness checks pass in CI.
- [ ] Complete the documented physical desktop/mobile acceptance pass against a deployed candidate.

## Deferred

- Full AI-character exercise animation remains scheduled follow-on work and does not block this training loop.
- Live PostgreSQL recovery evidence and Render standby activation require authorized infrastructure and remain release-operations work.
