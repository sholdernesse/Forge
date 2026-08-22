import { describe, expect, it } from 'vitest';
import { createTodayWorkout } from './workoutSession.js';
import { summarizeWorkout, trainingWeek, weeklyVolume } from './volumeLedger.js';

describe('weekly volume ledger', () => {
  it('counts completed sets against their muscle groups', () => {
    const workout = createTodayWorkout('2026-08-12');
    workout.exercises[2]!.sets.unshift({ id: 'warmup', kind: 'warmup', reps: 5, loadKg: 0, completedAt: '2026-08-12T11:55:00Z' });
    workout.exercises[2]!.sets[1]!.completedAt = '2026-08-12T12:00:00Z';
    workout.feedback = { perceivedExertion: 8, discomfort: 'mild', note: 'Knee felt different.' };
    expect(summarizeWorkout(workout, 32).muscleSets).toEqual({ core: 1 });
    expect(summarizeWorkout(workout, 32)).toMatchObject({ perceivedExertion: 8, discomfort: 'mild' });
    expect(summarizeWorkout(workout, 32)).toMatchObject({ feedbackNote: 'Knee felt different.', exerciseSummaries: expect.arrayContaining([{ exerciseId: 'dead-bugs', name: 'Dead bugs', completedSets: 1, totalSets: 3 }]) });
  });

  it('excludes sessions outside the rolling seven-day window', () => {
    const volume = weeklyVolume([
      { workoutId: 'old', date: '2026-08-01', title: 'Old', durationMinutes: 40, muscleSets: { chest: 20 } },
      { workoutId: 'new', date: '2026-08-10', title: 'New', durationMinutes: 40, muscleSets: { chest: 6 } },
    ], '2026-08-12');
    expect(volume.find((item) => item.muscle === 'chest')).toMatchObject({ completed: 6, target: 10 });
  });

  it('builds a Monday-to-Sunday schedule with today identified', () => {
    const week = trainingWeek([], '2026-08-12', 'Adaptive upper');
    expect(week).toHaveLength(7);
    expect(week.find((day) => day.status === 'today')).toMatchObject({ day: 'Wed', title: 'Adaptive upper' });
  });
});
