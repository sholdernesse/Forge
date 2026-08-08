import type { DigitalTwin } from './DigitalTwin.js';
import type { DailySnapshot, DecisionEvent, Goals, Recommendation, UserProfile } from './types.js';
import { sortSnapshots } from './TwinHistory.js';
import { calculateNutritionState } from './services/NutritionService.js';
import { calculateRecovery } from './services/RecoveryService.js';
import { calculateTrainingState } from './services/TrainingLoadService.js';

export interface TwinBuilderInput {
  profile: UserProfile;
  goals: Goals;
  history?: DailySnapshot[];
  recommendations?: Recommendation[];
  decisionTimeline?: DecisionEvent[];
  now?: string;
}

export function buildDigitalTwin(input: TwinBuilderInput): DigitalTwin {
  const history = sortSnapshots(input.history ?? []);

  return {
    version: 1,
    profile: input.profile,
    goals: input.goals,
    history,
    recovery: calculateRecovery(history),
    training: calculateTrainingState(history),
    nutrition: calculateNutritionState(history),
    recommendations: input.recommendations ?? [],
    decisionTimeline: input.decisionTimeline ?? [],
    updatedAt: input.now ?? new Date().toISOString(),
  };
}
