import { useMemo, useState } from 'react';
import { CoachService } from '@forge/coach';
import { buildDigitalTwin, type DailySnapshot, type Recommendation } from '@forge/digital-twin';
import {
  Activity, Apple, ArrowRight, Brain, ChevronRight, CircleUserRound, Dumbbell,
  Flame, Footprints, Gauge, HeartPulse, Home, Moon, Plus, Settings, Sparkles,
  Save, Target, TrendingDown, Utensils, X,
} from 'lucide-react';
import { demoGoals, demoHistory, demoProfile } from './demoData.js';
import { loadDashboardState, saveDashboardState, type CheckIn } from './dashboardStorage.js';

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

export function App() {
  const [initialState] = useState(initialDashboardState);
  const [history, setHistory] = useState(initialState.history);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checkIn, setCheckIn] = useState<CheckIn>(initialState.checkIn);
  const [checkInDraft, setCheckInDraft] = useState<CheckIn>(initialState.checkIn);
  const [savedAt, setSavedAt] = useState(initialState.savedAt);

  const evaluation = useMemo(() => {
    const twin = buildDigitalTwin({ profile: { ...demoProfile, weightKg: checkIn.weightKg }, goals: demoGoals, history, asOfDate: TODAY, now: NOW });
    return new CoachService().evaluateToday(twin, NOW);
  }, [history, checkIn.weightKg]);

  const { twin, brief } = evaluation;
  const today = history.find((day) => day.date === TODAY)!;
  const targetProtein = Math.round(checkIn.weightKg * 1.8);
  const calorieTarget = 2200;
  const weights = history.map((day) => day.weightKg ?? checkIn.weightKg);

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
    });
    setSaved(true);
    setCheckInOpen(false);
    window.setTimeout(() => setSaved(false), 2600);
  }

  function openCheckIn() {
    setCheckInDraft(checkIn);
    setCheckInOpen(true);
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
          <a href="#coach"><Brain size={19} /><span>AI Coach</span></a>
        </nav>
        <div className="sidebar-bottom">
          <a href="#settings"><Settings size={19} /><span>Settings</span></a>
          <div className="profile-chip"><CircleUserRound size={28} /><div><strong>Shane</strong><span>120-day shred</span></div></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div><span className="eyebrow">WEDNESDAY · AUGUST 12</span><h1>Good morning, Shane.</h1><p>Your plan has adapted to how you’re recovering today.</p></div>
          <div className="topbar-actions">
            <span className="save-status"><Save size={15} /> {savedAt ? 'Saved on this device' : 'Demo data'}</span>
            <button className="checkin-button" onClick={openCheckIn}><Plus size={18} /> Morning check-in</button>
          </div>
        </header>

        {saved && <div className="toast"><Sparkles size={17} /> Digital Twin updated. Today’s guidance is refreshed.</div>}

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
            <div className="coach-action"><span>{brief.recommendations[0]?.action ?? 'Complete your planned session and keep nutrition consistent.'}</span><button aria-label="Open AI Coach"><ArrowRight size={18} /></button></div>
            <div className="confidence"><span>Decision confidence</span><strong>{brief.recommendations[0]?.confidence ?? 76}%</strong></div>
          </article>
        </section>

        <section className="metric-strip">
          <div><span className="metric-icon orange"><Flame size={19} /></span><p>Calories</p><strong>{today.caloriesKcal?.toLocaleString()}</strong><small>of {calorieTarget.toLocaleString()} kcal</small><Progress value={today.caloriesKcal ?? 0} max={calorieTarget} tone="orange" /></div>
          <div><span className="metric-icon blue"><Apple size={19} /></span><p>Protein</p><strong>{today.proteinG}g</strong><small>of {targetProtein}g target</small><Progress value={today.proteinG ?? 0} max={targetProtein} tone="blue" /></div>
          <div><span className="metric-icon violet"><Footprints size={19} /></span><p>Steps</p><strong>{today.steps?.toLocaleString()}</strong><small>of 10,000 steps</small><Progress value={today.steps ?? 0} max={10000} tone="violet" /></div>
          <div><span className="metric-icon lime"><Dumbbell size={19} /></span><p>Training</p><strong>{twin.training.sessionsLast7Days}/{demoGoals.weeklyTrainingTarget}</strong><small>sessions this week</small><Progress value={twin.training.sessionsLast7Days} max={demoGoals.weeklyTrainingTarget ?? 5} /></div>
        </section>

        <section className="content-grid">
          <article className="panel workout-panel" id="training">
            <div className="panel-heading"><div><span className="section-label">TODAY’S TRAINING</span><h3>Cardio + mobility reset</h3></div><span className="duration">45 MIN</span></div>
            <p className="panel-copy">A lower-impact session protects recovery while keeping your weekly momentum moving.</p>
            <div className="workout-list">
              <div><span>01</span><div><strong>Zone 2 treadmill</strong><small>30 min · conversational pace</small></div><ChevronRight size={18} /></div>
              <div><span>02</span><div><strong>Hip + thoracic mobility</strong><small>10 min · controlled range</small></div><ChevronRight size={18} /></div>
              <div><span>03</span><div><strong>Dead bugs</strong><small>3 × 10 each side</small></div><ChevronRight size={18} /></div>
            </div>
            <button className="primary-action"><Dumbbell size={18} /> Start workout <ArrowRight size={18} /></button>
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
        </section>
      </main>

      {checkInOpen && <div className="drawer-backdrop" onMouseDown={() => setCheckInOpen(false)}>
        <aside className="drawer" onMouseDown={(event) => event.stopPropagation()}>
          <div className="drawer-heading"><div><span className="section-label">DAILY SIGNALS</span><h2>Morning check-in</h2><p>These inputs update your Digital Twin and today’s guidance.</p></div><button onClick={() => setCheckInOpen(false)}><X size={20} /></button></div>
          <label>Body weight <output>{checkInDraft.weightKg.toFixed(1)} kg</output><input type="range" min="65" max="90" step="0.1" value={checkInDraft.weightKg} onChange={(e) => setCheckInDraft({ ...checkInDraft, weightKg: Number(e.target.value) })} /></label>
          <label>Sleep quality <output>{checkInDraft.sleepScore}/100</output><input type="range" min="0" max="100" value={checkInDraft.sleepScore} onChange={(e) => setCheckInDraft({ ...checkInDraft, sleepScore: Number(e.target.value) })} /></label>
          <label>Hours slept <output>{checkInDraft.sleepHours.toFixed(1)}h</output><input type="range" min="0" max="12" step="0.1" value={checkInDraft.sleepHours} onChange={(e) => setCheckInDraft({ ...checkInDraft, sleepHours: Number(e.target.value) })} /></label>
          <label>Soreness <output>{checkInDraft.soreness}/10</output><input type="range" min="0" max="10" value={checkInDraft.soreness} onChange={(e) => setCheckInDraft({ ...checkInDraft, soreness: Number(e.target.value) })} /></label>
          <label>Stress <output>{checkInDraft.stress}/10</output><input type="range" min="0" max="10" value={checkInDraft.stress} onChange={(e) => setCheckInDraft({ ...checkInDraft, stress: Number(e.target.value) })} /></label>
          <button className="save-checkin" onClick={saveCheckIn}><Sparkles size={18} /> Update today’s plan</button>
          <small className="privacy-note">Saved securely on this device for the prototype. Account sync arrives with production persistence.</small>
        </aside>
      </div>}

      <nav className="mobile-nav"><a className="active" href="#today"><Home size={20} /><span>Today</span></a><a href="#training"><Dumbbell size={20} /><span>Train</span></a><button onClick={openCheckIn}><Plus size={22} /></button><a href="#nutrition"><Apple size={20} /><span>Nutrition</span></a><a href="#coach"><Brain size={20} /><span>Coach</span></a></nav>
    </div>
  );
}
