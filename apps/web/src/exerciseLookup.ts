import { exerciseGuides, type ExerciseGuide } from './exerciseGuides.js';

export const equipmentOptions = ['Bodyweight', 'Dumbbells', 'Barbell', 'Resistance band', 'Treadmill'] as const;
export type ExerciseEquipment = typeof equipmentOptions[number];
export const muscleOptions = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs & glutes', 'Core', 'Cardio'] as const;
export type ExerciseMuscle = typeof muscleOptions[number];
interface LookupMetadata { equipment: ExerciseEquipment; aliases: string[] }
const metadata: Record<string, LookupMetadata> = {
  'barbell-bench': { equipment: 'Barbell', aliases: ['bench press', 'flat bench', 'chest press', 'pecs'] },
  'box-squat': { equipment: 'Barbell', aliases: ['box squat', 'squat to box', 'quads'] },
  'bodyweight-squat': { equipment: 'Bodyweight', aliases: ['air squat', 'squat without weights', 'quads'] },
  'standing-calf-raise': { equipment: 'Bodyweight', aliases: ['calf raise', 'calves', 'heel raise'] },
  'split-squat': { equipment: 'Dumbbells', aliases: ['stationary lunge', 'split squat', 'quads'] },
  'reverse-lunge': { equipment: 'Bodyweight', aliases: ['backward lunge', 'reverse lunge', 'quads'] },
  'dead-bugs': { equipment: 'Bodyweight', aliases: ['deadbug', 'dead bug', 'abs', 'abdominals'] },
  'dumbbell-overhead-press': { equipment: 'Dumbbells', aliases: ['shoulder press', 'overhead press', 'ohp', 'delts'] },
  'chest-supported-row': { equipment: 'Dumbbells', aliases: ['incline row', 'chest supported row', 'bench row'] },
  'prone-y-raise': { equipment: 'Dumbbells', aliases: ['y raise', 'prone y', 'lower traps'] },
  'hip-thrust': { equipment: 'Barbell', aliases: ['hip thrust', 'glutes'] },
  'push-up': { equipment: 'Bodyweight', aliases: ['pushup', 'press up', 'pressup', 'pecs'] },
  'band-face-pull': { equipment: 'Resistance band', aliases: ['facepull', 'face pull', 'rear delts'] },
  'lateral-raise': { equipment: 'Dumbbells', aliases: ['side raise', 'lateral raise', 'side delts'] },
  'barbell-rdl': { equipment: 'Barbell', aliases: ['rdl', 'romanian deadlift', 'hip hinge'] },
  'goblet-squat': { equipment: 'Dumbbells', aliases: ['goblet squat', 'quads'] },
  'dumbbell-hip-thrust': { equipment: 'Dumbbells', aliases: ['hip thrust', 'glutes'] },
  'glute-bridge': { equipment: 'Bodyweight', aliases: ['hip bridge', 'glute bridge'] },
  'band-glute-bridge': { equipment: 'Resistance band', aliases: ['hip bridge', 'glute bridge'] },
  'band-squat': { equipment: 'Resistance band', aliases: ['band squat', 'quads'] },
  'dumbbell-floor-press': { equipment: 'Dumbbells', aliases: ['floor press', 'chest press', 'pecs'] },
  'one-arm-dumbbell-row': { equipment: 'Dumbbells', aliases: ['single arm row', 'one arm row', 'bench row'] },
  'band-chest-press': { equipment: 'Resistance band', aliases: ['chest press', 'standing press', 'pecs'] },
  'band-row': { equipment: 'Resistance band', aliases: ['seated row', 'band row'] },
  'band-overhead-press': { equipment: 'Resistance band', aliases: ['shoulder press', 'ohp', 'delts'] },
  'band-lateral-raise': { equipment: 'Resistance band', aliases: ['side raise', 'side delts'] },
  'pike-push-up': { equipment: 'Bodyweight', aliases: ['pike pushup', 'pike press', 'shoulder pushup'] },
  'reverse-snow-angel': { equipment: 'Bodyweight', aliases: ['snow angel', 'prone snow angel', 'lower traps'] },
  'shoulder-tap': { equipment: 'Bodyweight', aliases: ['plank tap', 'shoulder tap', 'abs', 'abdominals'] },
  'mobility-flow': { equipment: 'Bodyweight', aliases: ['mobility', 'hip flexor', 'thoracic rotation', 'warm up'] },
  'zone-2-treadmill': { equipment: 'Treadmill', aliases: ['incline walk', 'zone 2', 'cardio'] },
  'zone-2-walk': { equipment: 'Bodyweight', aliases: ['walking', 'zone 2', 'cardio'] },
};

export interface ExerciseLookupEntry {
  guide: ExerciseGuide;
  equipment: ExerciseEquipment;
  aliases: readonly string[];
}
export function exerciseLookupEntries(): ExerciseLookupEntry[] {
  return exerciseGuides().map(guide => {
    const entry = metadata[guide.exerciseId];
    if (!entry) throw new Error('Missing lookup metadata for ' + guide.exerciseId);
    return { guide, equipment: entry.equipment, aliases: [...entry.aliases] };
  }).sort((a, b) => a.guide.title.localeCompare(b.guide.title));
}
function normalize(value: string): string {
  const singular: Record<string, string> = {
    squats: 'squat', rows: 'row', raises: 'raise', presses: 'press', rdls: 'rdl',
    bands: 'band', dumbbells: 'dumbbell', barbells: 'barbell', deadlifts: 'deadlift',
    lunges: 'lunge', taps: 'tap',
  };
  return value.toLowerCase().replace(/\bdb\b/g, 'dumbbell').replace(/\bbb\b/g, 'barbell')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\b(pushups|push ups)\b/g, 'push up')
    .replace(/\b[a-z]+\b/g, word => singular[word] ?? word).trim();
}
function worksMuscle(guide: ExerciseGuide, muscle: ExerciseMuscle): boolean {
  const muscles = [...guide.primaryMuscles, ...guide.secondaryMuscles].join(' ').toLowerCase();
  const terms: Record<ExerciseMuscle, RegExp> = {
    Chest: /chest|pector/, Back: /back|lats|trapezius|rhomboid/,
    Shoulders: /shoulder|deltoid|rotator cuff|supraspinatus/,
    Arms: /biceps|triceps|forearm/, 'Legs & glutes': /quadriceps|glute|hamstring|calf|calves|gastrocnemius|soleus|adductor|hip flexor/,
    Core: /core|abdom|oblique/, Cardio: /cardiorespiratory/,
  };
  return terms[muscle].test(muscles);
}
/** Entire guide catalog; never takes a workout, schedule, or stored personal state. */
export function findExercises(entries: readonly ExerciseLookupEntry[], query: string,
  equipment: ExerciseEquipment | 'all' = 'all', muscle: ExerciseMuscle | 'all' = 'all'): ExerciseLookupEntry[] {
  const words = normalize(query).split(' ').filter(Boolean);
  return entries.filter(entry => {
    if (equipment !== 'all' && entry.equipment !== equipment) return false;
    if (muscle !== 'all' && !worksMuscle(entry.guide, muscle)) return false;
    const text = normalize([entry.guide.title, entry.guide.exerciseId, entry.equipment,
      ...entry.aliases, ...entry.guide.primaryMuscles, ...entry.guide.secondaryMuscles].join(' '));
    return words.every(word => text.includes(word));
  });
}
