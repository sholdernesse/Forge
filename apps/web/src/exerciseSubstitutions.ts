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

type SubstitutionGroup = [ExerciseSubstitution, ExerciseSubstitution, ExerciseSubstitution];

const groups: SubstitutionGroup[] = [
  [
    option('zone-2-treadmill', 'Zone 2 treadmill', 'Conversational pace', 'duration', ['preference'], 'Low-intensity aerobic work at a conversational effort'),
    option('outdoor-zone-2-walk', 'Outdoor Zone 2 walk', 'Conversational pace · steady route', 'duration', ['equipment', 'preference'], 'Low-intensity aerobic work at a conversational effort'),
    option('stationary-bike', 'Stationary bike', 'Conversational pace · smooth cadence', 'duration', ['equipment', 'comfort'], 'Low-intensity aerobic work with reduced impact'),
  ],
  [
    option('mobility-flow', 'Hip + thoracic mobility', 'Controlled range', 'duration', ['preference'], 'Controlled mobility practice for the hips and upper back'),
    option('chair-mobility-flow', 'Chair mobility flow', 'Supported · controlled range', 'duration', ['comfort'], 'Controlled hip and upper-back mobility with added support'),
    option('floor-mobility-flow', 'Floor mobility flow', 'Easy transitions · calm breathing', 'duration', ['preference'], 'Controlled mobility practice for the hips and upper back'),
  ],
  [
    option('dead-bugs', 'Dead bugs', 'Each side · slow exhale', 'reps', ['preference'], 'Contralateral trunk control with a stable spine'),
    option('heel-slides', 'Supine heel slides', 'Slow exhale · short range', 'reps', ['comfort'], 'Trunk control with a smaller lever arm'),
    option('bird-dog', 'Bird dog', 'Opposite arm and leg · pause', 'reps', ['preference'], 'Contralateral trunk control in a hands-and-knees position'),
  ],
  [
    option('barbell-bench', 'Barbell bench press', 'Controlled pause · leave 2 reps in reserve', 'reps', ['preference'], 'Horizontal pressing for the chest, shoulders, and triceps'),
    option('dumbbell-floor-press', 'Dumbbell floor press', 'Neutral grip · controlled touch', 'reps', ['equipment', 'comfort'], 'Horizontal pressing with a shorter shoulder range'),
    option('incline-push-up', 'Incline push-up', 'Stable surface · smooth tempo', 'reps', ['equipment', 'preference'], 'Horizontal pressing with bodyweight resistance'),
  ],
  [
    option('chest-supported-row', 'Chest-supported row', 'No lower-back loading', 'reps', ['preference'], 'Horizontal pulling for the upper back and arms'),
    option('one-arm-dumbbell-row', 'Supported one-arm row', 'Brace on bench · each side', 'reps', ['equipment', 'comfort'], 'Horizontal pulling with unilateral control and torso support'),
    option('band-row', 'Band row', 'Pause at ribs · smooth return', 'reps', ['equipment', 'preference'], 'Horizontal pulling with adjustable band resistance'),
  ],
  [
    option('dumbbell-overhead-press', 'Dumbbell overhead press', 'Controlled lockout', 'reps', ['preference'], 'Vertical pressing for the shoulders and triceps'),
    option('half-kneeling-band-press', 'Half-kneeling band press', 'Ribs down · each side', 'reps', ['equipment', 'comfort'], 'Upward pressing with lower external load and trunk support'),
    option('high-incline-press', 'High-incline dumbbell press', 'Bench supported · neutral grip', 'reps', ['comfort', 'preference'], 'Shoulder-focused pressing with back support'),
  ],
  [
    option('lateral-raise', 'Lateral raise', 'Lead with elbows · strict tempo', 'reps', ['preference'], 'Shoulder abduction work with controlled resistance'),
    option('band-lateral-raise', 'Band lateral raise', 'Light tension · strict tempo', 'reps', ['equipment'], 'Shoulder abduction work with progressive band resistance'),
    option('scaption-raise', 'Scaption raise', 'Thumbs up · controlled range', 'reps', ['comfort', 'preference'], 'Shoulder elevation in a slightly forward arm path'),
  ],
  [
    option('band-face-pull', 'Band face pull', 'External rotation finish', 'reps', ['preference'], 'Upper-back and rear-shoulder pulling with external rotation'),
    option('band-pull-apart', 'Band pull-apart', 'Straight arms · pause', 'reps', ['equipment', 'preference'], 'Upper-back and rear-shoulder work with a simple band setup'),
    option('rear-delt-fly', 'Chest-supported rear-delt fly', 'Light load · wide arc', 'reps', ['comfort'], 'Rear-shoulder and upper-back work with torso support'),
  ],
  [
    option('box-squat', 'Controlled box squat', 'Pain-free depth · braced torso', 'reps', ['preference'], 'Squat-pattern strength with a consistent depth target'),
    option('goblet-box-squat', 'Goblet box squat', 'Pain-free depth · braced torso', 'reps', ['equipment', 'comfort'], 'Squat pattern and controlled depth with less external load'),
    option('supported-split-squat', 'Supported split squat', 'Use support · each side', 'reps', ['comfort', 'preference'], 'Knee and hip strength with added balance support'),
  ],
  [
    option('hip-thrust', 'Barbell hip thrust', 'Full lockout · ribs down', 'reps', ['preference'], 'Hip-extension strength with emphasis on the glutes'),
    option('dumbbell-hip-thrust', 'Dumbbell hip thrust', 'Controlled lockout · ribs down', 'reps', ['equipment'], 'Hip-extension strength with a lighter, compact setup'),
    option('floor-glute-bridge', 'Floor glute bridge', 'Pause at top · bodyweight', 'reps', ['equipment', 'comfort'], 'Hip-extension work through a shorter supported range'),
  ],
  [
    option('split-squat', 'Dumbbell split squat', 'Stable stance · each side', 'reps', ['preference'], 'Single-leg knee and hip strength'),
    option('reverse-lunge', 'Reverse lunge', 'Step back · each side', 'reps', ['equipment', 'preference'], 'Single-leg knee and hip strength with a dynamic step'),
    option('low-step-up', 'Low step-up', 'Controlled drive · each side', 'reps', ['comfort'], 'Single-leg strength with an adjustable step height'),
  ],
  [
    option('standing-calf-raise', 'Standing calf raise', 'Two-second peak contraction', 'reps', ['preference'], 'Calf strength through controlled ankle plantar flexion'),
    option('bodyweight-calf-raise', 'Bodyweight calf raise', 'Use support · slow tempo', 'reps', ['equipment', 'comfort'], 'Calf strength with balance support and bodyweight resistance'),
    option('seated-calf-raise', 'Seated calf raise', 'Load over knees · full range', 'reps', ['comfort', 'preference'], 'Calf strength from a supported seated position'),
  ],
];

function option(
  id: string,
  name: string,
  detail: string,
  mode: ExerciseMode,
  reasons: SubstitutionReason[],
  preserves: string,
): ExerciseSubstitution {
  return { id, name, detail, mode, reasons, preserves };
}

export function exerciseSubstitutions(exerciseId: string): ExerciseSubstitution[] {
  const group = groups.find((items) => items.some((item) => item.id === exerciseId));
  return group?.filter((item) => item.id !== exerciseId).map(copyOption) ?? [];
}

export function exerciseIdsWithSubstitutions(): string[] {
  return groups.flatMap((group) => group.map((item) => item.id));
}

function copyOption(substitution: ExerciseSubstitution): ExerciseSubstitution {
  return { ...substitution, reasons: [...substitution.reasons] };
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

  const originalId = exercise.substitutedFromId ?? exercise.id;
  const returningToOriginal = substitution.id === originalId;
  const { substitutedFromId: _substitutedFromId, substitutedFromName: _substitutedFromName, ...baseExercise } = exercise;
  return {
    ...baseExercise,
    id: substitution.id,
    name: substitution.name,
    detail: substitution.detail,
    ...(returningToOriginal ? {} : {
      substitutedFromId: originalId,
      substitutedFromName: exercise.substitutedFromName ?? exercise.name,
    }),
    sets: exercise.sets.map((set, index) => ({
      ...set,
      id: `${substitution.id}-${index + 1}`,
      ...(substitution.mode === 'reps' ? { loadKg: 0 } : {}),
    })),
  };
}
