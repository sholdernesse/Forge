import { describe, expect, it } from 'vitest';
import { filterTrainingHistory } from './trainingHistoryFilters.js';

const records = [
  { workoutId: 'upper', date: '2026-08-12', title: 'Upper strength', durationMinutes: 50, muscleSets: { chest: 4 }, perceivedExertion: 8, discomfort: 'none' as const, exerciseSummaries: [{ exerciseId: 'bench', name: 'Bench press', completedSets: 4, totalSets: 4 }] },
  { workoutId: 'lower', date: '2026-08-10', title: 'Lower body', durationMinutes: 42, muscleSets: { quads: 3 }, perceivedExertion: 7, discomfort: 'mild' as const, feedbackNote: 'Left knee felt tight.' },
  { workoutId: 'recovery', date: '2026-08-08', title: 'Recovery walk', durationMinutes: 30, muscleSets: { cardio: 1 } },
  { workoutId: 'spring', date: '2026-05-12', title: 'Spring strength', durationMinutes: 45, muscleSets: { back: 4 }, perceivedExertion: 8 },
];

describe('training history filters', () => {
  it('filters high-effort and discomfort sessions without treating missing effort as zero effort data', () => {
    expect(filterTrainingHistory(records, 'high-effort', '').map((record) => record.workoutId)).toEqual(['upper', 'spring']);
    expect(filterTrainingHistory(records, 'discomfort', '').map((record) => record.workoutId)).toEqual(['lower']);
  });

  it('searches titles, exercise names, muscles, and private feedback context', () => {
    expect(filterTrainingHistory(records, 'all', 'bench').map((record) => record.workoutId)).toEqual(['upper']);
    expect(filterTrainingHistory(records, 'all', 'quads knee').map((record) => record.workoutId)).toEqual(['lower']);
  });

  it('normalizes whitespace and requires every search term', () => {
    expect(filterTrainingHistory(records, 'all', '  upper   chest ')).toHaveLength(1);
    expect(filterTrainingHistory(records, 'all', 'upper knee')).toEqual([]);
  });

  it('applies inclusive 30-day and 90-day windows against an explicit dashboard date', () => {
    expect(filterTrainingHistory(records, 'all', '', '30-days', '2026-08-12').map((record) => record.workoutId)).toEqual(['upper', 'lower', 'recovery']);
    expect(filterTrainingHistory(records, 'all', '', '90-days', '2026-08-12').map((record) => record.workoutId)).toEqual(['upper', 'lower', 'recovery']);
    expect(filterTrainingHistory(records, 'all', '', 'all-time', '2026-08-12')).toHaveLength(4);
  });

  it('combines time ranges with experience filters and search', () => {
    expect(filterTrainingHistory(records, 'high-effort', 'strength', '30-days', '2026-08-12').map((record) => record.workoutId)).toEqual(['upper']);
    expect(filterTrainingHistory(records, 'high-effort', 'strength', 'all-time', '2026-08-12').map((record) => record.workoutId)).toEqual(['upper', 'spring']);
  });
});
