# Sprint 4.67 — RDL Range-of-Motion Refinement

## Outcome

The Forge RDL guide now shows the meaningful loaded-stretch range while making clear that individual control—not a fixed bar height—determines the safe endpoint.

## Reference reviewed

- [What Muscles Does the Romanian Deadlift Work? — Gym Plus](https://gym.plus/learn/what-muscles-does-romanian-deadlift-work)

The reference identifies the hamstrings and glutes as the dynamic hip extensors, describes the lower and upper back as isometric stabilizers, and emphasizes a slow eccentric, soft knees, close bar path, and a controlled endpoint commonly around mid-shin or just below the knee.

## Delivered

- Replaces the active image with a versioned two-panel asset that places the bottom-position bar near mid-shin.
- Shows a deeper hip hinge without converting the movement into a squat.
- Preserves soft knees, nearly vertical shins, neutral spine, close bar path, and full-body framing.
- Updates movement guidance to describe travel toward mid-shin.
- States explicitly that mid-shin is a visual reference, not a required depth.
- Preserves the original RDL asset for comparison and rollback.
- Adds regression coverage for the versioned asset and individualized endpoint language.

## Boundaries

- Forge does not instruct users to chase depth after hamstring range or spinal control changes.
- The image is an educational reference, not real-time form analysis or medical clearance.
- Written movement standards remain authoritative over generated imagery.

## Acceptance

- The bottom frame visibly demonstrates greater range than the original knee-height frame.
- The bar remains close and above the mid-foot.
- The guide pairs the visual reference with a user-specific stop rule.
- Type checks, full tests, and production builds pass.
