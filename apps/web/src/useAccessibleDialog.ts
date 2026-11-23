import { useEffect, useRef, type RefObject } from 'react';

const dialogStack: Array<RefObject<HTMLElement | null>> = [];

export type DialogKeyboardAction = 'close' | 'focus-dialog' | 'focus-first' | 'focus-last' | 'none';

export interface DialogKeyboardState {
  key: string;
  shiftKey: boolean;
  focusableCount: number;
  activeIsDialog: boolean;
  activeIsFirst: boolean;
  activeIsLast: boolean;
}

export function dialogKeyboardAction(state: DialogKeyboardState): DialogKeyboardAction {
  if (state.key === 'Escape') return 'close';
  if (state.key !== 'Tab') return 'none';
  if (state.focusableCount === 0) return 'focus-dialog';
  if (state.shiftKey && (state.activeIsFirst || state.activeIsDialog)) return 'focus-last';
  if (!state.shiftKey && state.activeIsLast) return 'focus-first';
  return 'none';
}

export function useAccessibleDialog(onClose: () => void, active = true) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const previousOverflow = document.body.style.overflow;
    const ref = dialogRef as RefObject<HTMLElement | null>;
    dialogStack.push(ref);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    function isTopDialog() {
      return dialogStack.at(-1) === ref;
    }

    function keydown(event: KeyboardEvent) {
      if (!isTopDialog() || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      const action = dialogKeyboardAction({
        key: event.key,
        shiftKey: event.shiftKey,
        focusableCount: focusable.length,
        activeIsDialog: document.activeElement === dialogRef.current,
        activeIsFirst: document.activeElement === first,
        activeIsLast: document.activeElement === last,
      });
      if (action === 'none') return;
      event.preventDefault();
      if (action === 'close') {
        event.stopPropagation();
        closeRef.current();
      } else if (action === 'focus-dialog') {
        dialogRef.current.focus();
      } else if (action === 'focus-first') {
        first?.focus();
      } else {
        last?.focus();
      }
    }

    document.addEventListener('keydown', keydown, true);
    return () => {
      document.removeEventListener('keydown', keydown, true);
      const index = dialogStack.lastIndexOf(ref);
      if (index >= 0) dialogStack.splice(index, 1);
      document.body.style.overflow = dialogStack.length ? 'hidden' : previousOverflow;
      previousFocus?.focus();
    };
  }, [active]);
  return dialogRef;
}
