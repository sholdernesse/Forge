import type { Confidence, ISODate, ISODateTime } from '@forge/shared';

export type Sex = 'female' | 'male' | 'intersex' | 'unspecified';
export type PrimaryGoal = 'fat-loss' | 'muscle-gain' | 'recomposition' | 'performance' | 'maintenance';
export type RecommendationCategory = 'training' | 'nutrition' | 'recovery' | 'sleep' | 'habit';
export type DataQualityStatus = 'sufficient' | 'partial' | 'insufficient-data';

export interface UserProfile {
  id: string;
  age?: number;
  sex: Sex;
  heightCm?: number;
  weightKg?: number;
  bodyFatPct?: number;
  leanMassKg?: number;
}

export interface Goals {
  primary: PrimaryGoal;
  targetWeightKg?: number;
  targetDate?: ISODate;
  weeklyTrainingTarget?: number;
}

export interface DailySnapshot {
  date: ISODate;
  weightKg?: number;
  bodyFatPct?: number;
  sleepHours?: number;
  sleepScore?: number;
  steps?: number;
  caloriesKcal?: number;
  proteinG?: number;
  waterMl?: number;
  trainingMinutes?: number;
  trainingRpe?: number;
  soreness?: number;
  stress?: number;
  restingHeartRate?: number;
  hrvMs?: number;
}

export interface RecoveryState {
  readiness: number;
  sleepScore: number;
  sorenessScore: number;
  stressScore: number;
  rationale: string[];
  status: DataQualityStatus;
  dataCompleteness: number;
  latestSignalDate?: ISODate;
}

export interface TrainingState {
  sevenDayLoad: number;
  sessionsLast7Days: number;
  minutesLast7Days: number;
  lastTrainingDate?: ISODate;
}

export interface NutritionState {
  calorieAverage7d?: number;
  proteinAverage7d?: number;
  adherenceDays7d: number;
  proteinAdherenceDays7d: number;
}

export interface Evidence {
  key: string;
  label: string;
  value: string | number | boolean;
}

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  action: string;
  reason: string;
  confidence: Confidence;
  evidence: Evidence[];
  createdAt: ISODateTime;
}

export interface DecisionEvent {
  id: string;
  recommendationId: string;
  timestamp: ISODateTime;
  decision: string;
  reason: string;
  evidence: Evidence[];
  confidence: Confidence;
  outcome?: 'accepted' | 'dismissed' | 'completed' | 'unknown';
}
