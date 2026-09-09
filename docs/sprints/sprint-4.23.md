# Sprint 4.23 — Exercise-level Workout Continuity

## Goal

Extend repeated-workout context from session totals to the individual movements that shaped those totals.

## Delivered

- movement-by-movement completed-set comparison inside the previous-workout panel
- union matching across both sessions so added and omitted movements remain visible
- previous and current completed-set values beside a neutral delta
- alphabetical movement ordering for deterministic scanning
- legacy sessions without exercise summaries retain the session-level comparison without an empty movement section
- demo history includes repeated exercise summaries for immediate review

## Acceptance

- movements present in both sessions show their completed-set change
- newly added movements compare against zero previous sets
- omitted movements compare to zero current sets
- unchanged movement volume displays a neutral zero
- missing legacy exercise detail never prevents the session-level comparison
- comparison remains read-only and local
