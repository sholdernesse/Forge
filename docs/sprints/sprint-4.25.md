# Sprint 4.25 — Inspectable Strength Progress

## Goal

Turn the Strength Progress summary into an inspectable record rather than a static headline.

## Delivered

- selectable strength-leader cards
- chronological recorded-performance timeline for each selected movement
- estimated one-rep-max trend visualization when at least two records exist
- recorded-set count, latest-versus-first percentage change, and best estimated max
- load, reps, estimated max, date, and personal-record marker for every entry
- a safe one-entry state that explains how to unlock a trend
- non-mutating timeline calculations with deterministic ordering

## Safety boundary

Estimated one-rep max remains a trend proxy derived from completed work, not a prescription to attempt a maximal lift.

## Acceptance

- selecting a ranked movement opens its history in place
- selecting it again or using Close collapses the detail
- timelines remain chronological even when synchronized records arrive out of order
- a single record never produces an invalid chart
- missing movement history returns no detail
- inspecting strength does not alter stored performance data
