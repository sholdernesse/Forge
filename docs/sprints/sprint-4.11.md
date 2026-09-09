# Sprint 4.11 — Feedback-aware Training Guardrails

## Goal

Use the user's experienced effort and discomfort to make the next workout more conservative when recovery signals alone do not tell the whole story.

## Delivered

- three-day feedback assessment window before the next plan is generated
- near-maximal effort or mild discomfort activates the existing tested deload policy
- a session stopped for discomfort selects low-intensity recovery work
- feedback never increases training load or overrides low-readiness protections
- completed-session feedback is visible in Today for review
- old feedback falls out of the decision window instead of permanently suppressing training
- plan rationale states which user-reported signal caused the adaptation

## Decision boundary

Feedback is interpreted through deterministic policy rather than generated prose. `stopped` is a conservative planning signal, not an injury diagnosis. A manual train-day intention cannot bypass recovery selection caused by low readiness or a recently stopped session.

## Acceptance

- recent near-maximal effort reduces strength volume and load
- recent mild discomfort reduces strength volume and load
- recent stopped discomfort selects recovery work
- feedback older than three days does not affect the plan
- Today shows the stored effort and discomfort result
- every adaptation remains explainable in the plan rationale
