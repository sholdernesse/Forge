import { useEffect, useState, type ComponentType } from 'react';
import { X } from 'lucide-react';
import { useAccessibleDialog } from './useAccessibleDialog.js';

/** Load secondary screens on demand, with a closable, accessible retry state. */
export function deferredPanel<P extends { onClose(): void }>(load: () => Promise<ComponentType<P>>, title: string) {
  let cached: ComponentType<P> | undefined;
  return function DeferredPanel(props: P) {
    const [Component, setComponent] = useState<ComponentType<P> | undefined>(() => cached);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
      if (Component) return;
      let active = true;
      setFailed(false);
      void load().then(component => {
        cached = component;
        if (active) setComponent(() => component);
      }).catch(() => { if (active) setFailed(true); });
      return () => { active = false; };
    }, [Component, attempt]);
    if (Component) return <Component {...props} />;
    return <PanelLoading title={title} failed={failed} onClose={props.onClose}
      onRetry={() => { setFailed(false); setAttempt(value => value + 1); }} />;
  };
}

export function PanelLoading({ title, failed, onClose, onRetry }: {
  title: string; failed: boolean; onClose(): void; onRetry(): void;
}) {
  const ref = useAccessibleDialog(onClose);
  return <div className="drawer-backdrop" onMouseDown={onClose}>
    <aside ref={ref} className="drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
      onMouseDown={event => event.stopPropagation()}>
      <div className="drawer-heading"><h2>{title}</h2><button onClick={onClose} aria-label={`Close ${title}`}><X size={20} /></button></div>
      <p role={failed ? 'alert' : 'status'}>{failed ? `${title} could not load. Check your connection and retry.` : `Loading ${title}…`}</p>
      {failed && <button className="log-food-button" onClick={onRetry}>Try again</button>}
    </aside>
  </div>;
}
