import { clamp } from '@forge/shared';
import type { DailySnapshot, RecoveryState } from '../types.js';
import { latestSnapshots } from '../TwinHistory.js';

function avg(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateRecovery(history: DailySnapshot[]): RecoveryState {
  const recent = latestSnapshots(history, 3);
  const sleep = avg(recent.flatMap((s) => s.sleepScore == null ? [] : [s.sleepScore])) ?? 70;
  const sorenessRaw = avg(recent.flatMap((s) => s.soreness == null ? [] : [s.soreness])) ?? 3;
  const stressRaw = avg(recent.flatMap((s) => s.stress == null ? [] : [s.stress])) ?? 3;

  const sorenessScore = clamp(100 - sorenessRaw * 10);
  const stressScore = clamp(100 - stressRaw * 10);
  const readiness = Math.round(clamp(sleep * 0.45 + sorenessScore * 0.3 + stressScore * 0.25));

  const rationale: string[] = [];
  if (sleep < 65) rationale.push('Recent sleep quality is below target.');
  if (sorenessScore < 60) rationale.push('Reported soreness is elevated.');
  if (stressScore < 60) rationale.push('Reported stress is elevated.');
  if (!rationale.length) rationale.push('Sleep, soreness, and stress are within a workable range.');

  return { readiness, sleepScore: Math.round(sleep), sorenessScore: Math.round(sorenessScore), stressScore: Math.round(stressScore), rationale };
}
