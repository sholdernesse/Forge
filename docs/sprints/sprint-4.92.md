# Sprint 4.92 — Privacy-Safe API Observability

## Goal

Make production API failures diagnosable without placing user health data or credentials in logs.

## Delivered

- Added one structured JSON completion record per API request.
- Added server-generated request IDs returned through `x-request-id` for successful and failed requests.
- Normalized variable routes and unknown paths so query, barcode, and path values are not logged.
- Limited failure metadata to the error class; messages, stacks, request bodies, tokens, user IDs, and health data remain excluded.
- Documented the Log Analytics path, initial operational views, privacy boundary, and retention constraint.
- Added focused coverage for route normalization, duration records, and error redaction.

## Product constraint

This slice creates diagnostic evidence but does not invent alert thresholds. Staging traffic and an approved operational owner are required before paging rules are enabled.
