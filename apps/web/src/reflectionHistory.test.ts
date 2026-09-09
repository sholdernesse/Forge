import { describe, expect, it } from 'vitest';
import type { DailySnapshot } from '@forge/digital-twin';
import { reflectionTrend } from './reflectionHistory.js';

describe('reflection history', () => {
  it('returns a clear empty state until a complete reflection exists', () => {
    expect(reflectionTrend([{ date: '2026-08-10', mindScore: 7 }])).toEqual({
      entries: [],
      story: 'Complete an evening reflection to begin your mind, body, and soul story.',
    });
  });

  it('summarizes complete reflections in chronological order', () => {
    const trend = reflectionTrend([
      { date: '2026-08-12', mindScore: 8, bodyScore: 7, soulScore: 9, reflectionNote: 'Connected with family.' },
      { date: '2026-08-10', mindScore: 6, bodyScore: 6, soulScore: 7 },
    ]);

    expect(trend.entries.map((entry) => entry.date)).toEqual(['2026-08-10', '2026-08-12']);
    expect(trend.latest?.averageScore).toBe(8);
    expect(trend.leadingDimension).toBe('soul');
    expect(trend.change).toBe(1.7);
    expect(trend.story).toContain('Soul has been your strongest reported signal');
  });

  it('bounds the view and rejects invalid limits', () => {
    const history: DailySnapshot[] = Array.from({ length: 9 }, (_, index) => ({
      date: `2026-08-${String(index + 1).padStart(2, '0')}` as DailySnapshot['date'],
      mindScore: 5,
      bodyScore: 5,
      soulScore: 5,
    }));

    expect(reflectionTrend(history).entries).toHaveLength(7);
    expect(() => reflectionTrend(history, 0)).toThrow(RangeError);
  });
});
