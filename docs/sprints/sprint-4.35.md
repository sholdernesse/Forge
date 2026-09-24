# Sprint 4.35 — Movement Quality History

## Goal

Close the feedback loop by showing how controlled movement affected progression across recent workouts instead of leaving quality as hidden decision data.

## Delivered

- movement-quality labels in recent training rows
- distinct Controlled, Mixed, and Form broke down visual states
- movement quality in session-detail summaries
- plain-language detail explaining whether range and tempo were repeatable
- four-week controlled-movement percentage
- four-week movement-quality feedback coverage
- count of sessions where progression was held
- a coaching note explaining why progression was held
- history tone escalation for Mixed and Form broke down sessions
- automated history-projection and four-week analytics coverage

## Story rules

- Controlled movement is presented as repeatable range and tempo.
- Mixed movement is presented as a caution and a progression hold.
- Form broke down is presented as the strongest quality warning and a progression hold.
- Missing quality remains “Not recorded” rather than being treated as controlled.
- Discomfort remains a separate safety signal and takes precedence when present.

## Acceptance

- movement quality is visible from both the history row and detail view
- four-week metrics never infer quality from sessions without feedback
- controlled percentage is calculated only from quality-rated sessions
- progression holds are clearly explained
- quality labels remain observational and non-diagnostic
- lint, typecheck, tests, production build, security checks, infrastructure compilation, and container builds pass
