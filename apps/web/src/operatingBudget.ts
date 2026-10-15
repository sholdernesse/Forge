export type OperatingExpenseCategory = 'ai' | 'azure' | 'identity' | 'monitoring' | 'storage' | 'domain' | 'other';

export interface OperatingExpense {
  id: string;
  date: string;
  category: OperatingExpenseCategory;
  amountUsd: number;
  note: string;
}

export interface OperatingBudgetState {
  apiMonthlyBudgetUsd: number;
  apiCreditBalanceUsd: number;
  additionalMonthlyCostsUsd: number;
  contingencyPercent: number;
  expenses: OperatingExpense[];
}

export interface OperatingBudgetForecast {
  months: 3 | 6 | 9 | 12;
  azureUsd: number;
  apiUsd: number;
  additionalUsd: number;
  plannedUsd: number;
  safeTargetUsd: number;
  cashToEarmarkUsd: number;
}

export const OPERATING_BUDGET_STORAGE_KEY = 'forge.operations-budget.v1';
export const FORECAST_HORIZONS = [3, 6, 9, 12] as const;

const azureForecastUsd: Record<(typeof FORECAST_HORIZONS)[number], number> = {
  3: 66,
  6: 198,
  9: 420,
  12: 687,
};

export const defaultOperatingBudget: OperatingBudgetState = {
  apiMonthlyBudgetUsd: 5,
  apiCreditBalanceUsd: 0,
  additionalMonthlyCostsUsd: 0,
  contingencyPercent: 20,
  expenses: [],
};

function boundedMoney(value: unknown, maximum = 1_000_000): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum
    ? Math.round(value * 100) / 100
    : undefined;
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

function parseExpense(value: unknown): OperatingExpense | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<OperatingExpense>;
  const amountUsd = boundedMoney(candidate.amountUsd, 100_000);
  if (typeof candidate.id !== 'string' || !candidate.id || candidate.id.length > 100 || !validDate(candidate.date) || amountUsd === undefined || amountUsd <= 0) return undefined;
  if (!['ai', 'azure', 'identity', 'monitoring', 'storage', 'domain', 'other'].includes(String(candidate.category))) return undefined;
  if (typeof candidate.note !== 'string' || candidate.note.length > 160) return undefined;
  return { id: candidate.id, date: candidate.date, category: candidate.category as OperatingExpenseCategory, amountUsd, note: candidate.note.trim() };
}

export function parseOperatingBudget(value: unknown): OperatingBudgetState | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<OperatingBudgetState>;
  const apiMonthlyBudgetUsd = boundedMoney(candidate.apiMonthlyBudgetUsd, 10_000);
  const apiCreditBalanceUsd = boundedMoney(candidate.apiCreditBalanceUsd, 100_000);
  const additionalMonthlyCostsUsd = boundedMoney(candidate.additionalMonthlyCostsUsd, 100_000);
  const contingencyPercent = boundedMoney(candidate.contingencyPercent, 100);
  if (apiMonthlyBudgetUsd === undefined || apiCreditBalanceUsd === undefined || additionalMonthlyCostsUsd === undefined || contingencyPercent === undefined || !Array.isArray(candidate.expenses)) return undefined;
  const expenses = candidate.expenses.map(parseExpense).filter((expense): expense is OperatingExpense => Boolean(expense)).slice(-250);
  return { apiMonthlyBudgetUsd, apiCreditBalanceUsd, additionalMonthlyCostsUsd, contingencyPercent, expenses };
}

export function loadOperatingBudget(storage: Pick<Storage, 'getItem'>): OperatingBudgetState {
  try {
    const raw = storage.getItem(OPERATING_BUDGET_STORAGE_KEY);
    return raw ? parseOperatingBudget(JSON.parse(raw)) ?? defaultOperatingBudget : defaultOperatingBudget;
  } catch {
    return defaultOperatingBudget;
  }
}

export function saveOperatingBudget(storage: Pick<Storage, 'setItem'>, state: OperatingBudgetState): void {
  storage.setItem(OPERATING_BUDGET_STORAGE_KEY, JSON.stringify(state));
}

export function operatingBudgetForecast(state: OperatingBudgetState): OperatingBudgetForecast[] {
  return FORECAST_HORIZONS.map((months) => {
    const azureUsd = azureForecastUsd[months];
    const apiUsd = Math.round(state.apiMonthlyBudgetUsd * months * 100) / 100;
    const additionalUsd = Math.round(state.additionalMonthlyCostsUsd * months * 100) / 100;
    const plannedUsd = Math.round((azureUsd + apiUsd + additionalUsd) * 100) / 100;
    const safeTargetUsd = Math.ceil(plannedUsd * (1 + state.contingencyPercent / 100));
    const creditedApiUsd = Math.min(state.apiCreditBalanceUsd, apiUsd);
    return { months, azureUsd, apiUsd, additionalUsd, plannedUsd, safeTargetUsd, cashToEarmarkUsd: Math.max(0, Math.ceil(safeTargetUsd - creditedApiUsd)) };
  });
}

export function monthExpenseTotal(state: OperatingBudgetState, month: string, category?: OperatingExpenseCategory): number {
  return Math.round(state.expenses
    .filter((expense) => expense.date.startsWith(month) && (!category || expense.category === category))
    .reduce((total, expense) => total + expense.amountUsd, 0) * 100) / 100;
}

export function budgetUsagePercent(spentUsd: number, budgetUsd: number): number {
  if (budgetUsd <= 0) return spentUsd > 0 ? 100 : 0;
  return Math.round(spentUsd / budgetUsd * 100);
}

export function budgetAlertLevel(percent: number): 'ok' | 'watch' | 'warning' | 'critical' {
  if (percent >= 100) return 'critical';
  if (percent >= 90) return 'warning';
  if (percent >= 75) return 'watch';
  return 'ok';
}

export function operatingBudgetEnabled(environment: Record<string, unknown>): boolean {
  return environment.DEV === true || environment.VITE_FORGE_OPERATIONS_ENABLED === 'true';
}
