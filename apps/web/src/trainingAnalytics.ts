import type { TrainingSessionRecord } from './volumeLedger.js';

export interface TrainingWeekSummary {
  startDate: string;
  label: string;
  sessions: number;
  minutes: number;
}

export interface TrainingTrendSummary {
  sessions: number;
  minutes: number;
  averageEffort?: number;
  feedbackCoverage: number;
  discomfortSessions: number;
  qualityCoverage: number;
  controlledQualityPct?: number;
  progressionHoldSessions: number;
  activeWeeks: number;
  weeks: TrainingWeekSummary[];
}

const DAY_MS = 86_400_000;

export function trainingTrendSummary(records: TrainingSessionRecord[], asOfDate: string): TrainingTrendSummary {
  const anchor = new Date(`${asOfDate}T12:00:00Z`);
  const currentMonday = new Date(anchor);
  currentMonday.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7));
  const weeks = Array.from({ length: 4 }, (_, index) => {
    const start = new Date(currentMonday.getTime() - (3 - index) * 7 * DAY_MS);
    const end = new Date(start.getTime() + 7 * DAY_MS);
    const matching = records.filter((record) => {
      const time = Date.parse(`${record.date}T12:00:00Z`);
      return time >= start.getTime() && time < end.getTime() && time <= anchor.getTime();
    });
    return {
      startDate: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      sessions: matching.length,
      minutes: matching.reduce((total, record) => total + record.durationMinutes, 0),
    };
  });
  const windowStart = Date.parse(`${weeks[0]!.startDate}T00:00:00Z`);
  const recent = records.filter((record) => {
    const time = Date.parse(`${record.date}T12:00:00Z`);
    return time >= windowStart && time <= anchor.getTime();
  });
  const efforts = recent.map((record) => record.perceivedExertion).filter((value): value is number => value !== undefined);
  const qualityRated = recent.filter((record) => record.movementQuality !== undefined);
  const controlled = qualityRated.filter((record) => record.movementQuality === 'controlled').length;
  return {
    sessions: recent.length,
    minutes: recent.reduce((total, record) => total + record.durationMinutes, 0),
    ...(efforts.length ? { averageEffort: Math.round(efforts.reduce((total, value) => total + value, 0) / efforts.length * 10) / 10 } : {}),
    feedbackCoverage: recent.length ? Math.round(efforts.length / recent.length * 100) : 0,
    discomfortSessions: recent.filter((record) => record.discomfort === 'mild' || record.discomfort === 'stopped').length,
    qualityCoverage: recent.length ? Math.round(qualityRated.length / recent.length * 100) : 0,
    ...(qualityRated.length ? { controlledQualityPct: Math.round(controlled / qualityRated.length * 100) } : {}),
    progressionHoldSessions: qualityRated.length - controlled,
    activeWeeks: weeks.filter((week) => week.sessions > 0).length,
    weeks,
  };
}
