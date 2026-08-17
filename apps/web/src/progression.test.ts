import { describe, expect, it } from 'vitest';
import { createTodayWorkout } from './workoutSession.js';
import { estimatedOneRepMax, exerciseProgressTimeline, progressionTarget, recordPerformances, strongestMovements, type ExercisePerformance } from './progression.js';

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

  it('does not turn warm-up sets into strength records or personal bests', () => {
    const session = createTodayWorkout('2026-08-12');
    session.exercises[2]!.sets.unshift({ id: 'warmup', kind: 'warmup', reps: 5, loadKg: 100, completedAt: '2026-08-12T11:55:00.000Z' });
    session.exercises[2]!.sets[1]!.completedAt = '2026-08-12T12:00:00.000Z';
    session.exercises[2]!.sets[1]!.loadKg = 5;
    expect(recordPerformances(session, history)).toHaveLength(1);
    expect(recordPerformances(session, history)[0]).toMatchObject({ loadKg: 5 });
  });

  it('ranks movements by estimated-strength gain', () => {
    expect(strongestMovements(history)[0]).toMatchObject({ exerciseId: 'dead-bugs', gainPct: 4 });
  });

  it('builds a chronological, non-mutating movement timeline', () => {
    const reversed = [...history].reverse();
    expect(exerciseProgressTimeline(reversed, 'dead-bugs')).toMatchObject({
      exerciseName: 'Dead bugs',
      gainPct: 4,
      bestEstimatedOneRepMax: 7,
    });
    expect(exerciseProgressTimeline(reversed, 'dead-bugs')?.entries.map((entry) => entry.date)).toEqual(['2026-08-01', '2026-08-08']);
    expect(reversed[0]?.date).toBe('2026-08-08');
    expect(exerciseProgressTimeline(history, 'missing')).toBeUndefined();
  });
});
