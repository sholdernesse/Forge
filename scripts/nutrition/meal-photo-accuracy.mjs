import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const metrics = ['estimatedGrams', 'caloriesKcal', 'proteinG', 'carbsG', 'fatG'];
// Engineering acceptance targets, not a clinical accuracy claim.
const limits = { estimatedGrams: [0.25, 10], caloriesKcal: [0.20, 20], proteinG: [0.25, 5], carbsG: [0.25, 5], fatG: [0.25, 3] };

function requiredText(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`);
}

export function evaluateMealPhotoAccuracy(dataset) {
  if (dataset?.version !== 1 || !Array.isArray(dataset.meals) || !dataset.meals.length) throw new Error('A version 1 dataset with measured meals is required');
  if (!/^[a-f0-9]{40}$/i.test(dataset.candidateCommit ?? '')) throw new Error('candidateCommit must be a full commit SHA');
  requiredText(dataset.model, 'model');
  const ids = new Set();
  const results = dataset.meals.map(meal => {
    requiredText(meal.id, 'meal id');
    if (ids.has(meal.id)) throw new Error(`Duplicate meal id: ${meal.id}`);
    ids.add(meal.id);
    requiredText(meal.referenceMethod, `${meal.id} referenceMethod`);
    if (!Number.isFinite(Date.parse(meal.capturedAt))) throw new Error(`${meal.id} capturedAt must be a date`);
    if (!Array.isArray(meal.items) || !meal.items.length) throw new Error(`${meal.id} needs measured items`);
    const totals = { reference: Object.fromEntries(metrics.map(key => [key, 0])), estimate: Object.fromEntries(metrics.map(key => [key, 0])) };
    const itemIds = new Set();
    const items = meal.items.map(item => {
      requiredText(item.id, 'item id');
      if (itemIds.has(item.id)) throw new Error(`Duplicate item id: ${item.id}`);
      itemIds.add(item.id);
      if (!['matched', 'missed', 'extra'].includes(item.match)) throw new Error(`${item.id} needs matched, missed, or extra classification`);
      const errors = {};
      for (const key of metrics) {
        for (const side of ['reference', 'estimate']) {
          const value = item[side]?.[key];
          if (!Number.isFinite(value) || value < 0) throw new Error(`${item.id} ${side}.${key} must be a nonnegative number`);
          if ((item.match === 'missed' && side === 'estimate' || item.match === 'extra' && side === 'reference') && value !== 0) throw new Error(`${item.id} absent side must contain zeros`);
          totals[side][key] += value;
        }
        errors[key] = errorFor(item.reference[key], item.estimate[key], key);
      }
      return { id: item.id, match: item.match, errors };
    });
    const errors = Object.fromEntries(metrics.map(key => [key, errorFor(totals.reference[key], totals.estimate[key], key)]));
    // Item checks prevent offsetting over/under-estimates from hiding poor detection.
    const passed = items.every(item => item.match === 'matched' && Object.values(item.errors).every(error => error.passed)) && Object.values(errors).every(error => error.passed);
    return { id: meal.id, passed, totals, errors, items };
  });
  return { candidateCommit: dataset.candidateCommit, model: dataset.model, measuredMeals: results.length, passedMeals: results.filter(meal => meal.passed).length, status: results.every(meal => meal.passed) ? 'PASS' : 'FAIL', limits, meals: results };
}

function errorFor(reference, estimate, key) {
  const absoluteError = Math.abs(estimate - reference);
  const [relativeLimit, absoluteFloor] = limits[key];
  return { absoluteError, relativeError: reference === 0 ? null : absoluteError / reference, allowedError: Math.max(reference * relativeLimit, absoluteFloor), passed: absoluteError <= Math.max(reference * relativeLimit, absoluteFloor) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node scripts/nutrition/meal-photo-accuracy.mjs <measured-results.json>');
    const report = evaluateMealPhotoAccuracy(JSON.parse(await readFile(process.argv[2], 'utf8')));
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.status === 'PASS' ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
