import { describe, expect, it } from 'vitest';
import { buildDigitalTwin } from '@forge/digital-twin';
import { demoGoals, demoHistory, demoProfile } from './demoData.js';
import { createTodayWorkout } from './workoutSession.js';
import { calculateNutritionTargets } from './nutritionPlanner.js';

function twin(history = demoHistory) {
  return buildDigitalTwin({ profile: demoProfile, goals: demoGoals, history, asOfDate: '2026-08-12' });
}

describe('adaptive nutrition planner', () => {
  it('builds macro targets that reconcile to calories', () => {
    const targets = calculateNutritionTargets(twin(), { ...createTodayWorkout('2026-08-12'), planType: 'upper-strength', intensity: 'moderate' });
    expect(targets.proteinG).toBe(136);
    expect(targets.proteinG * 4 + targets.carbsG * 4 + targets.fatG * 9).toBeCloseTo(targets.caloriesKcal, -1);
  });

  it('does not adapt from a short weight window', () => {
    const targets = calculateNutritionTargets(twin(demoHistory), createTodayWorkout('2026-08-12'));
    expect(targets.trendKgPerWeek).toBeUndefined();
    expect(targets.safeguards[0]).toContain('12 days');
  });

  it('adds calories only after a sustained, well-logged recomposition trend', () => {
    const fastLoss: typeof demoHistory = Array.from({ length: 15 }, (_, index) => ({
      date: `2026-08-${String(index + 1).padStart(2, '0')}` as typeof demoHistory[number]['date'],
      weightKg: 78 - index * 0.12,
      caloriesKcal: 2200,
      sleepScore: 75,
      sleepHours: 7,
      soreness: 3,
      stress: 3,
    }));
    const strength = { ...createTodayWorkout('2026-08-12'), planType: 'upper-strength' as const, intensity: 'high' as const };
    expect(calculateNutritionTargets(twin(fastLoss), strength).adjustmentKcal).toBe(100);
    expect(calculateNutritionTargets(twin(fastLoss), strength).confidence).toBe('high');
  });

  it('holds calories when the long weight trend lacks nutrition logs', () => {
    const weightsOnly: typeof demoHistory = Array.from({ length: 15 }, (_, index) => ({
      date: `2026-08-${String(index + 1).padStart(2, '0')}` as typeof demoHistory[number]['date'],
      weightKg: 78 - index * 0.12,
      sleepScore: 75,
      sleepHours: 7,
      soreness: 3,
      stress: 3,
    }));
    const strength = { ...createTodayWorkout('2026-08-12'), planType: 'upper-strength' as const, intensity: 'high' as const };
    const targets = calculateNutritionTargets(twin(weightsOnly), strength);
    expect(targets.trendKgPerWeek).toBeDefined();
    expect(targets.adjustmentKcal).toBe(0);
    expect(targets.safeguards[0]).toContain('ten prior nutrition-log days');
  });
});
