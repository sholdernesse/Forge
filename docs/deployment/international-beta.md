# International adult beta

Approved rollout direction (October 25, 2026): Forge by **gnosislab.io** welcomes international testers through country-specific invitations, restricted to adults aged 18 or older. This is a staged rollout, not unrestricted worldwide availability. The registered contracting entity and final agreement approval remain separate release decisions.

## Implemented controls

- Production always enforces beta admission on dashboard and food/photo routes. A client flag cannot bypass the API.
- Invitations are assigned to the verified authentication subject and one country of residence; an account cannot create its own invitation or change its assigned country.
- A tester must separately confirm adulthood and residence in the invitation's country. The server stores the first confirmation timestamp; no birth date is requested. This is self-attestation, not independent identity/age verification.
- Admission is checked on every protected API request. Revoking an invitation or removing its country from the enabled list pauses personal access. The UI rechecks on focus/visibility recovery.
- Consent review/history, withdrawal, support, and authenticated dashboard deletion remain reachable when beta access is paused. Beta eligibility does not substitute for agreement acceptance.
- Production starts closed with an empty enabled-country list. No countries or tester accounts are automatically approved by this implementation.

## Deployment configuration

The API migration now includes `003_beta_invitations.sql`. Run migrations before serving the updated API; the API container runs them at startup.

Set `FORGE_BETA_COUNTRIES` to comma-separated, two-letter ISO country codes **only for countries cleared by the release owner**. Azure reads this from the repository/environment variable of the same name and passes it through `infra/apps.bicep`. Render's dormant blueprint includes the same setting. An empty list admits nobody. Changing the list requires redeploying/restarting the API. Invalid code syntax prevents startup.

For local preview set both `FORGE_BETA_REQUIRED=true` and `VITE_FORGE_BETA_PREVIEW=true` in the root `.env.local`, set the intended test country list, apply migrations, and restart `corepack pnpm dev:https`. Ordinary development keeps its existing bypass. Production enforcement cannot be disabled by `FORGE_BETA_REQUIRED=false`.

## Issue invitations through an authorized database session

Verify the tester's exact subject ID from the configured identity provider; do not assume an email address is the subject. Confirm the residence country with the tester and check it is enabled. Use parameterized administrative database tooling to insert an invitation:

```sql
INSERT INTO beta_invitations (user_id, country)
VALUES ($1, $2);
```

`$1` is the verified subject, `$2` the uppercase country code. These are bind parameters, not literal values. There is deliberately no public invitation-creation endpoint and no reusable invitation code. Do not send tokens or credentials to support or place invitation records in public CI logs.

To revoke an invitation, set `revoked = true` for that subject. To reinvite or correct a country, set the reviewed country, `revoked = false`, and `adult_confirmed_at = NULL` together, requiring a fresh eligibility confirmation. Do not fabricate confirmation timestamps on the user's behalf. Invitation data retention and account closure must be aligned with the final privacy notice before inviting outside users; dashboard deletion alone does not remove invitation/consent records.

## Tester flow

Sign in → invitation check → confirm age 18+ and residence → review/accept approved agreements → personal onboarding. Uninvited testers see a support link to express interest and are asked to provide their country, not health information. No automated waitlist or outbound invitations are sent by this feature.

## Acceptance before opening a cohort

1. Confirm the legal operator, approved agreements, privacy disclosures, processing/provider availability, and support coverage for each enabled country. The country list is an operational admission control, not proof of legal compliance.
2. Run migration twice to verify idempotency. Confirm adult attestation survives API restart and remains account-scoped.
3. On desktop and phone, test missing invitation, wrong country, unchecked eligibility, failed/offline confirmation, valid invitation, country pause, revocation, and switching accounts.
4. Verify direct dashboard and photo API calls cannot bypass admission. Confirm accepted beta eligibility still cannot bypass consent.
5. Verify agreement history/withdrawal and dashboard deletion remain available after revocation.
6. Run the deployed candidate smoke gate; it now checks `betaEnforced:true` in health alongside the existing consent controls. Record the exact candidate and redacted evidence.

Automated handler/client tests support this checklist. Physical device and deployed identity/provider checks are still required before opening access.
