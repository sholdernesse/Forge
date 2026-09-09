# Sprint 4.21 — User-controlled Training Export Scope

## Goal

Make exported reports reflect the training-history question the user is currently exploring while preserving full-history portability.

## Delivered

- explicit Current view and Full history export choices
- Current view includes every match from the active search, experience filter, and time range
- export scope is independent of progressive on-screen row disclosure
- both styled Excel and CSV honor the selected scope
- filenames clearly identify current-view exports
- live session counts appear inside the scope choices
- empty current views disable export rather than generating a misleading blank report

## Privacy boundary

Both export scopes remain explicit local browser actions. Search terms and filter settings are not written into synchronized state or exported as metadata.

## Acceptance

- Current view exports all filtered matches, including matches not yet revealed on screen
- Full history exports every stored completed session
- Excel and CSV use the same selected record scope
- current-view filenames are distinguishable from full-history filenames
- changing export scope never changes the visible history or stored data
