# Sprint 4.42 — Truthful User Context

## Goal

Remove fixed prototype identity and calendar assumptions before building onboarding, so Forge always presents the current user and their actual local day.

## Delivered

- Derive the active date from the browser’s local calendar rather than a fixed August 12 constant.
- Display the current local weekday and date.
- Use a morning, afternoon, or evening greeting based on local time.
- Use the authenticated display name or username with a neutral Athlete fallback.
- Remove Shane and the 120-day-shred label from generic development identity.
- Create a valid empty daily snapshot when the current date is not present.
- Preserve synchronized and legacy history while preventing a missing-today crash.
- Cover date, greeting, identity, and snapshot behavior with focused unit tests.

## Acceptance

- [x] The production UI contains no fixed August 12 heading.
- [x] The greeting reflects the current local time.
- [x] Authenticated identity drives the visible first name.
- [x] Development mode uses a neutral identity.
- [x] A missing current-day record produces honest zero activity/nutrition values.
- [x] Existing current-day history is returned unchanged.
- [x] Lint, typecheck, tests, build, deployment validation, and release-readiness checks pass in CI.
- [ ] Complete physical desktop/mobile acceptance against a deployed candidate.

## Next

- Separate remaining seeded profile, goals, history, food, and workout fixtures from a real authenticated user’s first-run state.
- Implement the reviewed onboarding starting paths after the first-run boundary is honest.
