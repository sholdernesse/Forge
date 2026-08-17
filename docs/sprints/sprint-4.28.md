# Sprint 4.28 — Clear Next Actions

## Goal

Answer “what should I do next?” immediately during training while keeping completed-session history grounded in actual elapsed time.

## Delivered

- persistent Up next guidance in the active workout
- selected-movement-first resolution with fallback to the next incomplete movement
- clear warm-up versus working-set labels
- repetition, load, and duration targets in the cue
- exercise tempo surfaced from the reviewed form guide
- one-tap access to form guidance and collapsed next sets
- no stale next-step cue after workout completion
- Today-card separation of working sets and warm-ups
- actual start-to-finish workout duration for history, trends, and comparisons
- bounded legacy fallback when valid timestamps are unavailable
- timestamp validation and chronological-order protection for restored sessions
- deterministic next-step and elapsed-duration coverage

## Acceptance

- an active workout identifies the next incomplete set without searching through every exercise
- changing the expanded movement updates the cue to that movement when work remains
- warm-ups are visibly distinct from working sets
- exercises with form guidance expose tempo and form access from the cue
- completing all sets removes the cue
- Today never combines warm-ups and working sets into an ambiguous count
- completed sessions use real elapsed time when valid start and finish timestamps exist
- invalid or reversed timestamps cannot enter synchronized workout state
- legacy sessions retain a conservative bounded duration fallback
