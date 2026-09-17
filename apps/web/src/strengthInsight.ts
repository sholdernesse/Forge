import type { ExercisePerformance } from './progression.js';
import type { TrainingSessionRecord } from './volumeLedger.js';

export interface StrengthInsight {
  status: 'baseline' | 'consistency' | 'quality' | 'progressing' | 'plateau';
  headline: string;
  explanation: string;
  nextStep: string;
  movement?: string;
  evidence: string;
}

const DAY_MS = 86_400_000;

function recentSessions(records: TrainingSessionRecord[], today: string): TrainingSessionRecord[] {
  const end = Date.parse(`${today}T12:00:00Z`);
  const start = end - 27 * DAY_MS;
  return records.filter((record) => {
    const time = Date.parse(`${record.date}T12:00:00Z`);
    return time >= start && time <= end;
  });
}

export function strengthProgressInsight(history: ExercisePerformance[], sessions: TrainingSessionRecord[], weeklyTarget: number, today: string): StrengthInsight {
  if (!history.length) return {
    status: 'baseline',
    headline: 'Build your strength baseline',
    explanation: 'Complete a loaded movement more than once before Forge describes progress.',
    nextStep: 'Log the planned sets with reps, load, and movement quality.',
    evidence: 'No comparable loaded sets yet',
  };

  const recent = recentSessions(sessions, today);
  const expected = Math.max(1, weeklyTarget * 4);
  const adherencePct = Math.min(100, Math.round(recent.length / expected * 100));
  if (recent.length < Math.max(3, Math.ceil(expected * 0.5))) return {
    status: 'consistency',
    headline: 'Consistency comes before plateau analysis',
    explanation: `Forge has ${recent.length} completed session${recent.length === 1 ? '' : 's'} against ${expected} planned across the recent four-week window.`,
    nextStep: 'Repeat the approved schedule before changing exercises, load, or volume.',
    evidence: `${adherencePct}% recent schedule coverage`,
  };

  const byExercise = new Map<string, ExercisePerformance[]>();
  for (const entry of history.filter((item) => item.date <= today)) byExercise.set(entry.exerciseId, [...(byExercise.get(entry.exerciseId) ?? []), entry]);
  const candidates = [...byExercise.values()].map((entries) => {
    const byDate = new Map<string, ExercisePerformance>();
    for (const entry of entries) {
      const current = byDate.get(entry.date);
      if (!current || entry.estimatedOneRepMax > current.estimatedOneRepMax) byDate.set(entry.date, entry);
    }
    return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
  }).sort((left, right) => right.length - left.length);
  const movement = candidates[0] ?? [];
  if (movement.length < 4) return {
    status: 'baseline',
    headline: 'Repeat key movements to reveal a trend',
    explanation: 'Workout consistency is building, but no loaded movement has four comparable exposures yet.',
    nextStep: 'Keep one primary movement consistent long enough to compare it fairly.',
    ...(movement[0] ? { movement: movement[0].exerciseName } : {}),
    evidence: `${movement.length} comparable exposure${movement.length === 1 ? '' : 's'} on the most-repeated movement`,
  };

  const first = movement[0]!;
  const latest = movement.at(-1)!;
  const spanDays = Math.floor((Date.parse(`${latest.date}T12:00:00Z`) - Date.parse(`${first.date}T12:00:00Z`)) / DAY_MS);
  const gainPct = first.estimatedOneRepMax > 0 ? Math.round((latest.estimatedOneRepMax / first.estimatedOneRepMax - 1) * 100) : 0;
  const rated = movement.filter((entry) => entry.movementQuality !== undefined);
  if (rated.length < Math.ceil(movement.length / 2)) return {
    status: 'quality',
    headline: 'Add movement-quality evidence',
    explanation: `${latest.exerciseName} has enough repeated exposure, but too few sessions confirm repeatable range and tempo.`,
    nextStep: 'Rate movement quality after the next matching workouts before changing progression.',
    movement: latest.exerciseName,
    evidence: `${rated.length} of ${movement.length} exposures rated`,
  };
  if (latest.movementQuality === 'mixed' || latest.movementQuality === 'breakdown') return {
    status: 'quality',
    headline: 'Control is the current progression limit',
    explanation: `${latest.exerciseName} was most recently rated ${latest.movementQuality === 'mixed' ? 'mixed' : 'form broke down'}.`,
    nextStep: 'Repeat the same target until range and tempo are controlled.',
    movement: latest.exerciseName,
    evidence: `${movement.length} exposures · latest quality not controlled`,
  };
  if (gainPct > 2) return {
    status: 'progressing',
    headline: 'Strength progress is still moving',
    explanation: `${latest.exerciseName} improved approximately ${gainPct}% across ${movement.length} comparable exposures.`,
    nextStep: 'Continue the current progression while movement quality remains controlled.',
    movement: latest.exerciseName,
    evidence: `${gainPct > 0 ? '+' : ''}${gainPct}% estimated strength · ${spanDays} days`,
  };
  if (spanDays < 21) return {
    status: 'baseline',
    headline: 'The trend needs more time',
    explanation: `${latest.exerciseName} has repeated exposure, but the comparison spans only ${spanDays} days.`,
    nextStep: 'Keep the movement stable through at least three weeks before reviewing a plateau.',
    movement: latest.exerciseName,
    evidence: `${movement.length} exposures · ${spanDays} days`,
  };
  return {
    status: 'plateau',
    headline: `Potential plateau: ${latest.exerciseName}`,
    explanation: `Estimated strength changed ${gainPct}% across ${movement.length} comparable exposures over ${spanDays} days despite sufficient schedule coverage.`,
    nextStep: 'Repeat one controlled exposure, then review recovery or one training variable—not several at once.',
    movement: latest.exerciseName,
    evidence: `${gainPct}% estimated change · ${adherencePct}% schedule coverage`,
  };
}
