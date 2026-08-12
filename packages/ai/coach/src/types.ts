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

export interface CoachAnswer {
  answer: string;
  recommendationIds: string[];
}
