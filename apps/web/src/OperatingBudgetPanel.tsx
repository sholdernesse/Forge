import { useMemo, useState } from 'react';
import { CircleDollarSign, CreditCard, Plus, Trash2, X } from 'lucide-react';
import { budgetAlertLevel, budgetUsagePercent, loadOperatingBudget, monthExpenseTotal, operatingBudgetForecast, saveOperatingBudget, type OperatingBudgetState, type OperatingExpenseCategory } from './operatingBudget.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface Props { onClose(): void; }

function localDateKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function money(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: value % 1 ? 2 : 0 });
}

const categories: Array<[OperatingExpenseCategory, string]> = [
  ['ai', 'AI / OpenAI'],
  ['azure', 'Azure hosting'],
  ['identity', 'Identity'],
  ['monitoring', 'Monitoring'],
  ['storage', 'Storage'],
  ['domain', 'Domain / DNS'],
  ['other', 'Other'],
];

export function OperatingBudgetPanel({ onClose }: Props) {
  const dialogRef = useAccessibleDialog(onClose);
  const [state, setState] = useState<OperatingBudgetState>(() => loadOperatingBudget(window.localStorage));
  const [expenseDate, setExpenseDate] = useState(localDateKey());
  const [expenseCategory, setExpenseCategory] = useState<OperatingExpenseCategory>('ai');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const forecast = useMemo(() => operatingBudgetForecast(state), [state]);
  const month = localDateKey().slice(0, 7);
  const apiSpent = monthExpenseTotal(state, month, 'ai');
  const totalSpent = monthExpenseTotal(state, month);
  const apiUsage = budgetUsagePercent(apiSpent, state.apiMonthlyBudgetUsd);
  const alert = budgetAlertLevel(apiUsage);
  const baselineMonthly = 22 + state.apiMonthlyBudgetUsd + state.additionalMonthlyCostsUsd;

  function persist(next: OperatingBudgetState) {
    setState(next);
    saveOperatingBudget(window.localStorage, next);
  }

  function updateMoney(field: 'apiMonthlyBudgetUsd' | 'apiCreditBalanceUsd' | 'additionalMonthlyCostsUsd' | 'contingencyPercent', value: string) {
    const amount = Math.max(0, Number(value) || 0);
    persist({ ...state, [field]: Math.round(amount * 100) / 100 });
  }

  function addExpense() {
    const amountUsd = Math.round(Number(expenseAmount) * 100) / 100;
    if (!Number.isFinite(amountUsd) || amountUsd <= 0 || !expenseDate) return;
    const expense = { id: crypto.randomUUID(), date: expenseDate, category: expenseCategory, amountUsd, note: expenseNote.trim().slice(0, 160) };
    persist({ ...state, expenses: [...state.expenses, expense].slice(-250) });
    setExpenseAmount('');
    setExpenseNote('');
  }

  return <div className="workout-backdrop" onMouseDown={onClose}>
    <section ref={dialogRef} className="operating-budget-panel" role="dialog" aria-modal="true" aria-labelledby="operating-budget-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <header><div className="budget-icon"><CircleDollarSign size={22} /></div><div><span className="section-label">FOUNDER OPERATIONS</span><h2 id="operating-budget-title">Forge operating budget</h2><p>Track cash runway separately from athlete data.</p></div><button className="icon-button" onClick={onClose} aria-label="Close operating budget"><X size={20} /></button></header>

      <div className="budget-summary">
        <article><small>Baseline month</small><strong>{money(baselineMonthly)}</strong><span>Azure plan + API allowance</span></article>
        <article className={`budget-${alert}`}><small>AI spend this month</small><strong>{money(apiSpent)} <em>/ {money(state.apiMonthlyBudgetUsd)}</em></strong><span>{apiUsage}% of allowance</span></article>
        <article><small>API credit balance</small><strong>{money(state.apiCreditBalanceUsd)}</strong><span>Prepaid and available</span></article>
        <article><small>Total logged this month</small><strong>{money(totalSpent)}</strong><span>All operating categories</span></article>
      </div>

      <section className="budget-controls" aria-labelledby="budget-controls-title"><div><span className="section-label">COST CONTROLS</span><h3 id="budget-controls-title">Monthly guardrails</h3></div><div className="budget-fields">
        <label>OpenAI monthly allowance <span>$</span><input type="number" min="0" step="1" value={state.apiMonthlyBudgetUsd} onChange={(event) => updateMoney('apiMonthlyBudgetUsd', event.target.value)} /></label>
        <label>OpenAI credit balance <span>$</span><input type="number" min="0" step="0.01" value={state.apiCreditBalanceUsd} onChange={(event) => updateMoney('apiCreditBalanceUsd', event.target.value)} /></label>
        <label>Other monthly costs <span>$</span><input type="number" min="0" step="1" value={state.additionalMonthlyCostsUsd} onChange={(event) => updateMoney('additionalMonthlyCostsUsd', event.target.value)} /></label>
        <label>Contingency buffer <span>%</span><input type="number" min="0" max="100" step="1" value={state.contingencyPercent} onChange={(event) => updateMoney('contingencyPercent', event.target.value)} /></label>
      </div><div className="budget-thresholds"><span>Alerts</span><b>50% review</b><b>75% watch</b><b>90% warning</b><b>100% stop</b></div></section>

      <section className="budget-forecast" aria-labelledby="budget-forecast-title"><div><span className="section-label">CASH RUNWAY</span><h3 id="budget-forecast-title">3, 6, 9 and 12-month forecast</h3><p>Azure follows the accepted staged-release forecast. API and other allowances scale monthly.</p></div><div className="budget-table" role="table" aria-label="Forge operating cost forecast"><div className="budget-table-header" role="row"><span>Horizon</span><span>Azure</span><span>OpenAI</span><span>Planned</span><span>Safe target</span><span>Earmark now</span></div>{forecast.map((row) => <div role="row" key={row.months}><b>{row.months} months</b><span>{money(row.azureUsd)}</span><span>{money(row.apiUsd)}</span><span>{money(row.plannedUsd)}</span><strong>{money(row.safeTargetUsd)}</strong><strong>{money(row.cashToEarmarkUsd)}</strong></div>)}</div></section>

      <section className="expense-entry" aria-labelledby="expense-entry-title"><div><span className="section-label">ACTUAL SPEND</span><h3 id="expense-entry-title">Log an operating expense</h3></div><div className="expense-form"><label>Date<input type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} /></label><label>Category<select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value as OperatingExpenseCategory)}>{categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Amount<input type="number" min="0.01" step="0.01" placeholder="5.00" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} /></label><label className="expense-note">Note<input maxLength={160} placeholder="API credit purchase" value={expenseNote} onChange={(event) => setExpenseNote(event.target.value)} /></label><button disabled={!expenseAmount || Number(expenseAmount) <= 0} onClick={addExpense}><Plus size={16} /> Add expense</button></div>
        <div className="expense-list">{state.expenses.length ? [...state.expenses].reverse().slice(0, 12).map((expense) => <div key={expense.id}><CreditCard size={16} /><span><b>{expense.note || categories.find(([value]) => value === expense.category)?.[1]}</b><small>{expense.date} · {expense.category}</small></span><strong>{money(expense.amountUsd)}</strong><button aria-label={`Delete ${expense.note || expense.category} expense`} onClick={() => persist({ ...state, expenses: state.expenses.filter((item) => item.id !== expense.id) })}><Trash2 size={15} /></button></div>) : <p>No operating expenses logged yet. Add the $5 OpenAI credit purchase after payment clears.</p>}</div>
      </section>

      <footer>Stored only on this device. It is excluded from athlete sync, account export, and public application data.</footer>
    </section>
  </div>;
}
