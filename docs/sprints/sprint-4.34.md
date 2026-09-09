# Sprint 4.34 — Quality-Gated Progression

## Goal

Make controlled range and repeatable technique part of progression decisions so Forge does not reward completed repetitions when movement quality materially deteriorated.

## Delivered

- a post-workout movement-quality check with three observable choices:
  - Controlled
  - Mixed
  - Form broke down
- plain-language definitions tied to range, tempo, and repeatability
- backward-compatible validation for saved workout feedback
- persistence of movement quality in session history
- propagation of movement quality into recorded exercise performance
- progression holds after Mixed quality
- progression holds after Form broke down
- ordinary clean-rep and smallest-safe-load progression remains unchanged after Controlled quality
- automated validation, propagation, and progression-policy coverage
- responsive feedback controls

## Progression policy

- Controlled: existing double-progression rules may add a clean repetition or the smallest safe load increase.
- Mixed: repeat the current prescription until range and tempo remain controlled.
- Form broke down: hold progression and rebuild repeatable technique before adding work.

This policy never increases load because a user reported discomfort. Existing readiness and symptom safety boundaries remain in force.

## Acceptance

- legacy feedback without movement quality remains valid
- unsupported quality values are rejected
- saved quality reaches both session history and exercise performance
- Mixed and Form broke down cannot produce a higher next target
- Controlled quality preserves existing progression behavior
- user-facing language describes observable movement instead of diagnosis
- lint, typecheck, tests, production build, security checks, infrastructure compilation, and container builds pass
