import type { MuscleGroup, TrainingSessionRecord } from './volumeLedger.js';

export interface TrainingHistoryEntry {
  workoutId: string;
  date: string;
  dateLabel: string;
  title: string;
  durationLabel: string;
  completedSets: number;
  muscleLabel: string;
  effortLabel?: string;
  discomfortLabel?: string;
  movementQualityLabel?: string;
  movementQuality?: TrainingSessionRecord['movementQuality'];
  tone: 'complete' | 'caution' | 'stopped';
  feedbackNote?: string;
  exercises: Array<{ id: string; name: string; completionLabel: string }>;
  muscleBreakdown: string[];
}

export type TrainingHistorySort = 'newest' | 'oldest' | 'highest-effort' | 'longest';

const muscleNames: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', core: 'Core', cardio: 'Cardio',
};

function compareTrainingRecords(left: TrainingSessionRecord, right: TrainingSessionRecord, sort: TrainingHistorySort) {
  if (sort === 'oldest') return left.date.localeCompare(right.date) || left.workoutId.localeCompare(right.workoutId);
  if (sort === 'highest-effort') {
    const effortDifference = (right.perceivedExertion ?? -1) - (left.perceivedExertion ?? -1);
    return effortDifference || right.date.localeCompare(left.date) || left.workoutId.localeCompare(right.workoutId);
  }
  if (sort === 'longest') {
    return right.durationMinutes - left.durationMinutes || right.date.localeCompare(left.date) || left.workoutId.localeCompare(right.workoutId);
  }
  return right.date.localeCompare(left.date) || left.workoutId.localeCompare(right.workoutId);
}

export function trainingHistoryEntries(records: TrainingSessionRecord[], limit = 6, sort: TrainingHistorySort = 'newest'): TrainingHistoryEntry[] {
  return [...records]
    .sort((left, right) => compareTrainingRecords(left, right, sort))
    .slice(0, Math.max(0, limit))
    .map((record) => {
      const muscles = (Object.entries(record.muscleSets) as Array<[MuscleGroup, number]>)
        .filter(([, sets]) => sets > 0)
        .sort((left, right) => right[1] - left[1]);
      const completedSets = muscles.reduce((total, [, sets]) => total + sets, 0);
      return {
        workoutId: record.workoutId,
        date: record.date,
        dateLabel: new Date(`${record.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        title: record.title,
        durationLabel: `${record.durationMinutes} min`,
        completedSets,
        muscleLabel: muscles.length ? muscles.slice(0, 3).map(([muscle]) => muscleNames[muscle]).join(' · ') : 'Recovery work',
        ...(record.perceivedExertion ? { effortLabel: `Effort ${record.perceivedExertion}/10` } : {}),
        ...(record.discomfort && record.discomfort !== 'none' ? { discomfortLabel: record.discomfort === 'stopped' ? 'Stopped for discomfort' : 'Mild discomfort' } : {}),
        ...(record.movementQuality ? {
          movementQuality: record.movementQuality,
          movementQualityLabel: record.movementQuality === 'controlled' ? 'Controlled movement' : record.movementQuality === 'mixed' ? 'Mixed movement quality' : 'Form broke down',
        } : {}),
        tone: record.discomfort === 'stopped' || record.movementQuality === 'breakdown' ? 'stopped' : record.discomfort === 'mild' || record.movementQuality === 'mixed' ? 'caution' : 'complete',
        ...(record.feedbackNote ? { feedbackNote: record.feedbackNote } : {}),
        exercises: record.exerciseSummaries?.map((exercise) => ({ id: exercise.exerciseId, name: exercise.name, completionLabel: `${exercise.completedSets} of ${exercise.totalSets} sets` })) ?? [],
        muscleBreakdown: muscles.map(([muscle, sets]) => `${muscleNames[muscle]} ${sets}`),
      };
    });
}
