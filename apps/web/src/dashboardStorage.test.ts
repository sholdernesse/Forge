import { describe, expect, it } from 'vitest';
import { demoHistory } from './demoData.js';
import {
  DASHBOARD_STORAGE_KEY,
  clearDashboardState,
  loadDashboardState,
  saveDashboardState,
  type DashboardState,
  type DashboardStorage,
} from './dashboardStorage.js';
import { createTodayWorkout } from './workoutSession.js';
import { demoSessionHistory } from './volumeLedger.js';
import { demoFoodEntries } from './foodLog.js';
import type { OnboardingProfile } from './onboarding.js';

class MemoryStorage implements DashboardStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const fallback: DashboardState = {
  history: demoHistory,
  checkIn: { weightKg: 75.8, sleepScore: 77, sleepHours: 7, soreness: 4, stress: 3 },
};

describe('dashboard storage', () => {
  it('round trips a saved check-in and history', () => {
    const storage = new MemoryStorage();
    const state = { ...fallback, savedAt: '2026-08-12T12:00:00.000Z', workoutSession: createTodayWorkout('2026-08-12'), sessionHistory: demoSessionHistory, scheduleOverrides: { '2026-08-13': 'rest' as const }, foodEntries: demoFoodEntries, favoriteFoodIds: ['chicken-breast'], savedMeals: [{ id: 'lunch', name: 'Lunch', items: [{ foodId: 'chicken-breast', quantity: 1 }] }], coachMessages: [{ id: 'm1', role: 'assistant' as const, content: 'Train today.', recommendationIds: [], answerBasis: 'recommendations' as const, suggestedAction: { type: 'open-workout' as const, label: 'Open today’s workout' }, createdAt: '2026-08-12T12:01:00.000Z' }] };
    saveDashboardState(storage, state);
    expect(loadDashboardState(storage, fallback)).toEqual(state);
  });

  it('round trips a valid onboarding profile and ignores malformed setup data', () => {
    const storage = new MemoryStorage();
    const onboardingProfile: OnboardingProfile = {
      version: 1,
      completedAt: '2026-08-21T12:00:00.000Z',
      primaryGoal: 'return-to-consistency',
      experience: 'new',
      weeklyTrainingDays: 3,
      sessionMinutes: 45,
      location: 'home',
      equipment: ['bodyweight', 'bands'],
      constraints: [],
      nutritionApproach: 'simple-guidance',
      age: 38,
      sex: 'unspecified',
      heightCm: 170,
      weightKg: 72,
    };
    saveDashboardState(storage, { ...fallback, onboardingProfile });
    expect(loadDashboardState(storage, fallback).onboardingProfile).toEqual(onboardingProfile);

    storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({
      version: 11,
      updatedAt: '2026-08-21T12:00:00.000Z',
      ...fallback,
      onboardingProfile: { ...onboardingProfile, equipment: ['teleporter'] },
    }));
    expect(loadDashboardState(storage, fallback).onboardingProfile).toBeUndefined();
  });

  it('falls back when stored data is corrupt or outside accepted ranges', () => {
    const storage = new MemoryStorage();
    storage.setItem(DASHBOARD_STORAGE_KEY, '{not-json');
    expect(loadDashboardState(storage, fallback)).toBe(fallback);

    storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({
      version: 1,
      history: demoHistory,
      checkIn: { ...fallback.checkIn, sleepScore: 900 },
    }));
    expect(loadDashboardState(storage, fallback)).toBe(fallback);
  });

  it('clears the stored prototype state', () => {
    const storage = new MemoryStorage();
    saveDashboardState(storage, fallback);
    clearDashboardState(storage);
    expect(storage.getItem(DASHBOARD_STORAGE_KEY)).toBeNull();
  });

  it('filters malformed coach messages and keeps the newest 40', () => {
    const storage = new MemoryStorage();
    const messages = Array.from({ length: 42 }, (_, index) => ({ id: `m${index}`, role: 'assistant', content: `Answer ${index}`, recommendationIds: [], createdAt: `2026-08-12T12:${String(index).padStart(2, '0')}:00.000Z` }));
    storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({ version: 10, updatedAt: '2026-08-12T13:00:00.000Z', ...fallback, coachMessages: [{ id: '', role: 'system', content: '', recommendationIds: 'bad', suggestedAction: { type: 'delete-account', label: 'Unsafe' }, createdAt: 'never' }, ...messages] }));

    const loaded = loadDashboardState(storage, fallback);
    expect(loaded.coachMessages).toHaveLength(40);
    expect(loaded.coachMessages?.[0]?.id).toBe('m2');
  });

  it('rejects unsupported Coach answer evidence classifications', () => {
    const storage = new MemoryStorage();
    storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({ version: 10, updatedAt: '2026-08-12T13:00:00.000Z', ...fallback, coachMessages: [{ id: 'm1', role: 'assistant', content: 'Unsupported basis.', recommendationIds: [], answerBasis: 'diagnosis', createdAt: '2026-08-12T12:00:00.000Z' }] }));

    expect(loadDashboardState(storage, fallback).coachMessages).toEqual([]);
  });

  it('rejects unsupported Coach handoff actions', () => {
    const storage = new MemoryStorage();
    storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({ version: 10, updatedAt: '2026-08-12T13:00:00.000Z', ...fallback, coachMessages: [{ id: 'm1', role: 'assistant', content: 'Do something unsafe.', recommendationIds: [], suggestedAction: { type: 'open-url', label: 'Leave Forge' }, createdAt: '2026-08-12T12:00:00.000Z' }] }));

    expect(loadDashboardState(storage, fallback).coachMessages).toEqual([]);
  });

  it('filters malformed training history records and bounds retained history', () => {
    const storage = new MemoryStorage();
    const records = Array.from({ length: 92 }, (_, index) => ({ workoutId: `w${index}`, date: '2026-08-12', title: 'Session', durationMinutes: 40, muscleSets: { chest: 3 } }));
    storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({ version: 10, updatedAt: '2026-08-12T13:00:00.000Z', ...fallback, sessionHistory: [{ workoutId: '', date: 'never', title: '', durationMinutes: -1, muscleSets: { unknown: 999 } }, ...records] }));

    const loaded = loadDashboardState(storage, fallback);
    expect(loaded.sessionHistory).toHaveLength(90);
    expect(loaded.sessionHistory?.[0]?.workoutId).toBe('w2');
  });
});
