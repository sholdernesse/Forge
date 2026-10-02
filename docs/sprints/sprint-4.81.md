# Sprint 4.81 — Movement Library Image Loading

## Goal

Keep the completed 32-movement catalog responsive on phones without hiding or reducing its visual guidance.

## Delivered

- Added native lazy loading to every Movement Library thumbnail.
- Added asynchronous image decoding so off-screen guide previews do not compete with the visible dialog interaction.
- Added a markup contract covering all 32 catalog thumbnails.

## Product constraint

The optimization changes neither guide quality nor navigation. Full movement and anatomy images still load when the user opens a guide.

## Acceptance

- All 32 thumbnails declare lazy loading and asynchronous decoding.
- Search, guide selection, accessibility semantics, and empty-result behavior remain unchanged.
- The production catalog no longer requests immediate decoding for every off-screen preview.
