export type ForgeExperienceMode = 'demo' | 'personal';

export function experienceMode(authStatus: string): ForgeExperienceMode {
  return authStatus === 'development' ? 'demo' : 'personal';
}

export interface FirstRunEvidence {
  mode: ForgeExperienceMode;
  onboardingComplete: boolean;
  savedAt?: string;
  exerciseCount: number;
  sessionCount: number;
  foodEntryCount: number;
  coachMessageCount: number;
}

export function isFirstRun(evidence: FirstRunEvidence): boolean {
  return evidence.mode === 'personal'
    && !evidence.onboardingComplete
    && evidence.exerciseCount === 0
    && evidence.sessionCount === 0
    && evidence.foodEntryCount === 0
    && evidence.coachMessageCount === 0;
}
