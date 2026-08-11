import type { DigitalTwin, Recommendation } from '@forge/digital-twin';

export function trainingRule(twin: DigitalTwin, now: string): Recommendation | undefined {
  const target = twin.goals.weeklyTrainingTarget;
  if (twin.recovery.status === 'insufficient-data') return undefined;
  if (!target || twin.recovery.readiness < 60) return undefined;
  if (twin.training.sessionsLast7Days >= target) return undefined;

  return {
    id: `rec_training_${twin.profile.id}_${now.slice(0, 10)}`,
    category: 'training',
    title: 'Training opportunity',
    action: 'Complete a planned training session today if your local soreness is manageable.',
    reason: `You have completed ${twin.training.sessionsLast7Days} of ${target} target sessions in the last seven days and readiness is ${twin.recovery.readiness}.`,
    confidence: Math.round(78 * twin.recovery.dataCompleteness / 100),
    evidence: [
      { key: 'sessions7d', label: 'Sessions in 7 days', value: twin.training.sessionsLast7Days },
      { key: 'target', label: 'Weekly target', value: target },
      { key: 'readiness', label: 'Readiness', value: twin.recovery.readiness },
    ],
    createdAt: now,
  };
}
