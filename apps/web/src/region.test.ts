import { describe, expect, it } from 'vitest';
import { formatWeight, formatWeightRate, loadUnitPreference, resolveWeightUnit, saveUnitPreference, weightValueFromKg, weightValueToKg } from './region.js';

describe('regional unit preferences', () => {
  it('defaults to system and persists an explicit choice', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    expect(loadUnitPreference(storage)).toBe('system');
    saveUnitPreference(storage, 'us');
    expect(loadUnitPreference(storage)).toBe('us');
  });

  it('resolves system units from the locale while honoring overrides', () => {
    expect(resolveWeightUnit('system', 'en-US')).toBe('lb');
    expect(resolveWeightUnit('system', 'en-GB')).toBe('kg');
    expect(resolveWeightUnit('metric', 'en-US')).toBe('kg');
    expect(resolveWeightUnit('us', 'fr-FR')).toBe('lb');
  });

  it('converts display values without changing the canonical kilogram value', () => {
    const pounds = weightValueFromKg(75.8, 'lb');
    expect(pounds).toBeCloseTo(167.1, 1);
    expect(weightValueToKg(pounds, 'lb')).toBeCloseTo(75.8, 8);
    expect(formatWeight(75.8, 'lb')).toBe('167.1 lb');
    expect(formatWeightRate(-0.25, 'lb')).toBe('-0.55 lb/week');
  });
});
