import { createId } from '@forge/shared';
import type { DecisionEvent, Recommendation } from './types.js';

export function recommendationToDecision(recommendation: Recommendation): DecisionEvent {
  return {
    id: createId('decision'),
    recommendationId: recommendation.id,
    timestamp: recommendation.createdAt,
    decision: recommendation.action,
    reason: recommendation.reason,
    evidence: recommendation.evidence,
    confidence: recommendation.confidence,
    outcome: 'unknown',
  };
}

export function appendDecision(timeline: DecisionEvent[], event: DecisionEvent): DecisionEvent[] {
  return [...timeline, event];
}
