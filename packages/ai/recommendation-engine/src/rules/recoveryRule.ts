import { createId } from '@forge/shared';
import type { DigitalTwin, Recommendation } from '@forge/digital-twin';

export function recoveryRule(twin: DigitalTwin, now: string): Recommendation | undefined {
  const score = twin.recovery.readiness;
  if (score >= 70) return undefined;

  const veryLow = score < 50;
  return {
    id: createId('rec'),
    category: 'recovery',
    title: veryLow ? 'Prioritize recovery today' : 'Reduce training intensity',
    action: veryLow ? 'Choose recovery work or a rest day.' : 'Keep training at moderate intensity and avoid failure work.',
    reason: twin.recovery.rationale.join(' '),
    confidence: veryLow ? 90 : 82,
    evidence: [
      { key: 'readiness', label: 'Readiness', value: score },
      { key: 'sleep', label: 'Sleep score', value: twin.recovery.sleepScore },
      { key: 'soreness', label: 'Soreness score', value: twin.recovery.sorenessScore },
    ],
    createdAt: now,
  };
}
