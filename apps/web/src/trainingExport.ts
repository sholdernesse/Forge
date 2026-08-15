import type { MuscleGroup, TrainingSessionRecord } from './volumeLedger.js';

const headers = ['Date', 'Workout', 'Duration minutes', 'Perceived effort', 'Discomfort', 'Feedback note', 'Muscle volume', 'Exercises'];

export function trainingHistoryCsv(records: TrainingSessionRecord[]): string {
  const rows = [...records]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((record) => [
      record.date,
      record.title,
      String(record.durationMinutes),
      record.perceivedExertion === undefined ? '' : String(record.perceivedExertion),
      record.discomfort ?? '',
      record.feedbackNote ?? '',
      muscleSummary(record.muscleSets),
      record.exerciseSummaries?.map((exercise) => `${exercise.name} (${exercise.completedSets}/${exercise.totalSets} sets)`).join('; ') ?? '',
    ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function trainingHistoryExportFilename(asOfDate: string): string {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(asOfDate) ? asOfDate : 'export';
  return `forge-training-history-${safeDate}.csv`;
}

function muscleSummary(muscleSets: Partial<Record<MuscleGroup, number>>): string {
  return Object.entries(muscleSets)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([muscle, sets]) => `${muscle}: ${sets}`)
    .join('; ');
}

function csvCell(value: string): string {
  const protectedValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}
