# Sprint 4.6 — Coach Memory and Cross-device Continuity

## Goal

Turn the single-answer Coach into a continuing interaction that follows the user between desktop and mobile.

## Delivered

- multi-turn coaching history instead of replacing the previous answer
- Coach messages stored in the versioned dashboard state and synchronized through the existing authenticated API
- recommendation IDs retained with assistant messages so explanations can be reconstructed from the current Digital Twin
- user-controlled conversation clearing
- a 40-message retention boundary and strict stored-message validation
- backward-compatible loading of dashboard versions 1 through 9

## Privacy and cost boundary

Conversation content stays inside the same local-first dashboard payload already controlled by the signed-in user. This sprint adds no external model provider and sends no conversation to a third party.

## Acceptance

- multiple questions remain visible in chronological order
- a signed-in user can reopen the same conversation on another device after synchronization
- malformed stored messages are discarded
- only the newest 40 valid messages are retained
- clearing the conversation persists and synchronizes
