import type { ISODate } from '@forge/shared';
import type { DailySnapshot, NutritionState } from '../types.js';
import { snapshotsInWindow } from '../TwinHistory.js';

function average(values: number[]): number | undefined {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : undefined;
}

export function calculateNutritionState(history: DailySnapshot[], asOfDate: ISODate): NutritionState {
  const week = snapshotsInWindow(history, 7, asOfDate);
  const calories = week.flatMap((s) => s.caloriesKcal == null ? [] : [s.caloriesKcal]);
  const protein = week.flatMap((s) => s.proteinG == null ? [] : [s.proteinG]);
  const calorieAverage7d = average(calories);
  const proteinAverage7d = average(protein);

  return {
    ...(calorieAverage7d == null ? {} : { calorieAverage7d }),
    ...(proteinAverage7d == null ? {} : { proteinAverage7d }),
    adherenceDays7d: calories.length,
    proteinAdherenceDays7d: protein.length,
  };
}
