import { describe, expect, it } from 'vitest';
import { micronutrientCoverage } from './micronutrients.js';
import type { FoodEntry } from './foodLog.js';

const entry = (overrides: Partial<FoodEntry> = {}): FoodEntry => ({
  id: 'food-1', date: '2026-09-16', meal: 'breakfast', name: 'Tracked food', serving: '1 serving',
  caloriesKcal: 100, proteinG: 10, carbsG: 10, fatG: 2, ...overrides,
});

describe('micronutrient coverage', () => {
  it('totals only recorded nutrients for the selected day against FDA Daily Values', () => {
    const coverage = micronutrientCoverage([
      entry({ fiberG: 7, calciumMg: 260, sodiumMg: 460 }),
      entry({ id: 'food-2', fiberG: 7, calciumMg: 390 }),
      entry({ id: 'old', date: '2026-09-15', fiberG: 14 }),
    ], '2026-09-16');

    expect(coverage).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'fiberG', amount: 14, percent: 50, direction: 'minimum' }),
      expect.objectContaining({ key: 'calciumMg', amount: 650, percent: 50 }),
      expect.objectContaining({ key: 'sodiumMg', amount: 460, percent: 20, direction: 'limit' }),
    ]));
  });

  it('does not turn missing provider data into a zero or deficiency claim', () => {
    expect(micronutrientCoverage([entry()], '2026-09-16')).toEqual([]);
  });
});
