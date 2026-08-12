import { describe, expect, it } from 'vitest';
import { createTodayWorkout } from './workoutSession.js';
import { estimatedOneRepMax, progressionTarget, recordPerformances, strongestMovements, type ExercisePerformance } from './progression.js';

const history: ExercisePerformance[] = [
  { exerciseId: 'dead-bugs', exerciseName: 'Dead bugs', date: '2026-08-01', reps: 10, loadKg: 5, estimatedOneRepMax: 6.7 },
  { exerciseId: 'dead-bugs', exerciseName: 'Dead bugs', date: '2026-08-08', reps: 12, loadKg: 5, estimatedOneRepMax: 7 },
];

describe('progression intelligence', () => {
  it('estimates strength and advances load after the rep range is complete', () => {
    expect(estimatedOneRepMax(60, 10)).toBe(80);
    expect(progressionTarget(history, 'dead-bugs')).toMatchObject({ reps: 8, loadKg: 7.5 });
  });

  it('detects a personal record from a completed set', () => {
    const session = createTodayWorkout('2026-08-12');
    const set = session.exercises[2]!.sets[0]!;
    set.loadKg = 7.5;
    set.reps = 10;
    set.completedAt = '2026-08-12T12:00:00.000Z';
    expect(recordPerformances(session, history)[0]).toMatchObject({ isPersonalRecord: true });
  });

  it('ranks movements by estimated-strength gain', () => {
    expect(strongestMovements(history)[0]).toMatchObject({ exerciseId: 'dead-bugs', gainPct: 4 });
  });
});
