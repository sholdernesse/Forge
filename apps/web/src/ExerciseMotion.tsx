import { useState, type ReactNode } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

export type ExerciseMotionId =
  | 'barbell-bench'
  | 'box-squat'
  | 'dead-bugs'
  | 'dumbbell-overhead-press'
  | 'chest-supported-row'
  | 'hip-thrust';

type MotionSpeed = 'normal' | 'slow';

interface ExerciseMotionProps {
  motionId: ExerciseMotionId;
  title: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

interface Scene {
  camera: 'Front' | 'Side';
  startLabel: string;
  finishLabel: string;
  path: string;
  muscles: ReactNode;
  environment: ReactNode;
  start: ReactNode;
  finish: ReactNode;
}

const person = (headX: number, headY: number, bodyPath: string) => <>
  <circle className="motion-head" cx={headX} cy={headY} r="22" />
  <path className="motion-body" d={bodyPath} />
</>;

function motionScene(id: ExerciseMotionId): Scene {
  if (id === 'barbell-bench') return {
    camera: 'Side',
    startLabel: 'STACKED START',
    finishLabel: 'CONTROLLED TOUCH',
    path: 'M240 82 L240 168',
    environment: <><rect className="motion-equipment-fill" x="105" y="205" width="265" height="18" rx="7" /><path className="motion-equipment" d="M135 223v55 M340 223v55" /></>,
    muscles: <><ellipse className="muscle-primary" cx="235" cy="176" rx="38" ry="15" /><ellipse className="muscle-secondary" cx="285" cy="151" rx="24" ry="11" /></>,
    start: <>{person(150, 174, 'M175 184 L300 184 M190 184 L160 230 M285 184 L330 230')}<path className="motion-limb" d="M220 180 L220 105 M275 180 L275 105" /><path className="motion-weight" d="M170 96 H325 M170 82v28 M325 82v28" /></>,
    finish: <>{person(150, 174, 'M175 184 L300 184 M190 184 L160 230 M285 184 L330 230')}<path className="motion-limb" d="M220 180 L200 150 L215 128 M275 180 L295 150 L280 128" /><path className="motion-weight" d="M175 124 H320 M175 110v28 M320 110v28" /></>,
  };
  if (id === 'box-squat') return {
    camera: 'Side',
    startLabel: 'TALL START',
    finishLabel: 'QUIET BOX TOUCH',
    path: 'M258 72 C252 130 230 175 202 210',
    environment: <><rect className="motion-equipment-fill" x="285" y="212" width="95" height="16" rx="4" /><path className="motion-equipment" d="M300 228v52 M365 228v52 M80 286h320" /></>,
    muscles: <><ellipse className="muscle-primary" cx="238" cy="180" rx="28" ry="21" /><ellipse className="muscle-secondary" cx="240" cy="224" rx="20" ry="34" /></>,
    start: <>{person(240, 68, 'M240 92 L240 190 M240 115 L190 145 M240 115 L290 145 M240 190 L212 285 M240 190 L278 285')}<path className="motion-weight" d="M145 112 H335 M145 96v32 M335 96v32" /></>,
    finish: <>{person(225, 115, 'M230 138 L270 196 M240 153 L185 172 M240 153 L295 172 M270 196 L205 230 L175 285 M270 196 L325 220 L350 285')}<path className="motion-weight" d="M150 142 H330 M150 126v32 M330 126v32" /></>,
  };
  if (id === 'dead-bugs') return {
    camera: 'Side',
    startLabel: 'BRACED START',
    finishLabel: 'OPPOSITE REACH',
    path: 'M240 145 C180 105 130 82 82 72 M240 145 C300 180 350 215 400 250',
    environment: <path className="motion-equipment" d="M55 272 H425" />,
    muscles: <><ellipse className="muscle-primary" cx="242" cy="213" rx="38" ry="18" /><ellipse className="muscle-secondary" cx="285" cy="207" rx="24" ry="13" /></>,
    start: <>{person(135, 220, 'M158 224 L280 224')}<path className="motion-limb" d="M205 220 L205 145 M255 220 L255 145 M280 224 L325 190 L325 142 M280 224 L335 240 L335 190" /></>,
    finish: <>{person(135, 220, 'M158 224 L280 224')}<path className="motion-limb" d="M205 220 L112 112 M255 220 L255 145 M280 224 L325 190 L325 142 M280 224 L390 258" /></>,
  };
  if (id === 'dumbbell-overhead-press') return {
    camera: 'Front',
    startLabel: 'STACKED START',
    finishLabel: 'OVERHEAD FINISH',
    path: 'M175 174 C155 120 165 72 190 38 M305 174 C325 120 315 72 290 38',
    environment: <path className="motion-equipment" d="M90 292 H390" />,
    muscles: <><ellipse className="muscle-primary" cx="193" cy="132" rx="23" ry="17" /><ellipse className="muscle-primary" cx="287" cy="132" rx="23" ry="17" /><ellipse className="muscle-secondary" cx="165" cy="176" rx="13" ry="28" /><ellipse className="muscle-secondary" cx="315" cy="176" rx="13" ry="28" /></>,
    start: <>{person(240, 70, 'M240 94 L240 224 M240 130 L190 150 M240 130 L290 150 M240 224 L205 292 M240 224 L275 292')}<path className="motion-limb" d="M190 150 L165 202 M290 150 L315 202" /><path className="motion-weight" d="M140 198h50 M140 186v24 M190 186v24 M290 198h50 M290 186v24 M340 186v24" /></>,
    finish: <>{person(240, 70, 'M240 94 L240 224 M240 130 L205 108 M240 130 L275 108 M240 224 L205 292 M240 224 L275 292')}<path className="motion-limb" d="M205 108 L190 42 M275 108 L290 42" /><path className="motion-weight" d="M165 38h50 M165 26v24 M215 26v24 M265 38h50 M265 26v24 M315 26v24" /></>,
  };
  if (id === 'chest-supported-row') return {
    camera: 'Side',
    startLabel: 'LONG-ARM START',
    finishLabel: 'SUPPORTED PULL',
    path: 'M270 175 C285 205 290 230 285 252',
    environment: <><path className="motion-equipment" d="M135 235 L300 125 M185 205 L145 282 M270 145 L335 282" /><path className="motion-equipment" d="M70 292 H410" /></>,
    muscles: <><ellipse className="muscle-primary" cx="240" cy="151" rx="36" ry="17" /><ellipse className="muscle-secondary" cx="276" cy="174" rx="18" ry="12" /></>,
    start: <>{person(315, 112, 'M292 126 L190 198 M210 184 L155 276 M230 170 L285 280')}<path className="motion-limb" d="M250 160 L280 238 M220 180 L245 258" /><path className="motion-weight" d="M258 244h45 M258 232v24 M303 232v24 M223 264h45 M223 252v24 M268 252v24" /></>,
    finish: <>{person(315, 112, 'M292 126 L190 198 M210 184 L155 276 M230 170 L285 280')}<path className="motion-limb" d="M250 160 L285 178 L270 210 M220 180 L250 198 L240 228" /><path className="motion-weight" d="M248 214h45 M248 202v24 M293 202v24 M218 232h45 M218 220v24 M263 220v24" /></>,
  };
  return {
    camera: 'Side',
    startLabel: 'CONTROLLED LOWER',
    finishLabel: 'GLUTE LOCKOUT',
    path: 'M235 238 C240 195 250 155 270 125',
    environment: <><rect className="motion-equipment-fill" x="80" y="168" width="105" height="18" rx="5" /><path className="motion-equipment" d="M95 186v70 M170 186v70 M65 286h350" /></>,
    muscles: <><ellipse className="muscle-primary" cx="244" cy="205" rx="33" ry="24" /><ellipse className="muscle-secondary" cx="303" cy="228" rx="31" ry="14" /></>,
    start: <>{person(125, 148, 'M148 160 L230 215 M230 215 L315 240 L365 286')}<path className="motion-limb" d="M230 215 L285 278 M315 240 L365 286" /><path className="motion-weight" d="M175 210 H300 M175 196v28 M300 196v28" /></>,
    finish: <>{person(125, 148, 'M148 160 L235 180 M235 180 L315 205 L365 286')}<path className="motion-limb" d="M235 180 L315 205 M315 205 L365 286" /><path className="motion-weight" d="M180 176 H305 M180 162v28 M305 162v28" /></>,
  };
}

export function ExerciseMotion({ motionId, title, primaryMuscles, secondaryMuscles }: ExerciseMotionProps) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<MotionSpeed>('normal');
  const [cycle, setCycle] = useState(0);
  const scene = motionScene(motionId);

  return <section className="motion-player" aria-label={`Animated ${title} guide`}>
    <div key={cycle} className={`motion-stage forge-character ${playing ? 'playing' : 'paused'} ${speed}`} aria-describedby="motion-guide-note">
      <svg viewBox="0 0 480 320" role="img" aria-label={`${scene.camera} view of a controlled ${title} repetition`}>
        <rect width="480" height="320" rx="18" className="motion-background" />
        {scene.environment}
        <path className="motion-path" d={scene.path} />
        {scene.muscles}
        <g className="motion-start-frame">{scene.start}</g>
        <g className="motion-finish-frame">{scene.finish}</g>
        <text x="22" y="302" className="motion-phase motion-phase-start">{scene.startLabel}</text>
        <text x="22" y="302" className="motion-phase motion-phase-finish">{scene.finishLabel}</text>
        <text x="458" y="302" textAnchor="end" className="motion-camera">{scene.camera.toUpperCase()} VIEW</text>
      </svg>
      <div className="motion-muscles" aria-label="Intended muscle emphasis">
        <span><i className="primary" />Primary: {primaryMuscles.join(', ')}</span>
        <span><i className="secondary" />Secondary: {secondaryMuscles.join(', ')}</span>
      </div>
    </div>
    <div className="motion-controls">
      <button onClick={() => setPlaying((current) => !current)} aria-pressed={!playing}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'Pause' : 'Play'}</button>
      <button onClick={() => setCycle((current) => current + 1)}><RotateCcw size={15} />Restart</button>
      <label>Speed<select value={speed} onChange={(event) => setSpeed(event.target.value as MotionSpeed)}><option value="normal">Normal</option><option value="slow">Slow</option></select></label>
    </div>
    <p id="motion-guide-note">Forge reference animation. Use a comfortable range; individual proportions and mobility vary.</p>
  </section>;
}
