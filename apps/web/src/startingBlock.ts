import type { JourneyGoal, OnboardingProfile } from './onboarding.js';

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
  weeks: StartingBlockWeek[];
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
  const currentWeek = Math.min(4, Math.floor(calendarDaysBetween(profile.completedAt, today) / 7) + 1);
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
    weeks: focuses.map(([title, focus], index) => {
      const week = index + 1;
      return { week, title: title!, focus: focus!, status: week < currentWeek ? 'complete' : week === currentWeek ? 'current' : 'upcoming' };
    }),
  };
}
