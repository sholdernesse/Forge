# Sprint 4.86 — Verified Micronutrient Coverage

## Goal

Help users understand nutrition quality from foods they already search or scan without adding a second logging workflow or implying a medical diagnosis.

## Delivered

- Extended USDA food normalization with potassium, calcium, iron, and vitamin D while retaining fiber and sodium.
- Preserved available verified nutrient values through the web client, serving-size scaling, food entries, local persistence, and account-sync payload.
- Added a compact, progressively disclosed Nutrition quality view for fiber, vitamin D, calcium, iron, potassium, and sodium.
- Compared recorded amounts with standard FDA Daily Values and distinguished sodium as a limit rather than a nutrient to maximize.
- Added narrow-phone layout behavior and focused API, client, scaling, and coverage tests.

## Safety and truthfulness

- Missing provider values remain missing; Forge does not convert them to zero.
- Coverage explicitly reflects tracked foods only.
- The view does not diagnose deficiencies or recommend supplements.
- FDA Daily Values are general label references rather than individualized medical targets.

Reference: [FDA Daily Value on Nutrition and Supplement Facts Labels](https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels).

## Deferred release item

The desktop `Offline · saved locally` state remains an open physical-acceptance defect. Sprint 4.85 improved retry behavior but did not clear the observed condition, so it is not represented as accepted.
