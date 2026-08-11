import { describe, expect, it } from 'vitest';
import type { DigitalTwin } from '@forge/digital-twin';
import { nutritionRule } from './nutritionRule.js';

function makeTwin(overrides: Partial<DigitalTwin> = {}): DigitalTwin {
  return {
    version: 1,
    profile: {
      id: 'user-1',
      sex: 'unspecified',
      weightKg: 90,
    },
    goals: {
      primary: 'recomposition',
    },
    recovery: {
      readiness: 75,
      sleepScore: 80,
      sorenessScore: 20,
      stressScore: 25,
      rationale: [],
      status: 'sufficient',
      dataCompleteness: 100,
    },
    training: {
      sevenDayLoad: 300,
      sessionsLast7Days: 4,
      minutesLast7Days: 240,
    },
    nutrition: {
      calorieAverage7d: 2400,
      proteinAverage7d: 120,
      adherenceDays7d: 6,
      proteinAdherenceDays7d: 6,
    },
    history: [],
    recommendations: [],
    decisionTimeline: [],
    updatedAt: '2026-08-08T12:00:00.000Z',
    ...overrides,
  } as DigitalTwin;
}

describe('nutritionRule', () => {
  it('recommends more protein when the seven-day average is materially below target', () => {
    const recommendation = nutritionRule(makeTwin(), '2026-08-08T12:00:00.000Z');

    expect(recommendation?.category).toBe('nutrition');
    expect(recommendation?.action).toContain('162 g');
    expect(recommendation?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'proteinAverage7d', value: 120 }),
        expect.objectContaining({ key: 'proteinTargetG', value: 162 }),
      ]),
    );
  });

  it('does not recommend a change when protein is already close to target', () => {
    const twin = makeTwin({
      nutrition: {
        calorieAverage7d: 2400,
        proteinAverage7d: 155,
        adherenceDays7d: 6,
        proteinAdherenceDays7d: 6,
      },
    });

    expect(nutritionRule(twin, '2026-08-08T12:00:00.000Z')).toBeUndefined();
  });

  it('waits for enough nutrition history before making a recommendation', () => {
    const twin = makeTwin({
      nutrition: {
        calorieAverage7d: 2400,
        proteinAverage7d: 100,
        adherenceDays7d: 2,
        proteinAdherenceDays7d: 2,
      },
    });

    expect(nutritionRule(twin, '2026-08-08T12:00:00.000Z')).toBeUndefined();
  });
});
