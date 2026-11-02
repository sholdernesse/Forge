import { useEffect, useMemo, useRef, useState } from 'react';
import { Dumbbell, Search, Sparkles, X } from 'lucide-react';
import { ExerciseGuide } from './ExerciseGuide.js';
import type { ExerciseGuide as ExerciseGuideModel } from './exerciseGuides.js';
import { equipmentOptions, exerciseLookupEntries, findExercises, muscleOptions, type ExerciseEquipment, type ExerciseMuscle } from './exerciseLookup.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface MovementLibraryProps {
  onClose(): void;
}

export function MovementLibrary({ onClose }: MovementLibraryProps) {
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState<ExerciseEquipment | 'all'>('all');
  const [muscle, setMuscle] = useState<ExerciseMuscle | 'all'>('all');
  const [selected, setSelected] = useState<ExerciseGuideModel | null>(null);
  const dialogRef = useAccessibleDialog(onClose);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { searchRef.current?.focus(); }, []);
  const entries = useMemo(exerciseLookupEntries, []);
  const results = useMemo(() => findExercises(entries, query, equipment, muscle), [entries, query, equipment, muscle]);
  function clearFilters() {
    setQuery(''); setEquipment('all'); setMuscle('all');
    searchRef.current?.focus();
  }

  return <>
    <div className="movement-library-backdrop" onMouseDown={onClose}>
      <section ref={dialogRef} className="movement-library" role="dialog" aria-modal="true" aria-labelledby="movement-library-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span className="section-label">LEARN ANYTIME</span><h2 id="movement-library-title">Exercise lookup</h2><p>Look up an exercise from your plan or explore something different.</p></div>
          <button onClick={onClose} aria-label="Close exercise lookup"><X size={20} /></button>
        </header>
        <div className="movement-library-controls">
          <label><Search size={16} /><span className="sr-only">Search exercises, common names, or muscles</span><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try RDL, DB shoulder press, or chest" /></label>
          <div className="exercise-lookup-filters">
            <label>Equipment<select aria-label="Equipment" value={equipment} onChange={event => setEquipment(event.target.value as ExerciseEquipment | 'all')}><option value="all">All equipment</option>{equipmentOptions.map(option => <option key={option}>{option}</option>)}</select></label>
            <label>Muscles worked<select aria-label="Muscles worked" value={muscle} onChange={event => setMuscle(event.target.value as ExerciseMuscle | 'all')}><option value="all">All muscles</option>{muscleOptions.map(option => <option key={option}>{option}</option>)}</select></label>
            {(query || equipment !== 'all' || muscle !== 'all') && <button onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>
        <div className="movement-library-summary"><span role="status" aria-live="polite">{results.length} of {entries.length} exercises</span><small>Form and muscle views · Lookup only; your workout stays unchanged.</small></div>
        <div className="movement-library-grid">
          {results.map(({ guide, equipment: equipmentName }) => <button key={guide.exerciseId} onClick={() => setSelected(guide)} aria-label={`View ${guide.title} guide`}>
            <span className="movement-library-visual"><img src={guide.imageSrc} alt="" loading="lazy" decoding="async" /><strong><Sparkles size={13} /> AI form guide</strong></span>
            <span className="movement-library-copy"><b>{guide.title}</b><span className="exercise-equipment">{equipmentName}</span><small>Primary · {guide.primaryMuscles.join(', ')}</small><em>Also works {guide.secondaryMuscles.join(', ')}</em></span>
            <Dumbbell size={18} />
          </button>)}
        </div>
        {!results.length && <div className="empty-state"><p>No exercise guides match. Try another name or clear your filters. This library does not yet cover every exercise.</p><button className="movement-library-button" onClick={clearFilters}>Show all {entries.length} exercises</button></div>}
      </section>
    </div>
    {selected && <ExerciseGuide guide={selected} onClose={() => setSelected(null)} />}
  </>;
}
