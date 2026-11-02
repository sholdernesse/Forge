import { describe, expect, it } from 'vitest';
import { forgeAccountDataFilename, forgeAccountDataJson } from './accountDataExport.js';
import type { DashboardState } from './dashboardStorage.js';

describe('Forge account data export', () => {
  it('wraps the complete dashboard state in a versioned portable document', () => {
    const state: DashboardState = {
      history: [],
      checkIn: { weightKg: 75, sleepScore: 80, sleepHours: 7, soreness: 3, stress: 2 },
      foodEntries: [{ id: 'food-1', date: '2026-09-17', meal: 'lunch', name: 'Chicken', serving: '6 oz', caloriesKcal: 280, proteinG: 53, carbsG: 0, fatG: 6 }],
    };
    expect(JSON.parse(forgeAccountDataJson(state, '2026-09-17T12:00:00.000Z'))).toEqual({ schemaVersion: 1, exportedAt: '2026-09-17T12:00:00.000Z', data: state });
  });

  it('uses a predictable date-scoped filename', () => {
    expect(forgeAccountDataFilename('2026-09-17')).toBe('forge-account-data-2026-09-17.json');
  });
});
