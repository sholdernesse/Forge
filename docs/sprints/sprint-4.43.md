# Sprint 4.43 — Honest Personal First-Run

## Outcome

A personal Forge session no longer begins with demonstration workouts, meals, strength records, favorites, or Coach history. The rich fixture remains available only in the explicit local development experience.

## Delivered

- Added an explicit demo-versus-personal experience boundary.
- Seeded demonstration collections only when authentication reports the development experience.
- Initialized signed-out, loading, and signed-in production sessions with empty user-owned collections.
- Removed demonstration fallbacks when older synchronized records omit optional collections.
- Added a concise first-run card that explains the empty history and routes the user to the morning check-in.
- Replaced ambiguous “Demo data” account and save labels with truthful personal first-run copy.
- Added focused tests for experience selection and first-run evidence.

## Product decision

This slice deliberately stops before full onboarding. It establishes truthful ownership first; goal, schedule, experience, equipment, constraints, and nutrition preferences remain the next personalization work.

## Acceptance

- Development mode still renders the review fixture.
- A clean production session contains no demonstration activity.
- Recording any personal evidence dismisses the first-run prompt.
- The prompt remains readable and actionable on desktop and phone.
- CI must pass on the documented head.
