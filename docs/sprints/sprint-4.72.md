# Sprint 4.72 — Face Pull Visual Guide

## Outcome

The programmed band face pull now has a complete Forge visual guide pair showing both controlled execution and the posterior shoulder/back musculature trained.

## Delivered

- Adds a two-panel movement image with a visible rack anchor, extended start, and face-level external-rotation finish.
- Adds a separate rear three-quarter anatomical illustration highlighting the rear deltoids, rhomboids, and middle trapezius.
- Identifies rotator cuff, biceps, forearms, and core as supporting muscles.
- Adds setup, movement, self-check, mistake, tempo, breathing, and safety guidance.
- Connects both assets to the existing `band-face-pull` planner identifier.
- Adds regression coverage for the required image pair, target muscles, anchor, and anti-shrug/anti-lean guidance.

## Boundaries

- The rack anchor must be stable and the band inspected before use.
- The finish is controlled beside the face; users are not told to force maximal external rotation.
- Forge does not diagnose shoulder or neck conditions.

## Acceptance

- Both images show the same band-anchored exercise and a clear start/finish sequence.
- The movement image keeps the torso still and shoulders away from the ears.
- The anatomy image prioritizes the posterior shoulders and mid-back over the arms.
- Type checks, full tests, and the production build pass.
