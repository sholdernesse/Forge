import type { ISODate } from '@forge/shared';
import type { DailySnapshot } from './types.js';

const DAY_MS = 86_400_000;

function dateToEpoch(date: ISODate): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError(`Invalid snapshot date: ${date}`);
  const epoch = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== date) {
    throw new RangeError(`Invalid snapshot date: ${date}`);
  }
  return epoch;
}

function assertRange(name: string, value: number | undefined, min: number, max: number): void {
  if (value != null && (!Number.isFinite(value) || value < min || value > max)) {
    throw new RangeError(`${name} must be between ${min} and ${max}.`);
  }
}

export function validateSnapshot(snapshot: DailySnapshot): DailySnapshot {
  dateToEpoch(snapshot.date);
  assertRange('sleepScore', snapshot.sleepScore, 0, 100);
  assertRange('soreness', snapshot.soreness, 0, 10);
  assertRange('stress', snapshot.stress, 0, 10);
  assertRange('trainingRpe', snapshot.trainingRpe, 0, 10);
  assertRange('sleepHours', snapshot.sleepHours, 0, 24);
  assertRange('mindScore', snapshot.mindScore, 1, 10);
  assertRange('bodyScore', snapshot.bodyScore, 1, 10);
  assertRange('soulScore', snapshot.soulScore, 1, 10);
  if (snapshot.reflectionNote != null && snapshot.reflectionNote.length > 280) {
    throw new RangeError('reflectionNote must be 280 characters or fewer.');
  }
  if (snapshot.reflectedAt != null && Number.isNaN(Date.parse(snapshot.reflectedAt))) {
    throw new RangeError('reflectedAt must be a valid date-time.');
  }
  for (const [name, value] of Object.entries(snapshot)) {
    if (name !== 'date' && typeof value === 'number' && value < 0) {
      throw new RangeError(`${name} cannot be negative.`);
    }
  }
  return snapshot;
}

export function normalizeSnapshots(snapshots: DailySnapshot[]): DailySnapshot[] {
  const byDate = new Map<ISODate, DailySnapshot>();
  for (const snapshot of snapshots) {
    validateSnapshot(snapshot);
    byDate.set(snapshot.date, { ...byDate.get(snapshot.date), ...snapshot });
  }
  return sortSnapshots([...byDate.values()]);
}

export function sortSnapshots(snapshots: DailySnapshot[]): DailySnapshot[] {
  return [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
}

export function snapshotsInWindow(snapshots: DailySnapshot[], days: number, asOfDate: ISODate): DailySnapshot[] {
  if (!Number.isInteger(days) || days < 1) throw new RangeError('days must be a positive integer.');
  const end = dateToEpoch(asOfDate);
  const start = end - (days - 1) * DAY_MS;
  return normalizeSnapshots(snapshots).filter((snapshot) => {
    const timestamp = dateToEpoch(snapshot.date);
    return timestamp >= start && timestamp <= end;
  });
}
