import { describe, expect, it } from 'vitest';
import { buildDigitalTwin } from './TwinBuilder.js';
import { normalizeSnapshots, snapshotsInWindow } from './TwinHistory.js';

describe('TwinHistory', () => {
  it('uses calendar windows instead of the last number of records', () => {
    const result = snapshotsInWindow([
      { date: '2026-07-01', caloriesKcal: 2000 },
      { date: '2026-08-04', caloriesKcal: 2100 },
      { date: '2026-08-10', caloriesKcal: 2200 },
    ], 7, '2026-08-10');

    expect(result.map((snapshot) => snapshot.date)).toEqual(['2026-08-04', '2026-08-10']);
  });

  it('merges duplicate dates with the latest values', () => {
    expect(normalizeSnapshots([
      { date: '2026-08-10', caloriesKcal: 2000 },
      { date: '2026-08-10', proteinG: 150 },
    ])).toEqual([{ date: '2026-08-10', caloriesKcal: 2000, proteinG: 150 }]);
  });

  it('rejects invalid measurement scales', () => {
    expect(() => normalizeSnapshots([{ date: '2026-08-10', trainingRpe: 11 }])).toThrow(RangeError);
  });

  it('does not infer healthy readiness from absent recovery data', () => {
    const twin = buildDigitalTwin({
      profile: { id: 'u1', sex: 'unspecified' },
      goals: { primary: 'performance', weeklyTrainingTarget: 4 },
      now: '2026-08-10T12:00:00.000Z',
      history: [],
    });

    expect(twin.recovery.status).toBe('insufficient-data');
    expect(twin.recovery.readiness).toBe(0);
  });
});
