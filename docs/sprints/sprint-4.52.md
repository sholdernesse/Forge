# Sprint 4.52 — User-Controlled Training Block Continuation

## Outcome

Forge can now turn a completed four-week review into a proposed next block without silently changing the user’s plan. The proposal either progresses the existing direction or repeats the current structure, and the user must approve it before the new four-week clock starts.

## Delivered

- Converts the existing review result into one compact next-block proposal.
- Proposes progression only when adherence and controlled-movement evidence are ready.
- Proposes a repeat when evidence is incomplete, adherence is low, discomfort is present, or form broke down.
- Preserves the user’s goal, frequency, duration, equipment, and constraints.
- Requires an explicit approval action before activating the next block.
- Persists the active block number, start time, and bounded approach across devices.
- Anchors later reviews to the active block start instead of the original onboarding date.
- Keeps daily readiness, feedback, and movement-level progression safeguards authoritative.

## Boundaries

- Reaching four weeks never increases load or volume automatically.
- A block approval does not bypass discomfort, recovery, or movement-quality protections.
- Forge does not infer a reason for missed sessions or discomfort.
- The proposal stays inside the existing Training Week card; no new screen or route was added.
- Existing profiles without block state remain valid and continue as block one.

## Acceptance

- Ready evidence proposes a progression block.
- Incomplete or concerning evidence proposes a repeat block.
- A proposal does not mutate the active profile before approval.
- Approval starts the correct numbered block and survives validated persistence.
- Later block timing is calculated from its own approved start date.
- Type checks, focused tests, the full test suite, and the production build pass.
