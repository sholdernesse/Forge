import { describe, expect, it } from 'vitest';
import type { OnboardingProfile } from './onboarding.js';
import { startingBlockFor } from './startingBlock.js';

const profile: OnboardingProfile = {
  version: 1, completedAt: '2026-08-01T14:00:00.000Z', primaryGoal: 'build-muscle-strength', experience: 'some-experience',
  weeklyTrainingDays: 4, sessionMinutes: 45, location: 'home', equipment: ['bodyweight', 'dumbbells'], constraints: [],
  nutritionApproach: 'simple-guidance', age: 40, sex: 'unspecified', heightCm: 175, weightKg: 78,
};

describe('four-week starting block', () => {
  it('shows the current phase from the approved-plan date', () => {
    const block = startingBlockFor(profile, '2026-08-10');
    expect(block.currentWeek).toBe(2);
    expect(block.weeks.map((week) => week.status)).toEqual(['complete', 'current', 'upcoming', 'upcoming']);
  });

  it('caps the visible foundation block at week four', () => {
    expect(startingBlockFor(profile, '2026-10-01').currentWeek).toBe(4);
  });

  it('keeps progression behind repeatable movement quality', () => {
    const block = startingBlockFor(profile, '2026-08-15');
    expect(block.weeks[2]?.focus).toContain('form stays steady');
    expect(block.purpose).toContain('strength base before adding load');
  });

  it('uses compact calibration language for experienced users', () => {
    const block = startingBlockFor({ ...profile, experience: 'experienced' }, '2026-08-01');
    expect(block.weeks[0]?.title).toBe('Calibrate');
    expect(block.weeks[2]?.focus).toContain('reps or load');
  });
});
