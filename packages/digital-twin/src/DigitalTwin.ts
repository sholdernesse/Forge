import type { DailySnapshot, DecisionEvent, Goals, NutritionState, RecoveryState, Recommendation, TrainingState, UserProfile } from './types.js';

export interface DigitalTwin {
  version: 1;
  profile: UserProfile;
  goals: Goals;
  recovery: RecoveryState;
  training: TrainingState;
  nutrition: NutritionState;
  history: DailySnapshot[];
  recommendations: Recommendation[];
  decisionTimeline: DecisionEvent[];
  updatedAt: string;
}
