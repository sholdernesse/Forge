# Sprint 4.95 — Release Candidate 1 Hardening

## Goal

Remove the misleading persistent-offline state and add the minimum public-facing trust surfaces required for a controlled Forge beta.

## Delivered

- Distinguishes a browser-confirmed network outage from an authenticated sync failure that is actively reconnecting.
- Retries dashboard synchronization every 15 seconds and immediately after network recovery, window focus, or return to a visible tab.
- Keeps local-first saves and existing conflict protection intact while avoiding unnecessary sync-session resets when onboarding state changes.
- Adds public `/privacy`, `/terms`, and `/support` routes with a clear wellness-not-medical-care boundary.
- Adds a verified support-email build setting and blocks the Azure deployment workflow when it is missing.
- Links privacy, terms, and support from the application shell.
- Adds focused sync-status and public-route configuration tests.

## Acceptance status

Automated web tests, TypeScript validation, production bundling, and deployment-security checks pass. Physical desktop/mobile validation against the deployed candidate remains required before release. PostgreSQL restore and Render standby evidence remain authorization-dependent operational gates.

## Release-owner decisions

- Supply and monitor `VITE_FORGE_SUPPORT_EMAIL`.
- Approve the beta privacy notice and terms; obtain jurisdiction-specific legal review before general availability.
- Authorize billable infrastructure only when ready to run the recovery exercises.
