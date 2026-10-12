import { createHash } from 'node:crypto';

export interface ConsentDocument { id: string; version: string; title: string; text: string }
export interface ConsentPolicy { approved: boolean; documents: readonly ConsentDocument[] }
export interface ConsentRecord { digest: string; accepted: boolean; recordedAt: string; documents: readonly ConsentDocument[]; locale: string; method: 'checkbox-and-button' | 'withdrawal' }
export interface ConsentEvent extends ConsentRecord { eventId: string }
export interface ConsentHistoryPage { events: ConsentEvent[]; nextCursor: string | null }
export interface ConsentRepository { history(userId: string, before?: string): Promise<ConsentHistoryPage>; latest(userId: string): Promise<ConsentRecord | null>; append(userId: string, record: ConsentRecord): Promise<void>; close?(): Promise<void> }

// Release owner must replace/review these texts and approve the versioned policy.
// No environment flag can turn draft wording into approved legal text.
export const consentPolicy: ConsentPolicy = {
  "approved": false,
  "documents": [
    {
      "id": "terms",
      "version": "2026-10-12-draft-1",
      "title": "Beta Terms of Use",
      "text": "Forge is a beta fitness and nutrition planning service.\n\nNot medical care\nForge provides general wellness, fitness, and nutrition information. It does not diagnose, treat, prevent, or cure medical conditions and is not a substitute for a physician, registered dietitian, physical therapist, or emergency service. Stop an activity that causes pain, dizziness, breathing difficulty, or other concerning symptoms and seek appropriate professional care.\n\nYour responsibilities\nProvide accurate information, protect your sign-in account, use exercises within your ability and environment, inspect equipment, and obtain professional clearance when your health, medications, pregnancy, injury, or other circumstances may affect exercise or nutrition.\n\nBeta availability\nFeatures may change, contain defects, or be temporarily unavailable. Forge may restrict access to protect users, data, or the service. Export important records periodically; Forge is not an emergency, medical-record, or permanent archival system.\n\nPhoto nutrition estimates\nMeal-photo results are estimates and may miss ingredients, oils, sauces, preparation methods, or exact weights. Review and correct every item before adding it to your log. Do not rely on a photo estimate to manage an allergy, medical condition, medication interaction, or other situation requiring precise nutrition information.\n\nAcceptable use\nDo not attempt unauthorized access, interfere with the service, upload unlawful material, misuse another person\u2019s data, or use Forge to provide unlicensed medical diagnosis or treatment.\n\nAccounts and deletion\nYou may stop using Forge at any time and can export or delete synchronized dashboard data from Settings. Identity-provider records and time-limited operational backups follow their separate retention boundaries."
    },
    {
      "id": "fitness-risk",
      "version": "2026-10-12-draft-1",
      "title": "Fitness Participation Acknowledgment",
      "text": "Forge provides general fitness, recovery, and nutrition information. It is not medical care or an emergency service. Exercise and changes in eating can cause injury or other health risks, including strains, falls, overexertion, and adverse effects from unsuitable choices.\n\nI choose to participate voluntarily. I am responsible for deciding whether an activity is appropriate, using equipment safely, and stopping when needed. I will seek appropriate professional guidance when a condition, injury, pregnancy, eating-disorder history, or medication may affect exercise or nutrition. I will not ignore pain, illness, or medical advice because of Forge output. For severe symptoms or an emergency, I will stop and seek urgent care.\n\nForge cannot observe all aspects of my health or technique. Exercise images are instructional aids rather than a live form assessment. Meal-photo results may misidentify foods and portions; I will review and correct them before logging. Medication-related personalization is general wellness support rather than dosing or treatment advice.\n\nI understand these risks and limitations. This acknowledgment does not waive any legal rights. Any proposed liability release requires separate legal approval."
    },
    {
      "id": "health-data",
      "version": "2026-10-12-draft-1",
      "title": "Health Data Use Consent",
      "text": "I consent to Forge using the health, exercise, nutrition, recovery, and optional medication-related information I choose to provide to operate my account, synchronize my records, and personalize my fitness and nutrition plan as described in the Privacy Notice.\n\nForge uses its hosting and identity service providers for these purposes. Optional meal-photo analysis sends a prepared image to OpenAI only when I choose that feature. This consent does not authorize marketing, new wearable integrations, or additional uses not described here. Those require separate choices. I can stop using Forge and use its export and deletion controls.\n\nThe final notice must identify the operating company, verified contact, actual recipients, consent withdrawal process, and retention terms before approval."
    }
  ]
};

export function policyDigest(policy: ConsentPolicy): string {
  return createHash('sha256').update(JSON.stringify(policy.documents)).digest('hex');
}
export function hasCurrentConsent(record: ConsentRecord | null, policy: ConsentPolicy): boolean {
  return policy.approved && record?.accepted === true && record.digest === policyDigest(policy);
}
export class MemoryConsentRepository implements ConsentRepository {
  private readonly records = new Map<string, ConsentEvent[]>();
  private sequence = 0n;
  async latest(userId: string): Promise<ConsentRecord | null> {
    const last = this.records.get(userId)?.at(-1);
    if (!last) return null;
    const { eventId: _eventId, ...record } = last;
    return structuredClone(record);
  }
  async append(userId: string, record: ConsentRecord) {
    const events = this.records.get(userId) ?? [];
    events.push({ ...structuredClone(record), eventId: String(++this.sequence) });
    this.records.set(userId, events);
  }
  async history(userId: string, before?: string): Promise<ConsentHistoryPage> {
    const events = [...(this.records.get(userId) ?? [])].reverse().filter(event => !before || BigInt(event.eventId) < BigInt(before));
    const page = events.slice(0, 20);
    return { events: structuredClone(page), nextCursor: events.length > 20 ? page.at(-1)!.eventId : null };
  }
}

export function consentRequired(environment: Record<string, string | undefined>): boolean {
  if (environment.NODE_ENV === 'production' && environment.FORGE_CONSENT_REQUIRED === 'false') throw new Error('Consent cannot be disabled in production');
  return environment.NODE_ENV === 'production' || environment.FORGE_CONSENT_REQUIRED === 'true';
}
