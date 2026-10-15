# Forge insurance and consent release gate

**Prepared:** October 5, 2026  
**Status:** Planning and broker/counsel review. The waiver draft is [fitness-participation-consent.DRAFT.md](./fitness-participation-consent.DRAFT.md).

## Insurance to quote before a public beta

Ask a licensed commercial broker for policies issued to the actual operating entity. Give the broker the real product description: adaptive workouts and exercise guidance; nutrition targets and AI meal-photo macro estimates; optional medication-related personalization; user-entered health signals; account sync; and third-party AI, food-data, hosting, and potential wearable integrations. Ask for written confirmation that these features are covered, not merely a generic software-company quote.

| Coverage | Why Forge should evaluate it | Broker questions |
|---|---|---|
| Technology errors and omissions / professional liability | A user may claim an incorrect plan, exercise instruction, or nutrition estimate caused harm or loss. | Does the policy cover fitness/nutrition recommendations, AI outputs, alleged bodily injury from advice, and contractors? What medical, dietetic, or wellness exclusions apply? |
| Cyber and privacy liability | Forge stores account-linked fitness/nutrition information and syncs it across devices. | Are breach response, forensic work, notice, defense, regulatory matters, vendors, and unauthorized disclosure covered? What minimum controls and exclusions apply? |
| Commercial general liability | Covers ordinary business premises and some third-party bodily injury/property claims; scope can differ sharply from app-content claims. | Are events, filming, demonstrations, or in-person activity planned? Does a bodily injury or professional-services exclusion leave a gap? |
| Workers' compensation and employer coverages | Requirements depend on employee count and operating state. | What is legally required for the actual entity and workforce? |
| Directors and officers / employment practices | Evaluate as the company hires, raises capital, or adds a board. | When would these be appropriate? |

An LLC or corporation and a user waiver do not substitute for coverage. Compare at least two written proposals using limits, deductible, retroactive date, defense costs, territory, claims-made continuity, and exclusions. Record the selected policy and renewal owner. Do not assume a particular policy is legally mandatory without checking the entity's location and workforce.

## Signup and first-use implementation target

The current Forge branch has public beta Terms and Privacy pages and a four-step personal-plan onboarding flow. There is no separate exercise-risk signature record. The implementation gate should sit **after authentication and before personal onboarding, health-data entry, plan activation, or other personal fitness/nutrition use**. A public demo with no personal data can remain separate if counsel approves.

1. Publish counsel-approved, versioned Terms, Privacy Notice, and fitness acknowledgment/release. Identify the actual legal entity in all three.
2. Display the full agreements through accessible links. Use distinct unchecked controls for Terms, fitness acknowledgment/release, and affirmative health-data use consent. Make the final action explicit.
3. Have the server accept an authenticated request containing the versions the user saw; verify they match current approved versions, then write account-scoped acceptance events. Keep the exact text/hash available for audit. A browser-only flag is insufficient for cross-device use.
4. Gate API endpoints and the personal app server-side until required versions are accepted; refresh the gate on sign-in and when a version materially changes. Verify a second device cannot bypass it.
5. Ask for separate, just-in-time permission before sending an optional meal photo to an AI provider or connecting a wearable. Explain recipients and purpose and allow the user to decline without silently recording consent.
6. Make withdrawal and deletion paths consistent with the Privacy Notice, while preserving only records that counsel says must be retained for legitimate legal reasons.
7. Test keyboard/screen-reader use, mobile readability, declined consent, stale versions, account isolation, cross-device enforcement, and a failed consent write. Never mark acceptance successful before the server confirms it.

## Release owner checklist

- [ ] Confirm operating entity, launch jurisdictions, adult-only policy, and any human coaching/dietetic scope.
- [ ] Obtain written broker quotes for technology/professional liability and cyber; assess general liability and employment coverages.
- [ ] Have counsel approve exact agreement text, consent flow, privacy disclosures, and version-retention policy.
- [ ] Implement and verify the server-side consent gate and account-bound audit record.
- [ ] Update public pages and feature-specific consent before inviting outside users.
- [ ] Add this gate to physical desktop/mobile release acceptance and support procedures.

## Source notes

- U.S. Small Business Administration, [Get business insurance](https://www.sba.gov/business-guide/launch-your-business/get-business-insurance): business-structure protection has limits, insurance types differ, and legal requirements vary by state.
- Federal Trade Commission, [Mobile Health App Interactive Tool](https://www.ftc.gov/business-guidance/resources/mobile-health-apps-interactive-tool): fitness, diet, medication, and connected-device apps may face multiple privacy and security obligations; representations must match actual data practices.
- Federal Trade Commission, [Complying with the Health Breach Notification Rule](https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0): certain non-HIPAA health apps, particularly with multi-source/wearable data, may have breach-notification obligations.
