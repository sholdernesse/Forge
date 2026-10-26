# API observability

Forge emits one structured JSON record for every API request. Azure Container Apps forwards stdout and stderr to the configured Log Analytics workspace; no vendor SDK or connection string is required in application code.

Each record contains only:

- UTC timestamp;
- severity and event name;
- server-generated request ID;
- HTTP method and normalized route template;
- status code and elapsed milliseconds;
- error class for an unhandled failure.

The API returns the same request ID in `x-request-id`, including on an unhandled `500`, so a support report can be correlated with one server record.

## Privacy boundary

Do not add access tokens, user IDs, request or response bodies, query values, barcode values, food names, health measurements, database URLs, exception messages, or stack traces to these records. Unknown paths are logged as `unmatched`; supported variable paths use a route template.

## Initial operational queries

Use the Container Apps console table selected by the active Azure workspace schema and parse the JSON log line before filtering. Establish alerts from measured staging traffic rather than invented production thresholds. At minimum, review:

- `api.request.failed` events;
- completed requests with status `500–599`;
- latency by normalized route at the 50th, 95th, and 99th percentiles;
- `401`, `403`, `412`, and `413` counts separately so authentication, origin, synchronization, and payload problems are not collapsed into server failures.

Keep the infrastructure-defined 30-day workspace retention until the privacy and support owners approve a different period. Access to logs must be role-limited and reviewed because operational metadata is still sensitive.

## Mutation audit events

Dashboard write attempts emit `audit.dashboard.write` records with the request ID, a keyed pseudonymous actor reference, and one bounded outcome: `accepted`, `conflict`, or `rejected`. They never contain the account subject, dashboard state, or rejection payload.

Production requires `FORGE_AUDIT_HMAC_KEY` with at least 32 characters. Store it as a Container Apps secret and map it to the API environment. Do not reuse an authentication, database, or encryption key. Rotation changes future actor references, so record approved rotations in the restricted operational evidence store.
