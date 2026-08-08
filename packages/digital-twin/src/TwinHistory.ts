import type { DailySnapshot } from './types.js';

export function sortSnapshots(snapshots: DailySnapshot[]): DailySnapshot[] {
  return [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
}

export function latestSnapshots(snapshots: DailySnapshot[], days: number): DailySnapshot[] {
  return sortSnapshots(snapshots).slice(-days);
}
