# Independent exercise lookup

Open **Exercises** in desktop navigation or the phone's bottom navigation, or
**Exercise lookup** in the header. The workout panel's lookup button opens the
same catalog. Starting or completing a workout is not required.

The initial catalog includes all 32 existing visual guides, sorted by name.
Search supports titles, common aliases (RDL, DB shoulder press, push-ups), equipment,
and muscles. Equipment and muscles-worked filters combine with the search.
Muscle filters include primary and supporting muscles, identified separately on
each card. Optional loads, such as a dumbbell during a supported calf raise, do not
change its primary Bodyweight category.

Selecting a result opens its existing form and anatomy images, setup, movement,
self-checks, mistakes, tempo, and breathing. Stop-immediately and doctor guidance
is visible in the guide. Closing it preserves the lookup query and filters.
Clearing filters returns to the whole library. A missing exercise is explicitly
reported as outside the current catalog; no guide or image is invented.

Lookup is read-only. It does not add an exercise, substitute a movement, start a
timer, change the daily plan, or record a workout. It does not call an AI provider
or transmit search terms. The catalog and metadata load only when opened.

## Acceptance

- Search a movement absent from today's workout and open its guide.
- Verify RDL, DB shoulder press, plural names and punctuation work.
- Combine equipment/muscle filters; clear them and recover all 32 guides.
- Verify an unknown exercise gives a useful empty state.
- Open each guide section, close back to results, and retain the search.
- Test keyboard focus, nested dialogs, Escape, and restoration to the opener.
- Verify desktop, narrow tablet, and phone layouts and light/dark themes.
- Confirm no personal/workout storage changes after browsing.

Unit tests cover full catalog coverage, aliases, combined filters, empty states,
and guide presentation. The CI browser check exercises desktop/mobile entry
points, filtering, guide navigation, discomfort advice, focus, Escape, viewport
overflow, and unchanged local data with a synthetic local account.

Actual phone/desktop acceptance against the deployed candidate remains required
before opening beta. This feature does not alter consent or beta eligibility.
