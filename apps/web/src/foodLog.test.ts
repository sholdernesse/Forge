import { describe, expect, it } from 'vitest';
import { createFoodEntry, demoFoodEntries, foodTotals, quickFoods } from './foodLog.js';

describe('food log', () => {
  it('sums only entries from the requested date', () => {
    expect(foodTotals([...demoFoodEntries, { ...demoFoodEntries[0]!, id: 'old', date: '2026-08-11' }], '2026-08-12')).toEqual({ caloriesKcal: 620, proteinG: 42, carbsG: 63, fatG: 22 });
  });

  it('creates a meal-specific entry from a quick food', () => {
    expect(createFoodEntry('2026-08-12', 'lunch', quickFoods[2]!, 'food-1')).toMatchObject({ id: 'food-1', meal: 'lunch', name: 'Chicken breast', proteinG: 53 });
  });
});
