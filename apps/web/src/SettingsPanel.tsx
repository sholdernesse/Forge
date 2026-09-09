import { useState } from 'react';
import { RefreshCw, RotateCcw, Settings, ShieldCheck, X } from 'lucide-react';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface Props { onClose(): void; onGeneratePlan(): void; onReset(): void; }

export function SettingsPanel({ onClose, onGeneratePlan, onReset }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const dialogRef = useAccessibleDialog(onClose);
  return <div className="workout-backdrop" onMouseDown={onClose}>
    <section ref={dialogRef} className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <header><div className="settings-icon"><Settings size={21} /></div><div><span className="section-label">PROTOTYPE CONTROLS</span><h2 id="settings-title">Forge settings</h2></div><button className="icon-button" onClick={onClose} aria-label="Close settings"><X size={20} /></button></header>
      <div className="settings-action"><RefreshCw size={21} /><span><b>Generate a new plan</b><small>Re-run today’s adaptive planner and discard workout completion state. Your check-ins, food, and history remain.</small></span><button onClick={() => { onGeneratePlan(); onClose(); }}>Generate</button></div>
      <div className="settings-safety"><ShieldCheck size={18} /><span>Active workouts are normally locked. Generating a new plan is an explicit override.</span></div>
      <div className="settings-action danger"><RotateCcw size={21} /><span><b>Reset prototype data</b><small>Remove all browser-local check-ins, workouts, food logs, favorites, and schedule choices.</small></span>{confirmReset ? <button onClick={onReset}>Yes, reset all</button> : <button onClick={() => setConfirmReset(true)}>Reset</button>}</div>
      {confirmReset && <button className="cancel-reset" onClick={() => setConfirmReset(false)}>Cancel reset</button>}
    </section>
  </div>;
}
