# Sprint 4.24 — Matching Workout Navigation

## Goal

Turn repeated-workout comparison into a browsable timeline without forcing users to close detail and reconstruct their history search.

## Delivered

- Previous and Next navigation between sessions sharing the same normalized workout title
- chronological, deterministic matching independent of current display sorting
- navigation remains available when an adjacent match falls outside the active time range or progressive row boundary
- disabled boundary controls clearly mark the first and latest matching sessions
- the comparison panel updates automatically as the selected session changes
- history filters, search, sorting, and export scope remain untouched while navigating

## Acceptance

- a middle occurrence can navigate both backward and forward
- the earliest occurrence only offers forward navigation
- the latest occurrence only offers backward navigation
- unrelated workout titles never enter the navigation sequence
- case and surrounding whitespace do not split matching sequences
- navigation remains read-only and does not alter stored history
