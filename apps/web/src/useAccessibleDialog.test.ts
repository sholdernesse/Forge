import { describe, expect, it } from 'vitest';
import { dialogKeyboardAction } from './useAccessibleDialog.js';

const base = {
  key: 'Tab',
  shiftKey: false,
  focusableCount: 3,
  activeIsDialog: false,
  activeIsFirst: false,
  activeIsLast: false,
};

describe('accessible dialog keyboard policy', () => {
  it('closes only for Escape', () => {
    expect(dialogKeyboardAction({ ...base, key: 'Escape' })).toBe('close');
    expect(dialogKeyboardAction({ ...base, key: 'Enter' })).toBe('none');
  });

  it('keeps focus inside the dialog in both tab directions', () => {
    expect(dialogKeyboardAction({ ...base, activeIsLast: true })).toBe('focus-first');
    expect(dialogKeyboardAction({ ...base, shiftKey: true, activeIsFirst: true })).toBe('focus-last');
    expect(dialogKeyboardAction({ ...base, shiftKey: true, activeIsDialog: true })).toBe('focus-last');
  });

  it('holds focus on a dialog with no interactive controls', () => {
    expect(dialogKeyboardAction({ ...base, focusableCount: 0 })).toBe('focus-dialog');
  });

  it('allows ordinary tab movement between internal controls', () => {
    expect(dialogKeyboardAction(base)).toBe('none');
  });
});
