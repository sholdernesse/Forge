import type { DigitalTwin, Recommendation } from '@forge/digital-twin';
import { nutritionRule } from './rules/nutritionRule.js';
import { recoveryRule } from './rules/recoveryRule.js';
import { trainingRule } from './rules/trainingRule.js';

export interface RecommendationEngineOptions {
  now?: string;
}

export class RecommendationEngine {
  generate(twin: DigitalTwin, options: RecommendationEngineOptions = {}): Recommendation[] {
    const now = options.now ?? new Date().toISOString();

    return [
      recoveryRule(twin, now),
      trainingRule(twin, now),
      nutritionRule(twin, now),
    ].filter((item): item is Recommendation => Boolean(item));
  }
}
