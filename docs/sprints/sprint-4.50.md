# Sprint 4.50 — Truthful Progress Timeline

## Outcome

Progress now tells an evidence-based story instead of displaying fixed prototype claims. Users can optionally open a compact Performance Timeline that connects recent training, movement quality, nutrition, sleep, and reflection context by date without claiming that one event caused another.

## Delivered

- Removed fixed “moving steadily,” “on track,” and recomposition language from the weight card.
- Builds weight direction only from real recorded measurements.
- Requires at least two weight measurements before describing a trend.
- Uses the authenticated user’s actual primary goal as context.
- Added a collapsed-by-default Performance Timeline within the existing Progress card.
- Limits the timeline to five recent meaningful events.
- Combines same-day workout, movement quality, protein, and sleep signals.
- Keeps discomfort and form-breakdown evidence visible.
- Adds reflection-only and nutrition-only events when no workout exists that day.
- Explicitly states that chronological sequence is not proof of causation.
- Added focused tests for insufficient weight data, measured direction, signal combination, and discomfort handling.

## Boundaries

- The timeline is not a social feed or an exhaustive activity log.
- Forge does not infer that nutrition, sleep, or reflection caused a training outcome.
- Missing measurements do not receive fallback values in the trend.
- No route, navigation item, service, storage schema, or new user input was added.

## Acceptance

- A new account never receives fabricated weight direction or goal status.
- A user can inspect recent cross-domain context without leaving Progress.
- Timeline content remains optional and compact on phone and desktop.
- Safety signals remain visible and progression-neutral.
- Type checks, the full test suite, and the production build pass.
