import type { ISODate } from '@forge/shared';
import type { DailySnapshot, TrainingState } from '../types.js';
import { snapshotsInWindow } from '../TwinHistory.js';

export function calculateTrainingState(history: DailySnapshot[], asOfDate: ISODate): TrainingState {
  const week = snapshotsInWindow(history, 7, asOfDate);
  const sessions = week.filter((s) => (s.trainingMinutes ?? 0) > 0);
  const sevenDayLoad = sessions.reduce((sum, s) => sum + (s.trainingMinutes ?? 0) * (s.trainingRpe ?? 5), 0);
  const minutesLast7Days = sessions.reduce((sum, s) => sum + (s.trainingMinutes ?? 0), 0);
  const lastTrainingDate = sessions.at(-1)?.date;

  return {
    sevenDayLoad: Math.round(sevenDayLoad),
    sessionsLast7Days: sessions.length,
    minutesLast7Days,
    ...(lastTrainingDate ? { lastTrainingDate } : {}),
  };
}
