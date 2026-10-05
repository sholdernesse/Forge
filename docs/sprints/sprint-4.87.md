# Sprint 4.87 — Weekly Nutrition Pattern

## Goal

Turn verified micronutrient entries into one understandable weekly food priority without adding another dashboard card or overstating incomplete logging.

## Delivered

- Added a seven-day nutrition-quality story inside the existing expandable Nutrition quality view.
- Require at least four days containing verified micronutrient values before identifying a pattern.
- Prioritize a repeatedly high sodium limit when present; otherwise identify the lowest repeatedly tracked fiber, vitamin D, calcium, iron, or potassium opportunity.
- Show one headline and one food-first action rather than six competing recommendations.
- Added focused coverage for insufficient evidence, a minimum-nutrient opportunity, and the sodium-limit priority.

## Safety and truthfulness

- Missing days and missing nutrients are not counted as zero.
- A nutrient must appear on at least four days before it can shape the story.
- Language describes tracked-food opportunities, not deficiencies.
- Forge recommends comparing foods and improving food choices, not taking high-dose supplements.

## Product constraint

The weekly story uses the existing Nutrition quality disclosure. It adds no card, navigation destination, questionnaire, service, or stored field.
