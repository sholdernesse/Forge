export interface ExerciseGuide {
  exerciseId: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  setup: string[];
  movement: string[];
  mistakes: string[];
  selfChecks: string[];
  tempo: string;
  breathing: string;
  safetyNote: string;
}

const guides: ExerciseGuide[] = [
  {
    exerciseId: 'barbell-bench',
    title: 'Barbell bench press',
    imageSrc: '/exercises/barbell-bench-guide.webp',
    imageAlt: 'Barbell bench press shown at the top and controlled bottom positions.',
    setup: ['Plant both feet and keep your hips in contact with the bench.', 'Pull your shoulder blades back and down before unracking.', 'Grip so your forearms are vertical at the bottom.'],
    movement: ['Lower the bar under control toward the lower chest.', 'Keep wrists stacked over elbows and elbows below the shoulders.', 'Press up and slightly back without bouncing the bar.'],
    mistakes: ['Flaring the elbows straight out', 'Lifting the hips to finish a repetition', 'Losing shoulder position or bouncing the bar'],
    selfChecks: ['From the side, the bar finishes over the shoulder and touches near the lower chest.', 'From the foot end, both wrists remain stacked above the elbows.', 'The first and final repetition use the same controlled touch point and hip position.'],
    tempo: 'Lower for about 2 seconds, pause softly at the chest, then press with control.',
    breathing: 'Brace before the descent; exhale through the press without losing your rib or shoulder position.',
    safetyNote: 'Use safeties or a spotter when benching with a barbell. Stop if you feel sharp shoulder, elbow, or chest pain.',
  },
  {
    exerciseId: 'box-squat',
    title: 'Controlled box squat',
    imageSrc: '/exercises/box-squat-guide.webp',
    imageAlt: 'Barbell box squat shown standing and at a controlled touch to the box.',
    setup: ['Set the box at a pain-free depth and the rack safeties just below it.', 'Brace before unracking and use a stable stance.', 'Keep pressure balanced through the whole foot.'],
    movement: ['Send hips back while allowing the knees to track over the toes.', 'Touch the box under control without relaxing your torso.', 'Drive through the floor and stand tall without rocking forward.'],
    mistakes: ['Collapsing the knees inward', 'Dropping quickly or fully sitting back', 'Rounding the lower back or shifting onto the toes'],
    selfChecks: ['From the front, each knee follows the direction of the middle toes throughout the repetition.', 'From the side, the bar stays above the mid-foot and the torso angle remains controlled.', 'The box touch is quiet and repeatable rather than a drop or backward rock.'],
    tempo: 'Descend for 2–3 seconds, touch the box without relaxing, then stand smoothly.',
    breathing: 'Take a brace before descending; maintain pressure through the touch and exhale as you pass the hardest point.',
    safetyNote: 'Use a load and depth you can control. Stop if back, hip, or knee discomfort becomes sharp or changes your movement.',
  },
  {
    exerciseId: 'dead-bugs',
    title: 'Dead bug',
    imageSrc: '/exercises/dead-bug-guide.webp',
    imageAlt: 'Dead bug shown in the starting position and with opposite arm and leg extended.',
    setup: ['Lie on your back with hips and knees at 90 degrees.', 'Reach your arms toward the ceiling and gently brace your abdomen.', 'Exhale enough to bring your ribs down toward the mat.'],
    movement: ['Slowly extend one leg and the opposite arm.', 'Move only as far as you can without your lower back lifting.', 'Return with control, reset your brace, and switch sides.'],
    mistakes: ['Arching the lower back', 'Moving quickly instead of controlling the range', 'Holding your breath or extending too far'],
    selfChecks: ['Place fingertips under the lower back and keep the pressure steady as the limbs move.', 'From the side, the ribs stay down rather than lifting as the arm reaches overhead.', 'Both sides use the same pain-free range and controlled speed.'],
    tempo: 'Reach for about 3 seconds, pause briefly, and return for about 2 seconds.',
    breathing: 'Exhale during the reach to maintain the brace; inhale quietly as you return and reset.',
    safetyNote: 'Shorten the range if your lower back lifts from the mat. Stop if the movement causes back pain.',
  },
];

export function exerciseGuide(exerciseId: string): ExerciseGuide | undefined {
  return guides.find((guide) => guide.exerciseId === exerciseId);
}

export function exerciseGuideIds(): string[] {
  return guides.map((guide) => guide.exerciseId);
}
