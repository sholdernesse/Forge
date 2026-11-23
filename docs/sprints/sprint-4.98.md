# Sprint 4.98 — founder operating budget

## Outcome

Forge now includes an internal operating-budget panel for the founder build. It keeps business costs separate from athlete dashboards and cloud sync while making the accepted deployment runway visible and editable.

## Included

- Preserves the staged Azure cumulative forecast of $66, $198, $420, and $687 at 3, 6, 9, and 12 months.
- Adds a $5 monthly OpenAI API allowance for meal-photo analysis.
- Tracks prepaid API credit balance, other monthly commitments, and a configurable contingency percentage.
- Calculates planned spend, the buffered safe target, and cash still to earmark at each forecast horizon.
- Logs dated actual expenses across AI, Azure, identity, monitoring, storage, domain, and other categories.
- Applies the 50%, 75%, 90%, and 100% API-budget review thresholds.

## Data boundary

Operating-budget data uses a separate browser-local storage key. It is excluded from athlete dashboard sync, athlete account export, and public health or nutrition data. The panel appears automatically in development and requires `VITE_FORGE_OPERATIONS_ENABLED=true` in a non-development founder build.
