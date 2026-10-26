# Signup consent milestone — October 12, 2026

## Implemented on the release branch

- An authenticated first-use gate runs before the personal app mounts. It presents distinct unchecked Terms, fitness-risk acknowledgment, and health-data use choices with full versioned text.
- The API validates the current content digest and all required choices. Server-generated UTC timestamps, authenticated account identity, locale, acceptance method, and exact document copies are stored in append-only PostgreSQL events, separately from dashboard snapshots.
- Dashboard reads/writes and food/photo endpoints enforce acceptance on every request. New devices obtain account acceptance from the server. Text changes invalidate older acceptance; browser storage cannot grant consent.
- Failed/offline verification blocks personal use. Sign-out and public documents remain available. Dashboard deletion remains available without acceptance.
- `/agreements` displays the current receipt and allows withdrawal. Withdrawal blocks personal API use; focus/visibility recovery rechecks the browser gate. Settings links to this page.
- The deployment smoke gate rejects candidates without enforced consent and approved text.

## Draft text remains a release blocker

`apps/api/src/consent.ts` is the canonical versioned policy. Its approval status is deliberately **false**. No environment flag can approve draft agreements, and consent cannot be disabled in production. The October 22 revision stages the release-owner-selected wording from `fitness-participation-consent.DRAFT.md` in the canonical fitness document as `2026-10-22-draft-2`. It adds voluntary participation, personal responsibility, a limited release of claims, and a prominent instruction to stop immediately if discomfort occurs and seek medical advice from the user’s doctor before resuming. The signup checkbox explicitly discloses the proposed waiver. This supersedes the earlier acknowledgment-only draft; it is **not** legally approved or available for signature. On October 26, the owner supplied the operating name **Patriot Technology Access and Identity Solutions, trading as gnosislab.io** and subsequently clarified that the business will be formed as an LLC. Registration is pending; the intended name is **Patriot Technology Access and Identity Solutions LLC, trading as gnosislab.io**. The current draft retains the name without an LLC suffix until formation and the filed name are confirmed; the beta scope is U.S. residents aged 18+, by invitation. These details are staged in version `2026-10-26-draft-3` across the current documents. Public disclosures, retention terms, and final approval remain unresolved.

The intended operating/trading name and U.S. adult beta scope are confirmed; LLC formation and the exact filed name remain pending. The release owner must finalize the verified contact, processing recipients, withdrawal/retention terms, and any licensed professional scope. Counsel must approve final language and align public Terms/Privacy with the exact documents presented. After editing, use a new version and set approval only in the reviewed policy commit. Insurance quotes remain a risk-management recommendation rather than a blanket statutory requirement for this app.

## Migration and development review

Run the normal API migration command before starting the updated server. It now applies both `001_dashboard_snapshots.sql` and idempotent `002_consent_events.sql`.

For a local draft preview, set API `FORGE_CONSENT_REQUIRED=true` and web `VITE_FORGE_CONSENT_PREVIEW=true`. Draft documents are readable but cannot be signed. Normal local development bypasses the browser gate unless preview is enabled. Production always requires consent and remains blocked while policy approval is false.

Acceptance events are not removed by dashboard deletion. Final retention, full identity-account deletion, and jurisdiction-specific disclosures must be approved before release. Account-scoped receipt history and individual JSON downloads are now available at /agreements, including after withdrawal and policy changes. History is bounded to 20 events per page with stable cursors. Never add medical answers or photos to consent logs.

## Validation and remaining evidence

Automated checks cover unauthenticated access, missing/incomplete consent, exact documents, server time, account isolation, another-client access, stale versions, policy edits, withdrawal, unavailable storage, unapproved policy, production configuration, response validation, failed writes, and unchecked signup markup. Production TypeScript/build checks and candidate-smoke unit tests run locally.

The physical desktop/mobile checklist now includes these scenarios. An isolated PostgreSQL 16 CI test now exercises idempotent migrations, durable acceptance, withdrawal, account isolation, and historical pagination. No deployed candidate was exercised in this milestone. Production PostgreSQL migration/restore, physical phone readability and interaction, real identity login, actual OpenAI meal-photo calls, mail delivery, and recovery/failover remain outstanding; local tests do not replace that evidence.
