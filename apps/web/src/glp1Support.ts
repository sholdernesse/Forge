import type { WorkoutSession } from './workoutSession.js';

export type Glp1Medication = 'semaglutide' | 'tirzepatide' | 'liraglutide' | 'dulaglutide' | 'other';
export type Glp1Schedule = 'daily' | 'weekly' | 'other';
export type Glp1SymptomSeverity = 'none' | 'mild' | 'moderate' | 'severe';
export type Glp1SideEffect = 'nausea' | 'vomiting' | 'diarrhea' | 'constipation' | 'abdominal-pain' | 'dizziness' | 'fatigue' | 'reduced-appetite';

export interface Glp1SupportProfile {
  enabled: boolean;
  medication: Glp1Medication;
  prescribedDose: string;
  schedule: Glp1Schedule;
  lastDoseDate?: string;
  doseChangedRecently: boolean;
  sideEffects: Glp1SideEffect[];
  severity: Glp1SymptomSeverity;
  notes: string;
  updatedAt: string;
}

export interface Glp1TrainingGuidance {
  mode: 'standard' | 'conservative' | 'recovery';
  headline: string;
  detail: string;
  needsClinicalReview: boolean;
}

const medications: Glp1Medication[] = ['semaglutide', 'tirzepatide', 'liraglutide', 'dulaglutide', 'other'];
const schedules: Glp1Schedule[] = ['daily', 'weekly', 'other'];
const severities: Glp1SymptomSeverity[] = ['none', 'mild', 'moderate', 'severe'];
const sideEffects: Glp1SideEffect[] = ['nausea', 'vomiting', 'diarrhea', 'constipation', 'abdominal-pain', 'dizziness', 'fatigue', 'reduced-appetite'];

export function defaultGlp1Support(now = new Date()): Glp1SupportProfile {
  return {
    enabled: false,
    medication: 'semaglutide',
    prescribedDose: '',
    schedule: 'weekly',
    doseChangedRecently: false,
    sideEffects: [],
    severity: 'none',
    notes: '',
    updatedAt: now.toISOString(),
  };
}

export function isGlp1SupportProfile(value: unknown): value is Glp1SupportProfile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Glp1SupportProfile>;
  return typeof candidate.enabled === 'boolean'
    && medications.includes(candidate.medication as Glp1Medication)
    && typeof candidate.prescribedDose === 'string' && candidate.prescribedDose.length <= 80
    && schedules.includes(candidate.schedule as Glp1Schedule)
    && (candidate.lastDoseDate === undefined || (typeof candidate.lastDoseDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(candidate.lastDoseDate)))
    && typeof candidate.doseChangedRecently === 'boolean'
    && Array.isArray(candidate.sideEffects) && candidate.sideEffects.every((item) => sideEffects.includes(item))
    && severities.includes(candidate.severity as Glp1SymptomSeverity)
    && typeof candidate.notes === 'string' && candidate.notes.length <= 500
    && typeof candidate.updatedAt === 'string' && !Number.isNaN(Date.parse(candidate.updatedAt));
}

export function glp1TrainingGuidance(profile?: Glp1SupportProfile): Glp1TrainingGuidance {
  if (!profile?.enabled) {
    return { mode: 'standard', headline: 'Standard adaptive training', detail: 'GLP-1 support is not active.', needsClinicalReview: false };
  }

  const concerningSymptom = profile.sideEffects.some((item) => ['vomiting', 'abdominal-pain', 'dizziness'].includes(item));
  const needsClinicalReview = profile.severity === 'severe' || (profile.severity === 'moderate' && concerningSymptom);
  if (needsClinicalReview) {
    return {
      mode: 'recovery',
      headline: 'Pause loaded training today',
      detail: 'Forge detected symptoms that should be reviewed before strenuous exercise. Use only comfortable light movement and contact a qualified clinician.',
      needsClinicalReview: true,
    };
  }

  if (profile.severity === 'moderate' || (profile.doseChangedRecently && profile.severity !== 'none')) {
    return {
      mode: 'conservative',
      headline: 'Reduced-volume strength day',
      detail: 'Forge will lower training volume and cap intensity while preserving the main strength movements.',
      needsClinicalReview: false,
    };
  }

  return {
    mode: 'standard',
    headline: 'Muscle-preserving plan active',
    detail: 'Forge will keep progressive resistance training central and use daily readiness to regulate effort.',
    needsClinicalReview: false,
  };
}

export function applyGlp1TrainingSupport(session: WorkoutSession, profile?: Glp1SupportProfile): WorkoutSession {
  const guidance = glp1TrainingGuidance(profile);
  if (!profile?.enabled || guidance.mode === 'standard') {
    return profile?.enabled ? { ...session, planReason: `${session.planReason ?? ''} GLP-1 support is active; resistance training remains prioritized to support strength and lean mass.`.trim() } : session;
  }
  if (guidance.mode === 'recovery') return session;

  return {
    ...session,
    intensity: 'low',
    planReason: `${session.planReason ?? ''} GLP-1 support reduced today’s volume because moderate symptoms or a recent dose change were recorded.`.trim(),
    exercises: session.exercises.slice(0, 4).map((exercise) => {
      const warmups = exercise.sets.filter((set) => set.kind === 'warmup');
      const working = exercise.sets.filter((set) => set.kind !== 'warmup');
      const workingLimit = Math.max(1, Math.ceil(working.length * 0.7));
      return { ...exercise, restSeconds: Math.max(exercise.restSeconds, 90), sets: [...warmups, ...working.slice(0, workingLimit)] };
    }),
  };
}
