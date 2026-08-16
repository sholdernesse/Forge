import { useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

type MotionView = 'front' | 'side';
type MotionSpeed = 'normal' | 'slow';

interface ExerciseMotionProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

export function ExerciseMotion({ primaryMuscles, secondaryMuscles }: ExerciseMotionProps) {
  const [playing, setPlaying] = useState(true);
  const [view, setView] = useState<MotionView>('front');
  const [speed, setSpeed] = useState<MotionSpeed>('normal');
  const [cycle, setCycle] = useState(0);

  return <section className="motion-player" aria-label="Animated dumbbell overhead press guide">
    <div
      key={cycle}
      className={`motion-stage ${playing ? 'playing' : 'paused'} ${speed}`}
      aria-describedby="motion-guide-note"
    >
      <svg viewBox="0 0 480 320" role="img" aria-label={`${view} view of a controlled dumbbell overhead press repetition`}>
        <rect width="480" height="320" rx="18" className="motion-background" />
        <path className="motion-path" d={view === 'front' ? 'M150 150 C135 105 145 65 175 42 M330 150 C345 105 335 65 305 42' : 'M262 150 C270 108 266 65 250 42'} />
        {view === 'front' ? <>
          <circle className="motion-head" cx="240" cy="72" r="30" />
          <path className="motion-body" d="M240 104 L240 235 M240 140 L176 154 M240 140 L304 154 M240 235 L205 300 M240 235 L275 300" />
          <ellipse className="muscle-primary" cx="193" cy="133" rx="23" ry="17" />
          <ellipse className="muscle-primary" cx="287" cy="133" rx="23" ry="17" />
          <ellipse className="muscle-secondary" cx="164" cy="174" rx="13" ry="28" />
          <ellipse className="muscle-secondary" cx="316" cy="174" rx="13" ry="28" />
          <path className="motion-start-frame" d="M176 154 L150 205 M304 154 L330 205" />
          <path className="motion-finish-frame" d="M193 132 L175 45 M287 132 L305 45" />
          <g className="motion-dumbbells">
            <path d="M125 198 h50 M125 187 v22 M175 187 v22" />
            <path d="M305 198 h50 M305 187 v22 M355 187 v22" />
          </g>
        </> : <>
          <circle className="motion-head" cx="265" cy="72" r="30" />
          <path className="motion-body" d="M248 103 L235 235 M238 140 L262 154 M235 235 L212 300 M235 235 L274 300" />
          <ellipse className="muscle-primary" cx="247" cy="132" rx="22" ry="17" />
          <ellipse className="muscle-secondary" cx="269" cy="175" rx="13" ry="29" />
          <path className="motion-start-frame" d="M250 148 L267 205" />
          <path className="motion-finish-frame" d="M250 134 L250 45" />
          <g className="motion-dumbbells single"><path d="M238 198 h50 M238 187 v22 M288 187 v22" /></g>
        </>}
        <text x="22" y="292" className="motion-phase motion-phase-start">CONTROLLED LOWER</text>
        <text x="22" y="292" className="motion-phase motion-phase-finish">STACKED FINISH</text>
      </svg>
      <div className="motion-muscles" aria-label="Intended muscle emphasis">
        <span><i className="primary" />Primary: {primaryMuscles.join(', ')}</span>
        <span><i className="secondary" />Secondary: {secondaryMuscles.join(', ')}</span>
      </div>
    </div>

    <div className="motion-controls">
      <button onClick={() => setPlaying((current) => !current)} aria-pressed={!playing}>
        {playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'Pause' : 'Play'}
      </button>
      <button onClick={() => setCycle((current) => current + 1)}><RotateCcw size={15} />Restart</button>
      <label>View<select value={view} onChange={(event) => setView(event.target.value as MotionView)}><option value="front">Front</option><option value="side">Side</option></select></label>
      <label>Speed<select value={speed} onChange={(event) => setSpeed(event.target.value as MotionSpeed)}><option value="normal">Normal</option><option value="slow">Slow</option></select></label>
    </div>
    <p id="motion-guide-note">Reference animation only. Individual limb proportions and comfortable range vary.</p>
  </section>;
}
