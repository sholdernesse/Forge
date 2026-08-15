# Sprint 4.9 — Safe Exercise Substitutions

## Goal

Let a user adapt an active workout for available equipment, comfort, or preference without losing the plan's training intent or completed work.

## Slice 1: bounded substitution model

- provider-neutral substitution registry separate from workout-plan generation
- explicit equipment, comfort, and preference reasons
- written explanation of the training intent each alternative preserves
- launch coverage for barbell bench press, controlled box squat, and dead bug
- immutable lookup results and safe empty results for unsupported exercises

## Slice 2: Workout Player handoff

- accessible `Swap exercise` flow inside the active exercise card
- reason and preserved training intent visible before selection
- completed sets block replacement so logged work is never silently discarded
- compatible set and rep targets retained while load resets to a safe starting point
- original exercise identity retained for audit and cross-device persistence

## Next slice

- expand reviewed alternatives to the remaining launch exercises
- connect visual guidance when a selected alternative has a guide
- add an explicit reverse or second-swap flow without losing the original plan identity

## Safety boundary

Substitutions are selected from a closed, reviewed registry. They preserve a broad movement intent, not clinical equivalence, and do not claim to diagnose pain or make an exercise safe for an injury.

## Acceptance

- only reviewed alternatives can replace an exercise
- the reason for swapping and preserved training intent are visible before confirmation
- completed work is never silently discarded
- substitutions survive refresh and authenticated cross-device synchronization
- an unavailable substitution feature never blocks workout completion
