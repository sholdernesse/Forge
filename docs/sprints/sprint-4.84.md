# Sprint 4.84 — Offline Sync Reconciliation

## Goal

Automatically reconcile locally preserved changes after the Forge service becomes available again.

## Delivered

- Compare the locally cached update time with the authenticated remote snapshot during every connection attempt.
- Push a newer local snapshot using the loaded remote revision rather than declaring stale remote data synchronized.
- Preserve a newer remote snapshot without overwriting it.
- Retain revision-conflict protection if another device changes the remote snapshot during reconciliation.
- Added focused coverage for both newer-local and newer-remote recovery paths.

## Product constraint

Offline edits remain local-first and no additional prompt, button, or background service was added. The existing 15-second connection retry now completes the recovery it already promised.

## Acceptance

- A locally saved check-in survives an API restart and reaches PostgreSQL after connectivity returns.
- A newer server snapshot remains authoritative when another device changed it later.
- Recovery never bypasses the existing revision check.
