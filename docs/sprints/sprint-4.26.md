# Sprint 4.26 — Resilient Active Workouts

## Goal

Keep an active workout usable and predictable across mobile interruptions, nested guidance, and movement transitions.

## Delivered

- stacked-dialog focus management for the Movement Library, form guides, and workout guidance
- topmost-dialog Escape handling, focus restoration, and background scroll locking
- persisted absolute rest deadlines that survive closing, reopening, and backgrounding the app
- accurate expired-rest recovery without negative or drifting timers
- accessible rest countdown with add 15 seconds, reduce 15 seconds, and Skip controls
- automatic expansion of the next incomplete movement after the current movement is completed
- no unnecessary rest timer after the final set of the workout
- deterministic coverage for rest persistence, adjustment, expiration, validation, and movement advancement

## Acceptance

- reopening an active workout shows the correct remaining rest time
- time spent with the app backgrounded counts toward rest
- rest adjustments persist with the workout
- completing a movement advances to the next incomplete movement
- completing the final workout set does not start another rest period
- Escape closes only the active nested dialog
- keyboard focus remains within the active dialog and returns to its opener on close

## Scheduled visual-production work

The existing overhead-press animation remains a reference prototype while core application and release acceptance work continues.

The production motion system is scheduled after core workflow stabilization:

1. approve original Forge masculine- and feminine-presenting character turnarounds
2. create reusable skeletal rigs and equipment anchors
3. keyframe and professionally validate the overhead-press pilot
4. implement character, angle, speed, pause, and muscle-overlay controls
5. expand the validated system across the movement library

Character selection controls representation and visual proportions. Range-of-motion guidance remains exercise- and individual-specific rather than being prescribed solely from the selected character.
