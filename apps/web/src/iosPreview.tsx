import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen } from 'lucide-react';
import { MovementLibrary } from './MovementLibrary.js';
import './styles.css';
import '../ios-preview/preview.css';

function ForgePreview() {
  const [open, setOpen] = useState(false);
  return <>
    <main className="ios-preview-home">
      <div className="ios-preview-brand"><span className="brand-mark" aria-hidden="true">F</span> FORGE</div>
      <span className="section-label">IPHONE BUILD PREVIEW</span>
      <h1>Explore the exercise library</h1>
      <p>Find an exercise by name, equipment, or muscles worked. Each guide includes form and anatomy illustrations.</p>
      <button type="button" className="primary-action" onClick={() => setOpen(true)}><BookOpen size={20} /> Open exercise lookup</button>
      <p className="ios-preview-note">This preview works offline. Accounts, workouts, and nutrition logging aren’t available in this build.</p>
    </main>
    {open && <MovementLibrary onClose={() => setOpen(false)} />}
  </>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><ForgePreview /></StrictMode>);
