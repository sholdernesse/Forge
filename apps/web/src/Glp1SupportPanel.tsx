import { useMemo, useState } from 'react';
import { Dumbbell, HeartPulse, Save, ShieldAlert, Utensils, X } from 'lucide-react';
import { defaultGlp1Support, glp1TrainingGuidance, type Glp1SideEffect, type Glp1SupportProfile } from './glp1Support.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface Props {
  profile?: Glp1SupportProfile;
  onSave(profile: Glp1SupportProfile): void;
  onClose(): void;
}

const medicationLabels: Array<[Glp1SupportProfile['medication'], string]> = [
  ['semaglutide', 'Semaglutide (Ozempic / Wegovy / Rybelsus)'],
  ['tirzepatide', 'Tirzepatide (Mounjaro / Zepbound)'],
  ['liraglutide', 'Liraglutide (Victoza / Saxenda)'],
  ['dulaglutide', 'Dulaglutide (Trulicity)'],
  ['other', 'Other prescribed GLP-1 medicine'],
];

const sideEffectLabels: Array<[Glp1SideEffect, string]> = [
  ['nausea', 'Nausea'], ['vomiting', 'Vomiting'], ['diarrhea', 'Diarrhea'], ['constipation', 'Constipation'],
  ['abdominal-pain', 'Abdominal pain'], ['dizziness', 'Dizziness'], ['fatigue', 'Fatigue'], ['reduced-appetite', 'Very low appetite'],
];

export function Glp1SupportPanel({ profile, onSave, onClose }: Props) {
  const dialogRef = useAccessibleDialog(onClose);
  const [draft, setDraft] = useState<Glp1SupportProfile>(() => profile ?? defaultGlp1Support());
  const guidance = useMemo(() => glp1TrainingGuidance(draft), [draft]);

  function toggleSideEffect(sideEffect: Glp1SideEffect) {
    const selected = draft.sideEffects.includes(sideEffect);
    setDraft({ ...draft, sideEffects: selected ? draft.sideEffects.filter((item) => item !== sideEffect) : [...draft.sideEffects, sideEffect] });
  }

  function save() {
    onSave({ ...draft, prescribedDose: draft.prescribedDose.trim().slice(0, 80), notes: draft.notes.trim().slice(0, 500), updatedAt: new Date().toISOString() });
    onClose();
  }

  return <div className="workout-backdrop" onMouseDown={onClose}>
    <section ref={dialogRef} className="glp1-panel" role="dialog" aria-modal="true" aria-labelledby="glp1-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <header><div className="glp1-icon"><HeartPulse size={22} /></div><div><span className="section-label">PERSONALIZATION</span><h2 id="glp1-title">GLP-1 support</h2><p>Personalize training around medication tolerance while protecting recovery and strength.</p></div><button className="icon-button" onClick={onClose} aria-label="Close GLP-1 support"><X size={20} /></button></header>

      <div className="glp1-enable"><span><b>Use GLP-1 support</b><small>Opt in to medication, dose, side-effect, and workout adaptations.</small></span><label className="glp1-switch"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} /><span aria-hidden="true" /></label></div>

      {draft.enabled && <>
        <section className="glp1-section"><div><span className="section-label">PRESCRIPTION LOG</span><h3>Medication and dose</h3></div><div className="glp1-fields">
          <label>Medication<select value={draft.medication} onChange={(event) => setDraft({ ...draft, medication: event.target.value as Glp1SupportProfile['medication'] })}>{medicationLabels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Prescribed dose<input value={draft.prescribedDose} maxLength={80} placeholder="As written on your prescription" onChange={(event) => setDraft({ ...draft, prescribedDose: event.target.value })} /></label>
          <label>Schedule<select value={draft.schedule} onChange={(event) => setDraft({ ...draft, schedule: event.target.value as Glp1SupportProfile['schedule'] })}><option value="weekly">Weekly</option><option value="daily">Daily</option><option value="other">Other</option></select></label>
          <label>Last dose<input type="date" value={draft.lastDoseDate ?? ''} onChange={(event) => {
            const value = event.target.value;
            if (value) setDraft({ ...draft, lastDoseDate: value });
            else {
              const { lastDoseDate: _lastDoseDate, ...withoutLastDoseDate } = draft;
              setDraft(withoutLastDoseDate);
            }
          }} /></label>
        </div><label className="glp1-check"><input type="checkbox" checked={draft.doseChangedRecently} onChange={(event) => setDraft({ ...draft, doseChangedRecently: event.target.checked })} /> My prescribed dose changed within the last four weeks</label>
        <div className="glp1-dose-safety"><ShieldAlert size={17} /><span><b>Follow your prescription exactly.</b> Forge records the dose but never recommends increasing, decreasing, delaying, or skipping it. Confirm changes with your prescriber.</span></div></section>

        <section className="glp1-section"><div><span className="section-label">TOLERANCE CHECK</span><h3>Current side effects</h3><p>Select what is affecting you now—not every symptom you have ever experienced.</p></div><div className="glp1-symptoms">{sideEffectLabels.map(([value, label]) => <button type="button" className={draft.sideEffects.includes(value) ? 'active' : ''} aria-pressed={draft.sideEffects.includes(value)} onClick={() => toggleSideEffect(value)} key={value}>{label}</button>)}</div><label className="glp1-severity">Overall severity<select value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value as Glp1SupportProfile['severity'] })}><option value="none">None</option><option value="mild">Mild — noticeable, normal activity is comfortable</option><option value="moderate">Moderate — affects food, fluids, or training</option><option value="severe">Severe — cannot train normally or keep fluids down</option></select></label>
        <label className="glp1-notes">Notes<textarea value={draft.notes} maxLength={500} placeholder="Timing, food tolerance, hydration, or a note for your clinician" onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label></section>

        <section className={`glp1-guidance ${guidance.mode}`} aria-live="polite"><div><Dumbbell size={19} /><span><b>{guidance.headline}</b><small>{guidance.detail}</small></span></div><div><Utensils size={19} /><span><b>Protect fuel and hydration</b><small>Prioritize protein across tolerable meals, drink fluids regularly, and do not train if you cannot keep fluids down.</small></span></div>{guidance.needsClinicalReview && <p role="alert"><ShieldAlert size={18} /><span>Stop exercise and seek prompt medical guidance for severe or persistent abdominal pain, repeated vomiting, fainting, or signs of dehydration. Use emergency services for an emergency.</span></p>}</section>
      </>}

      <footer><p>Forge provides fitness support, not diagnosis or medication management. Medication details are included in your private Forge data and account export.</p><button onClick={save}><Save size={17} /> Save personalization</button></footer>
    </section>
  </div>;
}
