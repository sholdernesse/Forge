import { describe, expect, it } from 'vitest';
import { experienceMode, isFirstRun } from './firstRun.js';

describe('first-run boundary', () => {
  it('keeps sample data exclusive to the explicit development experience', () => {
    expect(experienceMode('development')).toBe('demo');
    expect(experienceMode('signed-out')).toBe('personal');
    expect(experienceMode('signed-in')).toBe('personal');
    expect(experienceMode('loading')).toBe('personal');
  });

  it('identifies a personal account with no recorded activity', () => {
    expect(isFirstRun({
      mode: 'personal',
      exerciseCount: 0,
      sessionCount: 0,
      foodEntryCount: 0,
      coachMessageCount: 0,
    })).toBe(true);
  });

  it('does not label demo or established data as first-run', () => {
    expect(isFirstRun({
      mode: 'demo',
      exerciseCount: 0,
      sessionCount: 0,
      foodEntryCount: 0,
      coachMessageCount: 0,
    })).toBe(false);
    expect(isFirstRun({
      mode: 'personal',
      savedAt: '2026-08-21T12:00:00.000Z',
      exerciseCount: 0,
      sessionCount: 0,
      foodEntryCount: 0,
      coachMessageCount: 0,
    })).toBe(false);
  });
});
