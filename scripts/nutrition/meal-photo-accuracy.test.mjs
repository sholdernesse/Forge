import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateMealPhotoAccuracy } from './meal-photo-accuracy.mjs';

const nutrition = { estimatedGrams: 100, caloriesKcal: 200, proteinG: 20, carbsG: 20, fatG: 4 };
function dataset(items = [{ id: 'food-1', match: 'matched', reference: { ...nutrition }, estimate: { ...nutrition } }]) {
  return { version: 1, candidateCommit: 'a'.repeat(40), model: 'recorded-model', meals: [{ id: 'plate-1', capturedAt: '2026-10-15T08:00:00Z', referenceMethod: 'Weighed cooked portions and package labels', items }] };
}

test('reports measured errors without changing the source measurements', () => {
  const data = dataset();
  data.meals[0].items[0].estimate.caloriesKcal = 230;
  const before = JSON.stringify(data);
  const result = evaluateMealPhotoAccuracy(data);
  assert.equal(result.status, 'PASS');
  assert.equal(result.meals[0].errors.caloriesKcal.absoluteError, 30);
  assert.equal(result.meals[0].errors.caloriesKcal.relativeError, 0.15);
  assert.equal(JSON.stringify(data), before);
});

test('fails offsetting errors even when plate totals look accurate', () => {
  const data = dataset();
  data.meals[0].items[0].estimate.caloriesKcal = 300;
  data.meals[0].items.push({ id: 'food-2', match: 'matched', reference: { ...nutrition }, estimate: { ...nutrition, caloriesKcal: 100 } });
  const result = evaluateMealPhotoAccuracy(data);
  assert.equal(result.meals[0].errors.caloriesKcal.absoluteError, 0);
  assert.equal(result.status, 'FAIL');
});

test('handles zero-reference macros without infinite percentages', () => {
  const data = dataset();
  data.meals[0].items[0].reference.carbsG = 0;
  data.meals[0].items[0].estimate.carbsG = 1;
  const result = evaluateMealPhotoAccuracy(data);
  assert.equal(result.meals[0].errors.carbsG.relativeError, null);
  assert.equal(result.status, 'PASS');
});

test('fails missed and hallucinated foods instead of silently excluding them', () => {
  const zero = Object.fromEntries(Object.keys(nutrition).map(key => [key, 0]));
  for (const match of ['missed', 'extra']) {
    const item = { id: 'unmatched', match, reference: match === 'extra' ? zero : nutrition, estimate: match === 'missed' ? zero : nutrition };
    assert.equal(evaluateMealPhotoAccuracy(dataset([item])).status, 'FAIL');
  }
});

test('rejects incomplete, nonfinite, negative and duplicate evidence', () => {
  assert.throws(() => evaluateMealPhotoAccuracy({ version: 1, meals: [] }));
  for (const invalid of [NaN, Infinity, -1, undefined]) {
    const data = dataset();
    data.meals[0].items[0].reference.proteinG = invalid;
    assert.throws(() => evaluateMealPhotoAccuracy(data), /nonnegative/);
  }
  const data = dataset();
  data.meals.push(data.meals[0]);
  assert.throws(() => evaluateMealPhotoAccuracy(data), /Duplicate/);
  assert.throws(() => evaluateMealPhotoAccuracy({ ...dataset(), candidateCommit: 'latest' }), /commit SHA/);
});

test('CLI returns distinct exit codes for passing, failing and invalid evidence', async () => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const directory = await mkdtemp(join(tmpdir(), 'forge-accuracy-'));
  const path = join(directory, 'measurements.json');
  try {
    const data = dataset();
    for (const expected of [0, 1, 2]) {
      if (expected === 1) data.meals[0].items[0].estimate.caloriesKcal = 500;
      await writeFile(path, expected === 2 ? '{invalid' : JSON.stringify(data));
      const result = spawnSync(process.execPath, ['scripts/nutrition/meal-photo-accuracy.mjs', path], { encoding: 'utf8' });
      assert.equal(result.status, expected, result.stderr);
      if (expected !== 2) assert.equal(JSON.parse(result.stdout).status, expected === 0 ? 'PASS' : 'FAIL');
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
