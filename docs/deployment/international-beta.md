# U.S.-only initial adult beta; international expansion later

Approved rollout direction (October 25, 2026): Forge by **gnosislab.io** initially admits **U.S. residents aged 18 or older, by invitation only**. This supersedes the earlier international first-cohort plan. International expansion remains a later phase; the country-aware architecture is retained. The owner confirmed the registered business on October 26 as **Patriot Technology Access and Identity Solutions, trading as gnosislab.io**. Final agreement approval remains outstanding.

## Implemented controls

- Production always enforces beta admission on dashboard and food/photo routes. A client flag cannot bypass the API.
- Invitations are assigned to the verified authentication subject and one country of residence; an account cannot create its own invitation or change its assigned country.
- A tester must separately confirm adulthood and residence in the invitation's country. The server stores the first confirmation timestamp; no birth date is requested. This is self-attestation, not independent identity/age verification.
- Admission is checked on every protected API request. Revoking an invitation or removing its country from the enabled list pauses personal access. The UI rechecks on focus/visibility recovery.
- Consent review/history, withdrawal, support, and authenticated dashboard deletion remain reachable when beta access is paused. Beta eligibility does not substitute for agreement acceptance.
- Deployment templates default to `US`. Tester accounts still require explicit invitations; the API also denies non-U.S. invitations independently of the enabled-country list. An empty list pauses all admission.

## Deployment configuration

The API migration now includes `003_beta_invitations.sql`. Run migrations before serving the updated API; the API container runs them at startup.

Set `FORGE_BETA_COUNTRIES=US` for this initial beta. Any non-U.S. code is rejected at startup; expanding countries requires a separately reviewed policy change. Azure reads this from the repository/environment variable of the same name and passes it through `infra/apps.bicep`. Render's dormant blueprint includes the same setting. An empty list admits nobody. Changing the list requires redeploying/restarting the API. Invalid or non-U.S. country codes prevent startup. The Azure workflow uses `US` when no repository variable is configured; to pause admission there, explicitly deploy `betaCountries` as an empty string or revoke invitations.

For local preview with a U.S. test invitation, set both `FORGE_BETA_REQUIRED=true` and `VITE_FORGE_BETA_PREVIEW=true` in the root `.env.local`, set `FORGE_BETA_COUNTRIES=US`, apply migrations, and restart `corepack pnpm dev:https`. Ordinary development keeps its existing bypass. Production enforcement cannot be disabled by `FORGE_BETA_REQUIRED=false`.

## Manage invitations with the operator tool

Verify the tester's exact subject ID from the configured identity provider; do not assume an email address is the subject. Confirm U.S. residence with the tester. Use an authorized administrative database session; the app exposes no public invitation-creation endpoint.

The tool uses the existing API `pg` dependency and `DATABASE_URL` / `DATABASE_SSL` settings. It does not automatically load `.env.local`, send emails, or enable beta countries. Do not paste credentials into commands or support messages. Set `FORGE_BETA_SUBJECT` locally to the verified account subject, then run from the repository root:

```powershell
# Preview: no database connection or change.
corepack pnpm beta:invitation invite

# Apply after checking the subject and target database.
corepack pnpm beta:invitation invite --apply

# Read-only invitation status.
corepack pnpm beta:invitation status

# Preview and then apply revocation.
corepack pnpm beta:invitation revoke
corepack pnpm beta:invitation revoke --apply
```

`--subject <verified-id>` is also accepted, though the environment variable avoids putting the ID in shell history. Only `--country US` is supported (also the default). Writes require `--apply`; status is always read-only. Output omits the subject and database credentials. A missing row is reported as `found:false`.

Repeated invitation of an active U.S. account preserves its adult confirmation. Reinviting a revoked account or changing a prior country to `US` clears its confirmation so the tester must attest again. The tool never fabricates adult confirmation on the tester's behalf. Revoke access promptly for an incorrectly provisioned subject and invite the correct one separately.

Invitation data retention and account closure must be aligned with the final privacy notice before inviting outside users; dashboard deletion alone does not remove invitation/consent records. The tool does not approve agreements or bypass release checks.

## Tester flow

Sign in → invitation check → confirm age 18+ and residence → review/accept approved agreements → personal onboarding. Uninvited testers see a support link to express interest and are asked to provide their country, not health information. No automated waitlist or outbound invitations are sent by this feature.

## Acceptance before opening a cohort

1. Confirm approved agreements, privacy disclosures, processing/provider availability, and support coverage for the U.S. beta before any external invitations. The country list is an operational admission control, not proof of legal compliance.
2. Run migration twice to verify idempotency. Confirm adult attestation survives API restart and remains account-scoped.
3. On desktop and phone, test missing invitation, wrong country, unchecked eligibility, failed/offline confirmation, valid invitation, country pause, revocation, and switching accounts.
4. Verify direct dashboard and photo API calls cannot bypass admission. Confirm accepted beta eligibility still cannot bypass consent.
5. Verify agreement history/withdrawal and dashboard deletion remain available after revocation.
6. Run the deployed candidate smoke gate; it now checks `betaEnforced:true` in health alongside the existing consent controls. Record the exact candidate and redacted evidence.

Automated handler/client tests support this checklist. Physical device and deployed identity/provider checks are still required before opening access.
