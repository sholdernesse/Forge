import { createHash } from 'node:crypto';

export interface ConsentDocument { id: string; version: string; title: string; text: string }
export interface ConsentPolicy { approved: boolean; documents: readonly ConsentDocument[] }
export interface ConsentRecord { digest: string; accepted: boolean; recordedAt: string; documents: readonly ConsentDocument[]; locale: string; method: 'checkbox-and-button' | 'withdrawal' }
export interface ConsentEvent extends ConsentRecord { eventId: string }
export interface ConsentHistoryPage { events: ConsentEvent[]; nextCursor: string | null }
export interface ConsentRepository { history(userId: string, before?: string): Promise<ConsentHistoryPage>; latest(userId: string): Promise<ConsentRecord | null>; append(userId: string, record: ConsentRecord): Promise<void>; close?(): Promise<void> }

// Intended operator: Patriot Technology Access and Identity Solutions LLC, trading as gnosislab.io.
// LLC formation is pending. Confirm the filed name before adding the LLC suffix or approving these drafts.
// Release owner must replace/review these texts and approve the versioned policy.
// No environment flag can turn draft wording into approved legal text.
export const consentPolicy: ConsentPolicy = {
  "approved": false,
  "documents": [
    {
      "id": "terms",
      "version": "2026-10-26-draft-3",
      "title": "Beta Terms of Use",
      "text": "Forge is a beta fitness and nutrition planning service operated by Patriot Technology Access and Identity Solutions, trading as gnosislab.io. The initial beta is by invitation for U.S. residents aged 18 or older.\n\nNot medical care\nForge provides general wellness, fitness, and nutrition information. It does not diagnose, treat, prevent, or cure medical conditions and is not a substitute for a physician, registered dietitian, physical therapist, or emergency service. Stop an activity that causes pain, dizziness, breathing difficulty, or other concerning symptoms and seek appropriate professional care.\n\nYour responsibilities\nProvide accurate information, protect your sign-in account, use exercises within your ability and environment, inspect equipment, and obtain professional clearance when your health, medications, pregnancy, injury, or other circumstances may affect exercise or nutrition.\n\nBeta availability\nFeatures may change, contain defects, or be temporarily unavailable. Forge may restrict access to protect users, data, or the service. Export important records periodically; Forge is not an emergency, medical-record, or permanent archival system.\n\nPhoto nutrition estimates\nMeal-photo results are estimates and may miss ingredients, oils, sauces, preparation methods, or exact weights. Review and correct every item before adding it to your log. Do not rely on a photo estimate to manage an allergy, medical condition, medication interaction, or other situation requiring precise nutrition information.\n\nAcceptable use\nDo not attempt unauthorized access, interfere with the service, upload unlawful material, misuse another person\u2019s data, or use Forge to provide unlicensed medical diagnosis or treatment.\n\nAccounts and deletion\nYou may stop using Forge at any time and can export or delete synchronized dashboard data from Settings. Identity-provider records and time-limited operational backups follow their separate retention boundaries."
    },
    {
      "id": "fitness-risk",
      "version": "2026-10-26-draft-3",
      "title": "Voluntary Participation, Assumption of Risk, and Release of Liability",
      "text": "Personal responsibility. I voluntarily choose to use Forge. Forge does not require me to perform any exercise, eat any food, follow any nutrition target, or act on any recommendation. I am responsible for deciding whether and how to follow its guidance, considering my health, abilities, circumstances, and professional advice. I may decline a recommendation or stop participating at any time.\n\nNo medical or professional nutrition care. Forge and its employees do not act as my physicians, registered dietitians, licensed nutrition professionals, or other healthcare providers. Using Forge does not establish a healthcare-provider relationship. Forge provides general educational and wellness information informed by publicly available research, published guidance, and general fitness and nutrition principles. Its content, including AI-generated recommendations and food estimates, may be incomplete, inaccurate, outdated, or unsuitable for me. Published research does not guarantee that a recommendation is safe or effective for my circumstances.\n\nSTOP IMMEDIATELY IF YOU FEEL DISCOMFORT.\nIf at any time while using Forge or following its exercise, nutrition, or other guidance I experience discomfort, pain, dizziness, unusual shortness of breath, or any other concerning symptom, I will stop the activity or recommendation immediately and seek medical advice from my doctor before resuming. I will not push through symptoms or rely on Forge to determine whether it is safe to continue. If symptoms are severe or suggest an emergency, I will seek emergency medical care immediately rather than wait for a routine appointment.\n\nAssumption of risk. I understand that exercise and changes in eating may cause injury, illness, or other harm, including serious injury or death. I voluntarily assume the risks associated with activities and dietary choices I undertake while using Forge. I am responsible for using equipment safely, reviewing food and portion estimates, obtaining appropriate professional guidance, and stopping when symptoms or circumstances make continued participation unsafe. I will not use Forge to disregard medical advice or delay necessary care.\n\nRelease of claims. To the fullest extent permitted by applicable law, I release Patriot Technology Access and Identity Solutions, trading as gnosislab.io, its officers, employees, and contractors from claims for injury, illness, death, or other loss arising from my voluntary participation in exercise or dietary activities undertaken in reliance on Forge's general fitness and nutrition content, including claims arising from their ordinary negligence in providing that content. For claims validly covered by this release, I waive my right to recover damages or pursue legal action against those released parties.\n\nThis release does not cover gross negligence, reckless or intentional misconduct, fraud, privacy or data-security claims, or any liability or rights that applicable law does not permit me to waive.\n\nAcceptance before personal use. I have read and understand this agreement, including its assumption of risk and release of claims. I understand that I am giving up certain legal rights to the extent permitted by law. I voluntarily accept this agreement before accessing Forge's personal fitness and nutrition features."
    },
    {
      "id": "health-data",
      "version": "2026-10-26-draft-3",
      "title": "Health Data Use Consent",
      "text": "I consent to Patriot Technology Access and Identity Solutions, trading as gnosislab.io, as the operator of Forge, using the health, exercise, nutrition, recovery, and optional medication-related information I choose to provide to operate my account, synchronize my records, and personalize my fitness and nutrition plan as described in the Privacy Notice.\n\nForge uses its hosting and identity service providers for these purposes. Optional meal-photo analysis sends a prepared image to OpenAI only when I choose that feature. This consent does not authorize marketing, new wearable integrations, or additional uses not described here. Those require separate choices. I can stop using Forge and use its export and deletion controls.\n\nThe final notice must confirm the verified contact, actual recipients, consent withdrawal process, and retention terms before approval."
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
