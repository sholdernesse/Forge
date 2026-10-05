import { describe, expect, it } from 'vitest';
import { createFoodEntry, demoFoodEntries, foodTotals, lookupBarcode, mealEntries, quickFoods, recentMeals, repeatMealEntries, scaleFood, searchFoods } from './foodLog.js';
import { demoSavedMeals, foodCatalog } from './foodCatalog.js';

describe('food log', () => {
  it('sums only entries from the requested date', () => {
    expect(foodTotals([...demoFoodEntries, { ...demoFoodEntries[0]!, id: 'old', date: '2026-08-11' }], '2026-08-12')).toEqual({ caloriesKcal: 620, proteinG: 42, carbsG: 63, fatG: 22 });
  });

  it('creates a meal-specific entry from a quick food', () => {
    expect(createFoodEntry('2026-08-12', 'lunch', quickFoods[2]!, 'food-1')).toMatchObject({ id: 'food-1', meal: 'lunch', name: 'Chicken breast', proteinG: 53 });
  });

  it('scales macros in quarter-serving increments', () => {
    expect(scaleFood({ ...foodCatalog[2]!, fiberG: 2, calciumMg: 20, vitaminDMcg: 1.2 }, 1.5)).toMatchObject({ caloriesKcal: 420, proteinG: 79.5, fiberG: 3, calciumMg: 30, vitaminDMcg: 1.8, quantity: 1.5 });
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

describe('recent meal reuse', () => {
  const history = [
    createFoodEntry('2026-08-10', 'breakfast', { name: 'Eggs', serving: '2', caloriesKcal: 140, proteinG: 12, carbsG: 1, fatG: 10 }, 'eggs-10'),
    createFoodEntry('2026-08-10', 'breakfast', { name: 'Toast', serving: '1 slice', caloriesKcal: 100, proteinG: 4, carbsG: 18, fatG: 1 }, 'toast-10'),
    createFoodEntry('2026-08-11', 'breakfast', { name: 'Oats', serving: '1 bowl', caloriesKcal: 360, proteinG: 30, carbsG: 45, fatG: 7 }, 'oats-11'),
    createFoodEntry('2026-08-11', 'lunch', { name: 'Chicken', serving: '6 oz', caloriesKcal: 280, proteinG: 53, carbsG: 0, fatG: 6 }, 'chicken-11'),
  ];

  it('suggests distinct prior meals in most-recent order for the selected meal type', () => {
    const suggestions = recentMeals(history, '2026-08-12', 'breakfast');
    expect(suggestions.map((meal) => meal.label)).toEqual(['Oats', 'Eggs + Toast']);
    expect(suggestions[0]).toMatchObject({ caloriesKcal: 360, proteinG: 30 });
  });

  it('repeats the exact logged foods on the current date without reusing entry ids', () => {
    const suggestion = recentMeals(history, '2026-08-12', 'breakfast')[1]!;
    const repeated = repeatMealEntries(suggestion, '2026-08-12', 'snack');
    expect(repeated.map((entry) => entry.name)).toEqual(['Eggs', 'Toast']);
    expect(repeated.every((entry) => entry.date === '2026-08-12' && entry.meal === 'snack')).toBe(true);
    expect(repeated.map((entry) => entry.id)).not.toContain('eggs-10');
  });
});
