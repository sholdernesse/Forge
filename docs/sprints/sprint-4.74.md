# Sprint 4.74 — Standing Calf Raise Visual Guide

## Outcome

Every current lower-body equipment path now has visual guidance for its shared standing calf raise, including a stable balance setup and distinct calf anatomy.

## Delivered

- Adds a two-panel supported single-leg calf-raise movement image.
- Adds a separate rear-side anatomical illustration showing gastrocnemius and soleus as primary muscles.
- Identifies foot, ankle, core, and hip stabilizers as supporting contributors.
- Teaches controlled heel lowering, a vertical heel path, brief top pause, and no bouncing.
- Uses a stable rack touch for balance and makes added load optional.
- Connects both assets to the existing `standing-calf-raise` planner identifier.
- Adds regression coverage for the image pair, calf-muscle model, support setup, ankle alignment, and unloaded starting option.

## Boundaries

- Users begin without load and add resistance only after the supported movement is repeatable.
- A low non-slip block and stable rack support are required for the illustrated variation.
- Forge does not diagnose foot, ankle, calf, knee, or balance symptoms.

## Acceptance

- The working heel visibly travels from a controlled lowered position to a balanced raised position.
- The ankle does not visibly roll inward or outward.
- The anatomical view isolates the working gastrocnemius and soleus.
- Type checks, full tests, and the production build pass.
