# Physical desktop/mobile acceptance

This checklist is the remaining human acceptance gate for PR #2. It must be run against the deployed candidate with a physical desktop browser and phone; automated clients are supporting evidence, not a substitute.

## Preparation

- [ ] Record candidate commit, deployment URL, UTC start time, desktop/browser version, phone/OS/browser version, and network used.
- [ ] Confirm both devices use the same authorized test account and that no production account or health data is involved.
- [ ] Keep developer tools open on desktop and preserve redacted screenshots or recordings for failures. Never capture access tokens.
- [ ] Start each isolation scenario from a signed-out/private window so cached local state cannot mask a server failure.

## Desktop to mobile continuity

- [ ] Sign in on desktop, create a check-in, complete a workout with at least two movements, and record the visible values and UTC time.
- [ ] Sign in on the phone and confirm the check-in, completed workout, exercise summaries, and Strength Progress records hydrate without a manual re-entry.
- [ ] On the phone, inspect a strength leader, its chronological timeline, personal-record marker, and estimated-max trend; confirm a one-record movement shows the safe no-trend state.
- [ ] On the phone, change the check-in and add a completed session. Refresh desktop and confirm the new server revision appears.
- [ ] Navigate Previous and Next across matching workouts on both viewports; confirm search, sort, range, pagination, and export scope remain unchanged.
- [ ] Confirm controls remain usable without horizontal page scrolling at the phone's normal portrait zoom and after one orientation change.

## Nutrition camera workflows

- [ ] On the phone, photograph a non-sensitive test plate with two or more distinct foods. Confirm Forge previews the prepared image and returns editable items, portions, confidence, nutrition source, assumptions, and warnings.
- [ ] Correct one portion or macro, exclude one detected item, and add the reviewed meal. Confirm only selected items enter the chosen meal period and daily totals update immediately.
- [ ] Refresh the phone and desktop. Confirm approved nutrition entries synchronize, while the submitted photograph does not appear in history, exports, browser storage, API logs, or the synchronized dashboard.
- [ ] Scan one packaged-food barcode after the photo test to confirm the shared camera permission still permits the existing barcode workflow.
- [ ] Confirm an unsupported image and a provider-unavailable response produce actionable messages without adding nutrition entries.

## Conflict and isolation

- [ ] Load the same revision on both devices, save a change on the phone, then attempt a stale desktop save. Confirm the phone's newer data is not overwritten and the conflict is visible/recoverable.
- [ ] Sign out on both devices. Confirm protected dashboard reads are unavailable after refresh and browser back navigation.
- [ ] Sign in with a second authorized test account in a private window. Confirm it cannot read or mutate the first account's dashboard.
- [ ] Attempt the deployed API from an unapproved origin and without a token; record the expected denial without logging credentials.

## Evidence and disposition

Record evidence links, defects, and the final `PASS`, `FAIL`, or `BLOCKED` decision in the PR. Any failure affecting authentication, account isolation, revision protection, or data durability blocks release. Delete test health data after evidence is retained.

The repository-level acceptance tests cover authenticated hydration, stale-revision rejection, and subject isolation. They should pass immediately before and after this physical run.
