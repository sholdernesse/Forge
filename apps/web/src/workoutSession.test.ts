import { describe, expect, it } from 'vitest';
import { completedSetCount, createTodayWorkout, isWorkoutSession, totalSetCount, workoutMinutes } from './workoutSession.js';

describe('workout session', () => {
  it('creates the recovery workout with six loggable sets', () => {
    const session = createTodayWorkout('2026-08-12');
    expect(session.status).toBe('not-started');
    expect(totalSetCount(session)).toBe(6);
    expect(completedSetCount(session)).toBe(0);
    expect(isWorkoutSession(session)).toBe(true);
  });

  it('summarizes completed duration and rep sets', () => {
    const session = createTodayWorkout('2026-08-12');
    session.exercises[0]!.sets[0]!.completedAt = '2026-08-12T12:00:00.000Z';
    session.exercises[2]!.sets[0]!.completedAt = '2026-08-12T12:32:00.000Z';
    expect(completedSetCount(session)).toBe(2);
    expect(workoutMinutes(session)).toBe(32);
  });

  it('rejects malformed persisted sessions', () => {
    expect(isWorkoutSession({ id: 'broken', exercises: [] })).toBe(false);
  });
});
