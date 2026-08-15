import { useEffect, useMemo, useState } from 'react';
import { CoachService, type CoachActionType } from '@forge/coach';
import { buildDigitalTwin, type DailySnapshot, type Recommendation } from '@forge/digital-twin';
import {
  Activity, Apple, ArrowRight, Award, Brain, CalendarDays, Check, ChevronRight, CircleUserRound, Cloud, CloudOff, Dumbbell,
  Flame, Footprints, Gauge, HeartPulse, Home, Moon, Plus, Settings, ShieldAlert, Sparkles,
  Save, Target, TrendingDown, Utensils, X,
} from 'lucide-react';
import { demoGoals, demoHistory, demoProfile } from './demoData.js';
import { cacheDashboardState, clearDashboardState, dashboardStateUpdatedAt, DASHBOARD_SAVED_EVENT, loadDashboardState, saveDashboardState, type CheckIn, type CoachMessage, type DashboardSaveEventDetail } from './dashboardStorage.js';
import { DashboardSyncClient, DashboardSyncConflictError, dashboardSyncConfig, newerThanLocal, type RemoteDashboard, type SyncStatus } from './dashboardSync.js';
import { WorkoutPlayer } from './WorkoutPlayer.js';
import { completedSetCount, createTodayWorkout, totalSetCount, workoutMinutes, type WorkoutFeedback, type WorkoutSession } from './workoutSession.js';
import { demoExerciseHistory, recordPerformances, strongestMovements, type ExercisePerformance } from './progression.js';
import { demoTrainingPreferences, generateTrainingPlan } from './trainingPlanner.js';
import { demoSessionHistory, summarizeWorkout, trainingWeek, weeklyVolume, type TrainingSessionRecord } from './volumeLedger.js';
import { assessDeload, nextScheduleIntent, type ScheduleOverrides } from './schedulePolicy.js';
import { calculateNutritionTargets } from './nutritionPlanner.js';
import { FoodLogger } from './FoodLogger.js';
import { demoFoodEntries, foodTotals, type FoodEntry, type SavedMeal } from './foodLog.js';
import { demoSavedMeals } from './foodCatalog.js';
import { freshWorkoutPlan } from './prototypeActions.js';
import { SettingsPanel } from './SettingsPanel.js';
import { useForgeAuth } from './useForgeAuth.js';
import { CoachPanel } from './CoachPanel.js';
import { trainingHistoryEntries } from './trainingHistory.js';
import { trainingTrendSummary } from './trainingAnalytics.js';

const TODAY = '2026-08-12' as const;
const NOW = '2026-08-12T11:30:00.000Z';

const defaultCheckIn: CheckIn = { sleepScore: 77, sleepHours: 7, soreness: 4, stress: 3, weightKg: 75.8 };

function initialDashboardState() {
  return loadDashboardState(window.localStorage, { history: demoHistory, checkIn: defaultCheckIn });
}

function scoreTone(score: number) {
  if (score >= 78) return 'great';
  if (score >= 62) return 'steady';
  return 'recover';
}

function categoryIcon(category: Recommendation['category']) {
  if (category === 'nutrition') return <Apple size={18} />;
  if (category === 'training') return <Dumbbell size={18} />;
  return <HeartPulse size={18} />;
}

function Ring({ value }: { value: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={`readiness-ring ${scoreTone(value)}`}>
      <svg viewBox="0 0 128 128" aria-label={`Readiness ${value} out of 100`}>
        <circle className="ring-track" cx="64" cy="64" r={radius} />
        <circle className="ring-value" cx="64" cy="64" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} />
      </svg>
      <div><strong>{value}</strong><span>readiness</span></div>
    </div>
  );
}

function Progress({ value, max, tone = 'lime' }: { value: number; max: number; tone?: string }) {
  return <div className="progress"><span className={tone} style={{ width: `${Math.min(100, value / max * 100)}%` }} /></div>;
}

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => `${index * (240 / (values.length - 1))},${58 - ((value - min) / Math.max(1, max - min)) * 45}`).join(' ');
  return <svg className="sparkline" viewBox="0 0 240 64" preserveAspectRatio="none"><polyline points={points} /></svg>;
}

interface SyncConflictActions {
  useRemote(): Promise<void>;
  keepLocal(): Promise<void>;
}

export function App() {
  const environment = (import.meta as ImportMeta & { env: Record<string, unknown> }).env;
  const auth = useForgeAuth(environment);
  const [initialState] = useState(initialDashboardState);
  const [history, setHistory] = useState(initialState.history);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checkIn, setCheckIn] = useState<CheckIn>(initialState.checkIn);
  const [checkInDraft, setCheckInDraft] = useState<CheckIn>(initialState.checkIn);
  const [savedAt, setSavedAt] = useState(initialState.savedAt);
  const [workout, setWorkout] = useState<WorkoutSession>(initialState.workoutSession ?? createTodayWorkout(TODAY));
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<ExercisePerformance[]>(initialState.exerciseHistory ?? demoExerciseHistory);
  const [sessionHistory, setSessionHistory] = useState<TrainingSessionRecord[]>(initialState.sessionHistory ?? demoSessionHistory);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverrides>(initialState.scheduleOverrides ?? {});
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(initialState.foodEntries ?? demoFoodEntries);
  const [foodLoggerOpen, setFoodLoggerOpen] = useState(false);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<string[]>(initialState.favoriteFoodIds ?? ['eggs-whites', 'chicken-breast', 'protein-shake']);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>(initialState.savedMeals ?? demoSavedMeals);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>(initialState.coachMessages ?? []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [syncConflict, setSyncConflict] = useState<SyncConflictActions | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const evaluation = useMemo(() => {
    const twin = buildDigitalTwin({ profile: { ...demoProfile, weightKg: checkIn.weightKg }, goals: demoGoals, history, asOfDate: TODAY, now: NOW });
    return new CoachService().evaluateToday(twin, NOW);
  }, [history, checkIn.weightKg]);

  const { twin, brief } = evaluation;
  const generatedPlan = useMemo(() => generateTrainingPlan(twin, demoTrainingPreferences, sessionHistory, scheduleOverrides[TODAY]), [twin, sessionHistory, scheduleOverrides]);
  const deload = useMemo(() => assessDeload(twin), [twin]);
  const today = history.find((day) => day.date === TODAY)!;
  const nutritionTargets = useMemo(() => calculateNutritionTargets(twin, workout), [twin, workout]);
  const targetProtein = nutritionTargets.proteinG;
  const calorieTarget = nutritionTargets.caloriesKcal;
  const weights = history.map((day) => day.weightKg ?? checkIn.weightKg);
  const strengthLeaders = strongestMovements(exerciseHistory).slice(0, 3);
  const plannedMinutes = workout.exercises.reduce((total, exercise) => total + exercise.sets.reduce((sum, set) => sum + (set.durationMinutes ?? 3), 0), 0);
  const volume = weeklyVolume(sessionHistory, TODAY).filter((item) => ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes'].includes(item.muscle));
  const week = trainingWeek(sessionHistory, TODAY, workout.title, scheduleOverrides);
  const loggedNutrition = foodTotals(foodEntries, TODAY);
  const recentTraining = trainingHistoryEntries(sessionHistory);
  const selectedTraining = recentTraining.find((entry) => entry.workoutId === selectedHistoryId);
  const trainingTrend = trainingTrendSummary(sessionHistory, TODAY);
  const maxWeeklyMinutes = Math.max(1, ...trainingTrend.weeks.map((week) => week.minutes));

  useEffect(() => {
    if (auth.status === 'loading' || auth.status === 'signed-out') {
      setSyncStatus('local');
      return;
    }
    const config = dashboardSyncConfig(environment, auth.accessToken);
    if (!config) return;
    const client = new DashboardSyncClient(config);
    let active = true;
    let connected = false;
    let connection: Promise<void> | undefined;

    const applyRemote = (remote: RemoteDashboard) => {
      const next = remote.state;
      setHistory(next.history);
      setCheckIn(next.checkIn);
      setCheckInDraft(next.checkIn);
      setSavedAt(next.savedAt);
      setWorkout(next.workoutSession ?? createTodayWorkout(TODAY));
      setExerciseHistory(next.exerciseHistory ?? demoExerciseHistory);
      setSessionHistory(next.sessionHistory ?? demoSessionHistory);
      setScheduleOverrides(next.scheduleOverrides ?? {});
      setFoodEntries(next.foodEntries ?? demoFoodEntries);
      setFavoriteFoodIds(next.favoriteFoodIds ?? ['eggs-whites', 'chicken-breast', 'protein-shake']);
      setSavedMeals(next.savedMeals ?? demoSavedMeals);
      setCoachMessages(next.coachMessages ?? []);
      cacheDashboardState(window.localStorage, next, remote.updatedAt);
    };

    const connect = () => {
      if (connected) return Promise.resolve();
      if (connection) return connection;
      setSyncStatus('connecting');
      const localState = loadDashboardState(window.localStorage, initialState);
      const localUpdatedAt = dashboardStateUpdatedAt(window.localStorage) ?? new Date().toISOString();
      connection = client.initialize(localState, localUpdatedAt)
        .then((remote) => {
          if (!active) return;
          if (newerThanLocal(remote.updatedAt, dashboardStateUpdatedAt(window.localStorage))) {
            applyRemote(remote);
          }
          connected = true;
          setSyncConflict(null);
          setSyncStatus('synced');
        })
        .catch((error: unknown) => {
          if (active) setSyncStatus('offline');
          throw error;
        })
        .finally(() => { connection = undefined; });
      return connection;
    };

    const handleSaved = (event: Event) => {
      const { state, updatedAt } = (event as CustomEvent<DashboardSaveEventDetail>).detail;
      setSyncStatus('syncing');
      void connect().then(() => client.save(state, updatedAt))
        .then(() => { if (active) setSyncStatus('synced'); })
        .catch((error: unknown) => {
          if (!active) return;
          if (!(error instanceof DashboardSyncConflictError)) {
            setSyncStatus('offline');
            return;
          }
          setSyncStatus('conflict');
          setSyncConflict({
            useRemote: async () => {
              setSyncStatus('connecting');
              try {
                const remote = await client.load();
                if (!remote) throw new Error('Remote dashboard no longer exists');
                if (!active) return;
                applyRemote(remote);
                setSyncConflict(null);
                setSyncStatus('synced');
              } catch {
                if (active) setSyncStatus('conflict');
              }
            },
            keepLocal: async () => {
              setSyncStatus('syncing');
              try {
                await client.load();
                await client.save(state, updatedAt);
                if (!active) return;
                setSyncConflict(null);
                setSyncStatus('synced');
              } catch {
                if (active) setSyncStatus('conflict');
              }
            },
          });
        });
    };

    window.addEventListener(DASHBOARD_SAVED_EVENT, handleSaved);
    const retry = () => { if (!connected) void connect().catch(() => undefined); };
    window.addEventListener('online', retry);
    const retryTimer = window.setInterval(retry, 15_000);
    retry();

    return () => {
      active = false;
      window.removeEventListener(DASHBOARD_SAVED_EVENT, handleSaved);
      window.removeEventListener('online', retry);
      window.clearInterval(retryTimer);
    };
  }, [auth.accessToken, auth.status, environment, initialState]);

  useEffect(() => {
    if (workout.status !== 'not-started') return;
    if (workout.id === generatedPlan.id && workout.planReason === generatedPlan.planReason) return;
    setWorkout(generatedPlan);
    saveDashboardState(window.localStorage, {
      history,
      checkIn,
      workoutSession: generatedPlan,
      exerciseHistory,
      sessionHistory,
      scheduleOverrides,
      foodEntries,
      favoriteFoodIds,
      savedMeals,
      coachMessages,
      ...(savedAt ? { savedAt } : {}),
    });
  }, [generatedPlan, workout, history, checkIn, exerciseHistory, sessionHistory, scheduleOverrides, foodEntries, favoriteFoodIds, savedMeals, coachMessages, savedAt]);

  function saveCheckIn() {
    const nextHistory = history.map((day) => day.date === TODAY ? { ...day, ...checkInDraft } : day);
    const nextSavedAt = new Date().toISOString();
    setHistory(nextHistory);
    setCheckIn(checkInDraft);
    setSavedAt(nextSavedAt);
    saveDashboardState(window.localStorage, {
      history: nextHistory,
      checkIn: checkInDraft,
      savedAt: nextSavedAt,
      workoutSession: workout,
      exerciseHistory,
      sessionHistory,
      scheduleOverrides,
      foodEntries,
      favoriteFoodIds,
      savedMeals,
      coachMessages,
    });
    setSaved(true);
    setCheckInOpen(false);
    window.setTimeout(() => setSaved(false), 2600);
  }

  function openCheckIn() {
    setCheckInDraft(checkIn);
    setCheckInOpen(true);
  }

  function persistWorkout(nextWorkout: WorkoutSession, nextHistory = history) {
    setWorkout(nextWorkout);
    saveDashboardState(window.localStorage, {
      history: nextHistory,
      checkIn,
      workoutSession: nextWorkout,
      exerciseHistory,
      sessionHistory,
      scheduleOverrides,
      foodEntries,
      favoriteFoodIds,
      savedMeals,
      coachMessages,
      ...(savedAt ? { savedAt } : {}),
    });
  }

  function openWorkout() {
    const nextWorkout = workout.status === 'not-started'
      ? { ...workout, status: 'in-progress' as const, startedAt: new Date().toISOString() }
      : workout;
    persistWorkout(nextWorkout);
    setWorkoutOpen(true);
  }

  function finishWorkout(feedback: WorkoutFeedback) {
    const completedAt = new Date().toISOString();
    const nextWorkout: WorkoutSession = { ...workout, status: 'completed', completedAt, feedback };
    const minutes = Math.max(1, workoutMinutes(nextWorkout));
    const nextHistory = history.map((day) => day.date === TODAY
      ? { ...day, trainingMinutes: minutes, trainingRpe: feedback.perceivedExertion }
      : day);
    setHistory(nextHistory);
    const performances = recordPerformances(nextWorkout, exerciseHistory);
    const nextExerciseHistory = [...exerciseHistory, ...performances];
    const summary = summarizeWorkout(nextWorkout, minutes);
    const nextSessionHistory = [...sessionHistory.filter((session) => session.workoutId !== summary.workoutId), summary];
    setExerciseHistory(nextExerciseHistory);
    setSessionHistory(nextSessionHistory);
    setWorkout(nextWorkout);
    saveDashboardState(window.localStorage, {
      history: nextHistory,
      checkIn,
      workoutSession: nextWorkout,
      exerciseHistory: nextExerciseHistory,
      sessionHistory: nextSessionHistory,
      scheduleOverrides,
      foodEntries,
      favoriteFoodIds,
      savedMeals,
      coachMessages,
      ...(savedAt ? { savedAt } : {}),
    });
    setWorkoutOpen(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  function cycleSchedule(date: string) {
    if (workout.status !== 'not-started' && date === TODAY) return;
    const nextOverrides = { ...scheduleOverrides, [date]: nextScheduleIntent(scheduleOverrides[date]) };
    setScheduleOverrides(nextOverrides);
    saveDashboardState(window.localStorage, { history, checkIn, workoutSession: workout, exerciseHistory, sessionHistory, scheduleOverrides: nextOverrides, foodEntries, favoriteFoodIds, savedMeals, coachMessages, ...(savedAt ? { savedAt } : {}) });
  }

  function updateFoodEntries(nextEntries: FoodEntry[]) {
    const totals = foodTotals(nextEntries, TODAY);
    const nextHistory = history.map((day) => day.date === TODAY ? { ...day, caloriesKcal: totals.caloriesKcal, proteinG: totals.proteinG } : day);
    setFoodEntries(nextEntries);
    setHistory(nextHistory);
    saveDashboardState(window.localStorage, { history: nextHistory, checkIn, workoutSession: workout, exerciseHistory, sessionHistory, scheduleOverrides, foodEntries: nextEntries, favoriteFoodIds, savedMeals, coachMessages, ...(savedAt ? { savedAt } : {}) });
  }

  function updateFoodPreferences(nextFavorites: string[], nextMeals: SavedMeal[]) {
    setFavoriteFoodIds(nextFavorites);
    setSavedMeals(nextMeals);
    saveDashboardState(window.localStorage, { history, checkIn, workoutSession: workout, exerciseHistory, sessionHistory, scheduleOverrides, foodEntries, favoriteFoodIds: nextFavorites, savedMeals: nextMeals, coachMessages, ...(savedAt ? { savedAt } : {}) });
  }

  function generateNewPlan() {
    const nextWorkout = freshWorkoutPlan(generatedPlan);
    setWorkout(nextWorkout);
    saveDashboardState(window.localStorage, { history, checkIn, workoutSession: nextWorkout, exerciseHistory, sessionHistory, scheduleOverrides, foodEntries, favoriteFoodIds, savedMeals, coachMessages, ...(savedAt ? { savedAt } : {}) });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  function resetPrototype() {
    clearDashboardState(window.localStorage);
    window.location.reload();
  }

  function updateCoachMessages(nextMessages: CoachMessage[]) {
    setCoachMessages(nextMessages);
    saveDashboardState(window.localStorage, { history, checkIn, workoutSession: workout, exerciseHistory, sessionHistory, scheduleOverrides, foodEntries, favoriteFoodIds, savedMeals, coachMessages: nextMessages, ...(savedAt ? { savedAt } : {}) });
  }

  function handleCoachAction(action: CoachActionType) {
    setCoachOpen(false);
    if (action === 'open-workout') openWorkout();
    if (action === 'open-nutrition') setFoodLoggerOpen(true);
    if (action === 'open-check-in') openCheckIn();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">F</span><strong>FORGE</strong></div>
        <nav>
          <a className="active" href="#today"><Home size={19} /><span>Today</span></a>
          <a href="#training"><Dumbbell size={19} /><span>Training</span></a>
          <a href="#nutrition"><Utensils size={19} /><span>Nutrition</span></a>
          <a href="#progress"><Activity size={19} /><span>Progress</span></a>
          <button className="sidebar-coach" onClick={() => setCoachOpen(true)}><Brain size={19} /><span>AI Coach</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="sidebar-settings" onClick={() => setSettingsOpen(true)}><Settings size={19} /><span>Settings</span></button>
          <div className="profile-chip"><CircleUserRound size={28} /><div><strong>Shane</strong><span>120-day shred</span></div></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div><span className="eyebrow">WEDNESDAY · AUGUST 12</span><h1>Good morning, Shane.</h1><p>Your plan has adapted to how you’re recovering today.</p></div>
          <div className="topbar-actions">
            <span className={`save-status sync-${syncStatus}`}>{syncStatus === 'offline' ? <CloudOff size={15} /> : syncStatus === 'conflict' ? <ShieldAlert size={15} /> : syncStatus === 'local' ? <Save size={15} /> : <Cloud size={15} />} {syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'connecting' ? 'Connecting…' : syncStatus === 'synced' ? 'Synced across devices' : syncStatus === 'conflict' ? 'Sync needs attention' : syncStatus === 'offline' ? 'Offline · saved locally' : savedAt ? 'Saved on this device' : 'Demo data'}</span>
            {auth.status === 'signed-out' ? <button className="auth-button" onClick={() => void auth.signIn()}>Sign in</button> : auth.status === 'signed-in' ? <button className="auth-button signed-in" onClick={() => void auth.signOut()} title="Sign out">{auth.name ?? auth.username ?? 'Account'}</button> : null}
            <button className="topbar-settings" onClick={() => setSettingsOpen(true)} aria-label="Open Forge settings"><Settings size={18} /></button>
            <button className="checkin-button" onClick={openCheckIn}><Plus size={18} /> Morning check-in</button>
          </div>
        </header>

        {syncConflict && <div className="sync-conflict" role="alert">
          <ShieldAlert size={20} />
          <div><strong>Newer Forge data was saved on another device.</strong><span>Choose which version to keep. Nothing will be overwritten until you decide.</span></div>
          <button onClick={() => void syncConflict.useRemote()}>Use cloud version</button>
          <button className="keep-local" onClick={() => void syncConflict.keepLocal()}>Keep this device</button>
        </div>}

        {saved && <div className="toast" role="status" aria-live="polite"><Sparkles size={17} /> Digital Twin updated. Today’s guidance is refreshed.</div>}

        <section className="hero-grid" id="today">
          <article className="hero-card readiness-card">
            <div className="card-heading"><div><span className="section-label">TODAY’S READINESS</span><h2>{brief.headline}</h2></div><span className={`status-pill ${scoreTone(brief.readiness)}`}>{brief.recoveryStatus}</span></div>
            <div className="readiness-content">
              <Ring value={brief.readiness} />
              <div className="recovery-factors">
                <div><Moon size={18} /><span><b>Sleep</b><small>{twin.recovery.sleepScore}/100 · {today.sleepHours}h</small></span><strong>{twin.recovery.sleepScore >= 75 ? 'Good' : 'Fair'}</strong></div>
                <div><Gauge size={18} /><span><b>Soreness</b><small>{10 - (today.soreness ?? 0)}/10 recovered</small></span><strong>{(today.soreness ?? 0) <= 4 ? 'Ready' : 'Elevated'}</strong></div>
                <div><Brain size={18} /><span><b>Stress</b><small>{10 - (today.stress ?? 0)}/10 managed</small></span><strong>{(today.stress ?? 0) <= 4 ? 'Balanced' : 'High'}</strong></div>
              </div>
            </div>
          </article>

          <article className="hero-card coach-card" id="coach">
            <div className="coach-orb"><Sparkles size={21} /></div>
            <span className="section-label">FORGE COACH</span>
            <h2>{brief.recommendations[0]?.title ?? 'Stay the course'}</h2>
            <p>{brief.recommendations[0]?.reason ?? 'Your recovery signals support the plan already in place.'}</p>
            <div className="coach-action"><span>{brief.recommendations[0]?.action ?? 'Complete your planned session and keep nutrition consistent.'}</span><button onClick={() => setCoachOpen(true)} aria-label="Open AI Coach"><ArrowRight size={18} /></button></div>
            <div className="confidence"><span>Decision confidence</span><strong>{brief.recommendations[0]?.confidence ?? 76}%</strong></div>
          </article>
        </section>

        <section className="metric-strip">
          <div><span className="metric-icon orange"><Flame size={19} /></span><p>Calories</p><strong>{loggedNutrition.caloriesKcal.toLocaleString()}</strong><small>of {calorieTarget.toLocaleString()} kcal</small><Progress value={loggedNutrition.caloriesKcal} max={calorieTarget} tone="orange" /></div>
          <div><span className="metric-icon blue"><Apple size={19} /></span><p>Protein</p><strong>{loggedNutrition.proteinG}g</strong><small>of {targetProtein}g target</small><Progress value={loggedNutrition.proteinG} max={targetProtein} tone="blue" /></div>
          <div><span className="metric-icon violet"><Footprints size={19} /></span><p>Steps</p><strong>{today.steps?.toLocaleString()}</strong><small>of 10,000 steps</small><Progress value={today.steps ?? 0} max={10000} tone="violet" /></div>
          <div><span className="metric-icon lime"><Dumbbell size={19} /></span><p>Training</p><strong>{twin.training.sessionsLast7Days}/{demoGoals.weeklyTrainingTarget}</strong><small>sessions this week</small><Progress value={twin.training.sessionsLast7Days} max={demoGoals.weeklyTrainingTarget ?? 5} /></div>
        </section>

        <section className="content-grid">
          <article className="panel workout-panel" id="training">
            <div className="panel-heading"><div><span className="section-label">TODAY’S ADAPTIVE TRAINING</span><h3>{workout.title}</h3></div><span className="duration">{plannedMinutes} MIN</span></div>
            <div className="plan-rationale"><Sparkles size={17} /><span><b>{workout.intensity ?? 'moderate'} intensity · generated by Forge</b><small>{workout.planReason ?? 'Built from your recovery, goals, recent training, equipment, and constraints.'}</small></span></div>
            {deload.active && workout.planType !== 'recovery' && <div className="deload-alert"><ShieldAlert size={18} /><span><b>Deload protection active</b><small>Sets reduced 35% and load reduced 10% · fatigue score {deload.fatigueScore}</small></span></div>}
            {workout.status !== 'not-started' && <div className="workout-state-row"><span><b>{workout.status === 'completed' ? 'Workout complete' : 'Workout in progress'}</b><small>{completedSetCount(workout)} of {totalSetCount(workout)} sets logged</small></span><strong>{Math.round(completedSetCount(workout) / totalSetCount(workout) * 100)}%</strong></div>}
            {workout.feedback && <div className={`workout-feedback-summary discomfort-${workout.feedback.discomfort}`}><HeartPulse size={18} /><span><b>Session felt {workout.feedback.perceivedExertion}/10</b><small>{workout.feedback.discomfort === 'none' ? 'No discomfort affected the session.' : workout.feedback.discomfort === 'mild' ? 'Mild discomfort was recorded for conservative planning.' : 'The session was stopped because of discomfort.'}{workout.feedback.note ? ` ${workout.feedback.note}` : ''}</small></span></div>}
            <div className="workout-list">
              {workout.exercises.slice(0, 4).map((exercise, index) => <div key={exercise.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{exercise.name}</strong><small>{exercise.sets.length} set{exercise.sets.length === 1 ? '' : 's'} · {exercise.detail}</small></div><ChevronRight size={18} /></div>)}
            </div>
            <button className="primary-action" onClick={openWorkout}><Dumbbell size={18} /> {workout.status === 'not-started' ? 'Start workout' : workout.status === 'completed' ? 'Review workout' : 'Resume workout'} <ArrowRight size={18} /></button>
          </article>

          <article className="panel trend-panel" id="progress">
            <div className="panel-heading"><div><span className="section-label">7-DAY TREND</span><h3>Weight is moving steadily</h3></div><TrendingDown size={22} className="trend-icon" /></div>
            <div className="trend-summary"><strong>{checkIn.weightKg.toFixed(1)} kg</strong><span>−{(weights[0]! - weights.at(-1)!).toFixed(1)} kg this week</span></div>
            <Sparkline values={weights} />
            <div className="trend-labels"><span>Aug 6</span><span>Today</span></div>
            <div className="goal-row"><Target size={18} /><span><b>Goal trajectory</b><small>On pace for gradual recomposition</small></span><strong>On track</strong></div>
          </article>

          <article className="panel recommendations-panel" id="nutrition">
            <div className="panel-heading"><div><span className="section-label">WHY TODAY CHANGED</span><h3>Explainable recommendations</h3></div><span className="count-pill">{brief.recommendations.length}</span></div>
            {brief.recommendations.length ? brief.recommendations.map((recommendation) => (
              <div className="recommendation" key={recommendation.id}>
                <span className={`recommendation-icon ${recommendation.category}`}>{categoryIcon(recommendation.category)}</span>
                <div><strong>{recommendation.title}</strong><p>{recommendation.action}</p><small>{recommendation.evidence.length} signals · {recommendation.confidence}% confidence</small></div>
              </div>
            )) : <div className="empty-state">No adjustment is needed. Keep following your plan.</div>}
          </article>

          <article className="panel nutrition-panel">
            <div className="panel-heading"><div><span className="section-label">ADAPTIVE NUTRITION</span><h3>{nutritionTargets.caloriesKcal.toLocaleString()} kcal · {nutritionTargets.confidence} confidence</h3></div><Apple size={22} className="trend-icon" /></div>
            <p className="panel-copy">{nutritionTargets.reason}</p>
            <div className="macro-targets"><div><span>Protein</span><strong>{nutritionTargets.proteinG}g</strong><small>Preserve and build lean mass</small></div><div><span>Carbs</span><strong>{nutritionTargets.carbsG}g</strong><small>Fuel training and recovery</small></div><div><span>Fat</span><strong>{nutritionTargets.fatG}g</strong><small>Hormones and satiety</small></div></div>
            <div className="nutrition-adjustment"><span><Flame size={17} /><b>Today’s adjustment</b></span><strong>{nutritionTargets.adjustmentKcal > 0 ? '+' : ''}{nutritionTargets.adjustmentKcal} kcal</strong></div>
            <button className="log-food-button" onClick={() => setFoodLoggerOpen(true)}><Plus size={17} /> Log food <span>{loggedNutrition.caloriesKcal} kcal logged</span></button>
            {nutritionTargets.safeguards.map((guard) => <div className="nutrition-safeguard" key={guard}><ShieldAlert size={15} /><span>{guard}</span></div>)}
          </article>

          <article className="panel strength-panel">
            <div className="panel-heading"><div><span className="section-label">STRENGTH PROGRESS</span><h3>Your estimated strength is climbing</h3></div><Award size={22} className="trend-icon" /></div>
            <p className="panel-copy">Forge compares quality reps and load—not just the heaviest number you entered.</p>
            <div className="strength-list">{strengthLeaders.map((movement) => <div key={movement.exerciseId}><span><b>{movement.exerciseName}</b><small>{movement.loadKg} kg × {movement.reps} · est. max {movement.estimatedOneRepMax} kg</small></span><strong className={movement.gainPct > 0 ? 'positive' : ''}>{movement.gainPct > 0 ? '+' : ''}{movement.gainPct}%</strong></div>)}</div>
          </article>

          <article className="panel schedule-panel">
            <div className="panel-heading"><div><span className="section-label">TRAINING WEEK</span><h3>Schedule + muscle volume</h3></div><CalendarDays size={22} className="trend-icon" /></div>
            <p className="schedule-hint">Select today or an upcoming day to cycle: adaptive → train → rest.</p>
            <div className="week-strip">{week.map((day) => <button className={`${day.status} intent-${day.intent}`} key={day.date} disabled={day.status === 'completed' || day.date < TODAY || (day.date === TODAY && workout.status !== 'not-started')} onClick={() => cycleSchedule(day.date)} title={day.title}><span>{day.day}</span><b>{Number(day.date.slice(-2))}</b><small>{day.status === 'completed' ? 'Done' : day.intent === 'train' ? 'Train' : day.intent === 'rest' ? 'Rest' : day.status === 'today' ? 'Today' : 'Adaptive'}</small></button>)}</div>
            <div className="volume-ledger">{volume.map((item) => <div key={item.muscle}><span><b>{item.muscle}</b><small>{item.completed} / {item.target} hard sets</small></span><div className="volume-bar"><i style={{ width: `${Math.min(100, item.completed / item.target * 100)}%` }} /></div><strong>{Math.round(item.completed / item.target * 100)}%</strong></div>)}</div>
          </article>

          <article className="panel training-history-panel">
            <div className="panel-heading"><div><span className="section-label">TRAINING HISTORY</span><h3>Recent completed sessions</h3></div><Activity size={22} className="trend-icon" /></div>
            <p className="panel-copy">Duration, completed volume, and your reported experience stay together across devices.</p>
            <div className="training-trend-summary">
              <div className="training-trend-metrics"><span><small>4-week sessions</small><b>{trainingTrend.sessions}</b></span><span><small>Total time</small><b>{trainingTrend.minutes} min</b></span><span><small>Average effort</small><b>{trainingTrend.averageEffort ? `${trainingTrend.averageEffort}/10` : 'Not enough data'}</b></span><span><small>Feedback coverage</small><b>{trainingTrend.feedbackCoverage}%</b></span></div>
              <div className="training-week-chart" aria-label="Training minutes by week">{trainingTrend.weeks.map((week) => <div key={week.startDate}><span className="week-bar-track"><i style={{ height: `${Math.max(4, week.minutes / maxWeeklyMinutes * 100)}%` }} /></span><b>{week.minutes}</b><small>{week.label}</small></div>)}</div>
              {trainingTrend.discomfortSessions > 0 && <div className="training-trend-note"><ShieldAlert size={15} /><span>{trainingTrend.discomfortSessions} session{trainingTrend.discomfortSessions === 1 ? '' : 's'} included discomfort feedback in this four-week window.</span></div>}
            </div>
            <div className="training-history-list">{recentTraining.length ? recentTraining.map((entry) => <button className={`training-history-row ${entry.tone}`} key={entry.workoutId} onClick={() => setSelectedHistoryId(entry.workoutId)} aria-expanded={selectedHistoryId === entry.workoutId}>
              <time dateTime={entry.date}>{entry.dateLabel}</time>
              <span><b>{entry.title}</b><small>{entry.muscleLabel} · {entry.completedSets} set{entry.completedSets === 1 ? '' : 's'}</small></span>
              <span className="history-metrics"><b>{entry.durationLabel}</b>{entry.effortLabel && <small>{entry.effortLabel}</small>}</span>
              {entry.discomfortLabel && <strong>{entry.discomfortLabel}</strong>}
              <ChevronRight className="history-chevron" size={17} />
            </button>) : <div className="empty-state">Complete a workout to start your training history.</div>}</div>
            {selectedTraining && <section className="training-history-detail" aria-labelledby="training-history-detail-title">
              <header><div><span className="section-label">SESSION DETAIL · {selectedTraining.dateLabel}</span><h4 id="training-history-detail-title">{selectedTraining.title}</h4></div><button onClick={() => setSelectedHistoryId(null)} aria-label="Close session detail"><X size={17} /></button></header>
              <div className="history-detail-metrics"><span><small>Duration</small><b>{selectedTraining.durationLabel}</b></span><span><small>Volume</small><b>{selectedTraining.completedSets} sets</b></span><span><small>Experience</small><b>{selectedTraining.effortLabel ?? 'Not recorded'}</b></span></div>
              {selectedTraining.exercises.length ? <div className="history-exercises">{selectedTraining.exercises.map((exercise) => <div key={exercise.id}><span><b>{exercise.name}</b><small>{exercise.completionLabel}</small></span><Check size={16} /></div>)}</div> : <div className="history-breakdown">{selectedTraining.muscleBreakdown.length ? selectedTraining.muscleBreakdown.join(' · ') : 'Recovery work completed'}</div>}
              {selectedTraining.discomfortLabel && <div className={`history-feedback ${selectedTraining.tone}`}><b>{selectedTraining.discomfortLabel}</b><span>{selectedTraining.feedbackNote ?? 'No additional note was recorded.'}</span></div>}
            </section>}
          </article>
        </section>
      </main>

      {checkInOpen && <div className="drawer-backdrop" onMouseDown={() => setCheckInOpen(false)}>
        <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="checkin-title" tabIndex={-1} autoFocus onMouseDown={(event) => event.stopPropagation()}>
          <div className="drawer-heading"><div><span className="section-label">DAILY SIGNALS</span><h2 id="checkin-title">Morning check-in</h2><p>These inputs update your Digital Twin and today’s guidance.</p></div><button onClick={() => setCheckInOpen(false)} aria-label="Close check-in"><X size={20} /></button></div>
          <label>Body weight <output>{checkInDraft.weightKg.toFixed(1)} kg</output><input type="range" min="65" max="90" step="0.1" value={checkInDraft.weightKg} onChange={(e) => setCheckInDraft({ ...checkInDraft, weightKg: Number(e.target.value) })} /></label>
          <label>Sleep quality <output>{checkInDraft.sleepScore}/100</output><input type="range" min="0" max="100" value={checkInDraft.sleepScore} onChange={(e) => setCheckInDraft({ ...checkInDraft, sleepScore: Number(e.target.value) })} /></label>
          <label>Hours slept <output>{checkInDraft.sleepHours.toFixed(1)}h</output><input type="range" min="0" max="12" step="0.1" value={checkInDraft.sleepHours} onChange={(e) => setCheckInDraft({ ...checkInDraft, sleepHours: Number(e.target.value) })} /></label>
          <label>Soreness <output>{checkInDraft.soreness}/10</output><input type="range" min="0" max="10" value={checkInDraft.soreness} onChange={(e) => setCheckInDraft({ ...checkInDraft, soreness: Number(e.target.value) })} /></label>
          <label>Stress <output>{checkInDraft.stress}/10</output><input type="range" min="0" max="10" value={checkInDraft.stress} onChange={(e) => setCheckInDraft({ ...checkInDraft, stress: Number(e.target.value) })} /></label>
          <button className="save-checkin" onClick={saveCheckIn}><Sparkles size={18} /> Update today’s plan</button>
          <small className="privacy-note">Saved on this device and synchronized securely when you are signed in.</small>
        </aside>
      </div>}

      {workoutOpen && <WorkoutPlayer session={workout} exerciseHistory={exerciseHistory} onChange={persistWorkout} onClose={() => setWorkoutOpen(false)} onFinish={finishWorkout} />}
      {foodLoggerOpen && <FoodLogger date={TODAY} entries={foodEntries} favoriteFoodIds={favoriteFoodIds} savedMeals={savedMeals} onChange={updateFoodEntries} onPreferencesChange={updateFoodPreferences} onClose={() => setFoodLoggerOpen(false)} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} onGeneratePlan={generateNewPlan} onReset={resetPrototype} />}
      {coachOpen && <CoachPanel twin={twin} messages={coachMessages} onMessagesChange={updateCoachMessages} onAction={handleCoachAction} onClose={() => setCoachOpen(false)} />}

      <nav className="mobile-nav" aria-label="Mobile navigation"><a className="active" href="#today"><Home size={20} /><span>Today</span></a><a href="#training"><Dumbbell size={20} /><span>Train</span></a><button onClick={openCheckIn} aria-label="Open daily check-in"><Plus size={22} /></button><a href="#nutrition"><Apple size={20} /><span>Nutrition</span></a><button className="mobile-coach" onClick={() => setCoachOpen(true)}><Brain size={20} /><span>Coach</span></button></nav>
    </div>
  );
}
