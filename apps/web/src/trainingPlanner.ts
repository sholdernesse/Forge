import type { DigitalTwin } from '@forge/digital-twin';
import { addWarmupSet, type WorkoutExercise, type WorkoutSession } from './workoutSession.js';
import { weeklyVolume, type TrainingSessionRecord } from './volumeLedger.js';
import { applyDeload, assessDeload, assessTrainingFeedback, type ScheduleIntent } from './schedulePolicy.js';

export interface TrainingPreferences {
  equipment: Array<'bodyweight' | 'barbell' | 'dumbbells' | 'bands' | 'rack' | 'treadmill'>;
  constraints: Array<'lower-back-sensitive' | 'elbow-sensitive'>;
  preferredSessionMinutes: number;
}

export const demoTrainingPreferences: TrainingPreferences = {
  equipment: ['barbell', 'dumbbells', 'bands', 'rack', 'treadmill'],
  constraints: ['lower-back-sensitive', 'elbow-sensitive'],
  preferredSessionMinutes: 50,
};

function repExercise(id: string, name: string, detail: string, sets: number, reps: number, loadKg: number, restSeconds = 90): WorkoutExercise {
  return { id, name, detail, mode: 'reps', restSeconds, sets: Array.from({ length: sets }, (_, index) => ({ id: `${id}-${index + 1}`, reps, loadKg })) };
}

function durationExercise(id: string, name: string, detail: string, minutes: number): WorkoutExercise {
  return { id, name, detail, mode: 'duration', restSeconds: 30, sets: [{ id: `${id}-1`, durationMinutes: minutes }] };
}

function includePrimaryWarmup(session: WorkoutSession): WorkoutSession {
  const exerciseIndex = session.exercises.findIndex((exercise) => exercise.mode === 'reps' && exercise.sets.some((set) => (set.loadKg ?? 0) > 0));
  if (exerciseIndex < 0) return session;
  const exercise = session.exercises[exerciseIndex]!;
  const working = exercise.sets.find((set) => set.kind !== 'warmup')!;
  const withWarmup = addWarmupSet(exercise);
  const warmupLoad = Math.round((working.loadKg ?? 0) * 0.5 * 2) / 2;
  return {
    ...session,
    exercises: session.exercises.map((item, index) => index === exerciseIndex ? {
      ...withWarmup,
      sets: withWarmup.sets.map((set) => set.kind === 'warmup'
        ? { ...set, reps: Math.min(10, working.reps ?? 8), loadKg: warmupLoad }
        : set),
    } : item),
  };
}

function fitPreferredDuration(session: WorkoutSession, preferredMinutes: number): WorkoutSession {
  const exerciseLimit = preferredMinutes <= 30 ? 3 : preferredMinutes <= 45 ? 4 : session.exercises.length;
  return { ...session, exercises: session.exercises.slice(0, exerciseLimit) };
}

function finalizeStrengthPlan(session: WorkoutSession, deload: ReturnType<typeof assessDeload>, preferences: TrainingPreferences): WorkoutSession {
  return fitPreferredDuration(includePrimaryWarmup(applyDeload(session, deload)), preferences.preferredSessionMinutes);
}

export function generateTrainingPlan(twin: DigitalTwin, preferences: TrainingPreferences, sessionHistory: TrainingSessionRecord[] = [], scheduleIntent: ScheduleIntent = 'adaptive'): WorkoutSession {
  const date = twin.asOfDate;
  const readiness = twin.recovery.readiness;
  const weeklyTarget = twin.goals.weeklyTrainingTarget ?? 4;
  const weeklyComplete = twin.training.sessionsLast7Days >= weeklyTarget;
  const feedback = assessTrainingFeedback(sessionHistory, date);

  if (readiness < 55 || weeklyComplete || scheduleIntent === 'rest' || feedback.action === 'recovery') {
    const cause = scheduleIntent === 'rest'
      ? 'You designated today as a rest day. Forge retained light movement to support recovery.'
      : feedback.action === 'recovery'
      ? `${feedback.reasons.join(' ')} Forge selected low-intensity movement and recommends reassessing before loaded training.`
      : weeklyComplete
      ? `You have completed ${twin.training.sessionsLast7Days} of ${weeklyTarget} weekly sessions.`
      : `Readiness is ${readiness}, so Forge reduced joint and systemic loading.`;
    return {
      id: `${date}-adaptive-recovery`, date, title: 'Cardio + mobility reset', status: 'not-started', planType: 'recovery', intensity: 'low', planReason: cause,
      exercises: [
        durationExercise('zone-2-treadmill', preferences.equipment.includes('treadmill') ? 'Zone 2 treadmill' : 'Zone 2 walk', 'Conversational pace', Math.min(30, preferences.preferredSessionMinutes)),
        durationExercise('mobility-flow', 'Hip + thoracic mobility', 'Controlled range', 10),
        repExercise('dead-bugs', 'Dead bugs', 'Each side · slow exhale', 3, 10, 0, 60),
      ],
    };
  }

  const ledger = weeklyVolume(sessionHistory, date);
  const total = (...muscles: string[]) => ledger.filter((item) => muscles.includes(item.muscle)).reduce((sum, item) => sum + item.completed / item.target, 0);
  const upperVolume = total('chest', 'back', 'shoulders', 'biceps', 'triceps');
  const lowerVolume = total('quads', 'hamstrings', 'glutes', 'calves');
  const upperDay = sessionHistory.length ? upperVolume <= lowerVolume : twin.training.sessionsLast7Days % 2 === 0;
  const baseDeload = assessDeload(twin);
  const deload = feedback.action === 'deload'
    ? {
      ...baseDeload,
      active: true,
      fatigueScore: baseDeload.fatigueScore + 1,
      reasons: [...baseDeload.reasons, ...feedback.reasons],
      volumeMultiplier: 0.65,
      loadMultiplier: 0.9,
    }
    : baseDeload;
  const hasBarbellStation = preferences.equipment.includes('barbell') && preferences.equipment.includes('rack');
  const hasDumbbells = preferences.equipment.includes('dumbbells');
  const hasBands = preferences.equipment.includes('bands');
  const equipmentLabel = hasBarbellStation ? 'barbell and rack' : hasDumbbells ? 'dumbbells' : hasBands ? 'bands' : 'bodyweight';

  if (upperDay) {
    const neutralGrip = preferences.constraints.includes('elbow-sensitive');
    const exercises = hasBarbellStation ? [
      repExercise('barbell-bench', 'Barbell bench press', 'Controlled pause · leave 2 reps in reserve', 4, 8, 59, 120),
      repExercise('chest-supported-row', 'Chest-supported row', 'No lower-back loading', 4, 10, 22.5, 90),
      repExercise('dumbbell-overhead-press', 'Dumbbell overhead press', neutralGrip ? 'Neutral grip for elbow comfort' : 'Controlled lockout', 3, 10, 11.3),
      repExercise('lateral-raise', 'Lateral raise', 'Lead with elbows · strict tempo', 3, 15, 6.8, 60),
      repExercise('band-face-pull', 'Band face pull', 'External rotation finish', 3, 20, 4.5, 45),
    ] : hasDumbbells ? [
      repExercise('dumbbell-floor-press', 'Dumbbell floor press', neutralGrip ? 'Neutral grip · stop before elbow discomfort' : 'Controlled pause · leave 2 reps in reserve', 4, 10, 11.3, 90),
      repExercise('one-arm-dumbbell-row', 'One-arm dumbbell row', 'Supported stance · each side', 4, 10, 13.6, 90),
      repExercise('dumbbell-overhead-press', 'Dumbbell overhead press', neutralGrip ? 'Neutral grip for elbow comfort' : 'Controlled lockout', 3, 10, 9),
      repExercise('lateral-raise', 'Lateral raise', 'Lead with elbows · strict tempo', 3, 15, 4.5, 60),
      hasBands ? repExercise('band-face-pull', 'Band face pull', 'External rotation finish', 3, 15, 0, 45) : repExercise('prone-y-raise', 'Prone Y raise', 'Slow lift · keep ribs down', 3, 12, 0, 45),
    ] : hasBands ? [
      repExercise('band-chest-press', 'Band chest press', 'Stable anchor · controlled return', 4, 12, 0, 75),
      repExercise('band-row', 'Band row', 'Pause with shoulder blades back', 4, 12, 0, 75),
      repExercise('band-overhead-press', 'Band overhead press', 'Controlled lockout', 3, 10, 0, 60),
      repExercise('band-lateral-raise', 'Band lateral raise', 'Strict tempo · comfortable range', 3, 15, 0, 45),
      repExercise('band-face-pull', 'Band face pull', 'External rotation finish', 3, 15, 0, 45),
    ] : [
      repExercise('push-up', 'Push-up', 'Controlled body line · leave 2 reps in reserve', 4, 8, 0, 75),
      repExercise('prone-y-raise', 'Prone Y raise', 'Slow lift · keep ribs down', 3, 12, 0, 45),
      repExercise('pike-push-up', 'Pike push-up', 'Comfortable shoulder range', 3, 8, 0, 75),
      repExercise('reverse-snow-angel', 'Reverse snow angel', 'Slow sweep · no shrugging', 3, 10, 0, 45),
      repExercise('shoulder-tap', 'Plank shoulder tap', 'Stable hips · alternate sides', 3, 10, 0, 45),
    ];
    return finalizeStrengthPlan({
      id: `${date}-adaptive-upper`, date, title: 'Upper strength + delts', status: 'not-started', planType: 'upper-strength', intensity: readiness >= 82 ? 'high' : 'moderate',
      planReason: `Readiness is ${readiness}. Upper-body volume is further from its weekly target; this session uses your available ${equipmentLabel} setup.`,
      exercises,
    }, deload, preferences);
  }

  const backSensitive = preferences.constraints.includes('lower-back-sensitive');
  const exercises = hasBarbellStation ? [
    repExercise('box-squat', backSensitive ? 'Controlled box squat' : 'Back squat', backSensitive ? 'Pain-free depth · braced torso' : 'Consistent depth', 4, 8, 59, 120),
    repExercise('hip-thrust', 'Barbell hip thrust', 'Full lockout · ribs down', 4, 10, 68, 90),
    repExercise('split-squat', 'Dumbbell split squat', 'Stable stance · each side', 3, 10, 13.6, 90),
    repExercise('standing-calf-raise', 'Standing calf raise', 'Two-second peak contraction', 3, 15, 27.2, 60),
    repExercise('dead-bugs', 'Dead bugs', 'Each side · slow exhale', 3, 10, 0, 60),
  ] : hasDumbbells ? [
    repExercise('goblet-squat', 'Goblet squat', backSensitive ? 'Pain-free depth · braced torso' : 'Consistent depth', 4, 10, 13.6, 90),
    repExercise('dumbbell-hip-thrust', 'Dumbbell hip thrust', 'Full lockout · ribs down', 4, 10, 18, 90),
    repExercise('split-squat', 'Dumbbell split squat', 'Stable stance · each side', 3, 10, 9, 75),
    repExercise('standing-calf-raise', 'Standing calf raise', 'Two-second peak contraction', 3, 15, 13.6, 60),
    repExercise('dead-bugs', 'Dead bugs', 'Each side · slow exhale', 3, 10, 0, 60),
  ] : hasBands ? [
    repExercise('band-squat', 'Band squat', 'Controlled depth · stable knees', 4, 12, 0, 75),
    repExercise('band-glute-bridge', 'Band glute bridge', 'Full lockout · ribs down', 4, 12, 0, 60),
    repExercise('reverse-lunge', 'Reverse lunge', 'Stable step · each side', 3, 10, 0, 75),
    repExercise('standing-calf-raise', 'Standing calf raise', 'Two-second peak contraction', 3, 15, 0, 45),
    repExercise('dead-bugs', 'Dead bugs', 'Each side · slow exhale', 3, 10, 0, 45),
  ] : [
    repExercise('bodyweight-squat', 'Bodyweight squat', 'Controlled comfortable depth', 4, 12, 0, 60),
    repExercise('glute-bridge', 'Glute bridge', 'Full lockout · ribs down', 4, 12, 0, 60),
    repExercise('reverse-lunge', 'Reverse lunge', 'Stable step · each side', 3, 8, 0, 60),
    repExercise('standing-calf-raise', 'Standing calf raise', 'Two-second peak contraction', 3, 15, 0, 45),
    repExercise('dead-bugs', 'Dead bugs', 'Each side · slow exhale', 3, 10, 0, 45),
  ];
  return finalizeStrengthPlan({
    id: `${date}-adaptive-lower`, date, title: 'Lower body + core', status: 'not-started', planType: 'lower-strength', intensity: readiness >= 82 ? 'high' : 'moderate',
    planReason: `Readiness is ${readiness}. Lower-body work is due; this session uses your available ${equipmentLabel} setup and limits unsupported spinal loading.`,
    exercises,
  }, deload, preferences);
}
