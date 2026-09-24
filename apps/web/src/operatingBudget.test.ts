import { describe, expect, it } from 'vitest';
import { budgetAlertLevel, budgetUsagePercent, defaultOperatingBudget, loadOperatingBudget, monthExpenseTotal, operatingBudgetEnabled, operatingBudgetForecast, parseOperatingBudget, saveOperatingBudget } from './operatingBudget.js';

describe('Forge operating budget', () => {
  it('adds the OpenAI allowance to the accepted Azure runway and preserves the buffer', () => {
    const forecast = operatingBudgetForecast(defaultOperatingBudget);
    expect(forecast).toEqual([
      { months: 3, azureUsd: 66, apiUsd: 15, additionalUsd: 0, plannedUsd: 81, safeTargetUsd: 98, cashToEarmarkUsd: 98 },
      { months: 6, azureUsd: 198, apiUsd: 30, additionalUsd: 0, plannedUsd: 228, safeTargetUsd: 274, cashToEarmarkUsd: 274 },
      { months: 9, azureUsd: 420, apiUsd: 45, additionalUsd: 0, plannedUsd: 465, safeTargetUsd: 558, cashToEarmarkUsd: 558 },
      { months: 12, azureUsd: 687, apiUsd: 60, additionalUsd: 0, plannedUsd: 747, safeTargetUsd: 897, cashToEarmarkUsd: 897 },
    ]);
  });

  it('treats prepaid API credits as funded cash rather than additional cost', () => {
    const [forecast] = operatingBudgetForecast({ ...defaultOperatingBudget, apiCreditBalanceUsd: 5 });
    expect(forecast?.plannedUsd).toBe(81);
    expect(forecast?.cashToEarmarkUsd).toBe(93);
  });

  it('tracks actual monthly expenses and alert thresholds', () => {
    const state = { ...defaultOperatingBudget, expenses: [
      { id: '1', date: '2026-09-24', category: 'ai' as const, amountUsd: 3.75, note: 'OpenAI usage' },
      { id: '2', date: '2026-08-30', category: 'ai' as const, amountUsd: 2, note: 'Earlier month' },
    ] };
    expect(monthExpenseTotal(state, '2026-09', 'ai')).toBe(3.75);
    expect(budgetUsagePercent(3.75, 5)).toBe(75);
    expect(budgetAlertLevel(75)).toBe('watch');
    expect(budgetAlertLevel(90)).toBe('warning');
    expect(budgetAlertLevel(100)).toBe('critical');
  });

  it('validates and stores founder-only state separately from athlete data', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    saveOperatingBudget(storage, { ...defaultOperatingBudget, apiCreditBalanceUsd: 5 });
    expect(loadOperatingBudget(storage).apiCreditBalanceUsd).toBe(5);
    expect(parseOperatingBudget({ ...defaultOperatingBudget, apiMonthlyBudgetUsd: -1 })).toBeUndefined();
    expect(operatingBudgetEnabled({ DEV: true })).toBe(true);
    expect(operatingBudgetEnabled({ VITE_FORGE_OPERATIONS_ENABLED: 'true' })).toBe(true);
    expect(operatingBudgetEnabled({})).toBe(false);
  });
});
