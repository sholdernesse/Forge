# Sprint 4.32 — Consistent AI Character Form Guides

## Goal

Make every form guide feel like one trustworthy Forge system while preserving the photorealistic AI-generated characters established for the product.

## Delivered

- retained the original AI character guides for barbell bench press, controlled box squat, and dead bug
- added matching AI character guides for dumbbell overhead press, chest-supported dumbbell row, and barbell hip thrust
- the same premium dark home-gym setting across the complete guide set
- consistent two-panel start/finish compositions with a vertical divider
- consistent character identity, clothing continuity, camera position, lighting, framing, and equipment treatment within each exercise
- realistic male and female AI-generated fitness characters
- restored AI character previews throughout the Movement Library
- removed stick-figure rendering from the active form-guide experience
- retained written setup, movement, tempo, breathing, self-check, mistake, and safety guidance
- automated enforcement that every covered guide uses a distinct WebP character asset

## Product boundary

The character images teach observable setup and finishing positions. They are reference visuals rather than diagnosis, personalized biomechanics, or proof that a user’s form is safe.

The future male/female preference will select a complete matching character set. Both variants must use the same exercise mechanics, framing specification, and acceptance review so the two libraries cannot drift apart.

## Acceptance

- all six covered exercises display AI-generated characters
- no active guide falls back to SVG or stick-figure artwork
- each exercise has a distinct two-position WebP asset
- start and finish positions use the same character and environment within an exercise
- the dark Forge gym aesthetic remains consistent across exercises
- viewing a guide does not change the assigned workout
- lint, typecheck, tests, production build, security checks, infrastructure compilation, and container builds pass
