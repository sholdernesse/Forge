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
  bodyComposition: BodyCompositionTarget;
  adjustmentBreakdown: CalorieAdjustment[];
}

export interface BodyCompositionTarget {
  label: string;
  rangeLabel: string;
  status: 'calibrating' | 'on-track' | 'outside-range' | 'stable';
  statusLabel: string;
}

export interface CalorieAdjustment {
  label: string;
  kcal: number;
  explanation: string;
}

interface NutritionCalibration {
  trendKgPerWeek?: number;
  weighIns: number;
  spanDays: number;
  loggedDays: number;
}

function bodyCompositionTarget(goal: DigitalTwin['goals']['primary'], weightKg: number, trendKgPerWeek?: number): BodyCompositionTarget {
  const ranges = {
    'fat-loss': { min: -weightKg * 0.0075, max: -weightKg * 0.0025, label: 'Gradual fat loss' },
    recomposition: { min: -weightKg * 0.0025, max: weightKg * 0.0015, label: 'Recomposition' },
    'muscle-gain': { min: weightKg * 0.001, max: weightKg * 0.0025, label: 'Gradual muscle gain' },
    performance: { min: -weightKg * 0.0015, max: weightKg * 0.0015, label: 'Performance support' },
    maintenance: { min: -weightKg * 0.0015, max: weightKg * 0.0015, label: 'Weight maintenance' },
  } satisfies Record<DigitalTwin['goals']['primary'], { min: number; max: number; label: string }>;
  const target = ranges[goal];
  const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
  const rangeLabel = `${signed(target.min)} to ${signed(target.max)} kg/week`;
  if (trendKgPerWeek === undefined) return { label: target.label, rangeLabel, status: 'calibrating', statusLabel: 'Building a reliable trend' };
  if (trendKgPerWeek >= target.min && trendKgPerWeek <= target.max) return { label: target.label, rangeLabel, status: 'on-track', statusLabel: 'Current trend is in range' };
  const stableGoal = goal === 'maintenance' || goal === 'performance';
  return { label: target.label, rangeLabel, status: stableGoal ? 'stable' : 'outside-range', statusLabel: stableGoal ? 'Current trend needs review' : 'Current trend is outside range' };
}

function nutritionCalibration(history: DailySnapshot[]): NutritionCalibration {
  const ordered = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const latest = ordered.at(-1)?.date;
  if (!latest) return { weighIns: 0, spanDays: 0, loggedDays: 0 };
  const latestTime = Date.parse(`${latest}T00:00:00Z`);
  const window = ordered.filter((day) => {
    const ageDays = (latestTime - Date.parse(`${day.date}T00:00:00Z`)) / 86_400_000;
    return ageDays >= 0 && ageDays <= 14;
  });
  const weights = window.filter((day) => day.weightKg !== undefined);
  const loggedDays = window.filter((day) => day.date !== latest && day.caloriesKcal !== undefined).length;
  const spanDays = weights.length > 1
    ? (Date.parse(`${weights.at(-1)!.date}T00:00:00Z`) - Date.parse(`${weights[0]!.date}T00:00:00Z`)) / 86_400_000
    : 0;
  if (weights.length < 8 || spanDays < 12) return { weighIns: weights.length, spanDays, loggedDays };
  const first = weights.slice(0, Math.min(3, weights.length)).reduce((sum, day) => sum + day.weightKg!, 0) / Math.min(3, weights.length);
  const last = weights.slice(-Math.min(3, weights.length)).reduce((sum, day) => sum + day.weightKg!, 0) / Math.min(3, weights.length);
  return {
    trendKgPerWeek: Math.round(((last - first) / spanDays * 7) * 100) / 100,
    weighIns: weights.length,
    spanDays,
    loggedDays,
  };
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
  const calibration = nutritionCalibration(twin.history);
  const trend = calibration.trendKgPerWeek;
  const safeguards: string[] = [];
  let trendAdjustment = 0;

  if (trend === undefined) safeguards.push('Calories held steady until weight history spans at least 12 days with eight weigh-ins.');
  else if (calibration.loggedDays < 10) safeguards.push('Calories held steady until ten prior nutrition-log days support the longer trend.');
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
  const confidence = trend !== undefined && calibration.loggedDays >= 12 && calibration.weighIns >= 12
    ? 'high'
    : trend !== undefined && calibration.loggedDays >= 10
      ? 'medium'
      : 'low';
  const direction = trend === undefined ? 'Longer weight trend is still calibrating.' : `Longer weight trend is ${trend > 0 ? '+' : ''}${trend} kg/week.`;
  const demand = workout.planType === 'recovery' ? 'Recovery-day demand is lower.' : `${workout.intensity ?? 'moderate'} training demand adds fuel.`;
  const adjustmentBreakdown: CalorieAdjustment[] = [
    { label: 'Goal baseline', kcal: baseGoalAdjustment, explanation: `Supports the selected ${twin.goals.primary.replace('-', ' ')} goal.` },
    { label: 'Training demand', kcal: trainingAdjustment, explanation: workout.planType === 'recovery' ? 'Recovery day uses less training fuel.' : 'Today’s session adds training fuel.' },
    { label: 'Recovery support', kcal: recoveryAdjustment, explanation: recoveryAdjustment ? 'Lower readiness avoids compounding recovery strain.' : 'Readiness does not require extra recovery fuel.' },
    { label: 'Trend correction', kcal: trendAdjustment, explanation: trendAdjustment ? 'A sustained, well-logged trend triggered the bounded correction.' : 'No evidence-supported trend correction is active.' },
  ];

  return {
    caloriesKcal,
    proteinG,
    carbsG,
    fatG,
    ...(trend === undefined ? {} : { trendKgPerWeek: trend }),
    adjustmentKcal,
    confidence,
    reason: `${direction} ${demand}`,
    safeguards,
    bodyComposition: bodyCompositionTarget(twin.goals.primary, weight, trend),
    adjustmentBreakdown,
  };
}
