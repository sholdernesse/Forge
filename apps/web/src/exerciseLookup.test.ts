import { describe, expect, it } from 'vitest';
import { exerciseGuideIds } from './exerciseGuides.js';
import { equipmentOptions, exerciseLookupEntries, findExercises } from './exerciseLookup.js';
describe('standalone exercise lookup', () => {
  it('covers every visual guide, including exercises outside a daily plan', () => {
    const entries = exerciseLookupEntries();
    expect(entries.map(entry => entry.guide.exerciseId).sort()).toEqual(exerciseGuideIds().sort());
    expect(entries.every(entry => equipmentOptions.includes(entry.equipment))).toBe(true);
    expect(findExercises(entries, '')).toHaveLength(32);
    expect(entries.map(entry => entry.guide.title)).toEqual(entries.map(entry => entry.guide.title).sort((a, b) => a.localeCompare(b)));
  });
  it('finds common abbreviations, punctuation, and multiword names', () => {
    const entries = exerciseLookupEntries();
    expect(findExercises(entries, ' RDL ').map(entry => entry.guide.exerciseId)).toEqual(['barbell-rdl']);
    expect(findExercises(entries, 'DB shoulder press').map(entry => entry.guide.exerciseId)).toEqual(['dumbbell-overhead-press']);
    expect(findExercises(entries, 'BB Romanian deadlift').map(entry => entry.guide.exerciseId)).toEqual(['barbell-rdl']);
    expect(findExercises(entries, 'push-ups').map(entry => entry.guide.exerciseId)).toContain('push-up');
    expect(findExercises(entries, 'side raises', 'Resistance band').map(entry => entry.guide.exerciseId)).toEqual(['band-lateral-raise']);
    expect(findExercises(entries, 'bands squats').map(entry => entry.guide.exerciseId)).toEqual(['band-squat']);
  });
  it('combines equipment and actual muscles worked without mutating guide data', () => {
    const entries = exerciseLookupEntries();
    const before = JSON.stringify(entries);
    const results = findExercises(entries, 'press', 'Dumbbells', 'Shoulders');
    expect(results.map(entry => entry.guide.exerciseId)).toContain('dumbbell-overhead-press');
    expect(results.every(entry => entry.equipment === 'Dumbbells')).toBe(true);
    expect(findExercises(entries, '', 'Treadmill', 'Cardio').map(entry => entry.guide.exerciseId)).toEqual(['zone-2-treadmill']);
    expect(JSON.stringify(entries)).toBe(before);
  });
  it('returns an honest empty result for an unknown exercise or incompatible filters', () => {
    const entries = exerciseLookupEntries();
    expect(findExercises(entries, 'not in this library')).toEqual([]);
    expect(findExercises(entries, 'rdl', 'Bodyweight')).toEqual([]);
    expect(findExercises(entries, '', 'all', 'all')).toHaveLength(32);
  });
});
