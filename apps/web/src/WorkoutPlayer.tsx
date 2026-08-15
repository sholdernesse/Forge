import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Clock3, Eye, Minus, Plus, Sparkles, Trophy, X } from 'lucide-react';
import {
  completedSetCount,
  totalSetCount,
  type WorkoutSession,
  type WorkoutSetLog,
} from './workoutSession.js';
import { progressionTarget, type ExercisePerformance } from './progression.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';
import { exerciseGuide, type ExerciseGuide as ExerciseGuideModel } from './exerciseGuides.js';
import { ExerciseGuide } from './ExerciseGuide.js';

interface WorkoutPlayerProps {
  session: WorkoutSession;
  onChange(session: WorkoutSession): void;
  onClose(): void;
  onFinish(): void;
  exerciseHistory: ExercisePerformance[];
}

export function WorkoutPlayer({ session, onChange, onClose, onFinish, exerciseHistory }: WorkoutPlayerProps) {
  const firstIncomplete = session.exercises.findIndex((exercise) => exercise.sets.some((set) => !set.completedAt));
  const [activeExercise, setActiveExercise] = useState(Math.max(0, firstIncomplete));
  const [restRemaining, setRestRemaining] = useState(0);
  const [activeGuide, setActiveGuide] = useState<ExerciseGuideModel | null>(null);
  const dialogRef = useAccessibleDialog(() => activeGuide ? setActiveGuide(null) : onClose());
  const completed = completedSetCount(session);
  const total = totalSetCount(session);
  const progress = Math.round((completed / total) * 100);

  useEffect(() => {
    if (restRemaining <= 0) return undefined;
    const timer = window.setInterval(() => setRestRemaining((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [restRemaining]);

  const elapsed = useMemo(() => {
    if (!session.startedAt) return '0:00';
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(session.startedAt)) / 60_000));
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  }, [session.startedAt, completed]);

  function updateSet(exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSetLog>) {
    onChange({
      ...session,
      exercises: session.exercises.map((exercise, currentExercise) => currentExercise === exerciseIndex
        ? { ...exercise, sets: exercise.sets.map((set, currentSet) => currentSet === setIndex ? { ...set, ...patch } : set) }
        : exercise),
    });
  }

  function toggleSet(exerciseIndex: number, setIndex: number) {
    const exercise = session.exercises[exerciseIndex]!;
    const set = exercise.sets[setIndex]!;
    const nextSet: WorkoutSetLog = set.completedAt
      ? Object.fromEntries(Object.entries(set).filter(([key]) => key !== 'completedAt')) as WorkoutSetLog
      : { ...set, completedAt: new Date().toISOString() };
    onChange({
      ...session,
      exercises: session.exercises.map((currentExercise, currentExerciseIndex) => currentExerciseIndex === exerciseIndex
        ? { ...currentExercise, sets: currentExercise.sets.map((currentSet, currentSetIndex) => currentSetIndex === setIndex ? nextSet : currentSet) }
        : currentExercise),
    });
    if (!set.completedAt) setRestRemaining(exercise.restSeconds);
  }

  return <div className="workout-backdrop" onMouseDown={onClose}>
    <section ref={dialogRef} className="workout-player" role="dialog" aria-modal="true" aria-labelledby="workout-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <header className="workout-player-header">
        <button className="icon-button" onClick={onClose} aria-label="Close workout"><X size={21} /></button>
        <div><span className="section-label">ACTIVE WORKOUT</span><h2 id="workout-title">{session.title}</h2></div>
        <div className="elapsed"><Clock3 size={17} /><span>{elapsed}</span></div>
      </header>

      <div className="workout-progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="workout-progress-label"><span>{completed} of {total} sets complete</span><strong>{progress}%</strong></div>

      {restRemaining > 0 && <div className="rest-timer"><Clock3 size={18} /><span><b>Rest</b><small>Next set when ready</small></span><strong>{Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}</strong><button onClick={() => setRestRemaining(0)}>Skip</button></div>}

      <div className="exercise-stack">
        {session.exercises.map((exercise, exerciseIndex) => {
          const exerciseComplete = exercise.sets.every((set) => set.completedAt);
          const expanded = exerciseIndex === activeExercise;
          const target = progressionTarget(exerciseHistory, exercise.id);
          const guide = exerciseGuide(exercise.id);
          return <article className={`exercise-card ${expanded ? 'expanded' : ''}`} key={exercise.id}>
            <button className="exercise-heading" onClick={() => setActiveExercise(exerciseIndex)}>
              <span className={`exercise-number ${exerciseComplete ? 'complete' : ''}`}>{exerciseComplete ? <Check size={17} /> : exerciseIndex + 1}</span>
              <span><strong>{exercise.name}</strong><small>{exercise.sets.length} set{exercise.sets.length === 1 ? '' : 's'} · {exercise.detail}</small></span>
              <ChevronDown size={19} />
            </button>
            {expanded && <div className="set-table">
              {guide && <button className="watch-form" onClick={() => setActiveGuide(guide)}><Eye size={17} /><span><b>Watch form</b><small>See setup, movement, and common mistakes</small></span></button>}
              {target && <div className="progression-tip"><Sparkles size={16} /><span><b>Forge target: {target.loadKg} kg × {target.reps}</b><small>{target.reason}</small></span><button onClick={() => onChange({ ...session, exercises: session.exercises.map((item, index) => index === exerciseIndex ? { ...item, sets: item.sets.map((set) => ({ ...set, reps: target.reps, loadKg: target.loadKg })) } : item) })}>Apply</button></div>}
              <div className="set-row set-labels"><span>SET</span><span>{exercise.mode === 'duration' ? 'MINUTES' : 'REPS'}</span><span>{exercise.mode === 'duration' ? 'PACE' : 'LOAD KG'}</span><span>DONE</span></div>
              {exercise.sets.map((set, setIndex) => <div className={`set-row ${set.completedAt ? 'done' : ''}`} key={set.id}>
                <strong>{setIndex + 1}</strong>
                <div className="stepper"><button onClick={() => updateSet(exerciseIndex, setIndex, exercise.mode === 'duration' ? { durationMinutes: Math.max(1, (set.durationMinutes ?? 1) - 1) } : { reps: Math.max(1, (set.reps ?? 1) - 1) })}><Minus size={14} /></button><input aria-label={`${exercise.name} set ${setIndex + 1} ${exercise.mode === 'duration' ? 'minutes' : 'reps'}`} type="number" value={exercise.mode === 'duration' ? set.durationMinutes : set.reps} onChange={(event) => updateSet(exerciseIndex, setIndex, exercise.mode === 'duration' ? { durationMinutes: Number(event.target.value) } : { reps: Number(event.target.value) })} /><button onClick={() => updateSet(exerciseIndex, setIndex, exercise.mode === 'duration' ? { durationMinutes: (set.durationMinutes ?? 0) + 1 } : { reps: (set.reps ?? 0) + 1 })}><Plus size={14} /></button></div>
                {exercise.mode === 'reps' ? <input className="load-input" aria-label={`${exercise.name} set ${setIndex + 1} load`} type="number" min="0" step="2.5" value={set.loadKg ?? 0} onChange={(event) => updateSet(exerciseIndex, setIndex, { loadKg: Number(event.target.value) })} /> : <span className="pace-label">Zone 2</span>}
                <button className="set-check" onClick={() => toggleSet(exerciseIndex, setIndex)} aria-label={`Mark ${exercise.name} set ${setIndex + 1} ${set.completedAt ? 'incomplete' : 'complete'}`}><Check size={17} /></button>
              </div>)}
            </div>}
          </article>;
        })}
      </div>

      <footer className="workout-footer">
        <div><Trophy size={20} /><span><b>Finish when the work is done</b><small>Your training load will update Today.</small></span></div>
        <button disabled={completed === 0} onClick={onFinish}>Finish workout <Check size={18} /></button>
      </footer>
      {activeGuide && <ExerciseGuide guide={activeGuide} onClose={() => setActiveGuide(null)} />}
    </section>
  </div>;
}
