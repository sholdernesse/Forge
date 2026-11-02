# Sprint 4.19 — Training History Time Ranges

## Goal

Help users focus a growing history on the period that matters without removing access to their complete record.

## Delivered

- Last 30 days, Last 90 days, and All time range choices
- a useful 90-day default for recent training review
- inclusive calendar-day boundaries anchored to the dashboard date
- time ranges combine with text search and experience filters
- visible history returns to the first twelve matches when the range changes
- open session detail closes when it falls outside a newly selected range
- local-only filtering with no additional data transfer

## Acceptance

- 30-day and 90-day choices exclude older completed sessions
- All time restores every session eligible for the active search and experience filter
- time range, search, and experience filters compose predictably
- range changes update the shown-versus-matched count
- invalid record dates do not enter bounded time windows
