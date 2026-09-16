import type { FoodEntry } from './foodLog.js';

export type MicronutrientKey = 'fiberG' | 'sodiumMg' | 'potassiumMg' | 'calciumMg' | 'ironMg' | 'vitaminDMcg';

export interface MicronutrientCoverage {
  key: MicronutrientKey;
  label: string;
  amount: number;
  unit: 'g' | 'mg' | 'mcg';
  dailyValue: number;
  percent: number;
  direction: 'minimum' | 'limit';
}

const references: Array<Omit<MicronutrientCoverage, 'amount' | 'percent'>> = [
  { key: 'fiberG', label: 'Fiber', unit: 'g', dailyValue: 28, direction: 'minimum' },
  { key: 'vitaminDMcg', label: 'Vitamin D', unit: 'mcg', dailyValue: 20, direction: 'minimum' },
  { key: 'calciumMg', label: 'Calcium', unit: 'mg', dailyValue: 1_300, direction: 'minimum' },
  { key: 'ironMg', label: 'Iron', unit: 'mg', dailyValue: 18, direction: 'minimum' },
  { key: 'potassiumMg', label: 'Potassium', unit: 'mg', dailyValue: 4_700, direction: 'minimum' },
  { key: 'sodiumMg', label: 'Sodium', unit: 'mg', dailyValue: 2_300, direction: 'limit' },
];

export function micronutrientCoverage(entries: FoodEntry[], date: string): MicronutrientCoverage[] {
  const today = entries.filter((entry) => entry.date === date);
  return references.flatMap((reference) => {
    const recorded = today.filter((entry) => entry[reference.key] !== undefined);
    if (!recorded.length) return [];
    const amount = Math.round(recorded.reduce((total, entry) => total + (entry[reference.key] ?? 0), 0) * 10) / 10;
    return [{ ...reference, amount, percent: Math.round(amount / reference.dailyValue * 100) }];
  });
}
