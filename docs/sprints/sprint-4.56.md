# Sprint 4.56 — Goal-Aware Food Alternatives

## Outcome

Forge can show one evidence-backed alternative beside comparable food search or barcode results. The suggestion follows the user’s primary goal and explains the measurable tradeoff instead of labeling foods as universally healthy or unhealthy.

## Delivered

- Added a deterministic food-alternative policy for protein, calorie-efficiency, and balanced priorities.
- Maps muscle-gain and performance goals to protein-fit comparisons.
- Maps fat-loss goals to lower-calorie choices that retain similar protein.
- Uses fiber or sodium improvements for balanced comparisons when data exists.
- Shows at most one optional alternative, its reason, and per-100-gram differences.
- Lets the user add the alternative directly without hiding the original result.
- Corrected USDA search presentation so nutrients and labels consistently use a 100-gram reference.
- Normalizes Open Food Facts serving records to 100 grams before comparisons when serving weight is available.
- Returns no recommendation when serving basis, nutrients, or improvement evidence is insufficient.
- Preserves provider source and verification labels.

## Boundaries

- Forge does not call foods good, bad, clean, or unhealthy.
- Suggestions compare nutrition evidence; they do not account for allergies, medical diets, taste, price, or availability yet.
- A suggested alternative does not replace or delete the user’s original selection.
- Community-sourced records still require checking against the package label.
- Small differences do not produce recommendations.
- No AI model can override the deterministic comparison thresholds.

## Acceptance

- Unlike serving bases are normalized before comparison.
- Protein suggestions require meaningfully more protein at similar calories.
- Calorie suggestions preserve broadly similar protein.
- Fiber and sodium suggestions require meaningful differences.
- Missing or equivalent data yields no suggestion.
- Only one compact alternative appears on desktop and phone.
- Type checks, the full test suite, and production builds pass.
