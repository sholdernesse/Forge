import { describe, expect, it } from 'vitest';
import { compareTrainingSession } from './trainingComparison.js';

const records = [
  { workoutId: 'first', date: '2026-08-01', title: 'Upper Strength', durationMinutes: 40, muscleSets: { chest: 3, back: 3 }, perceivedExertion: 7 },
  { workoutId: 'other', date: '2026-08-05', title: 'Lower body', durationMinutes: 50, muscleSets: { quads: 5 } },
  { workoutId: 'second', date: '2026-08-08', title: ' upper strength ', durationMinutes: 46, muscleSets: { chest: 4, back: 4 }, perceivedExertion: 8 },
  { workoutId: 'latest', date: '2026-08-12', title: 'Upper Strength', durationMinutes: 44, muscleSets: { chest: 4, back: 3 } },
];

describe('training session comparison', () => {
  it('compares a session with the most recent earlier workout sharing its title', () => {
    expect(compareTrainingSession(records, 'second')).toEqual({
      previousWorkoutId: 'first',
      previousDate: '2026-08-01',
      duration: { current: 46, previous: 40, delta: 6 },
      completedSets: { current: 8, previous: 6, delta: 2 },
      effort: { current: 8, previous: 7, delta: 1 },
    });
    expect(compareTrainingSession(records, 'latest')?.previousWorkoutId).toBe('second');
  });

  it('omits effort when either session is unrated', () => {
    expect(compareTrainingSession(records, 'latest')?.effort).toBeUndefined();
  });

  it('does not compare the first occurrence, unrelated titles, or missing sessions', () => {
    expect(compareTrainingSession(records, 'first')).toBeUndefined();
    expect(compareTrainingSession(records, 'other')).toBeUndefined();
    expect(compareTrainingSession(records, 'missing')).toBeUndefined();
  });
});
