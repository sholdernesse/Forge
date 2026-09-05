# Sprint 4.54 — Searchable Food Database Gateway

## Outcome

Forge food logging now has a secure external-data boundary. Authenticated users can search normalized USDA FoodData Central foods and look up packaged products by barcode through Open Food Facts while the existing local catalog and manual entry remain available offline.

## Delivered

- Added authenticated food-search and barcode API routes.
- Added a server-only USDA FoodData Central adapter.
- Added Open Food Facts package-barcode lookup.
- Normalized provider records into one bounded Forge food shape.
- Labels results as USDA-backed government data or community-supplied data.
- Protects the USDA key from the browser and documents server configuration.
- Debounces remote search while continuing to show immediate local matches.
- Handles missing products and provider outages without blocking food logging.
- Validates provider responses before exposing them to the logging interface.
- Added API, adapter, client, authentication, normalization, and failure-path tests.

## Boundaries

- Open Food Facts records are community supplied and may be incomplete; Forge tells users to check the package label.
- Search results do not diagnose dietary needs or label food morally as healthy or unhealthy.
- Camera capture is not included in this slice; manual barcode entry remains available.
- Alternate-choice recommendations follow after category and goal context can be compared clearly.
- A production USDA key must be provisioned through the authorized deployment secret path before remote search is enabled.

## Acceptance

- Food endpoints require the same verified account authentication as dashboard sync.
- Search queries and barcode formats are bounded.
- USDA and Open Food Facts responses normalize consistently.
- Invalid provider records are discarded.
- Local search and manual entry still work when remote data is unavailable.
- Provider provenance is visible before a food is added.
- Type checks, the full test suite, and production builds pass.
