import { describe, expect, it } from 'vitest';
import { buildDigitalTwin } from '@forge/digital-twin';
import { demoGoals, demoHistory, demoProfile } from './demoData.js';
import { createTodayWorkout } from './workoutSession.js';
import { applyDeload, assessDeload, nextScheduleIntent } from './schedulePolicy.js';

describe('schedule and deload policy', () => {
  it('activates a deload for sustained low recovery signals', () => {
    const history = demoHistory.map((day) => ({ ...day, sleepScore: 45, soreness: 8, stress: 7 }));
    const twin = buildDigitalTwin({ profile: demoProfile, goals: demoGoals, history, asOfDate: '2026-08-12' });
    expect(assessDeload(twin)).toMatchObject({ active: true, volumeMultiplier: 0.65, loadMultiplier: 0.9 });
  });

  it('reduces strength sets and load but leaves recovery sessions unchanged', () => {
    const strength = createTodayWorkout('2026-08-12');
    strength.planType = 'upper-strength';
    strength.exercises[2]!.sets = Array.from({ length: 4 }, (_, index) => ({ id: `${index}`, reps: 8, loadKg: 60 }));
    const reduced = applyDeload(strength, { active: true, fatigueScore: 3, reasons: ['Fatigue'], volumeMultiplier: 0.65, loadMultiplier: 0.9 });
    expect(reduced.exercises[2]!.sets).toHaveLength(3);
    expect(reduced.exercises[2]!.sets[0]!.loadKg).toBe(54);
  });

  it('cycles adaptive, train, and rest schedule intents', () => {
    expect(nextScheduleIntent('adaptive')).toBe('train');
    expect(nextScheduleIntent('train')).toBe('rest');
    expect(nextScheduleIntent('rest')).toBe('adaptive');
  });
});
