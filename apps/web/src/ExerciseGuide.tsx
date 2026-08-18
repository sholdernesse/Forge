import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, ShieldAlert, TimerReset, Wind, X } from 'lucide-react';
import type { ExerciseGuide as ExerciseGuideModel } from './exerciseGuides.js';
import { ExerciseMotion } from './ExerciseMotion.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface ExerciseGuideProps {
  guide: ExerciseGuideModel;
  onClose(): void;
}

type GuideTab = 'setup' | 'movement' | 'mistakes' | 'check';

export function ExerciseGuide({ guide, onClose }: ExerciseGuideProps) {
  const [tab, setTab] = useState<GuideTab>('setup');
  const [discomfort, setDiscomfort] = useState(false);
  const dialogRef = useAccessibleDialog(onClose);
  const content = tab === 'setup'
    ? guide.setup
    : tab === 'movement'
      ? guide.movement
      : tab === 'mistakes'
        ? guide.mistakes
        : guide.selfChecks;

  return <div className="form-guide-backdrop" onMouseDown={onClose}>
    <section ref={dialogRef} className="form-guide" role="dialog" aria-modal="true" aria-labelledby="form-guide-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span className="section-label">VISUAL FORM GUIDE</span><h2 id="form-guide-title">{guide.title}</h2></div><button onClick={onClose} aria-label="Close form guide"><X size={20} /></button></header>
      <ExerciseMotion motionId={guide.motionId} title={guide.title} primaryMuscles={guide.primaryMuscles} secondaryMuscles={guide.secondaryMuscles} />
      <div className="guide-performance" aria-label="Movement rhythm">
        <span><TimerReset size={16} /><span><b>Tempo</b><small>{guide.tempo}</small></span></span>
        <span><Wind size={16} /><span><b>Breathing</b><small>{guide.breathing}</small></span></span>
      </div>
      <nav className="guide-tabs" aria-label="Exercise guide sections">
        <button className={tab === 'setup' ? 'active' : ''} onClick={() => setTab('setup')}>Setup</button>
        <button className={tab === 'movement' ? 'active' : ''} onClick={() => setTab('movement')}>Movement</button>
        <button className={tab === 'check' ? 'active' : ''} onClick={() => setTab('check')}>Self-check</button>
        <button className={tab === 'mistakes' ? 'active' : ''} onClick={() => setTab('mistakes')}>Avoid</button>
      </nav>
      <ol className={`guide-steps ${tab === 'mistakes' ? 'mistakes' : ''}`}>{content.map((item) => <li key={item}>{tab === 'mistakes' ? <AlertTriangle size={17} /> : tab === 'check' ? <Eye size={17} /> : <CheckCircle2 size={17} />}<span>{item}</span></li>)}</ol>
      <div className="guide-safety"><ShieldAlert size={18} /><span>{guide.safetyNote}</span></div>
      {discomfort ? <div className="discomfort-advice" role="alert"><b>Stop this exercise for now.</b><span>Reduce the load or range only if normal movement is comfortable. Choose another movement or seek qualified medical guidance if pain is sharp, worsening, or persistent.</span></div> : <button className="discomfort-button" onClick={() => setDiscomfort(true)}>I feel discomfort</button>}
    </section>
  </div>;
}
