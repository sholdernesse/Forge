import { describe, expect, it } from 'vitest';
import { beginWorkoutRest, clearWorkoutRest, completedSetCount, createTodayWorkout, isWorkoutFeedback, isWorkoutSession, totalSetCount, workoutMinutes, workoutRestSecondsRemaining } from './workoutSession.js';

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

  it('keeps rest timing accurate across close, reopen, and elapsed time', () => {
    const session = beginWorkoutRest(createTodayWorkout('2026-08-12'), 90, Date.parse('2026-08-12T12:00:00.000Z'));
    expect(session.restEndsAt).toBe('2026-08-12T12:01:30.000Z');
    expect(workoutRestSecondsRemaining(session, Date.parse('2026-08-12T12:00:35.250Z'))).toBe(55);
    expect(workoutRestSecondsRemaining(session, Date.parse('2026-08-12T12:02:00.000Z'))).toBe(0);
    expect(clearWorkoutRest(session).restEndsAt).toBeUndefined();
  });

  it('rejects invalid persisted rest deadlines', () => {
    const session = createTodayWorkout('2026-08-12');
    expect(isWorkoutSession({ ...session, restEndsAt: 'not-a-date' })).toBe(false);
    expect(isWorkoutSession(beginWorkoutRest(session, 60, 0))).toBe(true);
  });

  it('rejects malformed persisted sessions', () => {
    expect(isWorkoutSession({ id: 'broken', exercises: [] })).toBe(false);
    const session = createTodayWorkout('2026-08-12');
    expect(isWorkoutSession({ ...session, feedback: { perceivedExertion: 11, discomfort: 'none' } })).toBe(false);
  });

  it('bounds post-workout feedback without requiring a note', () => {
    expect(isWorkoutFeedback({ perceivedExertion: 7, discomfort: 'mild' })).toBe(true);
    expect(isWorkoutFeedback({ perceivedExertion: 7.5, discomfort: 'mild' })).toBe(false);
    expect(isWorkoutFeedback({ perceivedExertion: 7, discomfort: 'injured' })).toBe(false);
  });
});
