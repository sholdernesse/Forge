# Sprint 4.46 — Approve the Starting Plan

## Outcome

A new user now sees a concise, plain-language Forge plan before setup is saved or activated. The existing answers become an understandable weekly direction, and activation requires the explicit **Use this plan** action.

## Delivered

- Extended personal plan setup from three questions screens to a fourth review step without adding questionnaire fields.
- Summarized the user’s primary goal, training rhythm, experience, location, equipment, movement considerations, nutrition support, and starting baseline.
- Added a simple example weekly structure based on the selected training frequency.
- Made Forge’s adaptation boundary explicit: today’s intensity, exercise selection, and recovery work may respond to check-ins and history.
- Made user-controlled choices explicit: Forge does not silently change the primary goal, weekly availability, equipment, or movement considerations.
- Added **Change my answers** and **Use this plan** actions.
- Deferred the completion timestamp and profile activation until the user explicitly approves the review.
- Added focused tests for summary language, supported weekly structures, empty considerations, control boundaries, and four-step progress semantics.
- Added responsive review styling that reuses the existing onboarding visual system.
- Corrected narrow-phone compression by reflowing the dashboard header, condensing review rows, and stacking final approval actions below 420 px.
- Added a physical-phone grid guard that forces dashboard stories to one column and removes intrinsic card widths below 820 px.

## Boundaries

- The review explains the existing deterministic starting-plan inputs; it does not introduce a second plan engine.
- The weekly structure is an example, not a promise that overrides readiness or recovery policy.
- Secondary goals, dietary preferences, and coaching-depth preferences remain future personalization work.
- Physical desktop and phone acceptance remains a release gate.

## Acceptance

- The review uses only answers already collected in setup.
- No profile is completed or activated before **Use this plan** is selected.
- Users can return to their answers without losing them.
- The review clearly separates adaptive daily decisions from user-controlled setup choices.
- Review content remains readable in a single-column phone layout.
- Full CI passes on the documented head.
