import { describe, expect, it } from 'vitest';
import { foodAlternative } from './foodAlternatives.js';
import type { FoodDefinition } from './foodLog.js';

function food(id: string, caloriesKcal: number, proteinG: number, fiberG = 1, sodiumMg = 300): FoodDefinition {
  return { id, name: id, serving: '100 g reference', caloriesKcal, proteinG, carbsG: 20, fatG: 5, fiberG, sodiumMg, category: 'other', nutritionBasis: 'per-100g', servingGrams: 100 };
}

describe('goal-aware food alternatives', () => {
  it('finds a higher-protein choice without hiding the calorie tradeoff', () => {
    const result = foodAlternative(food('current', 200, 10), [food('protein-option', 205, 18)], 'protein');
    expect(result).toMatchObject({ food: { id: 'protein-option' }, reason: 'More protein at similar calories' });
    expect(result?.evidence).toContain('8 g more protein');
  });

  it('finds a lower-calorie choice only when protein stays comparable', () => {
    expect(foodAlternative(food('current', 260, 15), [food('lighter', 180, 13)], 'calorie-efficiency')?.food.id).toBe('lighter');
    expect(foodAlternative(food('current', 260, 15), [food('low-protein', 100, 2)], 'calorie-efficiency')).toBeUndefined();
  });

  it('normalizes serving data before comparison', () => {
    const serving: FoodDefinition = { ...food('serving', 100, 10), serving: '50 g', caloriesKcal: 100, proteinG: 10, fiberG: 0.5, sodiumMg: 150, nutritionBasis: 'per-serving', servingGrams: 50 };
    expect(foodAlternative(serving, [food('same', 200, 20)], 'protein')).toBeUndefined();
  });

  it('returns no suggestion when the evidence does not show a meaningful improvement', () => {
    expect(foodAlternative(food('current', 200, 15), [food('similar', 198, 15.5)], 'balanced')).toBeUndefined();
  });
});
