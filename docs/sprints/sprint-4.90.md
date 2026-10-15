# Sprint 4.90 — Explainable Body-Composition Targets

## Goal

Make adaptive nutrition understandable without presenting an uncertain body-composition outcome as a promise.

## Delivered

- Added goal-specific weekly weight-trend ranges scaled to the user’s current body weight.
- Shows whether the longer trend is still calibrating, inside the target range, or needs review.
- Added an expandable calorie explanation covering the goal baseline, training demand, recovery support, and evidence-gated trend correction.
- Kept the existing longer-history safeguards and bounded correction policy unchanged.
- Added focused tests for calibration state, in-range and out-of-range trends, and adjustment reconciliation.

## Product constraint

The range is guidance for reviewing a sustained scale trend. It is not a body-fat measurement, a tissue-gain claim, or an automatic reason to change calories before the existing evidence thresholds are met.
