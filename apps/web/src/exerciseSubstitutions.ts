import type { ExerciseMode, WorkoutExercise } from './workoutSession.js';

export type SubstitutionReason = 'equipment' | 'comfort' | 'preference';

export interface ExerciseSubstitution {
  id: string;
  name: string;
  detail: string;
  mode: ExerciseMode;
  reasons: SubstitutionReason[];
  preserves: string;
}

const substitutions: Record<string, ExerciseSubstitution[]> = {
  'barbell-bench': [
    {
      id: 'dumbbell-floor-press',
      name: 'Dumbbell floor press',
      detail: 'Neutral grip · controlled touch',
      mode: 'reps',
      reasons: ['equipment', 'comfort'],
      preserves: 'Horizontal pressing with a shorter shoulder range',
    },
    {
      id: 'incline-push-up',
      name: 'Incline push-up',
      detail: 'Stable surface · smooth tempo',
      mode: 'reps',
      reasons: ['equipment', 'preference'],
      preserves: 'Horizontal pressing with bodyweight resistance',
    },
  ],
  'box-squat': [
    {
      id: 'goblet-box-squat',
      name: 'Goblet box squat',
      detail: 'Pain-free depth · braced torso',
      mode: 'reps',
      reasons: ['equipment', 'comfort'],
      preserves: 'Squat pattern and controlled depth with less external load',
    },
    {
      id: 'supported-split-squat',
      name: 'Supported split squat',
      detail: 'Use support · each side',
      mode: 'reps',
      reasons: ['comfort', 'preference'],
      preserves: 'Knee and hip strength with added balance support',
    },
  ],
  'dead-bugs': [
    {
      id: 'heel-slides',
      name: 'Supine heel slides',
      detail: 'Slow exhale · short range',
      mode: 'reps',
      reasons: ['comfort'],
      preserves: 'Trunk control with a smaller lever arm',
    },
    {
      id: 'bird-dog',
      name: 'Bird dog',
      detail: 'Opposite arm and leg · pause',
      mode: 'reps',
      reasons: ['preference'],
      preserves: 'Contralateral trunk control in a hands-and-knees position',
    },
  ],
};

export function exerciseSubstitutions(exerciseId: string): ExerciseSubstitution[] {
  return substitutions[exerciseId]?.map((substitution) => ({
    ...substitution,
    reasons: [...substitution.reasons],
  })) ?? [];
}

export function exerciseIdsWithSubstitutions(): string[] {
  return Object.keys(substitutions);
}

export function applyExerciseSubstitution(
  exercise: WorkoutExercise,
  substitution: ExerciseSubstitution,
): WorkoutExercise {
  if (exercise.mode !== substitution.mode) {
    throw new Error('A substitution must use the same logging mode.');
  }
  if (exercise.sets.some((set) => set.completedAt)) {
    throw new Error('Completed work cannot be replaced.');
  }

  return {
    ...exercise,
    id: substitution.id,
    name: substitution.name,
    detail: substitution.detail,
    substitutedFromId: exercise.substitutedFromId ?? exercise.id,
    substitutedFromName: exercise.substitutedFromName ?? exercise.name,
    sets: exercise.sets.map((set, index) => ({
      ...set,
      id: `${substitution.id}-${index + 1}`,
      ...(substitution.mode === 'reps' ? { loadKg: 0 } : {}),
    })),
  };
}
