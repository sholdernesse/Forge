import { useEffect, useRef, type RefObject } from 'react';

const dialogStack: Array<RefObject<HTMLElement | null>> = [];

export function useAccessibleDialog(onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
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
      if (!isTopDialog()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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
  }, []);
  return dialogRef;
}
