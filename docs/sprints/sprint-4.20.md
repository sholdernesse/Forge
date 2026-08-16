# Sprint 4.20 — User-controlled Training History Sorting

## Goal

Let users reorganize matching training sessions around the question they are trying to answer.

## Delivered

- Newest first and Oldest first chronology choices
- Highest effort ordering with unrated sessions placed last
- Longest duration ordering
- deterministic date and workout fallbacks for equal values
- sorting composes with time ranges, text search, experience filters, and progressive browsing
- sort changes reset to the first twelve matches and close any open detail
- local-only ordering with no changes to synchronized history data

## Acceptance

- Newest first remains the default
- Oldest first reverses chronological review
- Highest effort orders rated sessions from highest to lowest and places missing ratings last
- Longest duration orders sessions from longest to shortest
- changing sort never modifies or deletes training records
- shown-versus-matched counts remain accurate
