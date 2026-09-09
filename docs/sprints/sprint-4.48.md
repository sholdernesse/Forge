# Sprint 4.48 — Evidence-Based Block Review

## Outcome

The four-week starting block now ends with an honest review instead of leaving the user permanently in Week 4. Forge summarizes adherence and movement-quality evidence, then gives one conservative next recommendation without activating a new block automatically.

## Delivered

- Marks the starting block review-ready after four complete weeks.
- Reviews sessions completed against the approved four-week commitment.
- Reports movement-quality feedback coverage and controlled-session percentage.
- Detects discomfort and reported form breakdown before recommending progression.
- Distinguishes ready, repeat, and needs-evidence outcomes.
- Recommends reducing frequency or duration when the current plan was difficult to repeat.
- Requires user review and approval before a later block may progress.
- Reuses the existing Training Week panel, onboarding timestamp, and session history.
- Added focused coverage for review timing, strong evidence, discomfort, form breakdown, and missing feedback.

## Decision order

1. Require four complete weeks.
2. Require enough real session and movement-quality evidence.
3. Hold progression for discomfort or form breakdown.
4. Address low adherence before increasing training demand.
5. Recommend next-block review only when adherence and controlled movement are both strong.

## Boundaries

- Forge does not diagnose the cause of discomfort.
- Missing ratings never count as controlled movement.
- The review does not generate or activate a second block.
- No route, modal, service, storage field, or navigation item was added.

## Acceptance

- A completed block no longer appears indefinitely as an active Week 4.
- The recommendation is traceable to visible session and quality evidence.
- Safety and repeatability outrank progression.
- The review remains compact on desktop and phone.
- Type checks, the full test suite, and the production web build pass.
