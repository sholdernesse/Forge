import { describe, expect, it } from 'vitest';
import { performanceTimeline, weightProgressStory } from './performanceTimeline.js';

describe('performance progress story', () => {
  it('does not invent a direction from one weight measurement', () => {
    const story = weightProgressStory([{ date: '2026-08-30', weightKg: 78 }], 'fat-loss', '2026-08-30');
    expect(story.trajectory).toBe('Not enough data');
    expect(story.headline).toContain('needs more check-ins');
  });

  it('describes the measured direction without declaring the user on track', () => {
    const story = weightProgressStory([{ date: '2026-08-20', weightKg: 79 }, { date: '2026-08-30', weightKg: 78.4 }], 'fat-loss', '2026-08-30');
    expect(story.change).toBe(-0.6);
    expect(story.summary).toContain('Down 0.6 kg');
    expect(story.trajectory).toContain('fat-loss direction');
  });

  it('combines same-day training, movement quality, nutrition, and sleep into one event', () => {
    const timeline = performanceTimeline([{ date: '2026-08-29', proteinG: 150, sleepHours: 7.5 }], [{ workoutId: 'w1', date: '2026-08-29', title: 'Upper strength', durationMinutes: 48, muscleSets: { chest: 4 }, movementQuality: 'controlled', discomfort: 'none' }], '2026-08-30');
    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.signals).toEqual(['48 min', 'Controlled movement', '150g protein', '7.5h sleep']);
  });

  it('keeps discomfort visible and does not claim causation', () => {
    const timeline = performanceTimeline([], [{ workoutId: 'w1', date: '2026-08-29', title: 'Lower strength', durationMinutes: 25, muscleSets: { quads: 2 }, discomfort: 'stopped' }], '2026-08-30');
    expect(timeline[0]).toMatchObject({ tone: 'recovery' });
    expect(timeline[0]?.detail).toContain('stopped for discomfort');
  });
});
