# Sprint 4.29 — Coach Symptom Safety Boundary

## Goal

Prevent symptom-related questions from being treated as ordinary training intent or as permission to continue a painful movement.

## Delivered

- symptom-intent detection before nutrition, recovery, and training routing
- coverage for pain, painful, hurt, hurts, hurting, injury, injured, sharp, discomfort, pinch, and pinching language
- a non-diagnostic safety response for symptom questions
- no symptom-question handoff to Open workout
- recovery-signal handoff with qualified-care language for significant or persistent symptoms
- explicit Coach answer-basis classification
- distinct recommendation, safety-boundary, insufficient-data, and readiness evidence states
- validated persistence of answer-basis metadata
- Coach UI explanation when a response comes from a safety boundary rather than a readiness score
- a discoverable discomfort prompt in the Coach welcome state
- automated intent, handoff, evidence, and persistence coverage

## Safety boundary

Forge does not diagnose an injury and does not use readiness to clear a painful movement. Symptom questions conservatively prioritize stopping movement that is sharp, worsening, persistent, or form-changing; recording the recovery signal; and seeking qualified medical guidance when appropriate.

## Acceptance

- a question can contain both symptom and training language without opening the workout
- common phrases such as “my shoulder hurts” trigger the safety boundary
- symptom answers are labeled as safety-boundary evidence
- the Coach never presents the boundary as a diagnosis
- unsupported answer-basis values are rejected from restored state
- ordinary supported training, nutrition, and recovery questions retain their existing handoffs
