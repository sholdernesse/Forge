import type { Recommendation } from '@forge/digital-twin';

export interface TodayBrief {
  readiness: number;
  headline: string;
  recommendations: Recommendation[];
}

export interface CoachAnswer {
  answer: string;
  recommendationIds: string[];
}
