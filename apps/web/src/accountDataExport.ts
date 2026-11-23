import type { DashboardState } from './dashboardStorage.js';

export interface ForgeAccountDataExport {
  schemaVersion: 1;
  exportedAt: string;
  data: DashboardState;
}

export function forgeAccountDataJson(state: DashboardState, exportedAt = new Date().toISOString()): string {
  const payload: ForgeAccountDataExport = { schemaVersion: 1, exportedAt, data: state };
  return JSON.stringify(payload, null, 2);
}

export function forgeAccountDataFilename(date: string): string {
  return `forge-account-data-${date}.json`;
}
