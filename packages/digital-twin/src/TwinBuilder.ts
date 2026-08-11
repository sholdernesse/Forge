import type { DigitalTwin } from './DigitalTwin.js';
import type { ISODate } from '@forge/shared';
import type { DailySnapshot, DecisionEvent, Goals, Recommendation, UserProfile } from './types.js';
import { normalizeSnapshots } from './TwinHistory.js';
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
  asOfDate?: ISODate;
}

export function buildDigitalTwin(input: TwinBuilderInput): DigitalTwin {
  const now = input.now ?? new Date().toISOString();
  const asOfDate = input.asOfDate ?? now.slice(0, 10) as ISODate;
  const history = normalizeSnapshots(input.history ?? []);

  return {
    version: 1,
    profile: input.profile,
    goals: input.goals,
    history,
    recovery: calculateRecovery(history, asOfDate),
    training: calculateTrainingState(history, asOfDate),
    nutrition: calculateNutritionState(history, asOfDate),
    recommendations: input.recommendations ?? [],
    decisionTimeline: input.decisionTimeline ?? [],
    updatedAt: now,
  };
}
