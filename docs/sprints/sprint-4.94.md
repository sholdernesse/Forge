# Sprint 4.94 — Account Data and Privacy Controls

## Goal

Give users a portable copy of their Forge data and a safe way to delete synchronized dashboard data without it being recreated automatically.

## Delivered

- Added a versioned JSON export covering the current dashboard state.
- Added authenticated, account-scoped `DELETE /v1/dashboard` behavior with idempotent `204` responses.
- Added distinct pseudonymous deletion audit outcomes for deleted and already-absent records.
- Clears browser data only after confirmed cloud deletion, then signs out and reloads.
- Added a durable local deletion marker that blocks sync initialization until the user explicitly completes a fresh onboarding.
- Added typed `DELETE` confirmation, signed-out disabling, and honest separation between local reset, Forge dashboard deletion, and Entra identity ownership.
- Documented primary-data, backup, log, export, recovery, and support retention procedures.
- Added focused coverage for export shape, cloud deletion, account isolation, idempotency, revision reset, deletion-marker behavior, and settings accessibility.

## Product constraint

Deletion covers Forge’s synchronized dashboard and local browser copy. It does not claim to delete an externally owned identity, immutable backup recovery point, or data stored on an offline device that has not reconnected.
