import { describe, expect, it } from 'vitest';
import { compareTrainingSession, trainingSessionNeighbors } from './trainingComparison.js';

const records = [
  { workoutId: 'first', date: '2026-08-01', title: 'Upper Strength', durationMinutes: 40, muscleSets: { chest: 3, back: 3 }, perceivedExertion: 7, movementQuality: 'mixed' as const, exerciseSummaries: [{ exerciseId: 'bench', name: 'Bench press', completedSets: 3, totalSets: 3 }, { exerciseId: 'row', name: 'Row', completedSets: 3, totalSets: 3 }] },
  { workoutId: 'other', date: '2026-08-05', title: 'Lower body', durationMinutes: 50, muscleSets: { quads: 5 } },
  { workoutId: 'second', date: '2026-08-08', title: ' upper strength ', durationMinutes: 46, muscleSets: { chest: 4, back: 4 }, perceivedExertion: 8, movementQuality: 'controlled' as const, exerciseSummaries: [{ exerciseId: 'bench', name: 'Bench press', completedSets: 4, totalSets: 4 }, { exerciseId: 'fly', name: 'Cable fly', completedSets: 2, totalSets: 2 }] },
  { workoutId: 'latest', date: '2026-08-12', title: 'Upper Strength', durationMinutes: 44, muscleSets: { chest: 4, back: 3 } },
];

describe('training session comparison', () => {
  it('compares a session with the most recent earlier workout sharing its title', () => {
    expect(compareTrainingSession(records, 'second')).toEqual({
      previousWorkoutId: 'first',
      previousDate: '2026-08-01',
      duration: { current: 46, previous: 40, delta: 6 },
      completedSets: { current: 8, previous: 6, delta: 2 },
      exercises: [
        { exerciseId: 'bench', name: 'Bench press', currentSets: 4, previousSets: 3, delta: 1 },
        { exerciseId: 'fly', name: 'Cable fly', currentSets: 2, previousSets: 0, delta: 2 },
        { exerciseId: 'row', name: 'Row', currentSets: 0, previousSets: 3, delta: -3 },
      ],
      effort: { current: 8, previous: 7, delta: 1 },
      movementQuality: { current: 'controlled', previous: 'mixed', delta: 1 },
    });
    expect(compareTrainingSession(records, 'latest')?.previousWorkoutId).toBe('second');
  });

  it('omits quality comparison unless both matching sessions are rated', () => {
    expect(compareTrainingSession(records, 'latest')?.movementQuality).toBeUndefined();
  });

  it('omits effort when either session is unrated', () => {
    expect(compareTrainingSession(records, 'latest')?.effort).toBeUndefined();
  });

  it('returns an empty exercise comparison when legacy summaries are unavailable', () => {
    expect(compareTrainingSession([
      { workoutId: 'old', date: '2026-07-01', title: 'Cardio', durationMinutes: 20, muscleSets: { cardio: 1 } },
      { workoutId: 'new', date: '2026-07-08', title: 'Cardio', durationMinutes: 25, muscleSets: { cardio: 1 } },
    ], 'new')?.exercises).toEqual([]);
  });

  it('does not compare the first occurrence, unrelated titles, or missing sessions', () => {
    expect(compareTrainingSession(records, 'first')).toBeUndefined();
    expect(compareTrainingSession(records, 'other')).toBeUndefined();
    expect(compareTrainingSession(records, 'missing')).toBeUndefined();
  });

  it('finds deterministic previous and next matching sessions', () => {
    expect(trainingSessionNeighbors(records, 'first')).toEqual({ nextWorkoutId: 'second' });
    expect(trainingSessionNeighbors(records, 'second')).toEqual({ previousWorkoutId: 'first', nextWorkoutId: 'latest' });
    expect(trainingSessionNeighbors(records, 'latest')).toEqual({ previousWorkoutId: 'second' });
    expect(trainingSessionNeighbors(records, 'missing')).toEqual({});
  });
});
