import type { JourneyGoal, OnboardingProfile } from './onboarding.js';
import type { TrainingSessionRecord } from './volumeLedger.js';

export interface StartingBlockWeek {
  week: number;
  title: string;
  focus: string;
  status: 'complete' | 'current' | 'upcoming';
}

export interface StartingBlock {
  title: string;
  purpose: string;
  currentWeek: number;
  reviewReady: boolean;
  weeks: StartingBlockWeek[];
}

export interface StartingBlockReview {
  sessions: number;
  plannedSessions: number;
  adherencePct: number;
  qualityCoveragePct: number;
  controlledPct?: number;
  discomfortSessions: number;
  tone: 'ready' | 'repeat' | 'needs-evidence';
  headline: string;
  nextStep: string;
}

const goalPurpose: Record<JourneyGoal, string> = {
  'build-muscle-strength': 'Build a repeatable strength base before adding load.',
  'lose-fat-body-composition': 'Protect strength while building a sustainable training rhythm.',
  'endurance-conditioning': 'Build work capacity gradually without outrunning recovery.',
  'healthier-more-energy': 'Create an achievable routine that supports daily energy.',
  'return-to-consistency': 'Rebuild momentum with sessions you can repeat each week.',
  'maintain-performance': 'Re-establish a reliable baseline before refining performance.',
  'help-me-choose': 'Learn from four weeks of real feedback before specializing the plan.',
};

function calendarDaysBetween(start: string, end: string): number {
  const startDate = Date.parse(`${start.slice(0, 10)}T12:00:00Z`);
  const endDate = Date.parse(`${end}T12:00:00Z`);
  if (Number.isNaN(startDate) || Number.isNaN(endDate)) return 0;
  return Math.max(0, Math.floor((endDate - startDate) / 86_400_000));
}

export function startingBlockFor(profile: OnboardingProfile, today: string): StartingBlock {
  const elapsedDays = calendarDaysBetween(profile.completedAt, today);
  const currentWeek = Math.min(4, Math.floor(elapsedDays / 7) + 1);
  const focuses = profile.experience === 'experienced'
    ? [
        ['Calibrate', 'Confirm realistic loads, recovery, and schedule fit.'],
        ['Repeat', 'Make quality work repeatable across the full week.'],
        ['Progress', 'Add reps or load only where control stays strong.'],
        ['Review', 'Use four weeks of evidence to shape the next block.'],
      ]
    : [
        ['Learn', 'Practice the movements and finish with reps in reserve.'],
        ['Repeat', 'Build confidence by repeating controlled sessions.'],
        ['Progress', 'Add a small challenge only where form stays steady.'],
        ['Review', 'Use four weeks of feedback to shape the next block.'],
      ];

  return {
    title: 'Your 4-week starting block',
    purpose: goalPurpose[profile.primaryGoal],
    currentWeek,
    reviewReady: elapsedDays >= 28,
    weeks: focuses.map(([title, focus], index) => {
      const week = index + 1;
      return { week, title: title!, focus: focus!, status: week < currentWeek ? 'complete' : week === currentWeek ? 'current' : 'upcoming' };
    }),
  };
}

export function startingBlockReview(profile: OnboardingProfile, today: string, records: TrainingSessionRecord[]): StartingBlockReview | undefined {
  if (calendarDaysBetween(profile.completedAt, today) < 28) return undefined;
  const startDate = profile.completedAt.slice(0, 10);
  const sessions = records.filter((record) => record.date >= startDate && record.date <= today);
  const plannedSessions = profile.weeklyTrainingDays * 4;
  const adherencePct = Math.min(100, Math.round(sessions.length / plannedSessions * 100));
  const rated = sessions.filter((record) => record.movementQuality !== undefined);
  const controlled = rated.filter((record) => record.movementQuality === 'controlled').length;
  const discomfortSessions = sessions.filter((record) => record.discomfort === 'mild' || record.discomfort === 'stopped').length;
  const qualityCoveragePct = sessions.length ? Math.round(rated.length / sessions.length * 100) : 0;
  const controlledPct = rated.length ? Math.round(controlled / rated.length * 100) : undefined;
  const evidence = { sessions: sessions.length, plannedSessions, adherencePct, qualityCoveragePct, ...(controlledPct === undefined ? {} : { controlledPct }), discomfortSessions };

  if (!sessions.length || qualityCoveragePct < 50) return {
    ...evidence,
    tone: 'needs-evidence',
    headline: 'Build a clearer training picture',
    nextStep: sessions.length ? 'Keep the same starting structure and rate movement quality after each session.' : 'Complete the first real sessions before Forge recommends progression.',
  };
  if (discomfortSessions > 0 || rated.some((record) => record.movementQuality === 'breakdown')) return {
    ...evidence,
    tone: 'repeat',
    headline: 'Repeat the block with control',
    nextStep: 'Keep the current structure and resolve discomfort or form breakdown before adding load or volume.',
  };
  if (adherencePct < 60) return {
    ...evidence,
    tone: 'repeat',
    headline: 'Make the plan easier to repeat',
    nextStep: 'Keep the goal, then reduce weekly frequency or session length before starting another block.',
  };
  if (adherencePct >= 75 && (controlledPct ?? 0) >= 75) return {
    ...evidence,
    tone: 'ready',
    headline: 'Ready to shape the next block',
    nextStep: 'Review the same goal and schedule, then approve the next progression before Forge activates it.',
  };
  return {
    ...evidence,
    tone: 'repeat',
    headline: 'Consolidate before progressing',
    nextStep: 'Repeat the current rhythm until controlled sessions are consistent enough to progress confidently.',
  };
}
