# Sprint 4.85 — Sync Retry Recovery

## Goal

Ensure a failed remote write can recover automatically instead of leaving Forge permanently marked offline after the API is available.

## Delivered

- Mark the sync connection unhealthy when a non-conflict dashboard write fails.
- Allow the existing 15-second recovery loop to reconnect, reload the current revision, and publish the latest local snapshot.
- Preserve the local-first save path and explicit revision-conflict flow.
- Added focused regression coverage for a failed write followed by successful reconciliation of the newer local state.

## Product constraint

Recovery remains automatic and uses the existing status indicator. No retry button, additional prompt, or second synchronization system was added.

## Acceptance

- A check-in is still saved locally immediately when its remote write fails.
- The connection is no longer treated as healthy after that failure.
- The next retry loads the remote revision and publishes the newer local snapshot.
- True revision conflicts continue to require the existing user decision.
