import type { TrainingSessionRecord } from './volumeLedger.js';

export type TrainingHistoryFilter = 'all' | 'high-effort' | 'discomfort';
export type TrainingHistoryRange = '30-days' | '90-days' | 'all-time';

function isWithinRange(date: string, range: TrainingHistoryRange, asOfDate: string) {
  if (range === 'all-time') return true;
  const days = range === '30-days' ? 30 : 90;
  const asOf = new Date(`${asOfDate}T00:00:00.000Z`);
  const session = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(asOf.getTime()) || Number.isNaN(session.getTime())) return false;
  const earliest = new Date(asOf);
  earliest.setUTCDate(earliest.getUTCDate() - (days - 1));
  return session >= earliest && session <= asOf;
}

export function filterTrainingHistory(
  records: TrainingSessionRecord[],
  filter: TrainingHistoryFilter,
  query: string,
  range: TrainingHistoryRange = 'all-time',
  asOfDate = new Date().toISOString().slice(0, 10),
): TrainingSessionRecord[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return records.filter((record) => {
    if (!isWithinRange(record.date, range, asOfDate)) return false;
    if (filter === 'high-effort' && (record.perceivedExertion ?? 0) < 8) return false;
    if (filter === 'discomfort' && record.discomfort !== 'mild' && record.discomfort !== 'stopped') return false;
    if (!terms.length) return true;
    const searchable = [
      record.title,
      record.feedbackNote ?? '',
      record.discomfort ?? '',
      ...Object.keys(record.muscleSets),
      ...(record.exerciseSummaries?.flatMap((exercise) => [exercise.name, exercise.exerciseId]) ?? []),
    ].join(' ').toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}
