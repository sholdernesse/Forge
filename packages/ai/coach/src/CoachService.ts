import { appendDecision, recommendationToDecision, type DigitalTwin } from '@forge/digital-twin';
import { RecommendationEngine } from '@forge/recommendation-engine';
import type { CoachAnswer, CoachingEvaluation, TodayBrief } from './types.js';

export class CoachService {
  constructor(private readonly engine = new RecommendationEngine()) {}

  getToday(twin: DigitalTwin, now = twin.updatedAt): TodayBrief {
    const recommendations = twin.recommendations.length ? twin.recommendations : this.engine.generate(twin, { now });
    const top = recommendations[0];
    return {
      readiness: twin.recovery.readiness,
      recoveryStatus: twin.recovery.status,
      headline: twin.recovery.status === 'insufficient-data'
        ? 'Add recovery data before adjusting training'
        : top?.title ?? 'Stay the course',
      recommendations,
    };
  }

  evaluateToday(twin: DigitalTwin, now = twin.updatedAt): CoachingEvaluation {
    const recommendations = this.engine.generate(twin, { now });
    const existingIds = new Set(twin.decisionTimeline.map((event) => event.recommendationId));
    const newRecommendations = recommendations.filter((recommendation) => !existingIds.has(recommendation.id));
    const decisionTimeline = newRecommendations.reduce(
      (timeline, recommendation) => appendDecision(timeline, recommendationToDecision(recommendation)),
      twin.decisionTimeline,
    );
    const evaluatedTwin: DigitalTwin = { ...twin, recommendations, decisionTimeline, updatedAt: now };
    return { twin: evaluatedTwin, brief: this.getToday(evaluatedTwin, now), newDecisionCount: newRecommendations.length };
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
      : twin.recovery.status === 'insufficient-data'
        ? 'I need recent recovery data before recommending a training adjustment.'
        : `Your current readiness is ${twin.recovery.readiness}. No rule-based adjustment is required right now.`;

    return { answer, recommendationIds: relevant.map((r) => r.id) };
  }
}
