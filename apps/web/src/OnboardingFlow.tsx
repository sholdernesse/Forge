import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Dumbbell, Sparkles, Target, X } from 'lucide-react';
import { isOnboardingProfile, type ExperienceLevel, type JourneyGoal, type NutritionApproach, type OnboardingProfile, type TrainingLocation } from './onboarding.js';
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

  const baselineValid = Number(age) >= 18 && Number(age) <= 100
    && Number(heightCm) >= 120 && Number(heightCm) <= 230
    && Number(weightKg) >= 30 && Number(weightKg) <= 300;

  function finish() {
    if (!primaryGoal) return;
    const profile: OnboardingProfile = {
      version: 1,
      completedAt: new Date().toISOString(),
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
    if (isOnboardingProfile(profile)) onComplete(profile);
  }

  return <div className="onboarding-backdrop" onMouseDown={onClose}>
    <aside ref={dialogRef} className="onboarding-flow" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <header>
        <div className="onboarding-brand"><span>F</span><b>FORGE</b></div>
        <div className="onboarding-progress" role="progressbar" aria-label="Plan setup progress" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-valuetext={'Step ' + (step + 1) + ' of 3'}><i style={{ width: String((step + 1) / 3 * 100) + '%' }} /></div>
        <button onClick={onClose} aria-label="Close plan setup"><X size={19} /></button>
      </header>

      {step === 0 && <section className="onboarding-step">
        <Target size={28} className="onboarding-step-icon" />
        <span className="section-label">STEP 1 OF 3 · YOUR DIRECTION</span>
        <h2 id="onboarding-title">What would you like Forge to help you change?</h2>
        <p>Choose one primary goal. You can add a secondary goal later without making today’s plan confusing.</p>
        <div className="onboarding-goals">{goalOptions.map((option) => <button key={option.value} className={primaryGoal === option.value ? 'selected' : ''} aria-pressed={primaryGoal === option.value} onClick={() => setPrimaryGoal(option.value)}>
          <span><b>{option.label}</b><small>{option.detail}</small></span>{primaryGoal === option.value && <Check size={18} />}
        </button>)}</div>
      </section>}

      {step === 1 && <section className="onboarding-step">
        <Dumbbell size={28} className="onboarding-step-icon" />
        <span className="section-label">STEP 2 OF 3 · YOUR TRAINING REALITY</span>
        <h2 id="onboarding-title">Make the plan fit your life</h2>
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
        <span className="section-label">STEP 3 OF 3 · YOUR STARTING POINT</span>
        <h2 id="onboarding-title">Give Forge an honest baseline</h2>
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

      <footer>
        <button className="onboarding-back" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft size={17} /> Back</button>
        {step < 2 ? <button className="onboarding-next" disabled={(step === 0 && !primaryGoal) || (step === 1 && equipment.length === 0)} onClick={() => setStep(step + 1)}>Continue <ChevronRight size={17} /></button>
          : <button className="onboarding-next" disabled={!baselineValid} onClick={finish}><Sparkles size={17} /> Build my Forge plan</button>}
      </footer>
    </aside>
  </div>;
}
