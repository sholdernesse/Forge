# Forge public beta release

Forge's public trust pages are served by the same web image at `/privacy`, `/terms`, and `/support`. They are reachable without authentication and use the release build's `VITE_FORGE_SUPPORT_EMAIL` value.

## Required configuration

Set `VITE_FORGE_SUPPORT_EMAIL` as a GitHub environment variable for each deployed environment. Use a verified mailbox that is actively monitored for account access, privacy, export, deletion, and security reports. The Azure deployment workflow stops before provisioning or publishing when this value is absent.

Because Vite embeds `VITE_*` values during the image build, changing the support address requires a new web image and deployment.

The build also writes `/release-config.json` with the public support address and exact 40-character release commit. Set `VITE_FORGE_RELEASE_SHA` to the commit used for the image; Azure does this automatically with `GITHUB_SHA`. The dormant Render Blueprint requires the same value when it is deliberately activated.

## Automated candidate check

Run the smoke gate before physical acceptance:

```bash
DEPLOYMENT_URL=https://<forge-hostname> \
EXPECTED_COMMIT=<full-40-character-commit> \
node scripts/release/smoke-candidate.mjs
```

The check blocks release when the deployment serves the wrong commit, lacks a valid support contact, fails API health, permits anonymous dashboard access, loses public routes or SPA fallback, omits required browser security headers, or serves versioned assets without immutable caching. The Azure deployment workflow retries this gate while a new revision becomes ready; the release-readiness workflow runs it again against the recorded candidate.

## Release-owner checklist

- Open `/privacy`, `/terms`, and `/support` on the deployed hostname without signing in.
- Confirm the automated candidate smoke gate passes for the recorded commit.
- Confirm every mail link targets the monitored mailbox and send a test message through it.
- Confirm the application footer links work on desktop and phone.
- Review the privacy notice against the deployed providers, retention periods, and deletion behavior.
- Review the beta terms and wellness disclaimer against the intended launch countries and audience.
- Record an owner approval for the beta copy. Obtain qualified legal review before a general-availability or multi-jurisdiction launch.
- Confirm support responders can correlate a report using time, device, visible status, and request ID without asking for passwords, tokens, or unnecessary health information.

Public pages and a monitored mailbox are necessary release controls, but they do not replace physical acceptance, identity/account-isolation evidence, or the authorized recovery exercises.
