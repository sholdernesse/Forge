import { describe, expect, it } from 'vitest';
import { filterTrainingHistory } from './trainingHistoryFilters.js';

const records = [
  { workoutId: 'upper', date: '2026-08-12', title: 'Upper strength', durationMinutes: 50, muscleSets: { chest: 4 }, perceivedExertion: 8, discomfort: 'none' as const, exerciseSummaries: [{ exerciseId: 'bench', name: 'Bench press', completedSets: 4, totalSets: 4 }] },
  { workoutId: 'lower', date: '2026-08-10', title: 'Lower body', durationMinutes: 42, muscleSets: { quads: 3 }, perceivedExertion: 7, discomfort: 'mild' as const, feedbackNote: 'Left knee felt tight.' },
  { workoutId: 'recovery', date: '2026-08-08', title: 'Recovery walk', durationMinutes: 30, muscleSets: { cardio: 1 } },
];

describe('training history filters', () => {
  it('filters high-effort and discomfort sessions without treating missing effort as zero effort data', () => {
    expect(filterTrainingHistory(records, 'high-effort', '').map((record) => record.workoutId)).toEqual(['upper']);
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
});
