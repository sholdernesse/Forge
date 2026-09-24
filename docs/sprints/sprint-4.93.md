# Sprint 4.93 — Pseudonymous Mutation Audit

## Goal

Create accountable evidence for dashboard mutations without copying account identifiers or health data into operational logs.

## Delivered

- Added structured audit events for accepted, conflicting, and rejected dashboard writes.
- Correlated every mutation event with the server-generated request ID.
- Replaced raw authenticated subjects with keyed HMAC actor references.
- Required a distinct operator-managed HMAC key in production.
- Restricted outcomes and reasons to a bounded schema; state, request bodies, tokens, and exception content remain excluded.
- Added focused coverage for pseudonymization, production configuration, event shape, and handler outcomes.

## Product constraint

Audit records support operational accountability; they are not product analytics. Access, retention, key rotation, and export remain controlled operational procedures.
