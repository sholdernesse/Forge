# Sprint 4.97 — Assisted Meal Photo Logging

## Goal

Let a signed-in user photograph a plate, receive a useful nutrition starting point, and retain control over every item and value that enters the Forge log.

## Delivered

- Adds phone-camera and existing-photo selection inside the food logger.
- Resizes images to a bounded resolution, converts them to JPEG, removes original file metadata, and rejects unsupported or oversized files before upload.
- Adds an authenticated, size-bounded meal-photo API route with a provider-isolated analyzer.
- Uses structured vision output to identify up to eight visible foods, estimate portions and macros, and report assumptions, warnings, and confidence.
- Enriches detected items with the existing USDA provider when a usable match exists; otherwise labels nutrition clearly as an AI estimate.
- Requires the user to review, edit, include/exclude, or remove each item before adding anything to the nutrition log.
- Stores only approved nutrition entries. Forge does not persist the submitted photo.
- Keeps OpenAI and USDA credentials server-side in Key Vault and adds matching dormant-standby configuration.
- Adds a per-account hourly API limit as an immediate cost safeguard; provider-project spending and rate limits remain mandatory operational controls.
- Exposes a non-secret health capability flag so deployment smoke checks fail before acceptance when meal-photo analysis is not configured.
- Documents provider, retention, accuracy, allergy, and medical-use boundaries in the public privacy notice and beta terms.

## Operational configuration

The API requires `OPENAI_API_KEY`, `OPENAI_VISION_MODEL`, and `USDA_FOODDATA_API_KEY`. No live vision request runs when these settings are absent. API use is billable and should have environment-specific spending and rate limits before deployment.

The implementation follows the official OpenAI image-input and Structured Outputs contracts. Photo estimates remain assistive evidence only; they do not become deterministic nutrition truth without user review.
