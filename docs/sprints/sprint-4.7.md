# Sprint 4.7 — Coach-to-action Handoffs

## Goal

Turn explainable coaching guidance into the next useful action without making the user navigate back through the dashboard.

## Delivered

- typed Coach action intents owned by `CoachService`, not inferred from generated display text
- training answers hand off to today's workout player
- nutrition answers hand off to the food logger
- recovery and insufficient-data answers hand off to the morning check-in
- action labels and types persist with Coach history across devices
- stored action validation rejects unsupported action types

## Decision boundary

The service chooses from a closed action set: `open-workout`, `open-nutrition`, or `open-check-in`. The UI only executes those known local navigation actions. Coach responses cannot issue arbitrary commands, URLs, or infrastructure operations.

## Acceptance

- every Coach answer includes one useful next action
- action selection follows question intent and available recovery evidence
- tapping an action closes Coach and opens the correct Forge workflow
- historical actions remain usable after synchronization
- malformed or unknown stored actions are discarded
