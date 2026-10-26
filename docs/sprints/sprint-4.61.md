# Sprint 4.61 — Resilient Barcode Resolution

## Outcome

Forge distinguishes a product absent from its data sources from an unavailable local service or provider, and can resolve exact branded-food barcodes through USDA when Open Food Facts has no record.

## Trigger

Physical phone acceptance decoded `884912359155` correctly but displayed the generic product-database-unavailable message. The barcode identifies a real Post cereal product, exposing both inaccurate 404 handling and a single-provider weakness.

## Delivered

- Treats an Open Food Facts 404 as a normal missing-product result rather than an outage.
- Falls back to an exact `gtinUpc` match in USDA branded-food search.
- Uses USDA `DEMO_KEY` only in non-production development when no key is configured.
- Keeps a configured production USDA key authoritative.
- Preserves API response status in the web client.
- Distinguishes provider outage, rejected local authorization, and unreachable local API in user-facing guidance.
- Adds provider-chain and interface-message tests.

## Boundaries

- USDA demo access is rate-limited and exists only for local acceptance testing.
- Production must configure its own USDA FoodData Central API key.
- Community and government data retain their provenance labels.
- Products absent from both sources still require manual nutrition-label entry.

## Acceptance

- Open Food Facts missing-product responses do not become false outage messages.
- USDA results must match the scanned normalized barcode exactly.
- Network and local-service failures give different recovery instructions.
- Type checks, focused tests, full suite, and production builds pass.
