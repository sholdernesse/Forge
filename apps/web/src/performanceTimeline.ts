import type { DailySnapshot, PrimaryGoal } from '@forge/digital-twin';
import type { TrainingSessionRecord } from './volumeLedger.js';

export interface WeightProgressStory {
  measurements: number[];
  latest?: number;
  change?: number;
  headline: string;
  summary: string;
  trajectory: string;
}

export interface PerformanceTimelineEntry {
  date: string;
  title: string;
  detail: string;
  signals: string[];
  tone: 'training' | 'recovery' | 'nutrition';
}

const goalLabels: Record<PrimaryGoal, string> = {
  'fat-loss': 'fat-loss direction',
  'muscle-gain': 'muscle-building direction',
  recomposition: 'recomposition direction',
  performance: 'performance direction',
  maintenance: 'maintenance direction',
};

export function weightProgressStory(history: DailySnapshot[], goal: PrimaryGoal, today: string): WeightProgressStory {
  const measurements = history
    .filter((day) => day.date <= today && typeof day.weightKg === 'number' && Number.isFinite(day.weightKg))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-7)
    .map((day) => day.weightKg!);
  const latest = measurements.at(-1);
  if (measurements.length < 2 || latest === undefined) return {
    measurements,
    ...(latest === undefined ? {} : { latest }),
    headline: 'Weight trend needs more check-ins',
    summary: 'Add another weight check-in before Forge describes a direction.',
    trajectory: 'Not enough data',
  };
  const change = Math.round((latest - measurements[0]!) * 10) / 10;
  const direction = Math.abs(change) < 0.2 ? 'holding steady' : change < 0 ? `down ${Math.abs(change).toFixed(1)} kg` : `up ${change.toFixed(1)} kg`;
  return {
    measurements,
    latest,
    change,
    headline: Math.abs(change) < 0.2 ? 'Weight is holding steady' : `Weight is trending ${change < 0 ? 'down' : 'up'}`,
    summary: `${direction[0]!.toUpperCase() + direction.slice(1)} across ${measurements.length} recorded check-ins.`,
    trajectory: `Review against your ${goalLabels[goal]}`,
  };
}

export function performanceTimeline(history: DailySnapshot[], sessions: TrainingSessionRecord[], today: string, limit = 5): PerformanceTimelineEntry[] {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit must be a positive integer.');
  const days = new Map<string, DailySnapshot>(history.filter((day) => day.date <= today).map((day) => [day.date, day]));
  const records = sessions.filter((session) => session.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  const entries: PerformanceTimelineEntry[] = records.map((session) => {
    const day = days.get(session.date);
    const signals = [
      `${session.durationMinutes} min`,
      ...(session.movementQuality ? [session.movementQuality === 'controlled' ? 'Controlled movement' : session.movementQuality === 'mixed' ? 'Mixed movement quality' : 'Form broke down'] : []),
      ...(typeof day?.proteinG === 'number' ? [`${Math.round(day.proteinG)}g protein`] : []),
      ...(typeof day?.sleepHours === 'number' ? [`${day.sleepHours}h sleep`] : []),
    ];
    return {
      date: session.date,
      title: `${session.title} completed`,
      detail: session.discomfort === 'stopped' ? 'The session stopped for discomfort; later progression should remain conservative.' : session.discomfort === 'mild' ? 'Mild discomfort was recorded with this session.' : 'Training evidence was added to the current block.',
      signals,
      tone: session.discomfort && session.discomfort !== 'none' ? 'recovery' : 'training',
    };
  });

  const sessionDates = new Set(records.map((session) => session.date));
  for (const day of [...days.values()].sort((a, b) => b.date.localeCompare(a.date))) {
    if (sessionDates.has(day.date)) continue;
    if (day.mindScore !== undefined && day.bodyScore !== undefined && day.soulScore !== undefined) entries.push({
      date: day.date,
      title: 'Whole-self reflection saved',
      detail: 'Mind, body, and soul context was recorded without treating it as a diagnosis.',
      signals: [`Mind ${day.mindScore}/10`, `Body ${day.bodyScore}/10`, `Soul ${day.soulScore}/10`],
      tone: 'recovery',
    });
    else if (day.caloriesKcal !== undefined || day.proteinG !== undefined) entries.push({
      date: day.date,
      title: 'Nutrition day logged',
      detail: 'Logged intake adds context for later adherence and adjustment reviews.',
      signals: [...(day.caloriesKcal === undefined ? [] : [`${Math.round(day.caloriesKcal)} kcal`]), ...(day.proteinG === undefined ? [] : [`${Math.round(day.proteinG)}g protein`])],
      tone: 'nutrition',
    });
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
