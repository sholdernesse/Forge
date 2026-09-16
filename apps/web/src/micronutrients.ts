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

export interface WeeklyNutritionStory {
  trackedDays: number;
  headline: string;
  detail: string;
  tone: 'building' | 'opportunity' | 'balanced' | 'limit';
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

function recentDates(date: string): string[] {
  const anchor = new Date(`${date}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(anchor);
    day.setUTCDate(anchor.getUTCDate() - offset);
    return day.toISOString().slice(0, 10);
  });
}

export function weeklyNutritionStory(entries: FoodEntry[], date: string): WeeklyNutritionStory {
  const dates = recentDates(date);
  const daily = dates.map((day) => micronutrientCoverage(entries, day));
  const trackedDays = daily.filter((coverage) => coverage.length > 0).length;
  if (trackedDays < 4) return {
    trackedDays,
    headline: 'Building your nutrition pattern',
    detail: `${trackedDays} of 7 days include verified micronutrient data. Four days are needed before Forge highlights a pattern.`,
    tone: 'building',
  };

  const averages = references.flatMap((reference) => {
    const values = daily.flatMap((coverage) => {
      const match = coverage.find((nutrient) => nutrient.key === reference.key);
      return match ? [match.percent] : [];
    });
    return values.length >= 4 ? [{ ...reference, trackedDays: values.length, averagePercent: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) }] : [];
  });
  const sodium = averages.find((nutrient) => nutrient.key === 'sodiumMg');
  if (sodium && sodium.averagePercent >= 100) return {
    trackedDays,
    headline: 'Sodium is the clearest limit to watch',
    detail: `Tracked foods averaged ${sodium.averagePercent}% of the Daily Value across ${sodium.trackedDays} days. Compare labels and favor lower-sodium choices when practical.`,
    tone: 'limit',
  };

  const opportunity = averages
    .filter((nutrient) => nutrient.direction === 'minimum')
    .sort((left, right) => left.averagePercent - right.averagePercent)[0];
  if (opportunity && opportunity.averagePercent < 80) return {
    trackedDays,
    headline: `${opportunity.label} is the clearest food opportunity`,
    detail: `Tracked foods averaged ${opportunity.averagePercent}% of the Daily Value across ${opportunity.trackedDays} days. Use food choices—not high-dose supplements—to improve the pattern.`,
    tone: 'opportunity',
  };

  return {
    trackedDays,
    headline: averages.length ? 'Tracked nutrition coverage looks steady' : 'More consistent nutrient detail is needed',
    detail: averages.length
      ? `No repeatedly tracked nutrient fell below 80% of its Daily Value${sodium ? ', and sodium remained below its label limit' : ''}.`
      : 'Micronutrients were recorded on four days, but no single nutrient appeared often enough for a reliable comparison.',
    tone: averages.length ? 'balanced' : 'building',
  };
}
