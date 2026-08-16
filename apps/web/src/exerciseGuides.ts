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
  motionId?: 'dumbbell-overhead-press';
  primaryMuscles: string[];
  secondaryMuscles: string[];
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
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'front deltoids'],
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
    primaryMuscles: ['Quadriceps', 'glutes'],
    secondaryMuscles: ['Hamstrings', 'core'],
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
    primaryMuscles: ['Deep core'],
    secondaryMuscles: ['Hip flexors'],
    safetyNote: 'Shorten the range if your lower back lifts from the mat. Stop if the movement causes back pain.',
  },
  {
    exerciseId: 'dumbbell-overhead-press',
    title: 'Dumbbell overhead press',
    imageSrc: '/exercises/dumbbell-overhead-press-guide.svg',
    imageAlt: 'Dumbbell overhead press shown with weights at shoulder level and controlled overhead lockout.',
    setup: ['Sit or stand tall with feet stable and ribs stacked over the pelvis.', 'Start with wrists above elbows and dumbbells just outside the shoulders.', 'Brace before pressing and keep your head neutral.'],
    movement: ['Press the dumbbells upward without leaning back.', 'Allow the arms to travel naturally while keeping the forearms near vertical.', 'Finish with the weights over the shoulders, then lower under control.'],
    mistakes: ['Arching the lower back to move the weight', 'Letting wrists fold backward or elbows drift far behind the torso', 'Crashing the dumbbells together or dropping the descent'],
    selfChecks: ['From the side, the weights finish above the shoulders rather than in front of the face.', 'From the front, wrists remain stacked above elbows through the lower half.', 'Your rib position and torso angle look the same on the first and last repetition.'],
    tempo: 'Press smoothly for about 1–2 seconds and lower for about 2 seconds.',
    breathing: 'Brace before pressing; exhale through the effort while keeping the ribs stacked, then inhale as you reset.',
    motionId: 'dumbbell-overhead-press',
    primaryMuscles: ['Deltoids'],
    secondaryMuscles: ['Triceps', 'upper chest'],
    safetyNote: 'Use a load you can press without leaning back. Stop if you feel sharp shoulder, neck, elbow, or back pain.',
  },
  {
    exerciseId: 'chest-supported-row',
    title: 'Chest-supported dumbbell row',
    imageSrc: '/exercises/chest-supported-row-guide.svg',
    imageAlt: 'Chest-supported dumbbell row shown with arms extended and elbows pulled beside the torso.',
    setup: ['Set the bench angle so your chest is supported without forcing your neck upward.', 'Plant your feet and let the dumbbells hang with shoulders controlled.', 'Keep the ribs against the pad and wrists neutral.'],
    movement: ['Pull the elbows beside the torso while the chest stays on the pad.', 'Pause briefly when the shoulder blades move back without shrugging.', 'Lower until the arms are long while maintaining shoulder control.'],
    mistakes: ['Lifting the chest from the pad to finish the pull', 'Shrugging the shoulders toward the ears', 'Swinging the dumbbells or shortening the controlled reach'],
    selfChecks: ['From the side, the chest remains in contact with the pad throughout each repetition.', 'From behind, the shoulders stay level and the elbows follow similar paths.', 'The bottom position shows long arms without the shoulders suddenly rolling forward.'],
    tempo: 'Pull for about 1 second, pause briefly, and lower for 2–3 seconds.',
    breathing: 'Exhale as you pull; inhale during the controlled reach without losing contact with the pad.',
    primaryMuscles: ['Upper back', 'lats'],
    secondaryMuscles: ['Biceps', 'rear deltoids'],
    safetyNote: 'Adjust the bench and load if you cannot keep your torso supported. Stop for sharp shoulder, neck, or back pain.',
  },
  {
    exerciseId: 'hip-thrust',
    title: 'Barbell hip thrust',
    imageSrc: '/exercises/hip-thrust-guide.svg',
    imageAlt: 'Hip thrust shown in the lowered position and at a controlled shoulder-to-knee lockout.',
    setup: ['Place the lower shoulder blades against a stable bench and pad the bar across the hip crease.', 'Set feet so the shins are near vertical at the top.', 'Keep the chin gently tucked and ribs controlled.'],
    movement: ['Lower the hips under control while the upper back stays supported.', 'Drive through the whole foot and lift the hips without throwing the head back.', 'Finish when shoulders, hips, and knees form a controlled line, then pause.'],
    mistakes: ['Overextending the lower back above the natural lockout', 'Pushing through the toes or letting knees collapse inward', 'Using momentum or allowing the bench to move'],
    selfChecks: ['From the side, the top position forms a line from shoulders through hips to knees.', 'At lockout, the shins are close to vertical and pressure remains through the whole foot.', 'The ribs remain down and the finish comes from the hips rather than a lower-back arch.'],
    tempo: 'Lift for about 1–2 seconds, pause at lockout, and lower for about 2 seconds.',
    breathing: 'Brace before lifting; exhale near lockout while keeping the ribs down, then inhale as you lower.',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings', 'quadriceps'],
    safetyNote: 'Use a stable bench, secure plates, and adequate bar padding. Stop for sharp back, hip, or knee pain.',
  },
];

export function exerciseGuide(exerciseId: string): ExerciseGuide | undefined {
  return guides.find((guide) => guide.exerciseId === exerciseId);
}

export function exerciseGuideIds(): string[] {
  return guides.map((guide) => guide.exerciseId);
}

export function exerciseGuides(): ExerciseGuide[] {
  return guides.map((guide) => ({
    ...guide,
    setup: [...guide.setup],
    movement: [...guide.movement],
    mistakes: [...guide.mistakes],
    selfChecks: [...guide.selfChecks],
    primaryMuscles: [...guide.primaryMuscles],
    secondaryMuscles: [...guide.secondaryMuscles],
  }));
}
