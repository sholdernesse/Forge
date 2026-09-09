import type { OnboardingProfile } from './onboarding.js';

export type OnboardingAnswers = Omit<OnboardingProfile, 'completedAt'>;

export interface OnboardingPlanReview {
  summary: Array<{ label: string; value: string }>;
  weeklyStructure: string;
  forgeCanAdapt: string;
  userApprovalRequired: string;
}

const goalLabels: Record<OnboardingProfile['primaryGoal'], string> = {
  'build-muscle-strength': 'Build muscle + strength',
  'lose-fat-body-composition': 'Lose fat + change body composition',
  'endurance-conditioning': 'Improve endurance + conditioning',
  'healthier-more-energy': 'Feel healthier + more energetic',
  'return-to-consistency': 'Return to consistency',
  'maintain-performance': 'Maintain performance',
  'help-me-choose': 'Balanced foundation',
};

const experienceLabels: Record<OnboardingProfile['experience'], string> = {
  new: 'New to structured training',
  'some-experience': 'Some training experience',
  experienced: 'Experienced',
};

const locationLabels: Record<OnboardingProfile['location'], string> = {
  home: 'Home',
  gym: 'Gym',
  both: 'Home + gym',
};

const equipmentLabels: Record<OnboardingProfile['equipment'][number], string> = {
  bodyweight: 'Bodyweight',
  barbell: 'Barbell',
  dumbbells: 'Dumbbells',
  bands: 'Bands',
  rack: 'Rack',
  treadmill: 'Treadmill',
};

const constraintLabels: Record<OnboardingProfile['constraints'][number], string> = {
  'lower-back-sensitive': 'Lower-back sensitive',
  'elbow-sensitive': 'Elbow sensitive',
};

const nutritionLabels: Record<OnboardingProfile['nutritionApproach'], string> = {
  'simple-guidance': 'Simple guidance',
  'track-macros': 'Calories + macros',
  'not-now': 'Not right now',
};

export function weeklyStructureFor(days: number): string {
  if (days === 2) return '2 full-body strength sessions with recovery between them.';
  if (days === 3) return '3 alternating strength sessions, balanced with recovery days.';
  if (days === 4) return '4 alternating upper- and lower-body strength sessions.';
  return `${days} adaptive training days, with recovery work replacing intensity when your signals call for it.`;
}

export function buildOnboardingReview(answers: OnboardingAnswers): OnboardingPlanReview {
  const considerations = answers.constraints.length > 0
    ? answers.constraints.map((item) => constraintLabels[item]).join(', ')
    : 'No movement considerations selected';

  return {
    summary: [
      { label: 'Primary goal', value: goalLabels[answers.primaryGoal] },
      { label: 'Training rhythm', value: `${answers.weeklyTrainingDays} days/week · ${answers.sessionMinutes} minutes` },
      { label: 'Experience', value: experienceLabels[answers.experience] },
      { label: 'Training setup', value: `${locationLabels[answers.location]} · ${answers.equipment.map((item) => equipmentLabels[item]).join(', ')}` },
      { label: 'Movement considerations', value: considerations },
      { label: 'Nutrition support', value: nutritionLabels[answers.nutritionApproach] },
      { label: 'Starting baseline', value: `${answers.age} years · ${answers.heightCm} cm · ${answers.weightKg} kg` },
    ],
    weeklyStructure: weeklyStructureFor(answers.weeklyTrainingDays),
    forgeCanAdapt: 'Forge can adjust today’s intensity, exercise selection, and recovery work using your check-ins and training history.',
    userApprovalRequired: 'Forge will not silently change your primary goal, weekly availability, equipment, or movement considerations. You control those setup choices.',
  };
}
