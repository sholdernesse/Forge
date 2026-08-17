import { describe, expect, it } from 'vitest';
import { buildDigitalTwin } from '@forge/digital-twin';
import { demoGoals, demoHistory, demoProfile } from './demoData.js';
import { demoTrainingPreferences, generateTrainingPlan } from './trainingPlanner.js';

function twinWith(sleepScore: number, sessions: number) {
  const history = demoHistory.map((day, index) => {
    const { trainingMinutes: _trainingMinutes, ...rest } = day;
    return index < sessions ? { ...rest, sleepScore, trainingMinutes: 45 } : { ...rest, sleepScore };
  });
  return buildDigitalTwin({ profile: demoProfile, goals: demoGoals, history, asOfDate: '2026-08-12', now: '2026-08-12T12:00:00.000Z' });
}

describe('adaptive training planner', () => {
  it('selects recovery work when readiness is suppressed', () => {
    const plan = generateTrainingPlan(twinWith(10, 2), demoTrainingPreferences);
    expect(plan).toMatchObject({ planType: 'recovery', intensity: 'low' });
    expect(plan.exercises.flatMap((exercise) => exercise.sets).some((set) => set.kind === 'warmup')).toBe(false);
  });

  it('honors a rest-day override without letting a training override bypass unsafe readiness', () => {
    expect(generateTrainingPlan(twinWith(95, 2), demoTrainingPreferences, [], 'rest').planType).toBe('recovery');
    expect(generateTrainingPlan(twinWith(10, 2), demoTrainingPreferences, [], 'train').planType).toBe('recovery');
  });

  it('selects an upper strength day and protects the elbow when ready', () => {
    const plan = generateTrainingPlan(twinWith(95, 2), demoTrainingPreferences);
    expect(plan.planType).toBe('upper-strength');
    expect(plan.exercises.find((exercise) => exercise.id === 'dumbbell-overhead-press')?.detail).toContain('Neutral grip');
    const bench = plan.exercises.find((exercise) => exercise.id === 'barbell-bench')!;
    expect(bench.sets[0]).toMatchObject({ kind: 'warmup', reps: 8, loadKg: 29.5 });
    expect(bench.sets.filter((set) => set.kind !== 'warmup')).toHaveLength(4);
  });

  it('selects back-conscious lower exercises on the alternating session', () => {
    const plan = generateTrainingPlan(twinWith(95, 3), demoTrainingPreferences, [
      { workoutId: 'upper', date: '2026-08-10', title: 'Upper', durationMinutes: 50, muscleSets: { chest: 10, back: 10, shoulders: 12 } },
    ]);
    expect(plan.planType).toBe('lower-strength');
    expect(plan.exercises.map((exercise) => exercise.id)).toContain('hip-thrust');
    expect(plan.exercises.map((exercise) => exercise.id)).not.toContain('romanian-deadlift');
    expect(plan.exercises.find((exercise) => exercise.id === 'box-squat')?.sets[0]).toMatchObject({ kind: 'warmup', loadKg: 29.5 });
  });

  it('deloads after near-maximal effort and selects recovery after a stopped session', () => {
    const hardHistory = [{ workoutId: 'hard', date: '2026-08-11', title: 'Hard', durationMinutes: 50, muscleSets: { chest: 4 }, perceivedExertion: 9 }];
    expect(generateTrainingPlan(twinWith(95, 2), demoTrainingPreferences, hardHistory)).toMatchObject({ intensity: 'low' });
    const stoppedHistory = [{ workoutId: 'stop', date: '2026-08-11', title: 'Stopped', durationMinutes: 10, muscleSets: {}, discomfort: 'stopped' as const }];
    expect(generateTrainingPlan(twinWith(95, 2), demoTrainingPreferences, stoppedHistory)).toMatchObject({ planType: 'recovery', intensity: 'low' });
  });
});
