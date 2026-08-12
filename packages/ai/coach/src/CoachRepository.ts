import { buildDigitalTwin, type DigitalTwin } from '@forge/digital-twin';
import type { ISODate } from '@forge/shared';
import type { CoachingEvaluation } from './types.js';
import { CoachService } from './CoachService.js';

/** Persistence implementations must save the twin and its decision timeline atomically. */
export interface CoachRepository {
  loadTwin(userId: string): Promise<DigitalTwin | undefined>;
  saveTwin(twin: DigitalTwin): Promise<void>;
}

export class PersistentCoachService {
  constructor(
    private readonly repository: CoachRepository,
    private readonly coach = new CoachService(),
    private readonly clock = () => new Date().toISOString(),
  ) {}

  async evaluateToday(userId: string, asOfDate: ISODate, now = this.clock()): Promise<CoachingEvaluation> {
    const persisted = await this.repository.loadTwin(userId);
    if (!persisted) throw new Error(`Digital Twin not found for user ${userId}.`);
    const twin = buildDigitalTwin({
      profile: persisted.profile,
      goals: persisted.goals,
      history: persisted.history,
      recommendations: persisted.recommendations,
      decisionTimeline: persisted.decisionTimeline,
      asOfDate,
      now,
    });
    const evaluation = this.coach.evaluateToday(twin, now);
    await this.repository.saveTwin(evaluation.twin);
    return evaluation;
  }
}
