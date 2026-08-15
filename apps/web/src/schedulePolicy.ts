import type { DigitalTwin } from '@forge/digital-twin';
import type { WorkoutSession } from './workoutSession.js';
import type { TrainingSessionRecord } from './volumeLedger.js';

export type ScheduleIntent = 'adaptive' | 'train' | 'rest';
export type ScheduleOverrides = Record<string, ScheduleIntent>;

export interface DeloadAssessment {
  active: boolean;
  fatigueScore: number;
  reasons: string[];
  volumeMultiplier: number;
  loadMultiplier: number;
}

export interface TrainingFeedbackAssessment {
  action: 'none' | 'deload' | 'recovery';
  reasons: string[];
}

export function assessTrainingFeedback(records: TrainingSessionRecord[], asOfDate: string): TrainingFeedbackAssessment {
  const cutoff = Date.parse(`${asOfDate}T00:00:00Z`);
  const start = cutoff - 3 * 86_400_000;
  const recent = records.filter((record) => {
    const date = Date.parse(`${record.date}T00:00:00Z`);
    return date >= start && date < cutoff;
  });
  if (recent.some((record) => record.discomfort === 'stopped')) {
    return { action: 'recovery', reasons: ['A recent session was stopped because of discomfort.'] };
  }
  const reasons: string[] = [];
  if (recent.some((record) => record.discomfort === 'mild')) reasons.push('A recent session included mild discomfort.');
  if (recent.some((record) => (record.perceivedExertion ?? 0) >= 9)) reasons.push('A recent session felt near-maximal.');
  return { action: reasons.length ? 'deload' : 'none', reasons };
}

export function assessDeload(twin: DigitalTwin): DeloadAssessment {
  const recent = twin.history.slice(-3);
  const average = (values: Array<number | undefined>) => {
    const present = values.filter((value): value is number => value !== undefined);
    return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : 0;
  };
  const reasons: string[] = [];
  let fatigueScore = 0;
  if (twin.recovery.readiness < 68) { fatigueScore += 2; reasons.push(`Readiness is ${twin.recovery.readiness}.`); }
  if (average(recent.map((day) => day.soreness)) >= 6) { fatigueScore += 1; reasons.push('Soreness has stayed elevated.'); }
  if (average(recent.map((day) => day.sleepScore)) > 0 && average(recent.map((day) => day.sleepScore)) < 65) { fatigueScore += 1; reasons.push('Recent sleep quality is below baseline.'); }
  if (average(recent.map((day) => day.stress)) >= 6) { fatigueScore += 1; reasons.push('Stress load has remained high.'); }
  const active = fatigueScore >= 2;
  return { active, fatigueScore, reasons, volumeMultiplier: active ? 0.65 : 1, loadMultiplier: active ? 0.9 : 1 };
}

export function applyDeload(session: WorkoutSession, assessment: DeloadAssessment): WorkoutSession {
  if (!assessment.active || session.planType === 'recovery') return session;
  return {
    ...session,
    id: `${session.id}-deload`,
    title: `Deload · ${session.title}`,
    intensity: 'low',
    planReason: `${session.planReason ?? ''} Deload applied: ${assessment.reasons.join(' ')}`.trim(),
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.slice(0, Math.max(1, Math.ceil(exercise.sets.length * assessment.volumeMultiplier))).map((set) => ({
        ...set,
        ...(set.loadKg ? { loadKg: Math.round(set.loadKg * assessment.loadMultiplier * 2) / 2 } : {}),
      })),
    })),
  };
}

export function nextScheduleIntent(current: ScheduleIntent | undefined): ScheduleIntent {
  if (!current || current === 'adaptive') return 'train';
  if (current === 'train') return 'rest';
  return 'adaptive';
}
