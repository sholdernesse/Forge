import { describe, expect, it } from 'vitest';
import { APPEARANCE_STORAGE_KEY, loadAppearancePreference, resolveAppearance, saveAppearancePreference, type AppearanceStorage } from './appearance.js';

class MemoryStorage implements AppearanceStorage {
  value: string | null = null;
  getItem(key: string) { return key === APPEARANCE_STORAGE_KEY ? this.value : null; }
  setItem(key: string, value: string) { if (key === APPEARANCE_STORAGE_KEY) this.value = value; }
}

describe('Forge appearance preference', () => {
  it('defaults invalid or absent preferences to dark', () => {
    const storage = new MemoryStorage();
    expect(loadAppearancePreference(storage)).toBe('dark');
    storage.value = 'ultraviolet';
    expect(loadAppearancePreference(storage)).toBe('dark');
  });

  it('persists the selected appearance', () => {
    const storage = new MemoryStorage();
    saveAppearancePreference(storage, 'light-gradient');
    expect(loadAppearancePreference(storage)).toBe('light-gradient');
  });

  it('resolves system mode from the device color preference', () => {
    expect(resolveAppearance('system', true)).toBe('dark');
    expect(resolveAppearance('system', false)).toBe('light-gradient');
    expect(resolveAppearance('light-gradient', true)).toBe('light-gradient');
  });
});
