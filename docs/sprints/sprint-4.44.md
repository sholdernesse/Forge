# Sprint 4.44 — Build My Forge Plan

## Outcome

A new personal user can establish the minimum honest inputs Forge needs before it presents a starting plan. Demonstration profile assumptions are replaced by the user’s goal, training reality, baseline, and selected support preferences.

## Delivered

- Added the three-step “Build my Forge plan” experience.
- Begins with the agreed primary question: “What would you like Forge to help you change?”
- Supports muscle/strength, fat/body composition, endurance, health/energy, consistency, maintenance, and “help me choose” starting directions.
- Captures experience, weekly frequency, session length, training location, available equipment, and conservative movement considerations.
- Captures age, sex used for estimates, height, weight, and desired nutrition support.
- Converts answers into validated Digital Twin profile and goal inputs.
- Passes weekly frequency, session length, equipment, and supported constraints to the training planner.
- Persists the versioned onboarding profile locally and through authenticated cross-device sync.
- Opens the first daily check-in immediately after plan setup.
- Preserves established pre-onboarding accounts without forcing a blocking migration.
- Keeps the initial interface focused by withholding unrelated dashboard sections and daily actions until setup is complete.

## Product boundaries

- One primary goal only; secondary-goal prioritization remains later work.
- No medical diagnosis or injury intake.
- “Help me choose” starts with a balanced recomposition foundation and adapts from evidence.
- Nutrition preference records the desired support depth; deeper provider integration remains in the nutrition roadmap.
- Units use the app’s current metric engine boundary; unit preference is a later accessibility/localization slice.

## Acceptance

- A clean personal account can complete setup with keyboard-accessible controls.
- Invalid or out-of-range baseline data cannot be saved.
- At least one equipment option is required.
- Valid onboarding data survives local and synchronized state parsing.
- Malformed onboarding data is ignored safely.
- Digital Twin goals/profile and training preferences reflect the saved answers.
- Development demo mode remains unchanged.
- Full CI passes on the documented head.
