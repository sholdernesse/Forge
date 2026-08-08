import type { DigitalTwin } from '@forge/digital-twin';
import { RecommendationEngine } from '@forge/recommendation-engine';
import type { CoachAnswer, TodayBrief } from './types.js';

export class CoachService {
  constructor(private readonly engine = new RecommendationEngine()) {}

  getToday(twin: DigitalTwin): TodayBrief {
    const recommendations = this.engine.generate(twin);
    const top = recommendations[0];
    return {
      readiness: twin.recovery.readiness,
      headline: top?.title ?? 'Stay the course',
      recommendations,
    };
  }

  getWorkout(twin: DigitalTwin) {
    return this.engine.generate(twin).filter((r) => r.category === 'training' || r.category === 'recovery');
  }

  getNutrition(twin: DigitalTwin) {
    return this.engine.generate(twin).filter((r) => r.category === 'nutrition');
  }

  getRecovery(twin: DigitalTwin) {
    return { state: twin.recovery, recommendations: this.engine.generate(twin).filter((r) => r.category === 'recovery' || r.category === 'sleep') };
  }

  ask(twin: DigitalTwin, question: string): CoachAnswer {
    const recommendations = this.engine.generate(twin);
    const normalized = question.toLowerCase();
    const relevant = normalized.includes('train') || normalized.includes('workout')
      ? recommendations.filter((r) => r.category === 'training' || r.category === 'recovery')
      : recommendations;

    const answer = relevant.length
      ? `${relevant[0]!.action} ${relevant[0]!.reason}`
      : `Your current readiness is ${twin.recovery.readiness}. No rule-based adjustment is required right now.`;

    return { answer, recommendationIds: relevant.map((r) => r.id) };
  }
}
