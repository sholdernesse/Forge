# Sprint 4.66 — AI-Character RDL Guide

## Outcome

Forge now teaches and, when appropriate, prescribes the Romanian deadlift using the established photorealistic AI-character visual system.

## Delivered

- Adds an original two-position RDL character asset matching Forge's approved male character, clothing, gym, lighting, framing, and visual treatment.
- Shows a tall start position and controlled hip-hinge position without a rounded back or squat-like depth.
- Adds setup, movement, mistake, self-check, tempo, breathing, muscle, and safety guidance.
- Makes the guide searchable in the Movement Library.
- Prescribes the guided barbell RDL for barbell athletes without a lower-back constraint.
- Retains the hip thrust for lower-back-sensitive profiles.
- Adds guide-contract and constraint-aware planner tests.

## Boundaries

- The image teaches two observable positions; it does not analyze a user's form.
- Written movement standards remain authoritative over generated imagery.
- Lower-back sensitivity prevents automatic RDL prescription.
- The asset contains no third-party imagery, text, logo, or watermark.

## Acceptance

- The RDL uses the same WebP AI-character format as every active guide.
- The planner and guide share the same `barbell-rdl` identifier.
- The movement remains absent from lower-back-sensitive plans.
- Type checks, full tests, and production builds pass.
