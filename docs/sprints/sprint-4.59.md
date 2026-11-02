# Sprint 4.59 — Cross-Browser Barcode Decoding

## Outcome

Secure iPhone browsers can scan package barcodes even when they do not expose the experimental native Barcode Detection API.

## Root cause

Chrome on iPhone runs on Apple's browser engine and can provide secure camera access, but it does not expose `BarcodeDetector`. Forge previously treated that missing API as a terminal capability failure after HTTPS and certificate trust had already succeeded.

## Delivered

- Preserves the native Barcode Detection path where available.
- Loads `@zxing/browser` only when a secure camera is available but native detection is not.
- Uses the rear camera and continuously decodes the package barcode on-device.
- Sends only the normalized barcode value into Forge's authenticated product lookup.
- Stops both native and compatibility scanning when detected or closed.
- Keeps manual barcode entry as the universal fallback.
- Removes the inaccurate unsupported-detection terminal state.

## Product and performance boundaries

- The compatibility decoder is a lazy-loaded bundle and does not increase the initial dashboard bundle.
- Camera frames remain in the browser and are not uploaded.
- HTTPS and explicit camera permission are still required.
- The decoder is not used for nutrition-label OCR or live form analysis.

## Acceptance

- A secure iPhone browser without `BarcodeDetector` proceeds to camera scanning.
- Browsers with native detection retain the existing fast path.
- Insecure contexts still explain the HTTPS requirement.
- Closing the scanner releases the camera.
- Type checks, scanner tests, the full suite, and production builds pass.
