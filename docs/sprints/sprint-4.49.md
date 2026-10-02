# Sprint 4.49 — Selectable Training Calendar

## Outcome

Training Week is now a functional, bounded calendar experience. Users can browse recent and upcoming weeks and make persistent Adaptive, Train, or Rest selections on eligible dates without adding a separate scheduling application.

## Delivered

- Added previous- and next-week navigation inside the existing Training Week panel.
- Supports four weeks of recent history and eight weeks of forward planning.
- Shows the visible Monday-to-Sunday date range and a one-action return to the current week.
- Preserves completed sessions as historical truth.
- Prevents changes to past dates and to today after a workout has begun.
- Keeps future Adaptive, Train, and Rest choices persistent through the existing dashboard state and account sync.
- Separates the displayed week anchor from the real current date so a browsed week is never falsely labeled today.
- Added focused coverage for future-week anchoring and false-today prevention.
- Recorded hydration and optional micronutrient coverage in the later nutrition roadmap.

## Boundaries

- Users select training intent, not a complex exercise-by-exercise calendar prescription.
- Forge still generates the actual daily workout from readiness, history, equipment, and the selected intent.
- Drag-and-drop scheduling, recurring calendar rules, and external calendar integration remain excluded until testing proves they are useful.
- The browser adds no route, modal, service, or storage schema.

## Acceptance

- Users can browse weeks without changing today’s workout accidentally.
- Eligible date selections survive reload and authenticated synchronization.
- Past and completed dates cannot be rewritten.
- The control remains usable in the existing phone-width Training panel.
- Type checks, the full test suite, and the production build pass.
