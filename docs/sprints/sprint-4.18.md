# Sprint 4.18 — Scalable Training History Browsing

## Goal

Keep long training histories responsive and approachable without preventing access to older sessions.

## Delivered

- the twelve most recent matching sessions remain the initial view
- a progressively disclosed control reveals up to twelve older matching sessions at a time
- the control states exactly how many sessions the next reveal will add
- the result summary distinguishes sessions currently shown from all search and filter matches
- changing search text or filter scope returns to the first result page
- any open session detail closes when the result scope changes
- all browsing remains local to the history already loaded in the dashboard

## Acceptance

- histories with twelve or fewer matches do not show an unnecessary reveal control
- larger histories can be browsed until every matching session is visible
- the last reveal never advertises or displays more sessions than remain
- search and filter changes reset the visible boundary to twelve
- empty and no-match states remain distinct
