import { describe, expect, it } from 'vitest';
import { experienceMode, isFirstRun } from './firstRun.js';

const emptyEvidence = {
  exerciseCount: 0,
  sessionCount: 0,
  foodEntryCount: 0,
  coachMessageCount: 0,
};

describe('first-run boundary', () => {
  it('keeps sample data exclusive to the explicit development experience', () => {
    expect(experienceMode('development')).toBe('demo');
    expect(experienceMode('signed-out')).toBe('personal');
    expect(experienceMode('signed-in')).toBe('personal');
    expect(experienceMode('loading')).toBe('personal');
  });

  it('keeps a personal account in first-run until onboarding is complete', () => {
    expect(isFirstRun({ mode: 'personal', onboardingComplete: false, ...emptyEvidence })).toBe(true);
    expect(isFirstRun({
      mode: 'personal',
      onboardingComplete: false,
      savedAt: '2026-08-21T12:00:00.000Z',
      exerciseCount: 3,
      sessionCount: 1,
      foodEntryCount: 2,
      coachMessageCount: 1,
    })).toBe(true);
  });

  it('does not label demo or onboarded personal data as first-run', () => {
    expect(isFirstRun({ mode: 'demo', onboardingComplete: false, ...emptyEvidence })).toBe(false);
    expect(isFirstRun({ mode: 'personal', onboardingComplete: true, ...emptyEvidence })).toBe(false);
  });
});
