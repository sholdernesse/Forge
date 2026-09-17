# Sprint 4.89 — Longer Nutrition Calibration

## Goal

Prevent short-term scale movement or sparse food logging from changing calorie guidance.

## Delivered

- Replaced the seven-day weight trigger with a rolling 15-day evidence window.
- Require at least eight weigh-ins spanning 12 days before calculating a weekly trend.
- Require at least ten prior nutrition-log days before that trend can influence calories.
- Preserve the existing bounded 100 kcal recomposition correction rather than introducing aggressive automatic changes.
- Increased confidence only when both weight and nutrition evidence are dense.
- Updated the visible explanation from a seven-day trend to a longer trend.
- Added focused coverage for short history, sufficient history, and sufficient weight history with missing nutrition evidence.

## Evidence and safety

- [CDC weight guidance](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html) emphasizes gradual, steady change and notes that sleep, stress, medicines, medical conditions, hormones, age, and other factors can affect weight management.
- [CDC maintenance guidance](https://www.cdc.gov/healthy-weight-growth/about/tips-for-balancing-food-activity.html) describes calorie needs as dependent on age, sex, height, weight, and activity while cautioning that other factors also influence body weight.
- Forge treats the trend as decision support, not a direct measurement of metabolism or energy expenditure.
- Missing nutrition days block trend-based adjustment rather than being interpreted as zero intake.

## Product constraint

This is a policy correction inside the existing nutrition engine. It adds no screen, card, control, service, or stored field.
