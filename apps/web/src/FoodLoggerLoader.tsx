import { useEffect, useState, type ComponentProps } from 'react';
import { X } from 'lucide-react';
import type { FoodLogger } from './FoodLogger.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

type FoodLoggerComponent = typeof FoodLogger;
type Props = ComponentProps<FoodLoggerComponent>;
let loadedFoodLogger: FoodLoggerComponent | undefined;

/** Keep camera and food-entry code out of the initial dashboard download. */
export function FoodLoggerLoader(props: Props) {
  const [Component, setComponent] = useState<FoodLoggerComponent | undefined>(() => loadedFoodLogger);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (Component) return;
    let active = true;
    setFailed(false);
    void import('./FoodLogger.js').then(module => {
      loadedFoodLogger = module.FoodLogger;
      if (active) setComponent(() => module.FoodLogger);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [Component, attempt]);
  if (Component) return <Component {...props} />;
  return <FoodLoggerLoading failed={failed} onClose={props.onClose} onRetry={() => { setFailed(false); setAttempt(value => value + 1); }} />;
}

function FoodLoggerLoading({ failed, onClose, onRetry }: { failed: boolean; onClose(): void; onRetry(): void }) {
  const dialogRef = useAccessibleDialog(onClose);
  return <div className="drawer-backdrop" onMouseDown={onClose}>
    <aside ref={dialogRef} className="drawer" role="dialog" aria-modal="true" aria-labelledby="food-loading-title" tabIndex={-1} onMouseDown={event => event.stopPropagation()}>
      <div className="drawer-heading"><div><span className="section-label">NUTRITION</span><h2 id="food-loading-title">Log food</h2></div><button onClick={onClose} aria-label="Close food logging"><X size={20} /></button></div>
      <p role={failed ? 'alert' : 'status'}>{failed ? 'Food logging could not load. Check your connection and retry.' : 'Loading food logging…'}</p>
      {failed && <button className="log-food-button" onClick={onRetry}>Try again</button>}
    </aside>
  </div>;
}
