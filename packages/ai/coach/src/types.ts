import type { DataQualityStatus, DigitalTwin, Recommendation } from '@forge/digital-twin';

export interface TodayBrief {
  readiness: number;
  recoveryStatus: DataQualityStatus;
  headline: string;
  recommendations: Recommendation[];
}

export interface CoachingEvaluation {
  twin: DigitalTwin;
  brief: TodayBrief;
  newDecisionCount: number;
}

export type CoachAnswerBasis = 'recommendations' | 'safety-boundary' | 'insufficient-data' | 'readiness';

export interface CoachAnswer {
  answer: string;
  basis: CoachAnswerBasis;
  recommendationIds: string[];
  suggestedAction: CoachSuggestedAction;
}

export type CoachActionType = 'open-workout' | 'open-nutrition' | 'open-check-in';

export interface CoachSuggestedAction {
  type: CoachActionType;
  label: string;
}
