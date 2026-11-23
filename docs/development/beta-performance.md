# Beta runtime optimizations

These changes prepare the existing beta candidate; they do not approve consent,
activate hosting, or substitute for physical desktop/phone acceptance.

## Request budgets

- OpenAI analysis keeps its existing 90-second default and 120-second configuration
  cap. The deadline now covers both headers and response-body parsing. No automatic
  retry is made for this billable operation.
- USDA search and Open Food Facts/USDA barcode fallback have a five-second budget
  per operation, including response bodies. Repeated normalized USDA searches share
  an in-flight request and a five-minute, 128-entry in-memory cache of public food
  results. Callers receive copies; failed requests are not cached. This cache
  contains no account IDs, photos, or saved meals.
- Photo reference enrichment runs in parallel with a five-second bound and retains
  clearly labeled visual estimates if reference data is unavailable.
- The browser allows 150 seconds for photo processing; the exact gateway photo
  route allows 155 seconds. Other API routes retain their 30-second gateway limit.
- Dashboard requests have a 15-second deadline including token retrieval and JSON
  parsing. A timeout aborts transport, releases the queue, and cannot update its
  revision after completion. Local records remain available for recovery.

## Database and photo spending

Apply migration `004_meal_photo_limits.sql` before starting the new API. The normal
migration command and API container startup include it. This is additive and
idempotent; existing dashboards, consent events, and invitations are unchanged.

Photo quota is a rolling window stored in PostgreSQL, with atomic per-subject
updates across replicas. Restarting an API does not reset it. The existing default
is ten attempts per hour, including provider failures. If the quota store cannot
be checked, the API returns 503 before calling OpenAI. Include the quota row
(subject and bounded timestamps, no image or nutrition payload) in account-closure
and retention procedures; deleting expired rows is safe once their newest
timestamp is outside the quota window.

Dashboard, consent, beta admission, and quota share one application-owned pool.
`DATABASE_POOL_SIZE` defaults to 10 and accepts 1–50, replacing the prior separate
10+2+2 connection ceilings. Acquisition is bounded at three seconds, server-side
statements at four seconds, client queries at five seconds, and idle connections
expire after 30 seconds. Shutdown drains HTTP work before ending the pool once.
Do not increase the pool cap or replica count without checking database capacity.

## Sync and deferred screens

Rapid pending saves are combined into the latest snapshot; an in-flight write is
never modified. Reads and deletion are ordering barriers. Revision checks remain
mandatory, and conflicts never trigger an automatic overwrite. This reduces
redundant whole-dashboard transfers without changing the persisted data format.

Workout, settings, Coach, movement guides, and onboarding load on demand with a
named, closable loading dialog and retry state. Food logging was already deferred.
The reviewed baseline main chunk was 499.78 KB (145.42 KB gzip). The optimized
local production build is 394.89 KB (119.89 KB gzip), about 21% less uncompressed
main-chunk code and 18% less gzip code. Authentication and barcode chunks remain
separate. These are build sizes, not measured startup or response-time results.

## Validation and deployed acceptance

- Unit/regression coverage exercises stuck headers/bodies, enrichment fallback,
  cache expiry/copies/capacity, asynchronous quota-store failures, and queued
  save/delete/conflict/timeout behavior.
- CI applies all migrations twice and exercises concurrent quota calls from
  independent pools, restart persistence, expiry, account isolation, and shared
  pool ownership against isolated PostgreSQL.
- After building the actual web container, CI runs a synthetic upstream through
  nginx. A 31.5-second photo response must succeed while an ordinary API request
  still times out at 30 seconds. No paid model call is made.
- Before opening beta, test the deployed gateway and physical phone/desktop,
  including slow photo processing, barcode fallback, disconnected saves, account
  switching, quota exhaustion, and recovery. Record exact candidate, device,
  network, startup time, request durations, and error rates. Existing route logs
  expose duration and safe failure categories; never collect health payloads or
  photos for performance telemetry.
