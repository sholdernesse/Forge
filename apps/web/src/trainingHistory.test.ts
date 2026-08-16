import { describe, expect, it } from 'vitest';
import { trainingHistoryEntries } from './trainingHistory.js';

describe('training history timeline', () => {
  it('sorts newest first and summarizes duration, volume, and feedback', () => {
    const entries = trainingHistoryEntries([
      { workoutId: 'older', date: '2026-08-08', title: 'Older', durationMinutes: 30, muscleSets: { core: 3 } },
      { workoutId: 'newer', date: '2026-08-12', title: 'Upper', durationMinutes: 52, muscleSets: { chest: 4, back: 4, triceps: 3 }, perceivedExertion: 8, discomfort: 'mild' },
    ]);
    expect(entries[0]).toMatchObject({ workoutId: 'newer', dateLabel: 'Aug 12', durationLabel: '52 min', completedSets: 11, effortLabel: 'Effort 8/10', discomfortLabel: 'Mild discomfort', tone: 'caution' });
    expect(entries[0]!.muscleLabel).toBe('Chest · Back · Triceps');
  });

  it('bounds the timeline and labels sessions without hard sets as recovery work', () => {
    const records = Array.from({ length: 8 }, (_, index) => ({ workoutId: `${index}`, date: `2026-08-${String(index + 1).padStart(2, '0')}`, title: 'Recovery', durationMinutes: 20, muscleSets: {} }));
    const entries = trainingHistoryEntries(records, 3);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({ workoutId: '7', muscleLabel: 'Recovery work' });
  });

  it('uses a distinct stopped tone without exposing an empty discomfort label', () => {
    expect(trainingHistoryEntries([{ workoutId: 'stop', date: '2026-08-12', title: 'Stopped', durationMinutes: 8, muscleSets: {}, discomfort: 'stopped' }])[0]).toMatchObject({ tone: 'stopped', discomfortLabel: 'Stopped for discomfort' });
    expect(trainingHistoryEntries([{ workoutId: 'ok', date: '2026-08-12', title: 'Complete', durationMinutes: 40, muscleSets: {}, discomfort: 'none' }])[0]?.discomfortLabel).toBeUndefined();
  });

  it('projects exercise completion and the bounded feedback note for detail views', () => {
    const entry = trainingHistoryEntries([{ workoutId: 'detail', date: '2026-08-12', title: 'Upper', durationMinutes: 40, muscleSets: { chest: 3 }, discomfort: 'mild', feedbackNote: 'Shoulder felt tight.', exerciseSummaries: [{ exerciseId: 'bench', name: 'Bench press', completedSets: 3, totalSets: 4 }] }])[0]!;
    expect(entry.feedbackNote).toBe('Shoulder felt tight.');
    expect(entry.exercises).toEqual([{ id: 'bench', name: 'Bench press', completionLabel: '3 of 4 sets' }]);
    expect(entry.muscleBreakdown).toEqual(['Chest 3']);
  });

  it('supports oldest, highest-effort, and longest sorting with deterministic ties', () => {
    const records = [
      { workoutId: 'short', date: '2026-08-12', title: 'Short', durationMinutes: 20, muscleSets: {}, perceivedExertion: 7 },
      { workoutId: 'long', date: '2026-08-10', title: 'Long', durationMinutes: 60, muscleSets: {}, perceivedExertion: 9 },
      { workoutId: 'unrated', date: '2026-08-08', title: 'Unrated', durationMinutes: 30, muscleSets: {} },
    ];
    expect(trainingHistoryEntries(records, 3, 'oldest').map((entry) => entry.workoutId)).toEqual(['unrated', 'long', 'short']);
    expect(trainingHistoryEntries(records, 3, 'highest-effort').map((entry) => entry.workoutId)).toEqual(['long', 'short', 'unrated']);
    expect(trainingHistoryEntries(records, 3, 'longest').map((entry) => entry.workoutId)).toEqual(['long', 'unrated', 'short']);
  });
});
