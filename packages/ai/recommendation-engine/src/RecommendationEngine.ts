import type { DigitalTwin, Recommendation } from '@forge/digital-twin';
import type { ISODate } from '@forge/shared';
import { nutritionRule } from './rules/nutritionRule.js';
import { recoveryRule } from './rules/recoveryRule.js';
import { trainingRule } from './rules/trainingRule.js';

export interface RecommendationEngineOptions {
  now?: string;
  asOfDate?: ISODate;
}

export class RecommendationEngine {
  generate(twin: DigitalTwin, options: RecommendationEngineOptions = {}): Recommendation[] {
    const now = options.now ?? new Date().toISOString();
    const asOfDate = options.asOfDate ?? twin.asOfDate;

    return [
      recoveryRule(twin, now),
      trainingRule(twin, now, asOfDate),
      nutritionRule(twin, now),
    ].filter((item): item is Recommendation => Boolean(item));
  }
}
