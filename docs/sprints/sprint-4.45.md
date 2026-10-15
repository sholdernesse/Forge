# Sprint 4.45 — Accessible Critical Flows

## Outcome

Forge’s release-critical overlays now share one keyboard contract: focus enters the active dialog, remains inside it, Escape closes only the top dialog, and focus returns to the control that opened it.

## Delivered

- Extracted and tested the shared dialog keyboard policy.
- Covered Escape, forward Tab wrapping, reverse Tab wrapping, empty-dialog focus, and ordinary internal tab movement.
- Added the shared accessible-dialog boundary to Forge Coach.
- Added the same focus trap, Escape behavior, scroll lock, and focus restoration to morning check-in and evening reflection.
- Kept nested-dialog behavior stack-aware so only the top overlay responds.
- Added server-rendered browser-markup checks for onboarding’s named modal, close action, seven goal toggles, blocked continuation, and visible step context.
- Exposed onboarding progress as a screen-reader progressbar with current step values.
- Moves keyboard focus to each new onboarding heading so the changed question is announced.
- Replaced the prototype-only 65–90 kg weight slider with an accessible 30–300 kg numeric input consistent with validated profile bounds.

## Boundaries

- Automated checks validate semantics and keyboard decision policy; they do not replace the deployed desktop/mobile exercise.
- Screen-reader behavior and browser-specific rendering remain part of physical release acceptance.
- No new navigation, settings, or visual clutter was added.

## Acceptance

- Every full-screen product overlay uses the shared dialog boundary.
- Escape closes the top active dialog.
- Tab and Shift+Tab cannot escape the active dialog.
- Body scrolling is locked while a dialog is active and restored after close.
- Focus returns to the opening control when the dialog unmounts.
- Onboarding has a programmatic name, modal state, progress state, and explicit toggle states.
- Full CI passes on the documented head.
