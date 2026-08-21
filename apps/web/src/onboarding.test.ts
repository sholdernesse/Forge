import { describe, expect, it } from 'vitest';
import { goalsFromOnboarding, isOnboardingProfile, trainingPreferencesFromOnboarding, userProfileFromOnboarding, type OnboardingProfile } from './onboarding.js';

const profile: OnboardingProfile = {
  version: 1,
  completedAt: '2026-08-21T12:00:00.000Z',
  primaryGoal: 'build-muscle-strength',
  experience: 'some-experience',
  weeklyTrainingDays: 4,
  sessionMinutes: 45,
  location: 'home',
  equipment: ['dumbbells', 'bands'],
  constraints: ['elbow-sensitive'],
  nutritionApproach: 'simple-guidance',
  age: 42,
  sex: 'female',
  heightCm: 168,
  weightKg: 68,
};

describe('Forge onboarding profile', () => {
  it('validates the complete bounded profile', () => {
    expect(isOnboardingProfile(profile)).toBe(true);
    expect(isOnboardingProfile({ ...profile, equipment: [] })).toBe(false);
    expect(isOnboardingProfile({ ...profile, age: 12 })).toBe(false);
    expect(isOnboardingProfile({ ...profile, primaryGoal: 'diagnose-me' })).toBe(false);
  });

  it('turns onboarding answers into engine inputs', () => {
    expect(goalsFromOnboarding(profile)).toEqual({ primary: 'muscle-gain', weeklyTrainingTarget: 4 });
    expect(userProfileFromOnboarding(profile, 'athlete-1')).toEqual({
      id: 'athlete-1',
      age: 42,
      sex: 'female',
      heightCm: 168,
      weightKg: 68,
    });
    expect(trainingPreferencesFromOnboarding(profile)).toEqual({
      equipment: ['dumbbells', 'bands'],
      constraints: ['elbow-sensitive'],
      preferredSessionMinutes: 45,
    });
  });

  it('uses a balanced starting goal when the user asks Forge to help choose', () => {
    expect(goalsFromOnboarding({ ...profile, primaryGoal: 'help-me-choose' }).primary).toBe('recomposition');
  });
});
