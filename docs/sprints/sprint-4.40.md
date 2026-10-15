# Sprint 4.40 — Navigation Simplification

## Goal

Reduce competing controls on Today and keep Forge’s global navigation focused on its five primary product destinations.

## Product audit

Movement Library had three desktop entry points: the sidebar, the top bar, and the workout card. The first two duplicated a contextual training tool and made the global interface feel denser without improving access.

## Delivered

- Restore five global destinations: Today, Nutrition, Training, Progress, and Coach.
- Remove Movement Library from the desktop sidebar.
- Remove the duplicate Movement Library button from the top bar.
- Keep the contextual **Explore movement guides** action beside today’s workout.
- Align desktop navigation order with the established product model and mobile navigation.
- Remove obsolete styling associated with the deleted controls.

## Acceptance

- [x] Global navigation contains five clear destinations.
- [x] Movement Library remains reachable from the relevant training context.
- [x] The top bar has fewer competing actions.
- [x] Desktop and mobile destination models are aligned.
- [x] No new route, state, component, or architecture is introduced.
- [x] Lint, typecheck, tests, build, deployment validation, and release-readiness checks pass in CI.
- [ ] Complete the documented physical desktop/mobile acceptance pass against a deployed candidate.

## Deferred

- A broader visual-density review should be performed during physical desktop/mobile acceptance, where actual viewport behavior can be judged.
- Full AI-character exercise animation remains scheduled follow-on work.
- Live PostgreSQL recovery evidence and Render standby activation require authorized infrastructure.
