import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Clock3, Eye, Minus, Plus, Repeat2, Sparkles, Trophy, X } from 'lucide-react';
import {
  addWarmupSet,
  addWorkoutSet,
  adjustWorkoutRest,
  applyWorkoutSetPatch,
  beginWorkoutRest,
  clearWorkoutRest,
  completedSetCount,
  isWorkingSet,
  nextIncompleteExerciseIndex,
  nextWorkoutStep,
  removeLastWarmupSet,
  removeLastWorkoutSet,
  totalSetCount,
  workoutRestSecondsRemaining,
  type WorkoutDiscomfort,
  type WorkoutFeedback,
  type WorkoutSession,
  type WorkoutSetLog,
} from './workoutSession.js';
import { progressionTarget, type ExercisePerformance } from './progression.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';
import { exerciseGuide, type ExerciseGuide as ExerciseGuideModel } from './exerciseGuides.js';
import { ExerciseGuide } from './ExerciseGuide.js';
import { applyExerciseSubstitution, exerciseSubstitutions } from './exerciseSubstitutions.js';

interface WorkoutPlayerProps {
  session: WorkoutSession;
  onChange(session: WorkoutSession): void;
  onClose(): void;
  onFinish(feedback: WorkoutFeedback): void;
  exerciseHistory: ExercisePerformance[];
}

export function WorkoutPlayer({ session, onChange, onClose, onFinish, exerciseHistory }: WorkoutPlayerProps) {
  const firstIncomplete = session.exercises.findIndex((exercise) => exercise.sets.some((set) => !set.completedAt));
  const [activeExercise, setActiveExercise] = useState(Math.max(0, firstIncomplete));
  const [clock, setClock] = useState(() => Date.now());
  const [activeGuide, setActiveGuide] = useState<ExerciseGuideModel | null>(null);
  const [swapExerciseId, setSwapExerciseId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [perceivedExertion, setPerceivedExertion] = useState(session.feedback?.perceivedExertion ?? 5);
  const [discomfort, setDiscomfort] = useState<WorkoutDiscomfort>(session.feedback?.discomfort ?? 'none');
  const [feedbackNote, setFeedbackNote] = useState(session.feedback?.note ?? '');
  const dialogRef = useAccessibleDialog(() => activeGuide ? setActiveGuide(null) : onClose());
  const completed = completedSetCount(session);
  const total = totalSetCount(session);
  const progress = Math.round((completed / total) * 100);
  const restRemaining = workoutRestSecondsRemaining(session, clock);
  const nextStep = nextWorkoutStep(session, activeExercise);
  const nextGuide = nextStep ? exerciseGuide(nextStep.exerciseId) : undefined;

  useEffect(() => {
    if (restRemaining <= 0) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
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
        ? { ...exercise, sets: exercise.sets.map((set, currentSet) => currentSet === setIndex ? applyWorkoutSetPatch(set, patch) : set) }
        : exercise),
    });
  }

  function toggleSet(exerciseIndex: number, setIndex: number) {
    const exercise = session.exercises[exerciseIndex]!;
    const set = exercise.sets[setIndex]!;
    const nextSet: WorkoutSetLog = set.completedAt
      ? Object.fromEntries(Object.entries(set).filter(([key]) => key !== 'completedAt')) as WorkoutSetLog
      : { ...set, completedAt: new Date().toISOString() };
    const nextSession: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((currentExercise, currentExerciseIndex) => currentExerciseIndex === exerciseIndex
        ? { ...currentExercise, sets: currentExercise.sets.map((currentSet, currentSetIndex) => currentSetIndex === setIndex ? nextSet : currentSet) }
        : currentExercise),
    };
    const nextExercise = set.completedAt ? undefined : nextIncompleteExerciseIndex(nextSession, exerciseIndex);
    onChange(nextExercise === undefined ? nextSession : beginWorkoutRest(nextSession, exercise.restSeconds));
    const exerciseNowComplete = nextSession.exercises[exerciseIndex]!.sets.every((item) => item.completedAt);
    if (!set.completedAt && exerciseNowComplete && nextExercise !== undefined) setActiveExercise(nextExercise);
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

      {restRemaining > 0 && <div className="rest-timer"><Clock3 size={18} /><span><b>Rest</b><small>Next set when ready</small></span><strong role="timer" aria-live="polite">{Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}</strong><div className="rest-actions"><button onClick={() => onChange(adjustWorkoutRest(session, -15))} aria-label="Reduce rest by 15 seconds">−15s</button><button onClick={() => onChange(adjustWorkoutRest(session, 15))} aria-label="Add 15 seconds to rest">+15s</button><button onClick={() => onChange(clearWorkoutRest(session))}>Skip</button></div></div>}

      {nextStep && <section className={`workout-next-step ${nextStep.kind}`} aria-label="Up next">
        <Sparkles size={18} />
        <span><small>UP NEXT · {nextStep.setLabel}</small><b>{nextStep.exerciseName}</b><em>{nextStep.targetLabel}</em>{nextGuide && <small className="next-tempo">TEMPO · {nextGuide.tempo}</small>}</span>
        <div className="next-step-actions">
          {nextStep.exerciseIndex !== activeExercise && <button onClick={() => setActiveExercise(nextStep.exerciseIndex)}>View set</button>}
          {nextGuide && <button onClick={() => setActiveGuide(nextGuide)}><Eye size={13} />Form</button>}
        </div>
      </section>}

      <div className="exercise-stack">
        {session.exercises.map((exercise, exerciseIndex) => {
          const exerciseComplete = exercise.sets.every((set) => set.completedAt);
          const expanded = exerciseIndex === activeExercise;
          const target = progressionTarget(exerciseHistory, exercise.id);
          const guide = exerciseGuide(exercise.id);
          const alternatives = exerciseSubstitutions(exercise.id);
          const hasCompletedSets = exercise.sets.some((set) => set.completedAt);
          const warmupCount = exercise.sets.filter((set) => set.kind === 'warmup').length;
          const removableWarmup = exercise.sets.some((set) => set.kind === 'warmup' && !set.completedAt);
          return <article className={`exercise-card ${expanded ? 'expanded' : ''}`} key={exercise.id}>
            <button className="exercise-heading" onClick={() => setActiveExercise(exerciseIndex)}>
              <span className={`exercise-number ${exerciseComplete ? 'complete' : ''}`}>{exerciseComplete ? <Check size={17} /> : exerciseIndex + 1}</span>
              <span><strong>{exercise.name}</strong><small>{exercise.sets.length} set{exercise.sets.length === 1 ? '' : 's'} · {exercise.detail}</small></span>
              <ChevronDown size={19} />
            </button>
            {expanded && <div className="set-table">
              {exercise.substitutedFromName && <div className="substitution-origin"><Repeat2 size={15} />Swapped from {exercise.substitutedFromName}</div>}
              {guide && <>
                <button className="watch-form" onClick={() => setActiveGuide(guide)}><Eye size={17} /><span><b>Watch AI character form guide</b><small>Compare setup and finishing position before the set</small></span></button>
                <section className="movement-standard" aria-label={`${exercise.name} movement standard`}>
                  <header><span><Repeat2 size={15} />MOVEMENT STANDARD</span><b>{guide.tempo}</b></header>
                  <div>
                    <span><small>1 · START</small><b>{guide.setup[0]}</b></span>
                    <span><small>2 · MOVE</small><b>{guide.movement[0]}</b></span>
                    <span><small>3 · CONTROL</small><b>{guide.selfChecks[2]}</b></span>
                  </div>
                  <p>Use the full comfortable range you can control. Quality stays ahead of load.</p>
                </section>
              </>}
              {alternatives.length > 0 && <>
                <button
                  className="swap-exercise"
                  disabled={hasCompletedSets}
                  onClick={() => setSwapExerciseId(swapExerciseId === exercise.id ? null : exercise.id)}
                  aria-expanded={swapExerciseId === exercise.id}
                ><Repeat2 size={17} /><span><b>Swap exercise</b><small>{hasCompletedSets ? 'Finish or undo completed sets before swapping' : 'Keep the training intent with a reviewed alternative'}</small></span></button>
                {swapExerciseId === exercise.id && <div className="substitution-picker" aria-label={`Alternatives for ${exercise.name}`}>
                  <div className="substitution-intro"><b>Choose an alternative</b><small>Your set and rep targets stay in place. Load resets to zero so you can choose a suitable starting point.</small></div>
                  {alternatives.map((alternative) => <button key={alternative.id} onClick={() => {
                    onChange({
                      ...session,
                      exercises: session.exercises.map((item, index) => index === exerciseIndex
                        ? applyExerciseSubstitution(item, alternative)
                        : item),
                    });
                    setSwapExerciseId(null);
                  }}>
                    <span><b>{alternative.name}</b><small>{alternative.detail}</small></span>
                    <span className="substitution-reasons">{alternative.reasons.join(' · ')}</span>
                    <em>{alternative.preserves}</em>
                  </button>)}
                  <button className="substitution-cancel" onClick={() => setSwapExerciseId(null)}>Keep {exercise.name}</button>
                </div>}
              </>}
              {target && <div className="progression-tip"><Sparkles size={16} /><span><b>Forge target: {target.loadKg} kg × {target.reps}</b><small>{target.reason}</small></span><button onClick={() => onChange({ ...session, exercises: session.exercises.map((item, index) => index === exerciseIndex ? { ...item, sets: item.sets.map((set) => ({ ...set, reps: target.reps, loadKg: target.loadKg })) } : item) })}>Apply</button></div>}
              <div className="set-row set-labels"><span>SET</span><span>{exercise.mode === 'duration' ? 'MINUTES' : 'REPS'}</span><span>{exercise.mode === 'duration' ? 'PACE' : 'LOAD KG'}</span><span>DONE</span></div>
              {exercise.sets.map((set, setIndex) => <div className={`set-row ${set.kind === 'warmup' ? 'warmup' : ''} ${set.completedAt ? 'done' : ''}`} key={set.id}>
                <strong>{set.kind === 'warmup' ? `W${exercise.sets.slice(0, setIndex + 1).filter((item) => item.kind === 'warmup').length}` : exercise.sets.slice(0, setIndex + 1).filter(isWorkingSet).length}{set.kind === 'warmup' && <small>Warm-up</small>}</strong>
                <div className="stepper"><button onClick={() => updateSet(exerciseIndex, setIndex, exercise.mode === 'duration' ? { durationMinutes: Math.max(1, (set.durationMinutes ?? 1) - 1) } : { reps: Math.max(1, (set.reps ?? 1) - 1) })}><Minus size={14} /></button><input aria-label={`${exercise.name} set ${setIndex + 1} ${exercise.mode === 'duration' ? 'minutes' : 'reps'}`} type="number" min="1" step="1" value={exercise.mode === 'duration' ? set.durationMinutes : set.reps} onChange={(event) => updateSet(exerciseIndex, setIndex, exercise.mode === 'duration' ? { durationMinutes: event.currentTarget.valueAsNumber } : { reps: event.currentTarget.valueAsNumber })} /><button onClick={() => updateSet(exerciseIndex, setIndex, exercise.mode === 'duration' ? { durationMinutes: (set.durationMinutes ?? 0) + 1 } : { reps: (set.reps ?? 0) + 1 })}><Plus size={14} /></button></div>
                {exercise.mode === 'reps' ? <input className="load-input" aria-label={`${exercise.name} set ${setIndex + 1} load`} type="number" min="0" step="2.5" value={set.loadKg ?? 0} onChange={(event) => updateSet(exerciseIndex, setIndex, { loadKg: event.currentTarget.valueAsNumber })} /> : <span className="pace-label">Zone 2</span>}
                <button className="set-check" onClick={() => toggleSet(exerciseIndex, setIndex)} aria-label={`Mark ${exercise.name} set ${setIndex + 1} ${set.completedAt ? 'incomplete' : 'complete'}`}><Check size={17} /></button>
              </div>)}
              {exercise.mode === 'reps' && <div className="warmup-set-actions" aria-label={`Adjust warm-up sets for ${exercise.name}`}>
                <span>{warmupCount ? `${warmupCount} warm-up set${warmupCount === 1 ? '' : 's'} · excluded from progression` : 'Warm-ups are excluded from progression'}</span>
                <button disabled={!removableWarmup} onClick={() => onChange({ ...session, exercises: session.exercises.map((item, index) => index === exerciseIndex ? removeLastWarmupSet(item) : item) })}><Minus size={14} />Remove warm-up</button>
                <button disabled={exercise.sets.length >= 12} onClick={() => onChange({ ...session, exercises: session.exercises.map((item, index) => index === exerciseIndex ? addWarmupSet(item) : item) })}><Plus size={14} />Add warm-up</button>
              </div>}
              <div className="set-count-actions" aria-label={`Adjust sets for ${exercise.name}`}>
                <button disabled={exercise.sets.length <= 1 || Boolean(exercise.sets.at(-1)?.completedAt)} onClick={() => onChange({ ...session, exercises: session.exercises.map((item, index) => index === exerciseIndex ? removeLastWorkoutSet(item) : item) })}><Minus size={14} />Remove set</button>
                <span>{exercise.sets.length} planned set{exercise.sets.length === 1 ? '' : 's'}</span>
                <button disabled={exercise.sets.length >= 12} onClick={() => onChange({ ...session, exercises: session.exercises.map((item, index) => index === exerciseIndex ? addWorkoutSet(item) : item) })}><Plus size={14} />Add set</button>
              </div>
            </div>}
          </article>;
        })}
      </div>

      {feedbackOpen && <section className="workout-feedback" aria-labelledby="workout-feedback-title">
        <span className="section-label">POST-WORKOUT CHECK-IN</span>
        <h3 id="workout-feedback-title">How did that session feel?</h3>
        <p>This helps Forge compare the planned effort with what you experienced.</p>
        <label>Overall effort <output>{perceivedExertion}/10</output><input type="range" min="1" max="10" value={perceivedExertion} onChange={(event) => setPerceivedExertion(Number(event.target.value))} /></label>
        <fieldset><legend>Did discomfort affect the session?</legend><div className="feedback-options">
          {([['none', 'No'], ['mild', 'A little'], ['stopped', 'I stopped']] as const).map(([value, label]) => <button className={discomfort === value ? 'active' : ''} type="button" aria-pressed={discomfort === value} key={value} onClick={() => setDiscomfort(value)}>{label}</button>)}
        </div></fieldset>
        {discomfort !== 'none' && <div className="feedback-safety" role="note">Forge records this signal for conservative planning. It does not diagnose an injury. Seek qualified care for severe, persistent, or worsening symptoms.</div>}
        <label>Optional note <textarea maxLength={240} rows={3} placeholder="What movement or area felt different?" value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} /><small>{feedbackNote.length}/240</small></label>
      </section>}

      <footer className="workout-footer">
        <div><Trophy size={20} /><span><b>Finish when the work is done</b><small>Your training load will update Today.</small></span></div>
        {feedbackOpen
          ? <div className="feedback-actions"><button className="feedback-cancel" onClick={() => setFeedbackOpen(false)}>Back</button><button onClick={() => onFinish({ perceivedExertion, discomfort, ...(feedbackNote.trim() ? { note: feedbackNote.trim() } : {}) })}>Save workout <Check size={18} /></button></div>
          : <button disabled={completed === 0 || session.status === 'completed'} onClick={() => setFeedbackOpen(true)}>{session.status === 'completed' ? 'Workout saved' : 'Finish workout'} <Check size={18} /></button>}
      </footer>
      {activeGuide && <ExerciseGuide guide={activeGuide} onClose={() => setActiveGuide(null)} />}
    </section>
  </div>;
}
