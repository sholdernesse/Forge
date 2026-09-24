# Sprint 4.17 — Training History Search and Filters

## Goal

Keep a growing synchronized training history usable as the number of completed sessions increases.

## Delivered

- text search across workout titles, exercise names and IDs, muscle groups, discomfort state, and feedback notes
- All, High effort, and Discomfort filter modes
- high effort defined transparently as reported effort of 8 or greater
- missing effort never included in the high-effort result set
- combined search terms use AND matching
- visible filtered-versus-total session count
- twelve-row display boundary after filtering
- safe no-results state distinct from an empty training history
- selected session detail closes when search or filter scope changes

## Privacy boundary

Search runs locally against the dashboard state already loaded in the browser. Feedback notes can match a search but remain hidden in results until the user deliberately opens the session detail.

## Acceptance

- title, exercise, muscle, and note terms find matching sessions
- every entered search term must match the same session
- High effort contains only sessions with reported effort of 8–10
- Discomfort contains mild and stopped sessions
- result counts update with search and filters
- clearing search and selecting All restores recent history
- no-results messaging never implies that history was deleted
