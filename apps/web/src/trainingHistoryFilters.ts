import type { TrainingSessionRecord } from './volumeLedger.js';

export type TrainingHistoryFilter = 'all' | 'high-effort' | 'discomfort';

export function filterTrainingHistory(
  records: TrainingSessionRecord[],
  filter: TrainingHistoryFilter,
  query: string,
): TrainingSessionRecord[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return records.filter((record) => {
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
