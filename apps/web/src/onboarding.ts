import type { Goals, PrimaryGoal, Sex, UserProfile } from '@forge/digital-twin';
import type { TrainingPreferences } from './trainingPlanner.js';

export type JourneyGoal =
  | 'build-muscle-strength'
  | 'lose-fat-body-composition'
  | 'endurance-conditioning'
  | 'healthier-more-energy'
  | 'return-to-consistency'
  | 'maintain-performance'
  | 'help-me-choose';
export type ExperienceLevel = 'new' | 'some-experience' | 'experienced';
export type TrainingLocation = 'home' | 'gym' | 'both';
export type NutritionApproach = 'simple-guidance' | 'track-macros' | 'not-now';
export type TrainingBlockApproach = 'foundation' | 'progress' | 'repeat';

export interface TrainingBlockState {
  number: number;
  startedAt: string;
  approach: TrainingBlockApproach;
}

export interface OnboardingProfile {
  version: 1;
  completedAt: string;
  primaryGoal: JourneyGoal;
  experience: ExperienceLevel;
  weeklyTrainingDays: number;
  sessionMinutes: number;
  location: TrainingLocation;
  equipment: TrainingPreferences['equipment'];
  constraints: TrainingPreferences['constraints'];
  nutritionApproach: NutritionApproach;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  trainingBlock?: TrainingBlockState;
}

const goals: JourneyGoal[] = ['build-muscle-strength', 'lose-fat-body-composition', 'endurance-conditioning', 'healthier-more-energy', 'return-to-consistency', 'maintain-performance', 'help-me-choose'];
const experiences: ExperienceLevel[] = ['new', 'some-experience', 'experienced'];
const locations: TrainingLocation[] = ['home', 'gym', 'both'];
const nutritionApproaches: NutritionApproach[] = ['simple-guidance', 'track-macros', 'not-now'];
const equipment: TrainingPreferences['equipment'] = ['bodyweight', 'barbell', 'dumbbells', 'bands', 'rack', 'treadmill'];
const constraints: TrainingPreferences['constraints'] = ['lower-back-sensitive', 'elbow-sensitive'];
const trainingBlockApproaches: TrainingBlockApproach[] = ['foundation', 'progress', 'repeat'];

function oneOf<T extends string>(value: unknown, accepted: readonly T[]): value is T {
  return typeof value === 'string' && accepted.includes(value as T);
}

function bounded(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isTrainingBlockState(value: unknown): value is TrainingBlockState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TrainingBlockState>;
  return Number.isInteger(candidate.number) && bounded(candidate.number, 1, 100)
    && typeof candidate.startedAt === 'string'
    && !Number.isNaN(Date.parse(candidate.startedAt))
    && oneOf(candidate.approach, trainingBlockApproaches);
}

export function isOnboardingProfile(value: unknown): value is OnboardingProfile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<OnboardingProfile>;
  return candidate.version === 1
    && typeof candidate.completedAt === 'string'
    && !Number.isNaN(Date.parse(candidate.completedAt))
    && oneOf(candidate.primaryGoal, goals)
    && oneOf(candidate.experience, experiences)
    && bounded(candidate.weeklyTrainingDays, 2, 7)
    && bounded(candidate.sessionMinutes, 20, 120)
    && oneOf(candidate.location, locations)
    && Array.isArray(candidate.equipment)
    && candidate.equipment.length > 0
    && candidate.equipment.every((item) => oneOf(item, equipment))
    && Array.isArray(candidate.constraints)
    && candidate.constraints.every((item) => oneOf(item, constraints))
    && oneOf(candidate.nutritionApproach, nutritionApproaches)
    && bounded(candidate.age, 18, 100)
    && oneOf(candidate.sex, ['female', 'male', 'intersex', 'unspecified'])
    && bounded(candidate.heightCm, 120, 230)
    && bounded(candidate.weightKg, 30, 300)
    && (candidate.trainingBlock === undefined || isTrainingBlockState(candidate.trainingBlock));
}

export function primaryGoalFor(goal: JourneyGoal): PrimaryGoal {
  if (goal === 'build-muscle-strength') return 'muscle-gain';
  if (goal === 'lose-fat-body-composition') return 'fat-loss';
  if (goal === 'endurance-conditioning') return 'performance';
  if (goal === 'maintain-performance') return 'maintenance';
  return goal === 'help-me-choose' ? 'recomposition' : 'maintenance';
}

export function goalsFromOnboarding(profile: OnboardingProfile): Goals {
  return { primary: primaryGoalFor(profile.primaryGoal), weeklyTrainingTarget: profile.weeklyTrainingDays };
}

export function userProfileFromOnboarding(profile: OnboardingProfile, id: string): UserProfile {
  return { id, age: profile.age, sex: profile.sex, heightCm: profile.heightCm, weightKg: profile.weightKg };
}

export function trainingPreferencesFromOnboarding(profile: OnboardingProfile): TrainingPreferences {
  return {
    equipment: profile.equipment,
    constraints: profile.constraints,
    preferredSessionMinutes: profile.sessionMinutes,
  };
}
