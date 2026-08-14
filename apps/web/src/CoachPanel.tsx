import { useMemo, useState, type FormEvent } from 'react';
import { Brain, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import { CoachService, type CoachAnswer } from '@forge/coach';
import type { DigitalTwin } from '@forge/digital-twin';

interface CoachPanelProps {
  twin: DigitalTwin;
  onClose(): void;
}

const prompts = [
  'Should I train today?',
  'How is my recovery?',
  'What should I focus on nutritionally?',
];

export function CoachPanel({ twin, onClose }: CoachPanelProps) {
  const coach = useMemo(() => new CoachService(), []);
  const [question, setQuestion] = useState('');
  const [exchange, setExchange] = useState<{ question: string; result: CoachAnswer } | null>(null);

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setExchange({ question: trimmed, result: coach.ask(twin, trimmed) });
    setQuestion('');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(question);
  }

  const evidence = exchange?.result.recommendationIds
    .map((id) => twin.recommendations.find((recommendation) => recommendation.id === id))
    .filter((recommendation) => recommendation !== undefined) ?? [];

  return <div className="drawer-backdrop coach-backdrop" onMouseDown={onClose}>
    <aside className="coach-panel" role="dialog" aria-modal="true" aria-labelledby="coach-title" onMouseDown={(event) => event.stopPropagation()}>
      <header>
        <div className="coach-panel-orb"><Brain size={22} /></div>
        <div><span className="section-label">FORGE COACH</span><h2 id="coach-title">Ask about today</h2></div>
        <button onClick={onClose} aria-label="Close AI Coach"><X size={20} /></button>
      </header>

      <div className="coach-context"><Sparkles size={17} /><span><b>Grounded in your Digital Twin</b><small>Readiness {twin.recovery.readiness} · {twin.training.sessionsLast7Days} sessions in 7 days · {twin.recovery.dataCompleteness}% recovery data</small></span></div>

      {!exchange && <section className="coach-welcome">
        <h3>What do you want to understand?</h3>
        <p>I’ll explain today’s plan using your recovery, training, and nutrition signals.</p>
        <div>{prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt}</button>)}</div>
      </section>}

      {exchange && <section className="coach-exchange" aria-live="polite">
        <div className="user-question"><span>You</span><p>{exchange.question}</p></div>
        <div className="coach-answer"><span>Forge Coach</span><p>{exchange.result.answer}</p></div>
        <div className="coach-evidence">
          <h3><ShieldCheck size={16} /> Why I’m saying this</h3>
          {evidence.length ? evidence.map((recommendation) => <div key={recommendation.id}>
            <span><b>{recommendation.title}</b><small>{recommendation.reason}</small></span>
            <strong>{recommendation.confidence}%</strong>
          </div>) : <p>No category-specific adjustment is active. Add today’s recovery signals for more precise guidance.</p>}
        </div>
      </section>}

      <form className="coach-compose" onSubmit={submit}>
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about training, recovery, or nutrition…" aria-label="Question for Forge Coach" />
        <button type="submit" disabled={!question.trim()} aria-label="Ask Forge Coach"><Send size={18} /></button>
      </form>
      <small className="coach-safety">Fitness guidance only. Forge does not diagnose injuries or medical conditions.</small>
    </aside>
  </div>;
}
