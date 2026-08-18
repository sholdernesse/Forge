# Sprint 4.32 — Consistent Exercise Form Visuals

## Goal

Make every form guide feel like one trustworthy Forge system instead of a collection of unrelated pictures.

## Delivered

- one reusable Forge motion renderer across every covered exercise
- exercise-specific start and finish poses for:
  - barbell bench press
  - controlled box squat
  - dead bug
  - dumbbell overhead press
  - chest-supported dumbbell row
  - barbell hip thrust
- consistent character anatomy, line weight, equipment color, muscle highlighting, framing, background, and typography
- a recommended camera angle labeled on every guide
- consistent start/finish phase language
- shared play, pause, restart, and slow-speed controls
- consistent primary and secondary muscle legends
- removal of mixed raster/SVG thumbnails from the movement library
- a standardized Forge motion preview treatment in the library
- automated enforcement that every covered guide has a unique motion scene

## Product boundary

These visuals teach observable setup, path, tempo, and end position. They are reference animations rather than personalized biomechanics, diagnosis, or proof that a user’s form is safe.

Male and female character variants remain scheduled as the next character-system layer. They will share these same motion definitions so sex selection cannot create inconsistent exercise mechanics or artwork.

## Acceptance

- no covered form guide falls back to the old mixed image styles
- every exercise has its own motion identifier and pose sequence
- muscle colors and controls mean the same thing throughout the library
- reduced-motion preferences continue to show a stable reference pose
- viewing a guide does not change the assigned workout
- lint, typecheck, tests, production build, security checks, infrastructure compilation, and container builds pass
