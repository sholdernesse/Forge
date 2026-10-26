# Sprint 4.55 — Secure Camera Barcode Capture

## Outcome

Forge can scan supported UPC and EAN package barcodes with a phone’s rear camera, send only the detected digits to the authenticated food lookup, and return the user to the existing food result and serving flow. Manual barcode entry remains visible and functional everywhere.

## Delivered

- Added an in-app rear-camera barcode scanner for supported browsers.
- Restricts detection to EAN-13, EAN-8, UPC-A, and UPC-E formats.
- Normalizes and bounds detected codes before lookup.
- Stops all camera media tracks after detection, dismissal, permission failure, or component cleanup.
- Keeps live video on the device; frames are not uploaded or stored.
- Uses the authenticated Open Food Facts gateway after detection.
- Handles camera denial, unsupported detection, unreadable codes, missing products, and provider outages with a manual path.
- Added modal semantics, focus handling, live status text, and phone-safe camera framing.
- Added focused capability and barcode-normalization tests.

## Boundaries

- Camera scanning requires HTTPS outside localhost and a browser implementing the Barcode Detector API.
- Forge does not claim universal browser support. Unsupported phones use the existing manual barcode field.
- A third-party decoder was not added because external package installation was not authorized in the build environment.
- Food images and camera frames never leave the device.
- Community-sourced product data still requires a package-label check.

## Acceptance

- Camera permission exists only while the scanner is open.
- A valid detected barcode closes the scanner and starts lookup.
- Invalid barcode lengths never reach the API.
- Escape and the close action dismiss the top dialog and stop the camera.
- Unsupported or denied camera access preserves manual entry.
- Type checks, the full test suite, and production builds pass.
