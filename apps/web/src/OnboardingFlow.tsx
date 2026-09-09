import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ClipboardCheck, Dumbbell, Sparkles, Target, X } from 'lucide-react';
import { isOnboardingProfile, type ExperienceLevel, type JourneyGoal, type NutritionApproach, type OnboardingProfile, type TrainingLocation } from './onboarding.js';
import { buildOnboardingReview, type OnboardingAnswers } from './onboardingReview.js';
import type { TrainingPreferences } from './trainingPlanner.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface OnboardingFlowProps {
  onComplete(profile: OnboardingProfile): void;
  onClose(): void;
}

const goalOptions: Array<{ value: JourneyGoal; label: string; detail: string }> = [
  { value: 'build-muscle-strength', label: 'Build muscle + strength', detail: 'Progressive resistance training and recovery.' },
  { value: 'lose-fat-body-composition', label: 'Lose fat + change body composition', detail: 'Sustainable nutrition with strength retention.' },
  { value: 'endurance-conditioning', label: 'Improve endurance + conditioning', detail: 'Build work capacity without losing recovery.' },
  { value: 'healthier-more-energy', label: 'Feel healthier + more energetic', detail: 'Simple habits, movement, nutrition, and recovery.' },
  { value: 'return-to-consistency', label: 'Return to consistency', detail: 'A realistic routine that rebuilds momentum.' },
  { value: 'maintain-performance', label: 'Maintain my performance', detail: 'Protect current fitness with efficient training.' },
  { value: 'help-me-choose', label: 'Help me choose', detail: 'Begin with a balanced foundation and learn from feedback.' },
];

const equipmentOptions: Array<{ value: TrainingPreferences['equipment'][number]; label: string }> = [
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'rack', label: 'Rack' },
  { value: 'bands', label: 'Bands' },
  { value: 'treadmill', label: 'Treadmill' },
];

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function OnboardingFlow({ onComplete, onClose }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [primaryGoal, setPrimaryGoal] = useState<JourneyGoal | null>(null);
  const [experience, setExperience] = useState<ExperienceLevel>('new');
  const [weeklyTrainingDays, setWeeklyTrainingDays] = useState(3);
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [location, setLocation] = useState<TrainingLocation>('home');
  const [equipment, setEquipment] = useState<TrainingPreferences['equipment']>(['bodyweight']);
  const [constraints, setConstraints] = useState<TrainingPreferences['constraints']>([]);
  const [nutritionApproach, setNutritionApproach] = useState<NutritionApproach>('simple-guidance');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<OnboardingProfile['sex']>('unspecified');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const dialogRef = useAccessibleDialog(onClose);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { stepHeadingRef.current?.focus(); }, [step]);

  const baselineValid = Number(age) >= 18 && Number(age) <= 100
    && Number(heightCm) >= 120 && Number(heightCm) <= 230
    && Number(weightKg) >= 30 && Number(weightKg) <= 300;

  function currentAnswers(): OnboardingAnswers | null {
    if (!primaryGoal || !baselineValid || equipment.length === 0) return null;
    return {
      version: 1,
      primaryGoal,
      experience,
      weeklyTrainingDays,
      sessionMinutes,
      location,
      equipment,
      constraints,
      nutritionApproach,
      age: Number(age),
      sex,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
    };
  }

  const answers = currentAnswers();
  const review = answers ? buildOnboardingReview(answers) : null;

  function finish() {
    const approvedAnswers = currentAnswers();
    if (!approvedAnswers) return;
    const profile: OnboardingProfile = {
      ...approvedAnswers,
      completedAt: new Date().toISOString(),
    };
    if (isOnboardingProfile(profile)) onComplete(profile);
  }

  return <div className="onboarding-backdrop" onMouseDown={onClose}>
    <aside ref={dialogRef} className="onboarding-flow" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <header>
        <div className="onboarding-brand"><span>F</span><b>FORGE</b></div>
        <div className="onboarding-progress" role="progressbar" aria-label="Plan setup progress" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1} aria-valuetext={'Step ' + (step + 1) + ' of 4'}><i style={{ width: String((step + 1) / 4 * 100) + '%' }} /></div>
        <button onClick={onClose} aria-label="Close plan setup"><X size={19} /></button>
      </header>

      {step === 0 && <section className="onboarding-step">
        <Target size={28} className="onboarding-step-icon" />
        <span className="section-label">STEP 1 OF 4 · YOUR DIRECTION</span>
        <h2 ref={stepHeadingRef} id="onboarding-title" tabIndex={-1}>What would you like Forge to help you change?</h2>
        <p>Choose one primary goal. You can add a secondary goal later without making today’s plan confusing.</p>
        <div className="onboarding-goals">{goalOptions.map((option) => <button key={option.value} className={primaryGoal === option.value ? 'selected' : ''} aria-pressed={primaryGoal === option.value} onClick={() => setPrimaryGoal(option.value)}>
          <span><b>{option.label}</b><small>{option.detail}</small></span>{primaryGoal === option.value && <Check size={18} />}
        </button>)}</div>
      </section>}

      {step === 1 && <section className="onboarding-step">
        <Dumbbell size={28} className="onboarding-step-icon" />
        <span className="section-label">STEP 2 OF 4 · YOUR TRAINING REALITY</span>
        <h2 ref={stepHeadingRef} id="onboarding-title" tabIndex={-1}>Make the plan fit your life</h2>
        <p>Forge will use this to set frequency, session size, and available movements.</p>
        <div className="onboarding-fields">
          <label>Training experience<select value={experience} onChange={(event) => setExperience(event.target.value as ExperienceLevel)}><option value="new">New to structured training</option><option value="some-experience">Some experience</option><option value="experienced">Experienced</option></select></label>
          <label>Days each week<select value={weeklyTrainingDays} onChange={(event) => setWeeklyTrainingDays(Number(event.target.value))}>{[2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label>
          <label>Time per session<select value={sessionMinutes} onChange={(event) => setSessionMinutes(Number(event.target.value))}><option value={30}>About 30 minutes</option><option value={45}>About 45 minutes</option><option value={60}>About 60 minutes</option><option value={75}>75 minutes</option><option value={90}>90 minutes</option></select></label>
          <label>Where you train<select value={location} onChange={(event) => setLocation(event.target.value as TrainingLocation)}><option value="home">Home</option><option value="gym">Gym</option><option value="both">Home + gym</option></select></label>
        </div>
        <fieldset className="onboarding-options"><legend>Equipment available</legend><div>{equipmentOptions.map((option) => <button type="button" key={option.value} className={equipment.includes(option.value) ? 'selected' : ''} aria-pressed={equipment.includes(option.value)} onClick={() => setEquipment(toggle(equipment, option.value))}>{equipment.includes(option.value) && <Check size={14} />}{option.label}</button>)}</div><small>Select at least one.</small></fieldset>
        <fieldset className="onboarding-options"><legend>Movement considerations</legend><div><button type="button" className={constraints.includes('lower-back-sensitive') ? 'selected' : ''} aria-pressed={constraints.includes('lower-back-sensitive')} onClick={() => setConstraints(toggle(constraints, 'lower-back-sensitive'))}>{constraints.includes('lower-back-sensitive') && <Check size={14} />}Lower-back sensitive</button><button type="button" className={constraints.includes('elbow-sensitive') ? 'selected' : ''} aria-pressed={constraints.includes('elbow-sensitive')} onClick={() => setConstraints(toggle(constraints, 'elbow-sensitive'))}>{constraints.includes('elbow-sensitive') && <Check size={14} />}Elbow sensitive</button></div><small>This guides conservative substitutions; it is not a diagnosis.</small></fieldset>
      </section>}

      {step === 2 && <section className="onboarding-step">
        <Sparkles size={28} className="onboarding-step-icon" />
        <span className="section-label">STEP 3 OF 4 · YOUR STARTING POINT</span>
        <h2 ref={stepHeadingRef} id="onboarding-title" tabIndex={-1}>Give Forge an honest baseline</h2>
        <p>These values let the Digital Twin avoid using a demonstration profile. You can change them later.</p>
        <div className="onboarding-fields baseline">
          <label>Age<input type="number" min="18" max="100" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} placeholder="Age" /></label>
          <label>Sex used for estimates<select value={sex} onChange={(event) => setSex(event.target.value as OnboardingProfile['sex'])}><option value="unspecified">Prefer not to specify</option><option value="female">Female</option><option value="male">Male</option><option value="intersex">Intersex</option></select></label>
          <label>Height (cm)<input type="number" min="120" max="230" inputMode="decimal" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} placeholder="e.g. 173" /></label>
          <label>Current weight (kg)<input type="number" min="30" max="300" step="0.1" inputMode="decimal" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder="e.g. 75.8" /></label>
          <label className="nutrition-choice">Nutrition support<select value={nutritionApproach} onChange={(event) => setNutritionApproach(event.target.value as NutritionApproach)}><option value="simple-guidance">Simple guidance (recommended)</option><option value="track-macros">Track calories + macros</option><option value="not-now">Not right now</option></select></label>
        </div>
        <div className="onboarding-boundary"><b>What happens next</b><span>Forge creates a starting plan from these answers, then asks for today’s sleep, soreness, and stress before adapting it.</span></div>
      </section>}

      {step === 3 && review && <section className="onboarding-step">
        <ClipboardCheck size={28} className="onboarding-step-icon" />
        <span className="section-label">STEP 4 OF 4 · YOUR PLAN</span>
        <h2 ref={stepHeadingRef} id="onboarding-title" tabIndex={-1}>Review your Forge plan</h2>
        <p>Nothing is activated until you approve it. Check that this starting direction feels realistic.</p>
        <div className="onboarding-review-grid">{review.summary.map((item) => <div className="onboarding-review-item" key={item.label}><small>{item.label}</small><b>{item.value}</b></div>)}</div>
        <div className="onboarding-plan-card"><span className="section-label">EXAMPLE WEEKLY STRUCTURE</span><b>{review.weeklyStructure}</b><small>Your daily check-in can make a session easier or recovery-focused without changing your weekly commitment.</small></div>
        <div className="onboarding-approval">
          <div><Check size={17} /><span><b>Forge can adapt</b><small>{review.forgeCanAdapt}</small></span></div>
          <div><Target size={17} /><span><b>You stay in control</b><small>{review.userApprovalRequired}</small></span></div>
        </div>
      </section>}

      <footer>
        <button className="onboarding-back" disabled={step === 0} onClick={() => setStep(step === 3 ? 0 : step - 1)}><ChevronLeft size={17} /> {step === 3 ? 'Change my answers' : 'Back'}</button>
        {step < 2 && <button className="onboarding-next" disabled={(step === 0 && !primaryGoal) || (step === 1 && equipment.length === 0)} onClick={() => setStep(step + 1)}>Continue <ChevronRight size={17} /></button>}
        {step === 2 && <button className="onboarding-next" disabled={!baselineValid} onClick={() => setStep(3)}>Review my plan <ChevronRight size={17} /></button>}
        {step === 3 && <button className="onboarding-next" disabled={!review} onClick={finish}><Check size={17} /> Use this plan</button>}
      </footer>
    </aside>
  </div>;
}
