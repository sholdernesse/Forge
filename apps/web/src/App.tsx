import { useEffect, useMemo, useState } from 'react';
import { CoachService, type CoachActionType } from '@forge/coach';
import { buildDigitalTwin, type DailySnapshot, type Recommendation } from '@forge/digital-twin';
import {
  Activity, Apple, ArrowRight, Award, BookOpen, Brain, CalendarDays, Check, ChevronLeft, ChevronRight, CircleUserRound, Cloud, CloudOff, Dumbbell,
  Download, Flame, Footprints, Gauge, HeartPulse, Home, Moon, Plus, Settings, ShieldAlert, Sparkles,
  Repeat2, Save, Target, TrendingDown, Utensils, X,
} from 'lucide-react';
import { demoGoals, demoHistory, demoProfile } from './demoData.js';
import { cacheDashboardState, clearDashboardState, dashboardStateUpdatedAt, DASHBOARD_SAVED_EVENT, loadDashboardState, saveDashboardState, type CheckIn, type CoachMessage, type DashboardSaveEventDetail } from './dashboardStorage.js';
import { DashboardSyncClient, DashboardSyncConflictError, dashboardSyncConfig, newerThanLocal, type RemoteDashboard, type SyncStatus } from './dashboardSync.js';
import { WorkoutPlayer } from './WorkoutPlayer.js';
import { clearWorkoutRest, completedSetCount, isWorkingSet, createTodayWorkout, totalSetCount, workoutElapsedMinutes, type WorkoutFeedback, type WorkoutSession } from './workoutSession.js';
import { demoExerciseHistory, exerciseProgressTimeline, recordPerformances, strongestMovements, type ExercisePerformance } from './progression.js';
import { demoTrainingPreferences, generateTrainingPlan } from './trainingPlanner.js';
import { calendarDateOffset, demoSessionHistory, summarizeWorkout, trainingWeek, weeklyVolume, type TrainingSessionRecord } from './volumeLedger.js';
import { assessDeload, nextScheduleIntent, type ScheduleOverrides } from './schedulePolicy.js';
import { calculateNutritionTargets } from './nutritionPlanner.js';
import { FoodLogger } from './FoodLogger.js';
import { demoFoodEntries, foodTotals, type FoodEntry, type SavedMeal } from './foodLog.js';
import { demoSavedMeals } from './foodCatalog.js';
import { freshWorkoutPlan } from './prototypeActions.js';
import { SettingsPanel } from './SettingsPanel.js';
import { useForgeAuth } from './useForgeAuth.js';
import { CoachPanel } from './CoachPanel.js';
import { trainingHistoryEntries, type TrainingHistorySort } from './trainingHistory.js';
import { trainingTrendSummary } from './trainingAnalytics.js';
import { trainingHistoryCsv, trainingHistoryExcelFilename, trainingHistoryExcelXml, trainingHistoryExportFilename, type TrainingHistoryExportScope } from './trainingExport.js';
import { filterTrainingHistory, type TrainingHistoryFilter, type TrainingHistoryRange } from './trainingHistoryFilters.js';
import { nextTrainingHistoryCount, TRAINING_HISTORY_PAGE_SIZE, visibleTrainingHistoryCount } from './trainingHistoryPagination.js';
import { compareTrainingSession, trainingSessionNeighbors } from './trainingComparison.js';
import { trainingComparisonStory } from './trainingComparisonStory.js';
import { workoutCarryForward } from './workoutFocus.js';
import { todayCoachAction } from './todayCoachAction.js';
import { MovementLibrary } from './MovementLibrary.js';
import { reflectionTrend } from './reflectionHistory.js';
import { greetingForHour, localDateHeading, localDateKey, userFirstName, withTodaySnapshot } from './appContext.js';
import { experienceMode, isFirstRun } from './firstRun.js';
import { OnboardingFlow } from './OnboardingFlow.js';
import { goalsFromOnboarding, trainingPreferencesFromOnboarding, userProfileFromOnboarding, type OnboardingProfile } from './onboarding.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';
import { startingBlockFor, startingBlockReview } from './startingBlock.js';
import { performanceTimeline, weightProgressStory } from './performanceTimeline.js';
import { strengthProgressInsight } from './strengthInsight.js';

const defaultCheckIn: CheckIn = { sleepScore: 77, sleepHours: 7, soreness: 4, stress: 3, weightKg: 75.8 };

function initialDashboardState(today: DailySnapshot['date'], demoMode: boolean) {
  const fallback = demoMode
    ? {
        history: demoHistory,
        checkIn: defaultCheckIn,
        exerciseHistory: demoExerciseHistory,
        sessionHistory: demoSessionHistory,
        foodEntries: demoFoodEntries,
        favoriteFoodIds: ['eggs-whites', 'chicken-breast', 'protein-shake'],
        savedMeals: demoSavedMeals,
        coachMessages: [],
      }
    : {
        history: [],
        checkIn: defaultCheckIn,
        exerciseHistory: [],
        sessionHistory: [],
        foodEntries: [],
        favoriteFoodIds: [],
        savedMeals: [],
        coachMessages: [],
      };
  const state = loadDashboardState(window.localStorage, fallback);
  return { ...state, history: withTodaySnapshot(state.history, today, state.checkIn) };
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

interface ReflectionDraft {
  mindScore: number;
  bodyScore: number;
  soulScore: number;
  reflectionNote: string;
}

interface SyncConflictActions {
  useRemote(): Promise<void>;
  keepLocal(): Promise<void>;
}

export function App() {
  const environment = (import.meta as ImportMeta & { env: Record<string, unknown> }).env;
  const auth = useForgeAuth(environment);
  const [sessionNow] = useState(() => new Date());
  const TODAY = localDateKey(sessionNow);
  const NOW = sessionNow.toISOString();
  const displayName = userFirstName(auth.name, auth.username);
  const mode = experienceMode(auth.status);
  const demoMode = mode === 'demo';
  const [initialState] = useState(() => initialDashboardState(TODAY, demoMode));
  const [history, setHistory] = useState(initialState.history);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const initialReflection = initialState.history.find((day) => day.date === TODAY);
  const [reflectionDraft, setReflectionDraft] = useState<ReflectionDraft>({
    mindScore: initialReflection?.mindScore ?? 5,
    bodyScore: initialReflection?.bodyScore ?? 5,
    soulScore: initialReflection?.soulScore ?? 5,
    reflectionNote: initialReflection?.reflectionNote ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [checkIn, setCheckIn] = useState<CheckIn>(initialState.checkIn);
  const [checkInDraft, setCheckInDraft] = useState<CheckIn>(initialState.checkIn);
  const [savedAt, setSavedAt] = useState(initialState.savedAt);
  const [workout, setWorkout] = useState<WorkoutSession>(initialState.workoutSession ?? createTodayWorkout(TODAY));
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<ExercisePerformance[]>(initialState.exerciseHistory ?? []);
  const [sessionHistory, setSessionHistory] = useState<TrainingSessionRecord[]>(initialState.sessionHistory ?? []);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverrides>(initialState.scheduleOverrides ?? {});
  const [scheduleWeekOffset, setScheduleWeekOffset] = useState(0);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(initialState.foodEntries ?? []);
  const [foodLoggerOpen, setFoodLoggerOpen] = useState(false);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<string[]>(initialState.favoriteFoodIds ?? []);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>(initialState.savedMeals ?? []);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>(initialState.coachMessages ?? []);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | undefined>(initialState.onboardingProfile);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [movementLibraryOpen, setMovementLibraryOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [syncConflict, setSyncConflict] = useState<SyncConflictActions | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<TrainingHistoryFilter>('all');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyRange, setHistoryRange] = useState<TrainingHistoryRange>('90-days');
  const [historySort, setHistorySort] = useState<TrainingHistorySort>('newest');
  const [historyExportScope, setHistoryExportScope] = useState<TrainingHistoryExportScope>('current-view');
  const [selectedStrengthId, setSelectedStrengthId] = useState<string | null>(null);
  const [historyVisibleCount, setHistoryVisibleCount] = useState(TRAINING_HISTORY_PAGE_SIZE);
  const reflectionDialogRef = useAccessibleDialog(() => setReflectionOpen(false), reflectionOpen);
  const checkInDialogRef = useAccessibleDialog(() => setCheckInOpen(false), checkInOpen);

  function saveCurrentDashboardState(state: Parameters<typeof saveDashboardState>[1], nextOnboarding = onboardingProfile) {
    saveDashboardState(window.localStorage, {
      ...state,
      ...(nextOnboarding ? { onboardingProfile: nextOnboarding } : {}),
    });
  }

  const athleteProfile = useMemo(
    () => onboardingProfile
      ? userProfileFromOnboarding(onboardingProfile, auth.username ?? 'forge-athlete')
      : demoProfile,
    [auth.username, onboardingProfile],
  );
  const athleteGoals = useMemo(
    () => onboardingProfile ? goalsFromOnboarding(onboardingProfile) : demoGoals,
    [onboardingProfile],
  );
  const trainingPreferences = useMemo(
    () => onboardingProfile ? trainingPreferencesFromOnboarding(onboardingProfile) : demoTrainingPreferences,
    [onboardingProfile],
  );
  const evaluation = useMemo(() => {
    const twin = buildDigitalTwin({ profile: { ...athleteProfile, weightKg: checkIn.weightKg }, goals: athleteGoals, history, asOfDate: TODAY, now: NOW });
    return new CoachService().evaluateToday(twin, NOW);
  }, [athleteGoals, athleteProfile, history, checkIn.weightKg]);

  const { twin, brief } = evaluation;
  const generatedPlan = useMemo(() => generateTrainingPlan(twin, trainingPreferences, sessionHistory, scheduleOverrides[TODAY]), [twin, trainingPreferences, sessionHistory, scheduleOverrides]);
  const deload = useMemo(() => assessDeload(twin), [twin]);
  const today = history.find((day) => day.date === TODAY)!;
  const nutritionTargets = useMemo(() => calculateNutritionTargets(twin, workout), [twin, workout]);
  const targetProtein = nutritionTargets.proteinG;
  const calorieTarget = nutritionTargets.caloriesKcal;
  const weightStory = weightProgressStory(history, athleteGoals.primary, TODAY);
  const timeline = performanceTimeline(history, sessionHistory, TODAY);
  const strengthLeaders = strongestMovements(exerciseHistory).slice(0, 3);
  const strengthInsight = strengthProgressInsight(exerciseHistory, sessionHistory, athleteGoals.weeklyTrainingTarget ?? 4, TODAY);
  const selectedStrengthTimeline = selectedStrengthId ? exerciseProgressTimeline(exerciseHistory, selectedStrengthId) : undefined;
  const plannedMinutes = workout.exercises.reduce((total, exercise) => total + exercise.sets.reduce((sum, set) => sum + (set.durationMinutes ?? 3), 0), 0);
  const volume = weeklyVolume(sessionHistory, TODAY).filter((item) => ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes'].includes(item.muscle));
  const scheduleAnchor = calendarDateOffset(TODAY, scheduleWeekOffset * 7);
  const week = trainingWeek(sessionHistory, scheduleAnchor, workout.title, scheduleOverrides, TODAY);
  const scheduleWeekLabel = `${new Date(`${week[0]!.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}–${new Date(`${week[6]!.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
  const loggedNutrition = foodTotals(foodEntries, TODAY);
  const filteredTrainingRecords = filterTrainingHistory(sessionHistory, historyFilter, historyQuery, historyRange, TODAY);
  const visibleHistoryCount = visibleTrainingHistoryCount(filteredTrainingRecords.length, historyVisibleCount);
  const recentTraining = trainingHistoryEntries(filteredTrainingRecords, visibleHistoryCount, historySort);
  const trainingExportRecords = historyExportScope === 'current-view' ? filteredTrainingRecords : sessionHistory;
  const selectedTraining = selectedHistoryId ? trainingHistoryEntries(sessionHistory.filter((record) => record.workoutId === selectedHistoryId), 1)[0] : undefined;
  const selectedTrainingComparison = selectedHistoryId ? compareTrainingSession(sessionHistory, selectedHistoryId) : undefined;
  const selectedTrainingStory = selectedTrainingComparison ? trainingComparisonStory(selectedTrainingComparison) : undefined;
  const selectedTrainingNeighbors = selectedHistoryId ? trainingSessionNeighbors(sessionHistory, selectedHistoryId) : {};
  const currentWorkoutFocus = workoutCarryForward(sessionHistory, workout.title, workout.date);
  const coachPriority = brief.recommendations[0];
  const coachPrimaryAction = todayCoachAction(coachPriority, workout.status);
  const trainingTrend = trainingTrendSummary(sessionHistory, TODAY);
  const startingBlock = useMemo(() => onboardingProfile ? startingBlockFor(onboardingProfile, TODAY) : undefined, [onboardingProfile, TODAY]);
  const blockReview = useMemo(() => onboardingProfile ? startingBlockReview(onboardingProfile, TODAY, sessionHistory) : undefined, [onboardingProfile, sessionHistory, TODAY]);
  const maxWeeklyMinutes = Math.max(1, ...trainingTrend.weeks.map((week) => week.minutes));
  const reflections = reflectionTrend(history);
  const firstRun = isFirstRun({
    mode,
    onboardingComplete: Boolean(onboardingProfile),
    ...(savedAt ? { savedAt } : {}),
    exerciseCount: exerciseHistory.length,
    sessionCount: sessionHistory.length,
    foodEntryCount: foodEntries.length,
    coachMessageCount: coachMessages.length,
  });

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
      const nextHistory = withTodaySnapshot(next.history, TODAY, next.checkIn);
      setHistory(nextHistory);
      setCheckIn(next.checkIn);
      setCheckInDraft(next.checkIn);
      setSavedAt(next.savedAt);
      setWorkout(next.workoutSession ?? createTodayWorkout(TODAY));
      setExerciseHistory(next.exerciseHistory ?? []);
      setSessionHistory(next.sessionHistory ?? []);
      setScheduleOverrides(next.scheduleOverrides ?? {});
      setFoodEntries(next.foodEntries ?? []);
      setFavoriteFoodIds(next.favoriteFoodIds ?? []);
      setSavedMeals(next.savedMeals ?? []);
      setCoachMessages(next.coachMessages ?? []);
      setOnboardingProfile(next.onboardingProfile);
      cacheDashboardState(window.localStorage, { ...next, history: nextHistory }, remote.updatedAt);
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
  }, [auth.accessToken, auth.status, demoMode, environment, initialState, onboardingProfile]);

  useEffect(() => {
    if (workout.status !== 'not-started') return;
    if (workout.id === generatedPlan.id && workout.planReason === generatedPlan.planReason) return;
    setWorkout(generatedPlan);
    saveCurrentDashboardState( {
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
    saveCurrentDashboardState( {
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

  function openReflection() {
    const current = history.find((day) => day.date === TODAY);
    setReflectionDraft({
      mindScore: current?.mindScore ?? 5,
      bodyScore: current?.bodyScore ?? 5,
      soulScore: current?.soulScore ?? 5,
      reflectionNote: current?.reflectionNote ?? '',
    });
    setReflectionOpen(true);
  }

  function saveReflection() {
    const reflectedAt = new Date().toISOString();
    const reflectionNote = reflectionDraft.reflectionNote.trim();
    const nextHistory = history.map((day) => day.date === TODAY ? {
      ...day,
      mindScore: reflectionDraft.mindScore,
      bodyScore: reflectionDraft.bodyScore,
      soulScore: reflectionDraft.soulScore,
      reflectedAt,
      reflectionNote,
    } : day);
    const nextSavedAt = reflectedAt;
    setHistory(nextHistory);
    setSavedAt(nextSavedAt);
    saveCurrentDashboardState( {
      history: nextHistory,
      checkIn,
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
    setReflectionOpen(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  function persistWorkout(nextWorkout: WorkoutSession, nextHistory = history) {
    setWorkout(nextWorkout);
    saveCurrentDashboardState( {
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
    const nextWorkout: WorkoutSession = { ...clearWorkoutRest(workout), status: 'completed', completedAt, feedback };
    const minutes = workoutElapsedMinutes(nextWorkout);
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
    saveCurrentDashboardState( {
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
    saveCurrentDashboardState( { history, checkIn, workoutSession: workout, exerciseHistory, sessionHistory, scheduleOverrides: nextOverrides, foodEntries, favoriteFoodIds, savedMeals, coachMessages, ...(savedAt ? { savedAt } : {}) });
  }

  function updateFoodEntries(nextEntries: FoodEntry[]) {
    const totals = foodTotals(nextEntries, TODAY);
    const nextHistory = history.map((day) => day.date === TODAY ? { ...day, caloriesKcal: totals.caloriesKcal, proteinG: totals.proteinG } : day);
    setFoodEntries(nextEntries);
    setHistory(nextHistory);
    saveCurrentDashboardState( { history: nextHistory, checkIn, workoutSession: workout, exerciseHistory, sessionHistory, scheduleOverrides, foodEntries: nextEntries, favoriteFoodIds, savedMeals, coachMessages, ...(savedAt ? { savedAt } : {}) });
  }

  function updateFoodPreferences(nextFavorites: string[], nextMeals: SavedMeal[]) {
    setFavoriteFoodIds(nextFavorites);
    setSavedMeals(nextMeals);
    saveCurrentDashboardState( { history, checkIn, workoutSession: workout, exerciseHistory, sessionHistory, scheduleOverrides, foodEntries, favoriteFoodIds: nextFavorites, savedMeals: nextMeals, coachMessages, ...(savedAt ? { savedAt } : {}) });
  }

  function generateNewPlan() {
    const nextWorkout = freshWorkoutPlan(generatedPlan);
    setWorkout(nextWorkout);
    saveCurrentDashboardState( { history, checkIn, workoutSession: nextWorkout, exerciseHistory, sessionHistory, scheduleOverrides, foodEntries, favoriteFoodIds, savedMeals, coachMessages, ...(savedAt ? { savedAt } : {}) });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  function completeOnboarding(profile: OnboardingProfile) {
    const nextCheckIn = { ...checkIn, weightKg: profile.weightKg };
    const nextHistory = history.map((day) => day.date === TODAY ? { ...day, weightKg: profile.weightKg } : day);
    setOnboardingProfile(profile);
    setCheckIn(nextCheckIn);
    setCheckInDraft(nextCheckIn);
    setHistory(nextHistory);
    saveCurrentDashboardState({
      history: nextHistory,
      checkIn: nextCheckIn,
      workoutSession: workout,
      exerciseHistory,
      sessionHistory,
      scheduleOverrides,
      foodEntries,
      favoriteFoodIds,
      savedMeals,
      coachMessages,
      ...(savedAt ? { savedAt } : {}),
    }, profile);
    setOnboardingOpen(false);
    setCheckInOpen(true);
  }

  function resetPrototype() {
    clearDashboardState(window.localStorage);
    window.location.reload();
  }

  function updateCoachMessages(nextMessages: CoachMessage[]) {
    setCoachMessages(nextMessages);
    saveCurrentDashboardState( { history, checkIn, workoutSession: workout, exerciseHistory, sessionHistory, scheduleOverrides, foodEntries, favoriteFoodIds, savedMeals, coachMessages: nextMessages, ...(savedAt ? { savedAt } : {}) });
  }

  function handleCoachAction(action: CoachActionType) {
    setCoachOpen(false);
    if (action === 'open-workout') openWorkout();
    if (action === 'open-nutrition') setFoodLoggerOpen(true);
    if (action === 'open-check-in') openCheckIn();
  }

  function downloadTrainingFile(content: string, type: string, filename: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportTrainingHistoryCsv() {
    downloadTrainingFile(trainingHistoryCsv(trainingExportRecords), 'text/csv;charset=utf-8', trainingHistoryExportFilename(TODAY, historyExportScope));
  }

  function exportTrainingHistoryExcel() {
    downloadTrainingFile(trainingHistoryExcelXml(trainingExportRecords, TODAY), 'application/vnd.ms-excel;charset=utf-8', trainingHistoryExcelFilename(TODAY, historyExportScope));
  }

  return (
    <div className={firstRun ? 'app-shell needs-setup' : 'app-shell'}>
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">F</span><strong>FORGE</strong></div>
        <nav>
          <a className="active" href="#today"><Home size={19} /><span>Today</span></a>
          <a href="#nutrition"><Utensils size={19} /><span>Nutrition</span></a>
          <a href="#training"><Dumbbell size={19} /><span>Training</span></a>
          <a href="#progress"><Activity size={19} /><span>Progress</span></a>
          <button className="sidebar-coach" onClick={() => setCoachOpen(true)}><Brain size={19} /><span>Coach</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="sidebar-settings" onClick={() => setSettingsOpen(true)}><Settings size={19} /><span>Settings</span></button>
          <div className="profile-chip"><CircleUserRound size={28} /><div><strong>{displayName}</strong><span>{demoMode ? 'Demo experience' : firstRun ? 'Set up your plan' : 'Personal plan'}</span></div></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div><span className="eyebrow">{localDateHeading(sessionNow)}</span><h1>{greetingForHour(sessionNow.getHours())}, {displayName}.</h1><p>{firstRun ? 'Build a focused starting plan from your goals and real-life training setup.' : 'Your plan has adapted to how you’re recovering today.'}</p></div>
          <div className="topbar-actions">
            <span className={`save-status sync-${syncStatus}`}>{syncStatus === 'offline' ? <CloudOff size={15} /> : syncStatus === 'conflict' ? <ShieldAlert size={15} /> : syncStatus === 'local' ? <Save size={15} /> : <Cloud size={15} />} {syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'connecting' ? 'Connecting…' : syncStatus === 'synced' ? 'Synced across devices' : syncStatus === 'conflict' ? 'Sync needs attention' : syncStatus === 'offline' ? 'Offline · saved locally' : savedAt ? 'Saved on this device' : demoMode ? 'Demo data' : 'Ready to set up'}</span>
            {auth.status === 'signed-out' ? <button className="auth-button" onClick={() => void auth.signIn()}>Sign in</button> : auth.status === 'signed-in' ? <button className="auth-button signed-in" onClick={() => void auth.signOut()} title="Sign out">{auth.name ?? auth.username ?? 'Account'}</button> : null}
            <button className="topbar-settings" onClick={() => setSettingsOpen(true)} aria-label="Open Forge settings"><Settings size={18} /></button>
            <button className="reflection-button" disabled={firstRun} onClick={openReflection}><HeartPulse size={18} /> Evening reflection</button>
            <button className="checkin-button" disabled={firstRun} onClick={openCheckIn}><Plus size={18} /> Morning check-in</button>
          </div>
        </header>

        {syncConflict && <div className="sync-conflict" role="alert">
          <ShieldAlert size={20} />
          <div><strong>Newer Forge data was saved on another device.</strong><span>Choose which version to keep. Nothing will be overwritten until you decide.</span></div>
          <button onClick={() => void syncConflict.useRemote()}>Use cloud version</button>
          <button className="keep-local" onClick={() => void syncConflict.keepLocal()}>Keep this device</button>
        </div>}

        {saved && <div className="toast" role="status" aria-live="polite"><Sparkles size={17} /> Digital Twin updated. Today’s guidance is refreshed.</div>}

        {firstRun && <section className="first-run-card" aria-labelledby="first-run-title">
          <div className="first-run-icon"><Target size={22} /></div>
          <div><span className="section-label">YOUR FORGE START</span><h2 id="first-run-title">Build a plan around you</h2><p>Your history is empty—no sample records have been added. Choose your goal, schedule, equipment, movement considerations, and starting baseline, then approve the plan in four simple steps.</p></div>
          <button onClick={() => setOnboardingOpen(true)}><Target size={17} /> Build my Forge plan</button>
        </section>}

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
            <h2>{coachPriority?.title ?? 'Stay the course'}</h2>
            <p>{coachPriority?.reason ?? 'Your recovery signals support the plan already in place.'}</p>
            <div className="coach-action"><span>{coachPriority?.action ?? 'Complete your planned session and keep nutrition consistent.'}</span><button onClick={() => handleCoachAction(coachPrimaryAction.action)}>{coachPrimaryAction.label}<ArrowRight size={18} /></button></div>
            <div className="confidence"><span>Decision confidence</span><strong>{coachPriority?.confidence ?? 76}%</strong></div>
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
              {workout.exercises.slice(0, 4).map((exercise, index) => {
                const workingSets = exercise.sets.filter(isWorkingSet).length;
                const warmupSets = exercise.sets.length - workingSets;
                return <div key={exercise.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{exercise.name}</strong><small>{workingSets} working set{workingSets === 1 ? '' : 's'}{warmupSets ? ` + ${warmupSets} warm-up` : ''} · {exercise.detail}</small></div><ChevronRight size={18} /></div>;
              })}
            </div>
            <div className="workout-actions"><button className="primary-action" onClick={openWorkout}><Dumbbell size={18} /> {workout.status === 'not-started' ? 'Start workout' : workout.status === 'completed' ? 'Review workout' : 'Resume workout'} <ArrowRight size={18} /></button><button className="movement-library-button" onClick={() => setMovementLibraryOpen(true)}><BookOpen size={18} /> Explore movement guides</button></div>
          </article>

          <article className="panel trend-panel" id="progress">
            <div className="panel-heading"><div><span className="section-label">RECENT PROGRESS</span><h3>{weightStory.headline}</h3></div><TrendingDown size={22} className="trend-icon" /></div>
            <div className="trend-summary"><strong>{weightStory.latest === undefined ? 'No weight yet' : `${weightStory.latest.toFixed(1)} kg`}</strong><span>{weightStory.summary}</span></div>
            {weightStory.measurements.length > 1 && <Sparkline values={weightStory.measurements} />}
            <div className="goal-row"><Target size={18} /><span><b>Goal context</b><small>{weightStory.trajectory}</small></span><strong>{weightStory.measurements.length > 1 ? 'Review' : 'Collect'}</strong></div>
            <details className="performance-timeline"><summary><span><Activity size={16} /><b>View performance timeline</b></span><small>{timeline.length ? `${timeline.length} recent events` : 'No events yet'}</small></summary>{timeline.length ? <div>{timeline.map((entry) => <article className={entry.tone} key={`${entry.date}-${entry.title}`}><time dateTime={entry.date}>{new Date(`${entry.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</time><section><b>{entry.title}</b><p>{entry.detail}</p><div>{entry.signals.map((signal) => <span key={signal}>{signal}</span>)}</div></section></article>)}</div> : <p className="timeline-empty">Complete a workout, reflection, or nutrition log to begin the timeline.</p>}<footer>Events share a sequence in time. Forge does not assume that one event caused another.</footer></details>
          </article>

          <article className="panel reflection-history-panel">
            <div className="panel-heading"><div><span className="section-label">WHOLE-SELF CHECK-IN</span><h3>Your recent reflection story</h3></div><HeartPulse size={22} className="reflection-icon" /></div>
            <p className="panel-copy">{reflections.story}</p>
            {reflections.latest ? <>
              <div className="reflection-latest" aria-label="Latest mind body and soul scores">
                <span><small>Mind</small><b>{reflections.latest.mindScore}/10</b></span>
                <span><small>Body</small><b>{reflections.latest.bodyScore}/10</b></span>
                <span><small>Soul</small><b>{reflections.latest.soulScore}/10</b></span>
              </div>
              <div className="reflection-chart" aria-label="Recent overall reflection scores">
                {reflections.entries.map((entry) => <div key={entry.date} title={`Mind ${entry.mindScore}, body ${entry.bodyScore}, soul ${entry.soulScore}`}><span><i style={{ height: `${entry.averageScore * 10}%` }} /></span><small>{new Date(`${entry.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</small></div>)}
              </div>
              {reflections.latest.note && <blockquote>“{reflections.latest.note}”</blockquote>}
            </> : <div className="empty-state">Your first evening reflection will appear here.</div>}
            <div className="reflection-boundary"><ShieldAlert size={15} /><span>This history provides context. It does not diagnose symptoms or clear a workout.</span></div>
            <button className="reflection-history-action" onClick={openReflection}>{reflections.latest?.date === TODAY ? 'Update today’s reflection' : 'Reflect on today'} <ArrowRight size={16} /></button>
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
            <div className="panel-heading"><div><span className="section-label">STRENGTH PROGRESS</span><h3>{strengthInsight.headline}</h3></div><Award size={22} className="trend-icon" /></div>
            <p className="panel-copy">{strengthInsight.explanation}</p>
            <div className={`strength-insight ${strengthInsight.status}`}><span><b>Next best action</b><small>{strengthInsight.nextStep}</small></span><strong>{strengthInsight.evidence}</strong></div>
            <div className="strength-list">{strengthLeaders.length ? strengthLeaders.map((movement) => <button key={movement.exerciseId} aria-expanded={selectedStrengthId === movement.exerciseId} onClick={() => setSelectedStrengthId(selectedStrengthId === movement.exerciseId ? null : movement.exerciseId)}><span><b>{movement.exerciseName}</b><small>{movement.loadKg} kg × {movement.reps} · est. max {movement.estimatedOneRepMax} kg</small></span><strong className={movement.gainPct > 0 ? 'positive' : ''}>{movement.gainPct > 0 ? '+' : ''}{movement.gainPct}%</strong></button>) : <div className="empty-state">Complete loaded working sets to begin your strength history.</div>}</div>
            {selectedStrengthTimeline && <section className="strength-detail" aria-labelledby="strength-detail-title"><header><div><span className="section-label">MOVEMENT HISTORY</span><h4 id="strength-detail-title">{selectedStrengthTimeline.exerciseName}</h4></div><button onClick={() => setSelectedStrengthId(null)} aria-label="Close movement history"><X size={16} /></button></header><div className="strength-detail-summary"><span><small>Recorded sets</small><b>{selectedStrengthTimeline.entries.length}</b></span><span><small>Estimated max change</small><b className={selectedStrengthTimeline.gainPct > 0 ? 'positive' : ''}>{selectedStrengthTimeline.gainPct > 0 ? '+' : ''}{selectedStrengthTimeline.gainPct}%</b></span><span><small>Best estimated max</small><b>{selectedStrengthTimeline.bestEstimatedOneRepMax} kg</b></span></div>{selectedStrengthTimeline.entries.length > 1 ? <><Sparkline values={selectedStrengthTimeline.entries.map((entry) => entry.estimatedOneRepMax)} /><div className="strength-timeline">{selectedStrengthTimeline.entries.map((entry) => <span key={`${entry.date}-${entry.loadKg}-${entry.reps}`}><time dateTime={entry.date}>{new Date(`${entry.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</time><b>{entry.loadKg} kg × {entry.reps}</b><small>Est. max {entry.estimatedOneRepMax} kg{entry.isPersonalRecord ? ' · PR' : ''}</small></span>)}</div></> : <p className="strength-detail-empty">Complete this movement again to unlock a strength trend.</p>}</section>}
          </article>

          <article className="panel schedule-panel">
            <div className="panel-heading"><div><span className="section-label">TRAINING WEEK</span><h3>Schedule + muscle volume</h3></div><CalendarDays size={22} className="trend-icon" /></div>
            {startingBlock && <section className="starting-block" aria-labelledby="starting-block-title">
              <header><div><span className="section-label">{startingBlock.reviewReady ? 'BLOCK REVIEW' : `WEEK ${startingBlock.currentWeek} OF 4`}</span><h4 id="starting-block-title">{startingBlock.title}</h4></div><small>{startingBlock.purpose}</small></header>
              <div className="starting-block-weeks">{startingBlock.weeks.map((phase) => <div className={phase.status} key={phase.week} aria-current={phase.status === 'current' ? 'step' : undefined}><span>{phase.status === 'complete' ? <Check size={14} /> : phase.week}</span><div><b>{phase.title}</b><small>{phase.focus}</small></div></div>)}</div>
              {blockReview && <div className={`starting-block-review ${blockReview.tone}`}><div><span><small>Sessions</small><b>{blockReview.sessions} / {blockReview.plannedSessions}</b></span><span><small>Movement ratings</small><b>{blockReview.qualityCoveragePct}%</b></span><span><small>Controlled</small><b>{blockReview.controlledPct === undefined ? 'Not enough data' : `${blockReview.controlledPct}%`}</b></span></div><section><b>{blockReview.headline}</b><p>{blockReview.nextStep}</p></section></div>}
            </section>}
            <nav className="week-browser" aria-label="Browse training weeks"><button aria-label="Previous training week" disabled={scheduleWeekOffset <= -4} onClick={() => setScheduleWeekOffset((offset) => offset - 1)}><ChevronLeft size={16} /></button><button className="week-browser-current" onClick={() => setScheduleWeekOffset(0)} disabled={scheduleWeekOffset === 0}><b>{scheduleWeekOffset === 0 ? 'This week' : scheduleWeekLabel}</b><small>{scheduleWeekOffset === 0 ? scheduleWeekLabel : 'Return to this week'}</small></button><button aria-label="Next training week" disabled={scheduleWeekOffset >= 8} onClick={() => setScheduleWeekOffset((offset) => offset + 1)}><ChevronRight size={16} /></button></nav>
            <p className="schedule-hint">Select today or an upcoming day to cycle: adaptive → train → rest.</p>
            <div className="week-strip">{week.map((day) => <button className={`${day.status} intent-${day.intent}`} key={day.date} disabled={day.status === 'completed' || day.date < TODAY || (day.date === TODAY && workout.status !== 'not-started')} onClick={() => cycleSchedule(day.date)} title={day.title}><span>{day.day}</span><b>{Number(day.date.slice(-2))}</b><small>{day.status === 'completed' ? 'Done' : day.intent === 'train' ? 'Train' : day.intent === 'rest' ? 'Rest' : day.status === 'today' ? 'Today' : 'Adaptive'}</small></button>)}</div>
            <div className="volume-ledger">{volume.map((item) => <div key={item.muscle}><span><b>{item.muscle}</b><small>{item.completed} / {item.target} hard sets</small></span><div className="volume-bar"><i style={{ width: `${Math.min(100, item.completed / item.target * 100)}%` }} /></div><strong>{Math.round(item.completed / item.target * 100)}%</strong></div>)}</div>
          </article>

          <article className="panel training-history-panel">
            <div className="panel-heading"><div><span className="section-label">TRAINING HISTORY</span><h3>Recent completed sessions</h3></div><div className="training-history-actions"><Activity size={22} className="trend-icon" /><label><span className="sr-only">Export scope</span><select value={historyExportScope} onChange={(event) => setHistoryExportScope(event.target.value as TrainingHistoryExportScope)}><option value="current-view">Current view ({filteredTrainingRecords.length})</option><option value="all">Full history ({sessionHistory.length})</option></select></label><button onClick={exportTrainingHistoryExcel} disabled={!trainingExportRecords.length}><Download size={15} /> Export Excel</button><button className="export-secondary" onClick={exportTrainingHistoryCsv} disabled={!trainingExportRecords.length}>CSV</button></div></div>
            <p className="panel-copy">Duration, completed volume, and your reported experience stay together across devices.</p>
            <div className="training-trend-summary">
              <div className="training-trend-metrics"><span><small>4-week sessions</small><b>{trainingTrend.sessions}</b></span><span><small>Total time</small><b>{trainingTrend.minutes} min</b></span><span><small>Average effort</small><b>{trainingTrend.averageEffort ? `${trainingTrend.averageEffort}/10` : 'Not enough data'}</b></span><span><small>Feedback coverage</small><b>{trainingTrend.feedbackCoverage}%</b></span><span><small>Controlled movement</small><b>{trainingTrend.controlledQualityPct === undefined ? 'Not enough data' : `${trainingTrend.controlledQualityPct}%`}</b></span></div>
              <div className="training-week-chart" aria-label="Training minutes by week">{trainingTrend.weeks.map((week) => <div key={week.startDate}><span className="week-bar-track"><i style={{ height: `${Math.max(4, week.minutes / maxWeeklyMinutes * 100)}%` }} /></span><b>{week.minutes}</b><small>{week.label}</small></div>)}</div>
              {trainingTrend.discomfortSessions > 0 && <div className="training-trend-note"><ShieldAlert size={15} /><span>{trainingTrend.discomfortSessions} session{trainingTrend.discomfortSessions === 1 ? '' : 's'} included discomfort feedback in this four-week window.</span></div>}{trainingTrend.progressionHoldSessions > 0 && <div className="training-trend-note quality"><Repeat2 size={15} /><span>{trainingTrend.progressionHoldSessions} session{trainingTrend.progressionHoldSessions === 1 ? '' : 's'} held progression because movement quality was not yet repeatable.</span></div>}
            </div>
            <div className="training-history-controls"><label><span className="sr-only">Search training history</span><input type="search" placeholder="Search workouts, exercises, or notes" value={historyQuery} onChange={(event) => { setHistoryQuery(event.target.value); setHistoryVisibleCount(TRAINING_HISTORY_PAGE_SIZE); setSelectedHistoryId(null); }} /></label><div role="group" aria-label="Filter training history">{([['all', 'All'], ['high-effort', 'High effort'], ['discomfort', 'Discomfort']] as const).map(([value, label]) => <button className={historyFilter === value ? 'active' : ''} aria-pressed={historyFilter === value} key={value} onClick={() => { setHistoryFilter(value); setHistoryVisibleCount(TRAINING_HISTORY_PAGE_SIZE); setSelectedHistoryId(null); }}>{label}</button>)}</div><label className="history-range"><span className="sr-only">Training history time range</span><select value={historyRange} onChange={(event) => { setHistoryRange(event.target.value as TrainingHistoryRange); setHistoryVisibleCount(TRAINING_HISTORY_PAGE_SIZE); setSelectedHistoryId(null); }}><option value="30-days">Last 30 days</option><option value="90-days">Last 90 days</option><option value="all-time">All time</option></select></label><label className="history-sort"><span className="sr-only">Sort training history</span><select value={historySort} onChange={(event) => { setHistorySort(event.target.value as TrainingHistorySort); setHistoryVisibleCount(TRAINING_HISTORY_PAGE_SIZE); setSelectedHistoryId(null); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest-effort">Highest effort</option><option value="longest">Longest duration</option></select></label><small>Showing {visibleHistoryCount} of {filteredTrainingRecords.length} match{filteredTrainingRecords.length === 1 ? '' : 'es'}</small></div>
            <div className="training-history-list">{recentTraining.length ? recentTraining.map((entry) => <button className={`training-history-row ${entry.tone}`} key={entry.workoutId} onClick={() => setSelectedHistoryId(entry.workoutId)} aria-expanded={selectedHistoryId === entry.workoutId}>
              <time dateTime={entry.date}>{entry.dateLabel}</time>
              <span><b>{entry.title}</b><small>{entry.muscleLabel} · {entry.completedSets} set{entry.completedSets === 1 ? '' : 's'}</small></span>
              <span className="history-metrics"><b>{entry.durationLabel}</b>{entry.effortLabel && <small>{entry.effortLabel}</small>}</span>
              {(entry.discomfortLabel || entry.movementQualityLabel) && <span className="history-signals">{entry.discomfortLabel && <strong>{entry.discomfortLabel}</strong>}{entry.movementQualityLabel && <em className={entry.movementQuality}>{entry.movementQualityLabel}</em>}</span>}
              <ChevronRight className="history-chevron" size={17} />
            </button>) : <div className="empty-state">{sessionHistory.length ? 'No sessions match this search and filter.' : 'Complete a workout to start your training history.'}</div>}</div>
            {visibleHistoryCount < filteredTrainingRecords.length && <button className="training-history-more" onClick={() => setHistoryVisibleCount(nextTrainingHistoryCount(filteredTrainingRecords.length, visibleHistoryCount))}>Show {Math.min(TRAINING_HISTORY_PAGE_SIZE, filteredTrainingRecords.length - visibleHistoryCount)} older session{Math.min(TRAINING_HISTORY_PAGE_SIZE, filteredTrainingRecords.length - visibleHistoryCount) === 1 ? '' : 's'}</button>}
            {selectedTraining && <section className="training-history-detail" aria-labelledby="training-history-detail-title">
              <header><div><span className="section-label">SESSION DETAIL · {selectedTraining.dateLabel}</span><h4 id="training-history-detail-title">{selectedTraining.title}</h4></div><button onClick={() => setSelectedHistoryId(null)} aria-label="Close session detail"><X size={17} /></button></header>
              <div className="history-detail-metrics"><span><small>Duration</small><b>{selectedTraining.durationLabel}</b></span><span><small>Volume</small><b>{selectedTraining.completedSets} sets</b></span><span><small>Experience</small><b>{selectedTraining.effortLabel ?? 'Not recorded'}</b></span><span><small>Movement quality</small><b>{selectedTraining.movementQualityLabel ?? 'Not recorded'}</b></span></div>
              {(selectedTrainingNeighbors.previousWorkoutId || selectedTrainingNeighbors.nextWorkoutId) && <nav className="history-detail-navigation" aria-label="Matching workout sessions"><button disabled={!selectedTrainingNeighbors.previousWorkoutId} onClick={() => selectedTrainingNeighbors.previousWorkoutId && setSelectedHistoryId(selectedTrainingNeighbors.previousWorkoutId)}>← Previous {selectedTraining.title}</button><span>Browse matching workouts</span><button disabled={!selectedTrainingNeighbors.nextWorkoutId} onClick={() => selectedTrainingNeighbors.nextWorkoutId && setSelectedHistoryId(selectedTrainingNeighbors.nextWorkoutId)}>Next {selectedTraining.title} →</button></nav>}
              {selectedTrainingComparison && <div className="history-comparison"><div><span className="section-label">VS PREVIOUS MATCH · {new Date(`${selectedTrainingComparison.previousDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span><b>Change since your last {selectedTraining.title}</b></div><span><small>Duration</small><b>{selectedTrainingComparison.duration.delta > 0 ? '+' : ''}{selectedTrainingComparison.duration.delta} min</b><em>{selectedTrainingComparison.duration.previous} → {selectedTrainingComparison.duration.current}</em></span><span><small>Completed sets</small><b>{selectedTrainingComparison.completedSets.delta > 0 ? '+' : ''}{selectedTrainingComparison.completedSets.delta}</b><em>{selectedTrainingComparison.completedSets.previous} → {selectedTrainingComparison.completedSets.current}</em></span><span><small>Reported effort</small><b>{selectedTrainingComparison.effort ? `${selectedTrainingComparison.effort.delta > 0 ? '+' : ''}${selectedTrainingComparison.effort.delta}` : 'Not comparable'}</b><em>{selectedTrainingComparison.effort ? `${selectedTrainingComparison.effort.previous} → ${selectedTrainingComparison.effort.current}` : 'Both sessions need a rating'}</em></span><span className={`quality-comparison ${selectedTrainingComparison.movementQuality ? (selectedTrainingComparison.movementQuality.delta > 0 ? 'improved' : selectedTrainingComparison.movementQuality.delta < 0 ? 'declined' : 'held') : ''}`}><small>Movement quality</small><b>{selectedTrainingComparison.movementQuality ? (selectedTrainingComparison.movementQuality.delta > 0 ? 'Improved' : selectedTrainingComparison.movementQuality.delta < 0 ? 'Needs control' : 'Held') : 'Not comparable'}</b><em>{selectedTrainingComparison.movementQuality ? `${selectedTrainingComparison.movementQuality.previous === 'controlled' ? 'Controlled' : selectedTrainingComparison.movementQuality.previous === 'mixed' ? 'Mixed' : 'Broke down'} → ${selectedTrainingComparison.movementQuality.current === 'controlled' ? 'Controlled' : selectedTrainingComparison.movementQuality.current === 'mixed' ? 'Mixed' : 'Broke down'}` : 'Both sessions need a rating'}</em></span>{selectedTrainingComparison.exercises.length > 0 && <section className="history-exercise-comparison"><header><b>Movement continuity</b><small>Previous → current completed sets</small></header>{selectedTrainingComparison.exercises.map((exercise) => <span key={exercise.exerciseId}><b>{exercise.name}</b><em>{exercise.previousSets} → {exercise.currentSets}</em><strong className={exercise.delta === 0 ? 'same' : ''}>{exercise.delta > 0 ? '+' : ''}{exercise.delta}</strong></span>)}</section>}{selectedTrainingStory && <section className={`training-comparison-story ${selectedTrainingStory.tone}`}><span className="section-label">FORGE COACHING READ</span><h5>{selectedTrainingStory.headline}</h5><p>{selectedTrainingStory.insight}</p><div><ArrowRight size={15} /><span><b>Next best action</b>{selectedTrainingStory.nextStep}</span></div></section>}</div>}
              {selectedTraining.exercises.length ? <div className="history-exercises">{selectedTraining.exercises.map((exercise) => <div key={exercise.id}><span><b>{exercise.name}</b><small>{exercise.completionLabel}</small></span><Check size={16} /></div>)}</div> : <div className="history-breakdown">{selectedTraining.muscleBreakdown.length ? selectedTraining.muscleBreakdown.join(' · ') : 'Recovery work completed'}</div>}
              {(selectedTraining.discomfortLabel || selectedTraining.movementQualityLabel) && <div className={`history-feedback ${selectedTraining.tone}`}><b>{selectedTraining.discomfortLabel ?? selectedTraining.movementQualityLabel}</b><span>{selectedTraining.feedbackNote ?? (selectedTraining.movementQuality === 'controlled' ? 'Range and tempo were reported as repeatable.' : 'Forge held progression until movement quality is repeatable.')}</span></div>}
            </section>}
          </article>
        </section>
      </main>

      {reflectionOpen && <div className="drawer-backdrop" onMouseDown={() => setReflectionOpen(false)}>
        <aside ref={reflectionDialogRef} className="drawer reflection-drawer" role="dialog" aria-modal="true" aria-labelledby="reflection-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
          <div className="drawer-heading"><div><span className="section-label">END-OF-DAY SIGNALS</span><h2 id="reflection-title">Mind, body, soul</h2><p>Capture how the day felt. Forge uses this as personal context—not a diagnosis or a readiness clearance.</p></div><button onClick={() => setReflectionOpen(false)} aria-label="Close evening reflection"><X size={20} /></button></div>
          <label>Mind <output>{reflectionDraft.mindScore}/10</output><input type="range" min="1" max="10" value={reflectionDraft.mindScore} onChange={(event) => setReflectionDraft({ ...reflectionDraft, mindScore: Number(event.target.value) })} /><small>Clarity, focus, and mental energy</small></label>
          <label>Body <output>{reflectionDraft.bodyScore}/10</output><input type="range" min="1" max="10" value={reflectionDraft.bodyScore} onChange={(event) => setReflectionDraft({ ...reflectionDraft, bodyScore: Number(event.target.value) })} /><small>Physical energy and overall comfort</small></label>
          <label>Soul <output>{reflectionDraft.soulScore}/10</output><input type="range" min="1" max="10" value={reflectionDraft.soulScore} onChange={(event) => setReflectionDraft({ ...reflectionDraft, soulScore: Number(event.target.value) })} /><small>Connection, purpose, and fulfillment</small></label>
          <label className="reflection-note">Optional reflection <span>{reflectionDraft.reflectionNote.length}/280</span><textarea maxLength={280} rows={4} placeholder="What helped today, and what would support tomorrow?" value={reflectionDraft.reflectionNote} onChange={(event) => setReflectionDraft({ ...reflectionDraft, reflectionNote: event.target.value })} /></label>
          <button className="save-checkin" onClick={saveReflection}><Sparkles size={18} /> Save evening reflection</button>
          <small className="privacy-note">Saved with today’s Digital Twin snapshot and synchronized securely when you are signed in.</small>
        </aside>
      </div>}

      {checkInOpen && <div className="drawer-backdrop" onMouseDown={() => setCheckInOpen(false)}>
        <aside ref={checkInDialogRef} className="drawer" role="dialog" aria-modal="true" aria-labelledby="checkin-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
          <div className="drawer-heading"><div><span className="section-label">DAILY SIGNALS</span><h2 id="checkin-title">Morning check-in</h2><p>These inputs update your Digital Twin and today’s guidance.</p></div><button onClick={() => setCheckInOpen(false)} aria-label="Close check-in"><X size={20} /></button></div>
          <label>Body weight (kg) <output>{checkInDraft.weightKg.toFixed(1)} kg</output><input type="number" min="30" max="300" step="0.1" inputMode="decimal" value={checkInDraft.weightKg} onChange={(e) => setCheckInDraft({ ...checkInDraft, weightKg: Number(e.target.value) })} /></label>
          <label>Sleep quality <output>{checkInDraft.sleepScore}/100</output><input type="range" min="0" max="100" value={checkInDraft.sleepScore} onChange={(e) => setCheckInDraft({ ...checkInDraft, sleepScore: Number(e.target.value) })} /></label>
          <label>Hours slept <output>{checkInDraft.sleepHours.toFixed(1)}h</output><input type="range" min="0" max="12" step="0.1" value={checkInDraft.sleepHours} onChange={(e) => setCheckInDraft({ ...checkInDraft, sleepHours: Number(e.target.value) })} /></label>
          <label>Soreness <output>{checkInDraft.soreness}/10</output><input type="range" min="0" max="10" value={checkInDraft.soreness} onChange={(e) => setCheckInDraft({ ...checkInDraft, soreness: Number(e.target.value) })} /></label>
          <label>Stress <output>{checkInDraft.stress}/10</output><input type="range" min="0" max="10" value={checkInDraft.stress} onChange={(e) => setCheckInDraft({ ...checkInDraft, stress: Number(e.target.value) })} /></label>
          <button className="save-checkin" onClick={saveCheckIn}><Sparkles size={18} /> Update today’s plan</button>
          <small className="privacy-note">Saved on this device and synchronized securely when you are signed in.</small>
        </aside>
      </div>}

      {onboardingOpen && <OnboardingFlow onComplete={completeOnboarding} onClose={() => setOnboardingOpen(false)} />}
      {workoutOpen && <WorkoutPlayer session={workout} exerciseHistory={exerciseHistory} {...(currentWorkoutFocus ? { carryForward: currentWorkoutFocus } : {})} onChange={persistWorkout} onClose={() => setWorkoutOpen(false)} onFinish={finishWorkout} />}
      {foodLoggerOpen && <FoodLogger date={TODAY} entries={foodEntries} favoriteFoodIds={favoriteFoodIds} savedMeals={savedMeals} onChange={updateFoodEntries} onPreferencesChange={updateFoodPreferences} onClose={() => setFoodLoggerOpen(false)} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} onGeneratePlan={generateNewPlan} onReset={resetPrototype} />}
      {coachOpen && <CoachPanel twin={twin} messages={coachMessages} onMessagesChange={updateCoachMessages} onAction={handleCoachAction} onClose={() => setCoachOpen(false)} />}
      {movementLibraryOpen && <MovementLibrary onClose={() => setMovementLibraryOpen(false)} />}

      <nav className="mobile-nav" aria-label="Mobile navigation"><a className="active" href="#today"><Home size={20} /><span>Today</span></a><a href="#training"><Dumbbell size={20} /><span>Train</span></a><button disabled={firstRun} onClick={openCheckIn} aria-label="Open daily check-in"><Plus size={22} /></button><a href="#nutrition"><Apple size={20} /><span>Nutrition</span></a><button className="mobile-coach" onClick={() => setCoachOpen(true)}><Brain size={20} /><span>Coach</span></button></nav>
    </div>
  );
}
