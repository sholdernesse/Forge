import { describe, expect, it } from 'vitest';
import { addWarmupSet, addWorkoutSet, applyWorkoutSetPatch, adjustWorkoutRest, beginWorkoutRest, clearWorkoutRest, completedSetCount, createTodayWorkout, isWorkoutFeedback, isWorkoutSession, isWorkingSet, nextIncompleteExerciseIndex, removeLastWarmupSet, removeLastWorkoutSet, totalSetCount, workoutMinutes, workoutRestSecondsRemaining } from './workoutSession.js';

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

  it('adjusts active rest without allowing a negative timer', () => {
    const started = beginWorkoutRest(createTodayWorkout('2026-08-12'), 60, 0);
    expect(workoutRestSecondsRemaining(adjustWorkoutRest(started, 15, 10_000), 10_000)).toBe(65);
    expect(adjustWorkoutRest(started, -60, 10_000).restEndsAt).toBeUndefined();
  });

  it('advances to the next incomplete movement and wraps when needed', () => {
    const session = createTodayWorkout('2026-08-12');
    session.exercises[1]!.sets.forEach((set) => { set.completedAt = '2026-08-12T12:00:00.000Z'; });
    expect(nextIncompleteExerciseIndex(session, 0)).toBe(2);
    session.exercises[2]!.sets.forEach((set) => { set.completedAt = '2026-08-12T12:00:00.000Z'; });
    expect(nextIncompleteExerciseIndex(session, 2)).toBe(0);
    session.exercises[0]!.sets.forEach((set) => { set.completedAt = '2026-08-12T12:00:00.000Z'; });
    expect(nextIncompleteExerciseIndex(session, 2)).toBeUndefined();
  });

  it('adds a set from the current prescription with a stable unique id', () => {
    const exercise = createTodayWorkout('2026-08-12').exercises[2]!;
    exercise.sets.at(-1)!.completedAt = '2026-08-12T12:00:00.000Z';
    const added = addWorkoutSet(exercise);
    expect(added.sets).toHaveLength(4);
    expect(added.sets.at(-1)).toEqual({ id: 'dead-bugs-extra-4', reps: 10, loadKg: 0 });
    expect(exercise.sets).toHaveLength(3);
  });

  it('bounds set additions and never removes completed or only sets', () => {
    const exercise = createTodayWorkout('2026-08-12').exercises[2]!;
    expect(addWorkoutSet(exercise, 3)).toBe(exercise);
    const added = addWorkoutSet(exercise);
    expect(removeLastWorkoutSet(added).sets).toHaveLength(3);
    added.sets.at(-1)!.completedAt = '2026-08-12T12:00:00.000Z';
    expect(removeLastWorkoutSet(added)).toBe(added);
    const oneSet = createTodayWorkout('2026-08-12').exercises[0]!;
    expect(removeLastWorkoutSet(oneSet)).toBe(oneSet);
  });

  it('normalizes direct set edits before they reach persisted history', () => {
    const set = { id: 'set-1', reps: 8, loadKg: 20 };
    expect(applyWorkoutSetPatch(set, { reps: -2, loadKg: -5 })).toEqual({ id: 'set-1', reps: 1, loadKg: 0 });
    expect(applyWorkoutSetPatch(set, { reps: 7.6 })).toEqual({ id: 'set-1', reps: 8, loadKg: 20 });
    expect(applyWorkoutSetPatch(set, { reps: Number.NaN, loadKg: Number.POSITIVE_INFINITY })).toEqual(set);
    expect(applyWorkoutSetPatch({ id: 'timed', durationMinutes: 5 }, { durationMinutes: 0 })).toEqual({ id: 'timed', durationMinutes: 1 });
  });

  it('rejects malformed set values in restored sessions', () => {
    const session = createTodayWorkout('2026-08-12');
    expect(isWorkoutSession({ ...session, exercises: [{ ...session.exercises[2], sets: [{ id: 'bad', reps: 0, loadKg: 10 }] }] })).toBe(false);
    expect(isWorkoutSession({ ...session, exercises: [{ ...session.exercises[2], sets: [{ id: 'bad', reps: 8.5, loadKg: 10 }] }] })).toBe(false);
    expect(isWorkoutSession({ ...session, exercises: [{ ...session.exercises[2], sets: [{ id: 'bad', reps: 8, loadKg: -1 }] }] })).toBe(false);
    expect(isWorkoutSession({ ...session, exercises: [{ ...session.exercises[0], sets: [{ id: 'bad', durationMinutes: 0 }] }] })).toBe(false);
  });

  it('adds and removes warm-up sets without mutating working prescriptions', () => {
    const exercise = createTodayWorkout('2026-08-12').exercises[2]!;
    const withWarmup = addWarmupSet(exercise);
    expect(withWarmup.sets[0]).toEqual({ id: 'dead-bugs-warmup-1', kind: 'warmup', reps: 10, loadKg: 0 });
    expect(withWarmup.sets.filter(isWorkingSet)).toEqual(exercise.sets);
    expect(removeLastWarmupSet(withWarmup)).toEqual(exercise);
    withWarmup.sets[0]!.completedAt = '2026-08-12T12:00:00.000Z';
    expect(removeLastWarmupSet(withWarmup)).toBe(withWarmup);
  });

  it('only permits warm-up sets for repetition exercises', () => {
    const durationExercise = createTodayWorkout('2026-08-12').exercises[0]!;
    expect(addWarmupSet(durationExercise)).toBe(durationExercise);
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
