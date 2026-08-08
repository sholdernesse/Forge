import { CoachService } from '@forge/coach';
import { buildDigitalTwin, type Goals, type UserProfile, type DailySnapshot } from '@forge/digital-twin';

export function buildTodayView(profile: UserProfile, goals: Goals, history: DailySnapshot[]) {
  const twin = buildDigitalTwin({ profile, goals, history });
  return new CoachService().getToday(twin);
}
