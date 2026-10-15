# Meal-photo accuracy validation

Status: measurement tooling ready; real-plate validation is pending. Unit-test fixtures are synthetic and do not establish model accuracy.

## Collect the evidence

Use at least ten distinct plates, including lean protein, starch, vegetables, mixed dishes, sauces/oils, and partially obscured food. Use a kitchen scale to weigh cooked edible portions before photographing. Record package-label or identified reference-food nutrition for those same portions; distinguish raw from cooked nutrition. Record the source and any uncertainty in `referenceMethod`. Include sauces and cooking fats in the reference even if the camera misses them.

Capture the candidate commit and configured vision model. Record the initial unedited analysis separately from the reviewed result. Copy the actual response numbers; do not replace them with expected values. Match detected items to reference items manually. Represent missed foods with a zero estimate, and extra detections with a zero reference, so they remain visible in the report. Do not store photographs, personal details, credentials, or image data URLs in the dataset.

## Dataset format

The following is a format example only, not measured evidence:

```json
{
  "version": 1,
  "candidateCommit": "0123456789abcdef0123456789abcdef01234567",
  "model": "configured-vision-model",
  "meals": [{
    "id": "plate-01",
    "capturedAt": "2026-10-15T08:00:00Z",
    "referenceMethod": "Cooked edible weight; package label and recorded food reference ID",
    "items": [{
      "id": "food-01",
      "match": "matched",
      "reference": { "estimatedGrams": 100, "caloriesKcal": 200, "proteinG": 20, "carbsG": 20, "fatG": 4 },
      "estimate": { "estimatedGrams": 110, "caloriesKcal": 220, "proteinG": 22, "carbsG": 22, "fatG": 4.4 }
    }]
  }]
}
```

Allowed match classifications: `matched`, `missed`, `extra`. All five numeric fields are required on both sides. Reference `estimatedGrams` is the actual scale weight, using the response field name for comparison.

## Run and interpret

```bash
corepack pnpm evaluate:meal-photo path/to/measured-results.json > accuracy-report.json
```

Exit codes: 0 means every supplied item and plate met the engineering targets; 1 means an accuracy failure; 2 means invalid or missing evidence. Reports include absolute error, relative error, allowed error, item classifications, and plate totals. Zero-reference macros have no meaningful relative percentage and use the absolute floor.

Initial engineering targets use the larger of the relative allowance and absolute floor:

| Metric | Relative allowance | Absolute floor |
| --- | --- | --- |
| Portion weight | 25% | 10 g |
| Calories | 20% | 20 kcal |
| Protein | 25% | 5 g |
| Carbohydrates | 25% | 5 g |
| Fat | 25% | 3 g |

These are proposed internal acceptance targets, not validated clinical tolerances or a consumer accuracy promise. Item checks prevent offsetting errors from concealing incorrect detection. A missed or extra food fails the plate regardless of total calories. A PASS covers only the supplied dataset; a tiny or unrepresentative sample cannot establish release readiness. The release owner must review at least ten varied real plates, failure cases, and unedited versus reviewed results before signing off. No live model request or billable API call is made by this offline evaluator.

Attach reports to the candidate's physical acceptance evidence. Keep meal-photo accuracy pending until actual measurements and reports are available.
