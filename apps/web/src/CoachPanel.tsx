import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Brain, Send, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { CoachService, type CoachActionType } from '@forge/coach';
import type { DigitalTwin } from '@forge/digital-twin';
import type { CoachMessage } from './dashboardStorage.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface CoachPanelProps {
  twin: DigitalTwin;
  messages: CoachMessage[];
  onMessagesChange(messages: CoachMessage[]): void;
  onAction(action: CoachActionType): void;
  onClose(): void;
}

const prompts = [
  'Should I train today?',
  'How is my recovery?',
  'What should I focus on nutritionally?',
  'I feel discomfort during a movement.',
];

export function CoachPanel({ twin, messages, onMessagesChange, onAction, onClose }: CoachPanelProps) {
  const coach = useMemo(() => new CoachService(), []);
  const [question, setQuestion] = useState('');
  const dialogRef = useAccessibleDialog(onClose);

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const result = coach.ask(twin, trimmed);
    const createdAt = new Date().toISOString();
    const nonce = `${Date.now()}-${messages.length}`;
    const nextMessages: CoachMessage[] = [...messages,
      { id: `question-${nonce}`, role: 'user', content: trimmed, recommendationIds: [], createdAt },
      { id: `answer-${nonce}`, role: 'assistant', content: result.answer, recommendationIds: result.recommendationIds, answerBasis: result.basis, suggestedAction: result.suggestedAction, createdAt },
    ];
    onMessagesChange(nextMessages.slice(-40));
    setQuestion('');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(question);
  }

  return <div className="drawer-backdrop coach-backdrop" onMouseDown={onClose}>
    <aside ref={dialogRef} className="coach-panel" role="dialog" aria-modal="true" aria-labelledby="coach-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
      <header>
        <div className="coach-panel-orb"><Brain size={22} /></div>
        <div><span className="section-label">FORGE COACH</span><h2 id="coach-title">Ask about today</h2></div>
        <div className="coach-header-actions">{messages.length > 0 && <button onClick={() => onMessagesChange([])} aria-label="Clear Coach conversation" title="Clear conversation"><Trash2 size={18} /></button>}<button onClick={onClose} aria-label="Close AI Coach"><X size={20} /></button></div>
      </header>

      <div className="coach-context"><Sparkles size={17} /><span><b>Grounded in your Digital Twin</b><small>Readiness {twin.recovery.readiness} · {twin.training.sessionsLast7Days} sessions in 7 days · {twin.recovery.dataCompleteness}% recovery data</small></span></div>

      {!messages.length && <section className="coach-welcome">
        <h3>What do you want to understand?</h3>
        <p>I’ll explain today’s plan using your recovery, training, and nutrition signals.</p>
        <div>{prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt}</button>)}</div>
      </section>}

      {messages.length > 0 && <section className="coach-exchange" aria-live="polite">
        {messages.map((message) => {
          const evidence = message.recommendationIds.map((id) => twin.recommendations.find((recommendation) => recommendation.id === id)).filter((recommendation) => recommendation !== undefined);
          return <div className="coach-turn" key={message.id}>
            <div className={message.role === 'user' ? 'user-question' : 'coach-answer'}><span>{message.role === 'user' ? 'You' : 'Forge Coach'}</span><p>{message.content}</p></div>
            {message.role === 'assistant' && <div className="coach-evidence">
              <h3><ShieldCheck size={16} /> Why I’m saying this</h3>
              {evidence.length ? evidence.map((recommendation) => <div key={recommendation.id}><span><b>{recommendation.title}</b><small>{recommendation.reason}</small></span><strong>{recommendation.confidence}%</strong></div>) : message.answerBasis === 'safety-boundary' ? <p>This response uses Forge’s symptom safety boundary, not a readiness score or diagnosis.</p> : message.answerBasis === 'insufficient-data' ? <p>Recent recovery data is required before Forge can make a supported adjustment.</p> : <p>No category-specific adjustment is active. Add today’s recovery signals for more precise guidance.</p>}
            </div>}
            {message.role === 'assistant' && message.suggestedAction && <button className="coach-handoff" onClick={() => onAction(message.suggestedAction!.type)}>{message.suggestedAction.label}<ArrowRight size={17} /></button>}
          </div>;
        })}
      </section>}

      <form className="coach-compose" onSubmit={submit}>
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about training, recovery, or nutrition…" aria-label="Question for Forge Coach" />
        <button type="submit" disabled={!question.trim()} aria-label="Ask Forge Coach"><Send size={18} /></button>
      </form>
      <small className="coach-safety">Fitness guidance only. Forge does not diagnose injuries or medical conditions.</small>
    </aside>
  </div>;
}
