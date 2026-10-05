import { describe, expect, it } from 'vitest';
import { micronutrientCoverage, weeklyNutritionStory } from './micronutrients.js';
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

  it('waits for four tracked days before highlighting a weekly pattern', () => {
    expect(weeklyNutritionStory([entry({ fiberG: 7 })], '2026-09-16')).toMatchObject({ trackedDays: 1, tone: 'building' });
  });

  it('selects one repeated food opportunity without calling it a deficiency', () => {
    const entries = ['16', '15', '14', '13'].map((day, index) => entry({ id: `food-${index}`, date: `2026-09-${day}`, fiberG: 14, calciumMg: 260 }));
    expect(weeklyNutritionStory(entries, '2026-09-16')).toEqual(expect.objectContaining({
      trackedDays: 4,
      headline: 'Calcium is the clearest food opportunity',
      tone: 'opportunity',
    }));
  });

  it('prioritizes a repeatedly high sodium limit over minimum-nutrient opportunities', () => {
    const entries = ['16', '15', '14', '13'].map((day, index) => entry({ id: `food-${index}`, date: `2026-09-${day}`, fiberG: 28, sodiumMg: 2_500 }));
    expect(weeklyNutritionStory(entries, '2026-09-16')).toEqual(expect.objectContaining({
      headline: 'Sodium is the clearest limit to watch',
      tone: 'limit',
    }));
  });
});
