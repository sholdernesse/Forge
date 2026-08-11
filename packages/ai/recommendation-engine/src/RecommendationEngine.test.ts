import { describe, expect, it } from 'vitest';
import { buildDigitalTwin } from '@forge/digital-twin';
import { RecommendationEngine } from './RecommendationEngine.js';

const profile = { id: 'u1', sex: 'unspecified' as const };
const goals = { primary: 'performance' as const, weeklyTrainingTarget: 4 };

describe('RecommendationEngine', () => {
  it('recommends reduced intensity when recovery is low', () => {
    const twin = buildDigitalTwin({
      profile,
      goals,
      now: '2026-08-08T12:00:00Z',
      history: [
        { date: '2026-08-08', sleepScore: 40, soreness: 7, stress: 7 },
      ],
    });

    const recommendations = new RecommendationEngine().generate(twin, { now: '2026-08-08T12:00:00Z' });
    expect(recommendations.some((r) => r.category === 'recovery')).toBe(true);
  });

  it('offers a training opportunity when readiness is good and weekly target is unmet', () => {
    const twin = buildDigitalTwin({
      profile,
      goals,
      now: '2026-08-08T12:00:00Z',
      history: [
        { date: '2026-08-07', sleepScore: 90, soreness: 2, stress: 2, trainingMinutes: 45, trainingRpe: 7 },
      ],
    });

    const recommendations = new RecommendationEngine().generate(twin, { now: '2026-08-08T12:00:00Z' });
    expect(recommendations.some((r) => r.category === 'training')).toBe(true);
  });
});
