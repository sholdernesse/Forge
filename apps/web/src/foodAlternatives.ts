import type { FoodDefinition } from './foodLog.js';

export type FoodChoicePriority = 'protein' | 'calorie-efficiency' | 'balanced';

export interface FoodAlternative {
  food: FoodDefinition;
  reason: string;
  evidence: string;
}

interface ComparableFood {
  caloriesKcal: number;
  proteinG: number;
  fiberG?: number;
  sodiumMg?: number;
}

function per100g(food: FoodDefinition): ComparableFood | undefined {
  if (!food.nutritionBasis) return undefined;
  const scale = food.nutritionBasis === 'per-100g' ? 1 : food.servingGrams ? 100 / food.servingGrams : undefined;
  if (!scale) return undefined;
  return {
    caloriesKcal: food.caloriesKcal * scale,
    proteinG: food.proteinG * scale,
    ...(food.fiberG !== undefined ? { fiberG: food.fiberG * scale } : {}),
    ...(food.sodiumMg !== undefined ? { sodiumMg: food.sodiumMg * scale } : {}),
  };
}

export function foodAlternative(reference: FoodDefinition, candidates: FoodDefinition[], priority: FoodChoicePriority): FoodAlternative | undefined {
  const baseline = per100g(reference);
  if (!baseline) return undefined;
  const options = candidates.flatMap((food) => {
    if (food.id === reference.id) return [];
    const comparison = per100g(food);
    return comparison ? [{ food, comparison }] : [];
  });

  if (priority === 'protein') {
    const match = options.filter(({ comparison }) => comparison.proteinG >= baseline.proteinG + 5 && comparison.caloriesKcal <= baseline.caloriesKcal * 1.1)
      .sort((a, b) => (b.comparison.proteinG - baseline.proteinG) - (a.comparison.proteinG - baseline.proteinG))[0];
    if (match) return { food: match.food, reason: 'More protein at similar calories', evidence: `${Math.round(match.comparison.proteinG - baseline.proteinG)} g more protein per 100 g · ${Math.round(match.comparison.caloriesKcal - baseline.caloriesKcal)} kcal difference` };
  }

  if (priority === 'calorie-efficiency') {
    const match = options.filter(({ comparison }) => comparison.caloriesKcal <= baseline.caloriesKcal - 50 && comparison.proteinG >= baseline.proteinG - 3)
      .sort((a, b) => a.comparison.caloriesKcal - b.comparison.caloriesKcal)[0];
    if (match) return { food: match.food, reason: 'Fewer calories with similar protein', evidence: `${Math.round(baseline.caloriesKcal - match.comparison.caloriesKcal)} fewer kcal per 100 g · ${Math.round(match.comparison.proteinG - baseline.proteinG)} g protein difference` };
  }

  const fiberMatch = options.filter(({ comparison }) => comparison.fiberG !== undefined && baseline.fiberG !== undefined && comparison.fiberG >= baseline.fiberG + 3 && comparison.caloriesKcal <= baseline.caloriesKcal + 20)
    .sort((a, b) => (b.comparison.fiberG ?? 0) - (a.comparison.fiberG ?? 0))[0];
  if (fiberMatch) return { food: fiberMatch.food, reason: 'More fiber at similar calories', evidence: `${Math.round((fiberMatch.comparison.fiberG ?? 0) - (baseline.fiberG ?? 0))} g more fiber per 100 g · ${Math.round(fiberMatch.comparison.caloriesKcal - baseline.caloriesKcal)} kcal difference` };

  const sodiumMatch = options.filter(({ comparison }) => comparison.sodiumMg !== undefined && baseline.sodiumMg !== undefined && comparison.sodiumMg <= baseline.sodiumMg - 150 && comparison.proteinG >= baseline.proteinG - 3)
    .sort((a, b) => (a.comparison.sodiumMg ?? Infinity) - (b.comparison.sodiumMg ?? Infinity))[0];
  if (sodiumMatch) return { food: sodiumMatch.food, reason: 'Less sodium with similar protein', evidence: `${Math.round((baseline.sodiumMg ?? 0) - (sodiumMatch.comparison.sodiumMg ?? 0))} mg less sodium per 100 g · ${Math.round(sodiumMatch.comparison.proteinG - baseline.proteinG)} g protein difference` };
  return undefined;
}
