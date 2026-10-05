import type { DailySnapshot } from '@forge/digital-twin';

export type ReflectionDimension = 'mind' | 'body' | 'soul';

export interface ReflectionHistoryEntry {
  date: string;
  mindScore: number;
  bodyScore: number;
  soulScore: number;
  averageScore: number;
  note?: string;
}

export interface ReflectionTrend {
  entries: ReflectionHistoryEntry[];
  latest?: ReflectionHistoryEntry;
  change?: number;
  leadingDimension?: ReflectionDimension;
  story: string;
}

function validScore(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 10;
}

export function reflectionTrend(history: DailySnapshot[], limit = 7): ReflectionTrend {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit must be a positive integer.');

  const entries = history
    .filter((day) => validScore(day.mindScore) && validScore(day.bodyScore) && validScore(day.soulScore))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit)
    .map((day) => ({
      date: day.date,
      mindScore: day.mindScore!,
      bodyScore: day.bodyScore!,
      soulScore: day.soulScore!,
      averageScore: Math.round((day.mindScore! + day.bodyScore! + day.soulScore!) / 3 * 10) / 10,
      ...(day.reflectionNote ? { note: day.reflectionNote } : {}),
    }));

  const latest = entries.at(-1);
  if (!latest) {
    return { entries, story: 'Complete an evening reflection to begin your mind, body, and soul story.' };
  }

  const totals = entries.reduce((sum, entry) => ({
    mind: sum.mind + entry.mindScore,
    body: sum.body + entry.bodyScore,
    soul: sum.soul + entry.soulScore,
  }), { mind: 0, body: 0, soul: 0 });
  const leadingDimension = (Object.entries(totals) as [ReflectionDimension, number][])
    .sort((left, right) => right[1] - left[1])[0]![0];

  if (entries.length === 1) {
    return {
      entries,
      latest,
      leadingDimension,
      story: `Your first reflection is saved. ${leadingDimension[0]!.toUpperCase() + leadingDimension.slice(1)} felt strongest today.`,
    };
  }

  const change = Math.round((latest.averageScore - entries[0]!.averageScore) * 10) / 10;
  const direction = change > 0 ? `up ${change}` : change < 0 ? `down ${Math.abs(change)}` : 'steady';
  return {
    entries,
    latest,
    change,
    leadingDimension,
    story: `${leadingDimension[0]!.toUpperCase() + leadingDimension.slice(1)} has been your strongest reported signal. Your overall reflection is ${direction} across this view.`,
  };
}
