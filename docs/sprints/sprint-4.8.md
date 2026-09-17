# Sprint 4.8 — Visual Exercise Guidance

## Goal

Help users understand how an exercise should look and feel without leaving the active workout.

## Delivered

- exercise-guide model separated from workout-plan generation
- original two-position visual guides for barbell bench press, controlled box squat, and dead bug
- in-workout `Watch form` entry point
- responsive full-screen mobile guide and contained desktop dialog
- Setup, Movement, and Avoid instruction views
- accessible alternative text and written guidance alongside every visual
- exercise-specific safety language and a discomfort response
- optimized WebP assets totaling less than 150 KB

## Content architecture

The guide registry references provider-neutral media paths. Additional exercises or licensed media can be added without changing the Workout Player. Visuals supplement—not replace—written cues, accessibility text, and conservative safety guidance.

## Safety boundary

Visual guides are educational references rather than form certification. Forge tells users to stop for sharp or movement-altering pain and does not use a visual to diagnose injury.

## Acceptance

- a user can open and close a guide without losing workout or rest-timer state
- guides work at phone and desktop sizes
- each launch guide contains setup, movement, mistakes, safety guidance, and descriptive alternative text
- missing guide media does not prevent an exercise from being completed
- production assets are locally hosted and require no third-party tracking
