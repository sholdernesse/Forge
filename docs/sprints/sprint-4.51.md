# Sprint 4.51 — Explainable Strength Plateaus

## Outcome

Strength Progress no longer claims every user is improving. Forge now distinguishes a missing baseline, inconsistent training exposure, missing movement-quality evidence, active progress, and a potential plateau—then gives one traceable next action.

## Delivered

- Replaced the fixed “estimated strength is climbing” headline.
- Requires recent schedule consistency before analyzing a plateau.
- Collapses multiple sets from the same movement and date into one comparable exposure.
- Requires at least four comparable exposures spanning at least three weeks.
- Requires movement-quality ratings on at least half of the comparable exposures.
- Prioritizes mixed quality or form breakdown ahead of load progression.
- Identifies measured improvement above a conservative two-percent threshold.
- Uses “potential plateau” language only when sufficient exposure, time, adherence, and quality evidence exist.
- Gives one next action and exposes the evidence supporting it.
- Adds an honest empty state for accounts without loaded working sets.
- Added focused coverage for baseline, inconsistency, progress, missing quality, and plateau outcomes.

## Decision order

1. Establish a loaded strength baseline.
2. Confirm recent schedule consistency.
3. Confirm repeated exposure to the same movement.
4. Confirm sufficient movement-quality feedback.
5. Resolve mixed quality or breakdown before progression.
6. Distinguish measured progress from a potential plateau.

## Boundaries

- Estimated one-repetition maximum is a comparison tool, not a direct strength test.
- Forge does not diagnose why progress slowed.
- A potential plateau does not automatically change load, exercises, volume, or recovery policy.
- No new panel, route, service, storage field, or user input was added.

## Acceptance

- New and inconsistent accounts never receive false plateau or progress claims.
- Plateau language is backed by visible exposure, time, adherence, and quality evidence.
- The Strength Progress card provides one clear next action.
- The insight remains compact on desktop and phone.
- Type checks, the full test suite, and the production build pass.
