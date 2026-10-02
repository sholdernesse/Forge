# Sprint 4.70 — Lateral Raise Form Guide

## Outcome

The programmed dumbbell lateral raise now has a consistent Forge AI-character guide that teaches controlled shoulder abduction without encouraging momentum or forced range.

## Delivered

- Adds a two-panel start-and-finish lateral-raise image matching the existing Forge character, gym, clothing, lighting, and framing.
- Shows the arms moving slightly forward of the exact side plane with soft elbows and neutral wrists.
- Uses shoulder height as a visible reference while explicitly allowing an earlier comfortable endpoint.
- Adds Setup, Movement, Self-check, Avoid, tempo, breathing, muscle, and safety guidance.
- Connects the guide to the existing `lateral-raise` exercise identifier, so it appears wherever that programmed movement opens a form guide.
- Adds regression coverage for asset selection, primary-muscle intent, controlled range, and slow lowering.

## Boundaries

- This slice does not establish the final shared muscle-highlight palette; that decision remains a later cross-guide visual-system pass.
- Forge does not diagnose shoulder conditions or promise a pain-free movement.
- Users are instructed to stop for sharp pain and use only a comfortable controlled range.

## Acceptance

- Both complete dumbbells and the full character are visible in both positions.
- The top position stays at approximately shoulder height with no visible shrug or torso lean.
- The guide discourages swinging and prescribes a slower lowering phase.
- Type checks, full tests, and the production build pass.
