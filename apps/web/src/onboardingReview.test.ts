import { describe, expect, it } from 'vitest';
import { buildOnboardingReview, type OnboardingAnswers, weeklyStructureFor } from './onboardingReview.js';

const answers: OnboardingAnswers = {
  version: 1,
  primaryGoal: 'build-muscle-strength',
  experience: 'some-experience',
  weeklyTrainingDays: 4,
  sessionMinutes: 45,
  location: 'both',
  equipment: ['bodyweight', 'dumbbells'],
  constraints: ['lower-back-sensitive'],
  nutritionApproach: 'simple-guidance',
  age: 36,
  sex: 'unspecified',
  heightCm: 175,
  weightKg: 78,
};

describe('onboarding plan review', () => {
  it('turns stored answers into a plain-language review without adding questions', () => {
    const review = buildOnboardingReview(answers);
    expect(review.summary).toEqual([
      { label: 'Primary goal', value: 'Build muscle + strength' },
      { label: 'Training rhythm', value: '4 days/week · 45 minutes' },
      { label: 'Experience', value: 'Some training experience' },
      { label: 'Training setup', value: 'Home + gym · Bodyweight, Dumbbells' },
      { label: 'Movement considerations', value: 'Lower-back sensitive' },
      { label: 'Nutrition support', value: 'Simple guidance' },
      { label: 'Starting baseline', value: '36 years · 175 cm · 78 kg' },
    ]);
  });

  it('states what Forge may adapt and which choices remain user-controlled', () => {
    const review = buildOnboardingReview(answers);
    expect(review.forgeCanAdapt).toContain('intensity, exercise selection, and recovery work');
    expect(review.userApprovalRequired).toContain('will not silently change');
    expect(review.userApprovalRequired).toContain('primary goal');
  });

  it('keeps weekly examples simple across supported training frequencies', () => {
    expect(weeklyStructureFor(2)).toContain('2 full-body');
    expect(weeklyStructureFor(3)).toContain('3 alternating');
    expect(weeklyStructureFor(4)).toContain('upper- and lower-body');
    expect(weeklyStructureFor(6)).toContain('6 adaptive training days');
  });

  it('makes an empty considerations list explicit', () => {
    const review = buildOnboardingReview({ ...answers, constraints: [] });
    expect(review.summary).toContainEqual({
      label: 'Movement considerations',
      value: 'No movement considerations selected',
    });
  });
});
