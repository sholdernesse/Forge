import type { DigitalTwin } from '@forge/digital-twin';
import type { WorkoutExercise, WorkoutSession } from './workoutSession.js';

export interface TrainingPreferences {
  equipment: Array<'barbell' | 'dumbbells' | 'bands' | 'rack' | 'treadmill'>;
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

export function generateTrainingPlan(twin: DigitalTwin, preferences: TrainingPreferences): WorkoutSession {
  const date = twin.asOfDate;
  const readiness = twin.recovery.readiness;
  const weeklyTarget = twin.goals.weeklyTrainingTarget ?? 4;
  const weeklyComplete = twin.training.sessionsLast7Days >= weeklyTarget;

  if (readiness < 72 || weeklyComplete) {
    const cause = weeklyComplete
      ? `You have completed ${twin.training.sessionsLast7Days} of ${weeklyTarget} weekly sessions.`
      : `Readiness is ${readiness}, so Forge reduced joint and systemic loading.`;
    return {
      id: `${date}-adaptive-recovery`, date, title: 'Cardio + mobility reset', status: 'not-started', planType: 'recovery', intensity: 'low', planReason: cause,
      exercises: [
        durationExercise('zone-2-treadmill', 'Zone 2 treadmill', 'Conversational pace', 30),
        durationExercise('mobility-flow', 'Hip + thoracic mobility', 'Controlled range', 10),
        repExercise('dead-bugs', 'Dead bugs', 'Each side · slow exhale', 3, 10, 0, 60),
      ],
    };
  }

  const upperDay = twin.training.sessionsLast7Days % 2 === 0;
  if (upperDay) {
    const neutralGrip = preferences.constraints.includes('elbow-sensitive');
    return {
      id: `${date}-adaptive-upper`, date, title: 'Upper strength + delts', status: 'not-started', planType: 'upper-strength', intensity: readiness >= 82 ? 'high' : 'moderate',
      planReason: `Readiness is ${readiness}. Upper-body volume balances your recent weekly rotation while respecting elbow comfort.`,
      exercises: [
        repExercise('barbell-bench', 'Barbell bench press', 'Controlled pause · leave 2 reps in reserve', 4, 8, 59, 120),
        repExercise('chest-supported-row', 'Chest-supported row', 'No lower-back loading', 4, 10, 22.5, 90),
        repExercise('dumbbell-overhead-press', 'Dumbbell overhead press', neutralGrip ? 'Neutral grip for elbow comfort' : 'Controlled lockout', 3, 10, 11.3),
        repExercise('lateral-raise', 'Lateral raise', 'Lead with elbows · strict tempo', 3, 15, 6.8, 60),
        repExercise('band-face-pull', 'Band face pull', 'External rotation finish', 3, 20, 4.5, 45),
      ],
    };
  }

  const backSensitive = preferences.constraints.includes('lower-back-sensitive');
  return {
    id: `${date}-adaptive-lower`, date, title: 'Lower body + core', status: 'not-started', planType: 'lower-strength', intensity: readiness >= 82 ? 'high' : 'moderate',
    planReason: `Readiness is ${readiness}. Lower-body work is due; exercise selection limits unsupported spinal loading.`,
    exercises: [
      repExercise('box-squat', backSensitive ? 'Controlled box squat' : 'Back squat', backSensitive ? 'Pain-free depth · braced torso' : 'Consistent depth', 4, 8, 59, 120),
      repExercise('hip-thrust', 'Barbell hip thrust', 'Full lockout · ribs down', 4, 10, 68, 90),
      repExercise('split-squat', 'Dumbbell split squat', 'Stable stance · each side', 3, 10, 13.6, 90),
      repExercise('standing-calf-raise', 'Standing calf raise', 'Two-second peak contraction', 3, 15, 27.2, 60),
      repExercise('dead-bugs', 'Dead bugs', 'Each side · slow exhale', 3, 10, 0, 60),
    ],
  };
}
