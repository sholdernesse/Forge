# Sprint 4.64 — Observable Phone Food Lookup

## Outcome

A repeated phone lookup failure now provides enough safe development evidence to distinguish a stale browser bundle, broken proxy route, and provider request failure without exposing credentials.

## Trigger

Physical acceptance continued to show the same generic network message after the computer was confirmed at Sprint 4.63. Further speculative fixes would not identify the browser-side failure.

## Delivered

- Runs a same-origin `/api/health` check after a barcode lookup exception.
- Reports the active development route and health response status beside the existing recovery message.
- Makes the diagnostic development-only.
- Never includes authorization headers, tokens, food history, or account data.
- Adds regression coverage for enabled and disabled diagnostic behavior.

## Boundaries

- The diagnostic appears only after a failed lookup.
- Production continues to show concise user-facing recovery guidance.
- The health check does not retry or conceal the original lookup failure.

## Acceptance

- A current development bundle appends `Diagnostic: Route /api; health ...` after a lookup exception.
- Absence of the diagnostic identifies a stale browser bundle.
- Production configuration performs no diagnostic request.
- Type checks, full tests, and production builds pass.
