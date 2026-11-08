import { describe, expect, it } from 'vitest';
import { todayCoachAction } from './todayCoachAction.js';
import type { Recommendation } from '@forge/digital-twin';

function recommendation(category: Recommendation['category']): Recommendation {
  return {
    id: 'priority',
    category,
    title: 'Today’s priority',
    reason: 'Based on current signals.',
    action: 'Take the next step.',
    evidence: [],
    confidence: 82,
    createdAt: '2026-08-12T11:30:00.000Z',
  };
}

describe('today coach action', () => {
  it('routes nutrition and recovery priorities to their direct action', () => {
    expect(todayCoachAction(recommendation('nutrition'), 'not-started')).toEqual({
      action: 'open-nutrition',
      label: 'Log today’s nutrition',
    });
    expect(todayCoachAction(recommendation('recovery'), 'not-started')).toEqual({
      action: 'open-check-in',
      label: 'Update recovery signals',
    });
  });

  it('uses the workout state for a training priority', () => {
    expect(todayCoachAction(recommendation('training'), 'not-started').label).toBe('Start today’s workout');
    expect(todayCoachAction(recommendation('training'), 'in-progress').label).toBe('Resume today’s workout');
    expect(todayCoachAction(recommendation('training'), 'completed').label).toBe('Review today’s workout');
  });

  it('defaults to the workout when no adjustment is required', () => {
    expect(todayCoachAction(undefined, 'not-started')).toEqual({
      action: 'open-workout',
      label: 'Start today’s workout',
    });
  });
});
