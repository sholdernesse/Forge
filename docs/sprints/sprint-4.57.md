# Sprint 4.57 — Visible Scanner Capability States

## Outcome

The Scan with camera action always opens a visible dialog. Forge now explains whether scanning is ready, requires HTTPS, lacks camera access, or lacks native barcode detection instead of silently declining to open.

## Root cause

The original button checked camera and detector support before opening the dialog. A phone loading Forge from a local LAN URL such as `http://192.168.x.x:4173` is not in a secure context, so browser camera APIs are unavailable. Forge wrote a small fallback message lower in the food panel, making the button appear broken.

## Delivered

- Opens the scanner dialog for every Scan with camera action.
- Distinguishes HTTPS-required, camera-unavailable, and detector-unavailable states.
- Provides a direct manual-entry action in every state.
- Explains that the deployed HTTPS candidate is required for real phone-camera acceptance.
- Replaces the inactive black preview with a clear unavailable-camera treatment.
- Preserves on-device video, media-track cleanup, and authenticated barcode lookup.
- Adds focused capability-state tests.

## Boundaries

- Browsers enforce secure-context camera policy; Forge does not bypass that boundary.
- A LAN development URL over plain HTTP cannot provide the real phone scanner experience.
- Native detector availability still varies by browser.
- Manual barcode entry remains the universal fallback.

## Acceptance

- The camera button never appears unresponsive.
- Insecure local-phone access explains the HTTPS requirement.
- Missing camera or detector support receives its own accurate message.
- Supported secure browsers continue into live scanning.
- Closing the dialog stops any active camera tracks.
- Type checks, focused tests, the full suite, and production builds pass.
