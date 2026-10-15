# Sprint 4.41 — Intentional Movement Quality Feedback

## Goal

Protect Forge’s progression and coaching decisions from false evidence created by a preselected post-workout answer.

## Product audit

Movement quality previously opened with **Controlled** selected. A user could save without evaluating the session, causing Forge to treat an untouched default as evidence for progression.

## Delivered

- Open new post-workout feedback with no movement-quality answer selected.
- Require one deliberate choice: Controlled, Mixed, or Form broke down.
- Keep **Save workout** disabled until a quality answer is chosen.
- Explain why the choice is required without adding another modal or step.
- Preserve existing saved feedback when reviewing a completed workout.
- Preserve compatibility with older session records where movement quality was optional.

## Acceptance

- [x] Forge never records Controlled from an untouched default.
- [x] All three quality choices remain one tap away.
- [x] The missing choice is explained inline.
- [x] Saving becomes available immediately after a selection.
- [x] Existing persisted sessions remain valid.
- [x] No new screen, route, service, or stored field is introduced.
- [x] Lint, typecheck, tests, build, deployment validation, and release-readiness checks pass in CI.
- [ ] Complete the documented physical desktop/mobile acceptance pass against a deployed candidate.

## Deferred

- Physical acceptance should confirm the disabled state and inline instruction remain obvious on a phone without feeling punitive.
- Full AI-character exercise animation remains scheduled follow-on work.
- Live PostgreSQL recovery evidence and Render standby activation require authorized infrastructure.
