import { useMemo, useState } from 'react';
import { Dumbbell, Search, Sparkles, X } from 'lucide-react';
import { ExerciseGuide } from './ExerciseGuide.js';
import { exerciseGuides, type ExerciseGuide as ExerciseGuideModel } from './exerciseGuides.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

type LibraryFilter = 'all' | 'animated';

interface MovementLibraryProps {
  onClose(): void;
}

export function MovementLibrary({ onClose }: MovementLibraryProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [selected, setSelected] = useState<ExerciseGuideModel | null>(null);
  const dialogRef = useAccessibleDialog(onClose);
  const guides = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return exerciseGuides().filter((guide) => {
      if (filter === 'animated' && !guide.motionId) return false;
      return !normalized || [
        guide.title,
        ...guide.primaryMuscles,
        ...guide.secondaryMuscles,
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [filter, query]);

  return <>
    <div className="movement-library-backdrop" onMouseDown={onClose}>
      <section ref={dialogRef} className="movement-library" role="dialog" aria-modal="true" aria-labelledby="movement-library-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span className="section-label">LEARN ANYTIME</span><h2 id="movement-library-title">Movement Library</h2><p>Explore form without changing today’s adaptive workout.</p></div>
          <button onClick={onClose} aria-label="Close movement library"><X size={20} /></button>
        </header>
        <div className="movement-library-controls">
          <label><Search size={16} /><span className="sr-only">Search movements or muscles</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movement or muscle" /></label>
          <div role="group" aria-label="Movement guide filter">
            <button className={filter === 'all' ? 'active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All guides</button>
            <button className={filter === 'animated' ? 'active' : ''} aria-pressed={filter === 'animated'} onClick={() => setFilter('animated')}><Sparkles size={14} /> Animated</button>
          </div>
        </div>
        <div className="movement-library-summary"><span>{guides.length} guide{guides.length === 1 ? '' : 's'}</span><small>Viewing a guide never changes your program.</small></div>
        <div className="movement-library-grid">
          {guides.map((guide) => <button key={guide.exerciseId} onClick={() => setSelected(guide)}>
            <span className="movement-library-visual standardized"><span className="movement-library-figure" aria-hidden="true"><i /><i /><i /></span><strong><Sparkles size={13} /> Forge motion</strong></span>
            <span className="movement-library-copy"><b>{guide.title}</b><small>Primary · {guide.primaryMuscles.join(', ')}</small><em>Also works {guide.secondaryMuscles.join(', ')}</em></span>
            <Dumbbell size={18} />
          </button>)}
        </div>
        {!guides.length && <div className="empty-state">No movement guides match that search.</div>}
      </section>
    </div>
    {selected && <ExerciseGuide guide={selected} onClose={() => setSelected(null)} />}
  </>;
}
