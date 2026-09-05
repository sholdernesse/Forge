import { describe, expect, it } from 'vitest';
import { addHydration, hydrationTotal, isHydrationEntry, undoLatestHydration } from './hydration.js';

describe('hydration logging', () => {
  it('adds bounded quick entries and totals only the selected day', () => {
    const first = addHydration([], '2026-09-03', 250, '2026-09-03T12:00:00.000Z');
    const entries = addHydration(first, '2026-09-03', 500, '2026-09-03T13:00:00.000Z');
    expect(hydrationTotal(entries, '2026-09-03')).toBe(750);
    expect(hydrationTotal(entries, '2026-09-04')).toBe(0);
  });

  it('undoes only the latest entry for today', () => {
    const entries = [
      ...addHydration([], '2026-09-02', 250, '2026-09-02T12:00:00.000Z'),
      ...addHydration([], '2026-09-03', 250, '2026-09-03T12:00:00.000Z'),
      ...addHydration([], '2026-09-03', 500, '2026-09-03T13:00:00.000Z'),
    ];
    expect(hydrationTotal(undoLatestHydration(entries, '2026-09-03'), '2026-09-03')).toBe(250);
    expect(hydrationTotal(undoLatestHydration(entries, '2026-09-03'), '2026-09-02')).toBe(250);
  });

  it('rejects malformed or excessive entries', () => {
    expect(isHydrationEntry({ id: 'water', date: '2026-09-03', amountMl: 250, createdAt: '2026-09-03T12:00:00.000Z' })).toBe(true);
    expect(isHydrationEntry({ id: 'water', date: '2026-09-03', amountMl: 5_000, createdAt: '2026-09-03T12:00:00.000Z' })).toBe(false);
  });
});
