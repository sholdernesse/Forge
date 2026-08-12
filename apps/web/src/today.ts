import { CoachService } from '@forge/coach';
import { buildDigitalTwin, type Goals, type UserProfile, type DailySnapshot } from '@forge/digital-twin';
import type { ISODate } from '@forge/shared';

export function buildTodayView(profile: UserProfile, goals: Goals, history: DailySnapshot[], asOfDate: ISODate) {
  const twin = buildDigitalTwin({ profile, goals, history, asOfDate });
  return new CoachService().getToday(twin);
}
