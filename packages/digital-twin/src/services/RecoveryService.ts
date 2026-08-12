import { clamp, type ISODate } from '@forge/shared';
import type { DailySnapshot, RecoveryState } from '../types.js';
import { snapshotsInWindow } from '../TwinHistory.js';

function avg(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateRecovery(history: DailySnapshot[], asOfDate: ISODate): RecoveryState {
  const recent = snapshotsInWindow(history, 3, asOfDate);
  const sleepValues = recent.flatMap((s) => s.sleepScore == null ? [] : [s.sleepScore]);
  const sorenessValues = recent.flatMap((s) => s.soreness == null ? [] : [s.soreness]);
  const stressValues = recent.flatMap((s) => s.stress == null ? [] : [s.stress]);
  const availableSignals = Number(sleepValues.length > 0) + Number(sorenessValues.length > 0) + Number(stressValues.length > 0);
  const dataCompleteness = Math.round((availableSignals / 3) * 100);

  if (availableSignals < 2) {
    return {
      readiness: 0,
      sleepScore: Math.round(avg(sleepValues) ?? 0),
      sorenessScore: Math.round(clamp(100 - (avg(sorenessValues) ?? 10) * 10)),
      stressScore: Math.round(clamp(100 - (avg(stressValues) ?? 10) * 10)),
      rationale: ['Not enough recent recovery data is available to calculate readiness safely.'],
      status: 'insufficient-data',
      dataCompleteness,
      ...(recent.at(-1)?.date ? { latestSignalDate: recent.at(-1)!.date } : {}),
    };
  }

  const sleep = avg(sleepValues) ?? 0;
  const sorenessRaw = avg(sorenessValues) ?? 10;
  const stressRaw = avg(stressValues) ?? 10;

  const sorenessScore = clamp(100 - sorenessRaw * 10);
  const stressScore = clamp(100 - stressRaw * 10);
  const readiness = Math.round(clamp(sleep * 0.45 + sorenessScore * 0.3 + stressScore * 0.25));

  const rationale: string[] = [];
  if (sleep < 65) rationale.push('Recent sleep quality is below target.');
  if (sorenessScore < 60) rationale.push('Reported soreness is elevated.');
  if (stressScore < 60) rationale.push('Reported stress is elevated.');
  if (!rationale.length) rationale.push('Sleep, soreness, and stress are within a workable range.');

  return {
    readiness,
    sleepScore: Math.round(sleep),
    sorenessScore: Math.round(sorenessScore),
    stressScore: Math.round(stressScore),
    rationale,
    status: availableSignals === 3 ? 'sufficient' : 'partial',
    dataCompleteness,
    ...(recent.at(-1)?.date ? { latestSignalDate: recent.at(-1)!.date } : {}),
  };
}
