import { describe, expect, it } from 'vitest';
import { trainingTrendSummary } from './trainingAnalytics.js';

describe('training trend summary', () => {
  it('builds four Monday-aligned weeks without including future sessions', () => {
    const summary = trainingTrendSummary([
      { workoutId: 'old', date: '2026-07-21', title: 'Old', durationMinutes: 30, muscleSets: {} },
      { workoutId: 'one', date: '2026-08-03', title: 'One', durationMinutes: 40, muscleSets: {}, perceivedExertion: 7 },
      { workoutId: 'two', date: '2026-08-11', title: 'Two', durationMinutes: 50, muscleSets: {}, perceivedExertion: 9, discomfort: 'mild' },
      { workoutId: 'future', date: '2026-08-13', title: 'Future', durationMinutes: 60, muscleSets: {} },
    ], '2026-08-12');
    expect(summary.weeks.map((week) => week.startDate)).toEqual(['2026-07-20', '2026-07-27', '2026-08-03', '2026-08-10']);
    expect(summary).toMatchObject({ sessions: 3, minutes: 120, averageEffort: 8, feedbackCoverage: 67, discomfortSessions: 1, activeWeeks: 3 });
  });

  it('distinguishes missing feedback from low effort', () => {
    const summary = trainingTrendSummary([{ workoutId: 'one', date: '2026-08-11', title: 'One', durationMinutes: 30, muscleSets: {} }], '2026-08-12');
    expect(summary.averageEffort).toBeUndefined();
    expect(summary.feedbackCoverage).toBe(0);
  });

  it('returns a stable empty four-week view', () => {
    expect(trainingTrendSummary([], '2026-08-12')).toMatchObject({ sessions: 0, minutes: 0, feedbackCoverage: 0, discomfortSessions: 0, activeWeeks: 0 });
  });
});
