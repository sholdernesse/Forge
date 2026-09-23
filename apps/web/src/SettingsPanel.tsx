import { useState } from 'react';
import { Download, RefreshCw, RotateCcw, Settings, ShieldCheck, Trash2, X } from 'lucide-react';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface Props { onClose(): void; onGeneratePlan(): void; onReset(): void; onExport(): void; onDelete(): Promise<void>; canDeleteCloud: boolean; }

export function SettingsPanel({ onClose, onGeneratePlan, onReset, onExport, onDelete, canDeleteCloud }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const dialogRef = useAccessibleDialog(onClose);
  return <div className="workout-backdrop" onMouseDown={onClose}>
    <section ref={dialogRef} className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <header><div className="settings-icon"><Settings size={21} /></div><div><span className="section-label">DATA & PLAN CONTROLS</span><h2 id="settings-title">Forge settings</h2></div><button className="icon-button" onClick={onClose} aria-label="Close settings"><X size={20} /></button></header>
      <div className="settings-action"><RefreshCw size={21} /><span><b>Generate a new plan</b><small>Re-run today’s adaptive planner and discard workout completion state. Your check-ins, food, and history remain.</small></span><button onClick={() => { onGeneratePlan(); onClose(); }}>Generate</button></div>
      <div className="settings-safety"><ShieldCheck size={18} /><span>Active workouts are normally locked. Generating a new plan is an explicit override.</span></div>
      <div className="settings-action"><Download size={21} /><span><b>Export my Forge data</b><small>Download a portable JSON copy of check-ins, training, nutrition, hydration, preferences, and Coach history.</small></span><button onClick={onExport}>Export</button></div>
      <div className="settings-action danger"><RotateCcw size={21} /><span><b>Reset this device</b><small>Remove browser-local check-ins, workouts, food logs, favorites, and schedule choices. A signed-in cloud copy is not deleted.</small></span>{confirmReset ? <button onClick={onReset}>Yes, reset local data</button> : <button onClick={() => setConfirmReset(true)}>Reset</button>}</div>
      {confirmReset && <button className="cancel-reset" onClick={() => setConfirmReset(false)}>Cancel reset</button>}
      <div className="settings-action danger"><Trash2 size={21} /><span><b>Delete synchronized Forge data</b><small>Delete this signed-in account’s cloud dashboard, then remove this device’s local copy and sign out.</small></span><button disabled={!canDeleteCloud || deleting} onClick={() => setConfirmDelete(true)}>{canDeleteCloud ? 'Delete data' : 'Sign in required'}</button></div>
      {confirmDelete && <div className="settings-confirm" role="alertdialog" aria-labelledby="delete-data-title"><p id="delete-data-title"><b>This cannot be undone.</b> Export first if you want a copy. Type <strong>DELETE</strong> to confirm.</p><input autoFocus value={deleteText} onChange={(event) => setDeleteText(event.target.value)} aria-label="Type DELETE to confirm" placeholder="DELETE" />{deleteError && <small role="alert">{deleteError}</small>}<div><button disabled={deleting} onClick={() => { setConfirmDelete(false); setDeleteText(''); setDeleteError(''); }}>Cancel</button><button className="confirm-reset" disabled={deleteText !== 'DELETE' || deleting} onClick={() => { setDeleting(true); setDeleteError(''); void onDelete().catch(() => { setDeleting(false); setDeleteError('Deletion could not be confirmed. Your local data is intact and cloud sync is paused; retry when online.'); }); }}>{deleting ? 'Deleting…' : 'Delete permanently'}</button></div></div>}
    </section>
  </div>;
}
