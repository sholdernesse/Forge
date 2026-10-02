import { useEffect } from 'react';

export type PublicDocumentKind = 'privacy' | 'terms' | 'support';

export function publicDocumentForPath(pathname: string): PublicDocumentKind | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/privacy') return 'privacy';
  if (normalized === '/terms') return 'terms';
  if (normalized === '/support') return 'support';
  return null;
}

export function supportEmailFromEnvironment(environment: Record<string, unknown>): string | null {
  const value = environment.VITE_FORGE_SUPPORT_EMAIL;
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? value.trim() : null;
}

const effectiveDate = 'September 21, 2026';

function Privacy({ supportEmail }: { supportEmail: string | null }) {
  return <>
    <h1>Privacy notice</h1>
    <p className="public-document-lead">Forge uses the minimum information needed to provide personalized training, nutrition, recovery, and progress features.</p>
    <section><h2>Information Forge handles</h2><p>Account identity, onboarding choices, check-ins, body measurements you choose to enter, workouts, nutrition and hydration logs, optional meal photos submitted for analysis, reflections, coaching history, device synchronization metadata, and privacy-safe operational logs.</p></section>
    <section><h2>How information is used</h2><p>Forge uses your information to operate your account, synchronize your records, calculate deterministic recommendations, explain those recommendations, protect the service, investigate failures, and improve reliability. Forge does not sell personal information or use private health and fitness entries for targeted advertising.</p></section>
    <section><h2>Service providers</h2><p>Forge relies on Microsoft Azure and Microsoft Entra for hosting and identity. Food searches may use USDA FoodData Central and Open Food Facts. When you choose meal-photo analysis, the prepared image is sent to OpenAI to identify visible foods and estimate portions. These providers receive only the information necessary to perform their service.</p></section>
    <section><h2>Meal photos</h2><p>Before upload, Forge resizes the selected image and creates a new JPEG without the original file metadata. The image is analyzed in memory and is not placed in your Forge dashboard or retained by Forge as a meal photo. Confirm that no person or sensitive background information is visible before submitting it.</p></section>
    <section><h2>Retention and control</h2><p>You can export your Forge data and request deletion from Settings. Deletion removes the synchronized dashboard and local copy on the connected device. Encrypted recovery backups may remain for a limited operational-retention period before expiration. Offline devices must reconnect or be cleared separately.</p></section>
    <section><h2>Security and limitations</h2><p>Forge uses authenticated access, account isolation, encrypted transport, restricted service identities, audit events, and private database networking. No internet service can promise absolute security, so report suspected unauthorized access promptly.</p></section>
    <section><h2>Contact</h2><p>{supportEmail ? <>Privacy and data requests: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</> : 'A verified privacy contact must be configured before public release.'}</p></section>
  </>;
}

function Terms({ supportEmail }: { supportEmail: string | null }) {
  return <>
    <h1>Beta terms of use</h1>
    <p className="public-document-lead">Forge is a beta fitness and nutrition planning service. By using it, you agree to use it responsibly and understand its current limitations.</p>
    <section><h2>Not medical care</h2><p>Forge provides general wellness, fitness, and nutrition information. It does not diagnose, treat, prevent, or cure medical conditions and is not a substitute for a physician, registered dietitian, physical therapist, or emergency service. Stop an activity that causes pain, dizziness, breathing difficulty, or other concerning symptoms and seek appropriate professional care.</p></section>
    <section><h2>Your responsibilities</h2><p>Provide accurate information, protect your sign-in account, use exercises within your ability and environment, inspect equipment, and obtain professional clearance when your health, medications, pregnancy, injury, or other circumstances may affect exercise or nutrition.</p></section>
    <section><h2>Beta availability</h2><p>Features may change, contain defects, or be temporarily unavailable. Forge may restrict access to protect users, data, or the service. Export important records periodically; Forge is not an emergency, medical-record, or permanent archival system.</p></section>
    <section><h2>Photo nutrition estimates</h2><p>Meal-photo results are estimates and may miss ingredients, oils, sauces, preparation methods, or exact weights. Review and correct every item before adding it to your log. Do not rely on a photo estimate to manage an allergy, medical condition, medication interaction, or other situation requiring precise nutrition information.</p></section>
    <section><h2>Acceptable use</h2><p>Do not attempt unauthorized access, interfere with the service, upload unlawful material, misuse another person’s data, or use Forge to provide unlicensed medical diagnosis or treatment.</p></section>
    <section><h2>Accounts and deletion</h2><p>You may stop using Forge at any time and can export or delete synchronized dashboard data from Settings. Identity-provider records and time-limited operational backups follow their separate retention boundaries.</p></section>
    <section><h2>Questions</h2><p>{supportEmail ? <>Contact <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</> : 'A verified support contact must be configured before public release.'}</p></section>
  </>;
}

function Support({ supportEmail }: { supportEmail: string | null }) {
  return <>
    <h1>Forge support</h1>
    <p className="public-document-lead">For beta access, account, synchronization, food lookup, data-export, or deletion assistance, contact the Forge support team.</p>
    <section><h2>Before contacting support</h2><ul><li>Record the time and device where the problem occurred.</li><li>Include the visible error message and the page or action involved.</li><li>Do not send passwords, access tokens, or unnecessary health information.</li><li>For synchronization issues, confirm whether the status says offline, reconnecting, or needs attention.</li></ul></section>
    <section><h2>Contact</h2><p>{supportEmail ? <a className="public-document-contact" href={`mailto:${supportEmail}?subject=Forge beta support`}>{supportEmail}</a> : 'Support email is not configured. Public release is blocked until a verified address is provided.'}</p></section>
    <section><h2>Urgent situations</h2><p>Forge does not provide emergency or medical support. For a medical emergency, contact local emergency services. For immediate mental-health crisis support in the United States, call or text 988.</p></section>
  </>;
}

export function PublicDocumentPage({ kind, supportEmail }: { kind: PublicDocumentKind; supportEmail: string | null }) {
  const title = kind === 'privacy' ? 'Privacy' : kind === 'terms' ? 'Terms' : 'Support';
  useEffect(() => { document.title = `${title} — Forge`; }, [title]);
  return <div className="public-document-shell">
    <header><a className="public-document-brand" href="/"><span>F</span><b>FORGE</b></a><a href="/">Return to Forge</a></header>
    <main className="public-document"><div className="public-document-meta">FORGE PUBLIC BETA · EFFECTIVE {effectiveDate.toUpperCase()}</div>{kind === 'privacy' ? <Privacy supportEmail={supportEmail} /> : kind === 'terms' ? <Terms supportEmail={supportEmail} /> : <Support supportEmail={supportEmail} />}</main>
    <footer><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a><span>© 2026 Forge</span></footer>
  </div>;
}
