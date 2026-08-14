import { describe, expect, it } from 'vitest';
import { buildDigitalTwin } from '@forge/digital-twin';
import { CoachService } from './CoachService.js';
import { PersistentCoachService, type CoachRepository } from './CoachRepository.js';

describe('CoachService', () => {
  it('does not duplicate the same daily decision', () => {
    const now = '2026-08-10T12:00:00.000Z';
    const twin = buildDigitalTwin({
      profile: { id: 'u1', sex: 'unspecified' },
      goals: { primary: 'performance', weeklyTrainingTarget: 4 },
      now,
      asOfDate: '2026-08-10',
      history: [{ date: '2026-08-10', sleepScore: 40, soreness: 7, stress: 7 }],
    });
    const coach = new CoachService();
    const first = coach.evaluateToday(twin, now);
    const second = coach.evaluateToday(first.twin, now);

    expect(first.newDecisionCount).toBeGreaterThan(0);
    expect(second.newDecisionCount).toBe(0);
    expect(second.twin.decisionTimeline).toHaveLength(first.twin.decisionTimeline.length);
  });

  it('asks for data instead of recommending training when recovery is unknown', () => {
    const twin = buildDigitalTwin({
      profile: { id: 'u1', sex: 'unspecified' },
      goals: { primary: 'performance', weeklyTrainingTarget: 4 },
      now: '2026-08-10T12:00:00.000Z',
      asOfDate: '2026-08-10',
    });

    const result = new CoachService().evaluateToday(twin);
    expect(result.brief.recoveryStatus).toBe('insufficient-data');
    expect(result.brief.headline).toContain('recovery data');
    expect(result.brief.recommendations).toHaveLength(0);
  });

  it('persists the evaluated twin through the repository boundary', async () => {
    const twin = buildDigitalTwin({
      profile: { id: 'u1', sex: 'unspecified' },
      goals: { primary: 'performance', weeklyTrainingTarget: 4 },
      now: '2026-08-10T12:00:00.000Z',
      asOfDate: '2026-08-10',
      history: [{ date: '2026-08-10', sleepScore: 40, soreness: 7, stress: 7 }],
    });
    let saved: typeof twin | undefined;
    const repository: CoachRepository = {
      loadTwin: async () => twin,
      saveTwin: async (value) => { saved = value; },
    };

    const result = await new PersistentCoachService(repository).evaluateToday('u1', '2026-08-10');
    expect(saved?.decisionTimeline).toHaveLength(result.newDecisionCount);
  });

  it('advances persisted evaluations and rebuilds stale derived state', async () => {
    const twin = buildDigitalTwin({
      profile: { id: 'u1', sex: 'unspecified' },
      goals: { primary: 'performance', weeklyTrainingTarget: 4 },
      now: '2026-08-01T12:00:00.000Z',
      asOfDate: '2026-08-01',
      history: [{ date: '2026-08-01', sleepScore: 90, soreness: 2, stress: 2 }],
    });
    let saved = twin;
    const repository: CoachRepository = {
      loadTwin: async () => saved,
      saveTwin: async (value) => { saved = value; },
    };

    const result = await new PersistentCoachService(
      repository,
      new CoachService(),
      () => '2026-08-10T12:00:00.000Z',
    ).evaluateToday('u1', '2026-08-10');

    expect(result.twin.updatedAt).toBe('2026-08-10T12:00:00.000Z');
    expect(result.twin.asOfDate).toBe('2026-08-10');
    expect(result.twin.recovery.status).toBe('insufficient-data');
    expect(result.brief.recommendations.some((r) => r.category === 'training')).toBe(false);
  });

  it('grounds nutrition questions only in nutrition recommendations', () => {
    const twin = buildDigitalTwin({
      profile: { id: 'u1', sex: 'unspecified', weightKg: 76 },
      goals: { primary: 'recomposition', weeklyTrainingTarget: 4 },
      now: '2026-08-10T12:00:00.000Z',
      asOfDate: '2026-08-10',
      history: [
        { date: '2026-08-08', sleepScore: 80, soreness: 2, stress: 2, proteinG: 72 },
        { date: '2026-08-09', sleepScore: 82, soreness: 2, stress: 2, proteinG: 70 },
        { date: '2026-08-10', sleepScore: 84, soreness: 2, stress: 2, proteinG: 75 },
      ],
    });

    const coach = new CoachService();
    const answer = coach.ask(twin, 'How is my protein and nutrition today?');
    const recommendations = coach.getNutrition(twin);

    expect(answer.recommendationIds.length).toBeGreaterThan(0);
    expect(answer.recommendationIds.every((id) => recommendations.some((item) => item.id === id))).toBe(true);
  });

  it('does not claim evidence when a requested category has no recommendation', () => {
    const twin = buildDigitalTwin({
      profile: { id: 'u1', sex: 'unspecified' },
      goals: { primary: 'performance', weeklyTrainingTarget: 4 },
      now: '2026-08-10T12:00:00.000Z',
      asOfDate: '2026-08-10',
    });

    const answer = new CoachService().ask(twin, 'What should I eat today?');
    expect(answer.recommendationIds).toHaveLength(0);
    expect(answer.answer).toContain('recovery data');
  });
});
