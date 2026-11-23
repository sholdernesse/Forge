export type AppearancePreference = 'dark' | 'light-gradient' | 'system';
export type ResolvedAppearance = 'dark' | 'light-gradient';

export const APPEARANCE_STORAGE_KEY = 'forge.appearance.v1';

export interface AppearanceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isAppearancePreference(value: unknown): value is AppearancePreference {
  return value === 'dark' || value === 'light-gradient' || value === 'system';
}

export function loadAppearancePreference(storage: AppearanceStorage): AppearancePreference {
  try {
    const value = storage.getItem(APPEARANCE_STORAGE_KEY);
    return isAppearancePreference(value) ? value : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveAppearancePreference(storage: AppearanceStorage, preference: AppearancePreference): void {
  storage.setItem(APPEARANCE_STORAGE_KEY, preference);
}

export function resolveAppearance(preference: AppearancePreference, systemPrefersDark: boolean): ResolvedAppearance {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light-gradient';
  return preference;
}

export function applyAppearance(preference: AppearancePreference, root: HTMLElement = document.documentElement, systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches): ResolvedAppearance {
  const resolved = resolveAppearance(preference, systemPrefersDark);
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved === 'dark' ? 'dark' : 'light';
  return resolved;
}
