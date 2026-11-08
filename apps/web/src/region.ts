export type UnitPreference = 'system' | 'us' | 'metric';
export type WeightUnit = 'lb' | 'kg';

export interface UnitPreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const UNIT_PREFERENCE_STORAGE_KEY = 'forge.units.v1';
const POUNDS_PER_KILOGRAM = 2.2046226218;

export function isUnitPreference(value: unknown): value is UnitPreference {
  return value === 'system' || value === 'us' || value === 'metric';
}

export function loadUnitPreference(storage: Pick<UnitPreferenceStorage, 'getItem'>): UnitPreference {
  const saved = storage.getItem(UNIT_PREFERENCE_STORAGE_KEY);
  return isUnitPreference(saved) ? saved : 'system';
}

export function saveUnitPreference(storage: Pick<UnitPreferenceStorage, 'setItem'>, preference: UnitPreference): void {
  storage.setItem(UNIT_PREFERENCE_STORAGE_KEY, preference);
}

export function resolveWeightUnit(preference: UnitPreference, locale = 'en-US'): WeightUnit {
  if (preference === 'us') return 'lb';
  if (preference === 'metric') return 'kg';
  try {
    const region = new Intl.Locale(locale).region;
    return region === 'US' || region === 'LR' || region === 'MM' ? 'lb' : 'kg';
  } catch {
    return locale.toLowerCase().startsWith('en-us') ? 'lb' : 'kg';
  }
}

export function weightValueFromKg(weightKg: number, unit: WeightUnit): number {
  return unit === 'lb' ? weightKg * POUNDS_PER_KILOGRAM : weightKg;
}

export function weightValueToKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value / POUNDS_PER_KILOGRAM : value;
}

export function formatWeight(weightKg: number, unit: WeightUnit, fractionDigits = 1): string {
  return `${weightValueFromKg(weightKg, unit).toFixed(fractionDigits)} ${unit}`;
}

export function formatWeightRate(weightKg: number, unit: WeightUnit, fractionDigits = 2): string {
  const value = weightValueFromKg(weightKg, unit);
  return `${value > 0 ? '+' : ''}${value.toFixed(fractionDigits)} ${unit}/week`;
}

export function weightInputBounds(unit: WeightUnit): { min: number; max: number; step: number } {
  return unit === 'lb' ? { min: 66, max: 661, step: 0.1 } : { min: 30, max: 300, step: 0.1 };
}
