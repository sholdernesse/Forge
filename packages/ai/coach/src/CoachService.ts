import { appendDecision, recommendationToDecision, type DigitalTwin } from '@forge/digital-twin';
import { RecommendationEngine } from '@forge/recommendation-engine';
import type { CoachAnswer, CoachSuggestedAction, CoachingEvaluation, TodayBrief } from './types.js';

export class CoachService {
  constructor(private readonly engine = new RecommendationEngine()) {}

  getToday(twin: DigitalTwin, now = twin.updatedAt): TodayBrief {
    const recommendations = twin.recommendations.length ? twin.recommendations : this.engine.generate(twin, { now, asOfDate: twin.asOfDate });
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
    const recommendations = this.engine.generate(twin, { now, asOfDate: twin.asOfDate });
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
    const symptomQuestion = /\b(pain|painful|hurt|hurting|injury|injured|sharp|discomfort|pinch|pinching)\b/.test(normalized);
    const nutritionQuestion = normalized.includes('protein') || normalized.includes('calorie') || normalized.includes('food') || normalized.includes('nutrition');
    const recoveryQuestion = normalized.includes('sleep') || normalized.includes('recover') || normalized.includes('sore') || normalized.includes('stress');
    const trainingQuestion = normalized.includes('train') || normalized.includes('workout') || normalized.includes('lift');
    if (symptomQuestion) {
      const safetyEvidence = recommendations.filter((recommendation) => recommendation.category === 'recovery' || recommendation.category === 'sleep');
      return {
        answer: 'I cannot diagnose an injury or use readiness to clear a painful movement. Stop the movement if discomfort is sharp, worsening, persistent, or changes your form. Record the recovery signal, choose a comfortable alternative only if normal movement is pain-free, and seek qualified medical guidance when symptoms are significant or do not settle.',
        basis: 'safety-boundary',
        recommendationIds: safetyEvidence.slice(0, 3).map((recommendation) => recommendation.id),
        suggestedAction: { type: 'open-check-in', label: 'Update recovery signals' },
      };
    }

    const relevant = nutritionQuestion
      ? recommendations.filter((r) => r.category === 'nutrition')
      : recoveryQuestion
        ? recommendations.filter((r) => r.category === 'recovery' || r.category === 'sleep')
        : trainingQuestion
          ? recommendations.filter((r) => r.category === 'training' || r.category === 'recovery')
          : recommendations;

    const answer = relevant.length
      ? `${relevant[0]!.action} ${relevant[0]!.reason}`
      : twin.recovery.status === 'insufficient-data'
        ? 'I need recent recovery data before recommending a training adjustment.'
        : `Your current readiness is ${twin.recovery.readiness}. No rule-based adjustment is required right now.`;

    const suggestedAction: CoachSuggestedAction = twin.recovery.status === 'insufficient-data'
      ? { type: 'open-check-in', label: 'Complete today’s check-in' }
      : nutritionQuestion || relevant[0]?.category === 'nutrition'
        ? { type: 'open-nutrition', label: 'Open food log' }
        : recoveryQuestion || relevant[0]?.category === 'recovery' || relevant[0]?.category === 'sleep'
          ? { type: 'open-check-in', label: 'Update recovery signals' }
          : { type: 'open-workout', label: 'Open today’s workout' };

    const basis = relevant.length
      ? 'recommendations'
      : twin.recovery.status === 'insufficient-data'
        ? 'insufficient-data'
        : 'readiness';

    return { answer, basis, recommendationIds: relevant.slice(0, 3).map((r) => r.id), suggestedAction };
  }
}
