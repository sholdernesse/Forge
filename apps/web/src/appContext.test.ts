import { describe, expect, it } from 'vitest';
import { greetingForHour, localDateHeading, localDateKey, userFirstName, withTodaySnapshot } from './appContext.js';

describe('app context', () => {
  it('builds a calendar key from local date fields rather than UTC', () => {
    const local = new Date(2026, 7, 21, 23, 30);
    expect(localDateKey(local)).toBe('2026-08-21');
  });

  it('formats the visible local date and time-aware greeting', () => {
    const local = new Date(2026, 7, 21, 15, 0);
    expect(localDateHeading(local)).toContain('AUGUST 21');
    expect(greetingForHour(5)).toBe('Good morning');
    expect(greetingForHour(15)).toBe('Good afternoon');
    expect(greetingForHour(21)).toBe('Good evening');
  });

  it('uses the authenticated first name with safe fallbacks', () => {
    expect(userFirstName('Shane Holdernesse', 'ignored@example.com')).toBe('Shane');
    expect(userFirstName(undefined, 'alex.smith@example.com')).toBe('Alex smith');
    expect(userFirstName()).toBe('Athlete');
  });

  it('creates an honest empty daily snapshot only when today is missing', () => {
    const defaults = { weightKg: 75, sleepScore: 70, sleepHours: 7, soreness: 3, stress: 4 };
    const history = [{ date: '2026-08-20', weightKg: 75 }];
    const next = withTodaySnapshot(history, '2026-08-21', defaults);
    expect(next).toEqual([
      { date: '2026-08-20', weightKg: 75 },
      { date: '2026-08-21', weightKg: 75, sleepScore: 70, sleepHours: 7, soreness: 3, stress: 4, steps: 0, caloriesKcal: 0, proteinG: 0 },
    ]);
    expect(withTodaySnapshot(next, '2026-08-21', defaults)).toBe(next);
  });
});
