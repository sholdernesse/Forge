import type { DailySnapshot } from '@forge/digital-twin';

export interface DailySignalDefaults {
  sleepScore: number;
  sleepHours: number;
  soreness: number;
  stress: number;
  weightKg: number;
}

export function localDateKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localDateHeading(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now).toLocaleUpperCase();
}

export function greetingForHour(hour: number): 'Good morning' | 'Good afternoon' | 'Good evening' {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function userFirstName(name?: string, username?: string): string {
  const candidate = name?.trim() || username?.split('@')[0]?.trim();
  if (!candidate) return 'Athlete';
  const first = candidate.split(/\s+/)[0]!.replace(/[._-]+/g, ' ');
  return first ? first.charAt(0).toLocaleUpperCase() + first.slice(1) : 'Athlete';
}

export function withTodaySnapshot(
  history: DailySnapshot[],
  date: string,
  defaults: DailySignalDefaults,
): DailySnapshot[] {
  if (history.some((day) => day.date === date)) return history;
  return [...history, {
    date,
    weightKg: defaults.weightKg,
    sleepScore: defaults.sleepScore,
    sleepHours: defaults.sleepHours,
    soreness: defaults.soreness,
    stress: defaults.stress,
    steps: 0,
    caloriesKcal: 0,
    proteinG: 0,
  }];
}
