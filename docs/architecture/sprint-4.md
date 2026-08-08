# Sprint 4 Architecture

## Product rule

**The UI displays decisions. Services make decisions.**

Forge separates collection, state, decisioning, and presentation so the coaching system can evolve without coupling business rules to a screen.

## Data flow

1. Raw user and device signals are normalized into a `DailySnapshot`.
2. `TwinBuilder` folds snapshots into the current `DigitalTwin`.
3. `RecommendationEngine` evaluates the twin and emits explainable recommendations.
4. `DecisionTimeline` stores the recommendation, evidence, confidence, and later outcome.
5. `CoachService` exposes a stable interface for Today, Workout, Nutrition, Recovery, and conversational questions.

## Packages

- `@forge/shared`: shared primitives and utilities.
- `@forge/digital-twin`: canonical user state and history.
- `@forge/recommendation-engine`: deterministic recommendation engine v1.
- `@forge/coach`: application-facing coaching API.

## Sprint 4.1 acceptance criteria

- Twin can be constructed from profile, goals, and snapshots.
- Recovery and training load are calculated outside UI code.
- Recommendations include evidence and confidence.
- Decisions can be appended to a timeline.
- Core packages typecheck independently.
- Recommendation behavior has unit tests.
