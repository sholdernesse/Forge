import type { DailySnapshot, DigitalTwin } from '@forge/digital-twin';
import type { WorkoutSession } from './workoutSession.js';

export interface NutritionTargets {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  trendKgPerWeek?: number;
  adjustmentKcal: number;
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  safeguards: string[];
}

function weightedTrend(history: DailySnapshot[]): number | undefined {
  const weights = history.filter((day) => day.weightKg !== undefined).slice(-7);
  if (weights.length < 4) return undefined;
  const first = weights.slice(0, Math.min(3, weights.length)).reduce((sum, day) => sum + day.weightKg!, 0) / Math.min(3, weights.length);
  const last = weights.slice(-Math.min(3, weights.length)).reduce((sum, day) => sum + day.weightKg!, 0) / Math.min(3, weights.length);
  const days = Math.max(1, Date.parse(`${weights.at(-1)!.date}T00:00:00Z`) - Date.parse(`${weights[0]!.date}T00:00:00Z`)) / 86_400_000;
  return Math.round(((last - first) / days * 7) * 100) / 100;
}

export function calculateNutritionTargets(twin: DigitalTwin, workout: WorkoutSession): NutritionTargets {
  const profile = twin.profile;
  const weight = profile.weightKg ?? twin.history.at(-1)?.weightKg ?? 75;
  const height = profile.heightCm ?? 173;
  const age = profile.age ?? 40;
  const sexOffset = profile.sex === 'male' ? 5 : -161;
  const basal = 10 * weight + 6.25 * height - 5 * age + sexOffset;
  const maintenance = Math.round(basal * 1.48 / 50) * 50;
  const baseGoalAdjustment = twin.goals.primary === 'fat-loss' ? -350 : twin.goals.primary === 'muscle-gain' ? 200 : twin.goals.primary === 'recomposition' ? -150 : 0;
  const trend = weightedTrend(twin.history);
  const completeNutritionDays = twin.history.slice(-7, -1).filter((day) => day.caloriesKcal !== undefined).length;
  const safeguards: string[] = [];
  let trendAdjustment = 0;

  if (trend === undefined) safeguards.push('Waiting for at least four weigh-ins before adapting calories.');
  else if (completeNutritionDays < 4) safeguards.push('Calories held steady until four complete logging days are available.');
  else if (twin.goals.primary === 'recomposition') {
    if (trend < -0.45) trendAdjustment = 100;
    if (trend > 0.15) trendAdjustment = -100;
  }

  const trainingAdjustment = workout.planType === 'recovery' ? -50 : workout.intensity === 'high' ? 150 : 100;
  const recoveryAdjustment = twin.recovery.readiness < 60 ? 100 : 0;
  const adjustmentKcal = baseGoalAdjustment + trendAdjustment + trainingAdjustment + recoveryAdjustment;
  const caloriesKcal = Math.max(1500, maintenance + adjustmentKcal);
  const proteinG = Math.round(weight * (twin.goals.primary === 'muscle-gain' ? 2 : 1.8));
  const fatG = Math.round(weight * 0.8);
  const carbsG = Math.max(0, Math.round((caloriesKcal - proteinG * 4 - fatG * 9) / 4));
  const confidence = trend !== undefined && completeNutritionDays >= 6 ? 'high' : trend !== undefined && completeNutritionDays >= 4 ? 'medium' : 'low';
  const direction = trend === undefined ? 'Weight trend is still calibrating.' : `Seven-day trend is ${trend > 0 ? '+' : ''}${trend} kg/week.`;
  const demand = workout.planType === 'recovery' ? 'Recovery-day demand is lower.' : `${workout.intensity ?? 'moderate'} training demand adds fuel.`;

  return { caloriesKcal, proteinG, carbsG, fatG, ...(trend === undefined ? {} : { trendKgPerWeek: trend }), adjustmentKcal, confidence, reason: `${direction} ${demand}`, safeguards };
}
