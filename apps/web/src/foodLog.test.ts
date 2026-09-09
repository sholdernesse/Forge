import { describe, expect, it } from 'vitest';
import { createFoodEntry, demoFoodEntries, foodTotals, lookupBarcode, mealEntries, quickFoods, scaleFood, searchFoods } from './foodLog.js';
import { demoSavedMeals, foodCatalog } from './foodCatalog.js';

describe('food log', () => {
  it('sums only entries from the requested date', () => {
    expect(foodTotals([...demoFoodEntries, { ...demoFoodEntries[0]!, id: 'old', date: '2026-08-11' }], '2026-08-12')).toEqual({ caloriesKcal: 620, proteinG: 42, carbsG: 63, fatG: 22 });
  });

  it('creates a meal-specific entry from a quick food', () => {
    expect(createFoodEntry('2026-08-12', 'lunch', quickFoods[2]!, 'food-1')).toMatchObject({ id: 'food-1', meal: 'lunch', name: 'Chicken breast', proteinG: 53 });
  });

  it('scales macros in quarter-serving increments', () => {
    expect(scaleFood(foodCatalog[2]!, 1.5)).toMatchObject({ caloriesKcal: 420, proteinG: 79.5, quantity: 1.5 });
  });

  it('searches locally and resolves the barcode provider boundary', () => {
    expect(searchFoods(foodCatalog, 'rice')[0]?.id).toBe('jasmine-rice');
    expect(lookupBarcode(foodCatalog, '0-00000000002')?.id).toBe('protein-shake');
  });

  it('expands a saved meal into independently removable entries', () => {
    let sequence = 0;
    const entries = mealEntries(demoSavedMeals[1]!, foodCatalog, '2026-08-12', 'lunch', () => `meal-${++sequence}`);
    expect(entries.map((entry) => entry.id)).toEqual(['meal-1', 'meal-2']);
    expect(foodTotals(entries, '2026-08-12').caloriesKcal).toBe(485);
  });
});
