# Sprint 4.14 — Training Consistency Trends

## Goal

Turn completed-session history into an understandable four-week consistency view without inventing scores when feedback is missing.

## Delivered

- Monday-aligned four-week training window
- completed-session and total-duration summaries
- weekly training-minute bars
- average perceived effort when reported
- explicit feedback-coverage percentage
- discomfort-session count within the same bounded window
- future sessions excluded from current summaries
- stable empty and partial-data states

## Interpretation boundary

The trend is descriptive rather than diagnostic or prescriptive. Missing effort feedback is shown as missing data, never converted into a low score. Discomfort counts provide context and do not label an injury.

## Acceptance

- the chart always shows four aligned calendar weeks
- only sessions on or before the current day are counted
- total time equals the included session durations
- average effort uses only sessions with reported effort
- feedback coverage makes missing reports visible
- discomfort counts use the same four-week boundary
- empty history renders without misleading zero-effort language
