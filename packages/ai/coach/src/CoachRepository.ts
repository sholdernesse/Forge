import type { DigitalTwin } from '@forge/digital-twin';
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
  ) {}

  async evaluateToday(userId: string, now?: string): Promise<CoachingEvaluation> {
    const twin = await this.repository.loadTwin(userId);
    if (!twin) throw new Error(`Digital Twin not found for user ${userId}.`);
    const evaluation = this.coach.evaluateToday(twin, now ?? twin.updatedAt);
    await this.repository.saveTwin(evaluation.twin);
    return evaluation;
  }
}
