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
      history: [{ date: '2026-08-10', sleepScore: 40, soreness: 7, stress: 7 }],
    });
    let saved: typeof twin | undefined;
    const repository: CoachRepository = {
      loadTwin: async () => twin,
      saveTwin: async (value) => { saved = value; },
    };

    const result = await new PersistentCoachService(repository).evaluateToday('u1');
    expect(saved?.decisionTimeline).toHaveLength(result.newDecisionCount);
  });
});
