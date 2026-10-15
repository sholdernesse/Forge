# Sprint 4.22 — Previous Workout Comparison

## Goal

Give completed-session detail meaningful context without labeling longer, harder, or higher-volume work as inherently better.

## Delivered

- automatic comparison with the most recent earlier session sharing the same normalized workout title
- duration, completed-set, and reported-effort deltas
- previous and current values shown beside every delta
- effort comparison only when both sessions contain a rating
- neutral change language instead of prescriptive performance judgments
- deterministic previous-session selection independent of the active history filters
- a visible repeated-workout example in the local demo history

## Acceptance

- opening a repeated workout displays its nearest earlier match
- the first occurrence of a workout does not show an empty comparison panel
- title matching ignores surrounding whitespace and letter case
- missing effort never becomes a numeric zero
- comparisons do not modify synchronized training records
- comparison remains available even when the previous session is outside the current time range
