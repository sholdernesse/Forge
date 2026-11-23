# Sprint 4.71 — Complete Anatomical Guide Pairing

## Outcome

Every exercise currently covered by the Forge visual system now includes two separate teaching sets: an approved range-of-motion demonstration and a companion anatomical illustration showing the muscles trained.

## Delivered

- Makes `muscleImageSrc` and `muscleImageAlt` required parts of every exercise-guide contract.
- Adds anatomy companions for flat bench press, box squat, dead bug, overhead press, chest-supported row, hip thrust, and lateral raise.
- Preserves the existing RDL anatomy view and every approved movement image.
- Uses the camera angle that best exposes the relevant musculature instead of forcing anatomy and movement images to use the same angle.
- Shows distinct muscle boundaries and fiber direction rather than broad glowing zones.
- Keeps a text legend for users who cannot rely on color alone.
- Adds regression checks requiring unique WebP movement and anatomy assets for every covered exercise.

## Visual hierarchy

- Primary movers use the current Forge green treatment.
- Supporting muscles use the current muted amber treatment.
- These colors remain provisional and will be reviewed together as one system rather than adjusted exercise by exercise.

## Boundaries

- Anatomy imagery communicates broad training emphasis rather than exact individual recruitment or diagnosis.
- Generated images do not override written technique or safety guidance.
- Future exercises cannot be added to the guided catalog without both visual sets and descriptive alternative text.

## Acceptance

- Every guided exercise renders a movement image followed by an anatomical image and text legend.
- Each anatomy image uses a useful muscle-viewing angle and matches its guide's primary/supporting muscle list.
- No approved range-of-motion asset is modified or replaced.
- Type checks, full tests, and the production build pass.
