# Sprint 4.33 — In-Workout Movement Standards

## Goal

Carry Forge’s slow, controlled, full-range coaching philosophy into the active set-logging experience so form guidance is present before the user adds load or marks a set complete.

## Delivered

- an exercise-specific Movement Standard inside every supported active exercise
- three concise phases:
  - Start — the first setup checkpoint
  - Move — the intended movement path
  - Control — an observable repeatability check
- the full prescribed tempo beside the movement phases
- a direct AI character form-guide action immediately above the standard
- explicit guidance to use the full comfortable range the user can control
- a persistent “quality stays ahead of load” progression boundary
- responsive mobile layout that stacks movement phases for readability
- reuse of the existing validated setup, movement, self-check, and tempo content

## Product boundary

Movement Standards guide execution; they do not use the camera to judge form, diagnose pain, or certify that a repetition is safe. Pain and discomfort remain governed by Forge’s existing conservative safety boundary.

## Acceptance

- each exercise with a visual guide also shows a movement standard
- Start, Move, and Control content comes from the same guide contract as the form modal
- tempo is visible without opening another screen
- the standard appears before the editable set rows
- the mobile layout does not require horizontal scrolling
- progression language prioritizes repeatable control over increasing load
- lint, typecheck, tests, production build, security checks, infrastructure compilation, and container builds pass
