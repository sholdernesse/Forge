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

  it('does not adapt from fewer than four weigh-ins', () => {
    const targets = calculateNutritionTargets(twin(demoHistory.slice(-3)), createTodayWorkout('2026-08-12'));
    expect(targets.trendKgPerWeek).toBeUndefined();
    expect(targets.safeguards[0]).toContain('four weigh-ins');
  });

  it('adds calories when recomposition weight loss is too fast', () => {
    const fastLoss = demoHistory.map((day, index) => ({ ...day, weightKg: 78 - index * 0.5, caloriesKcal: 2200 }));
    const strength = { ...createTodayWorkout('2026-08-12'), planType: 'upper-strength' as const, intensity: 'high' as const };
    expect(calculateNutritionTargets(twin(fastLoss), strength).adjustmentKcal).toBe(100);
  });
});
