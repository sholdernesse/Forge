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
  tone: 'complete' | 'caution' | 'stopped';
  feedbackNote?: string;
  exercises: Array<{ id: string; name: string; completionLabel: string }>;
  muscleBreakdown: string[];
}

const muscleNames: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', core: 'Core', cardio: 'Cardio',
};

export function trainingHistoryEntries(records: TrainingSessionRecord[], limit = 6): TrainingHistoryEntry[] {
  return [...records]
    .sort((left, right) => right.date.localeCompare(left.date))
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
        tone: record.discomfort === 'stopped' ? 'stopped' : record.discomfort === 'mild' ? 'caution' : 'complete',
        ...(record.feedbackNote ? { feedbackNote: record.feedbackNote } : {}),
        exercises: record.exerciseSummaries?.map((exercise) => ({ id: exercise.exerciseId, name: exercise.name, completionLabel: `${exercise.completedSets} of ${exercise.totalSets} sets` })) ?? [],
        muscleBreakdown: muscles.map(([muscle, sets]) => `${muscleNames[muscle]} ${sets}`),
      };
    });
}
