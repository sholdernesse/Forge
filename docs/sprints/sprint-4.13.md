# Sprint 4.13 — Completed Session Detail

## Goal

Let users inspect what happened inside a completed workout without leaving Today or relying on raw synchronized state.

## Delivered

- expandable rows in the recent training timeline
- exercise-level completed-versus-planned set summaries for new sessions
- duration, volume, and perceived-effort detail metrics
- optional feedback note visible only inside the selected session detail
- muscle-volume fallback for older records without exercise summaries
- closeable, responsive detail treatment on phone and desktop
- strict stored training-history validation with a 90-session retention boundary

## Compatibility

Existing history records remain readable through their muscle-volume summary. Newly completed sessions add optional exercise summaries and feedback context without changing the API transport or creating a second storage format.

## Acceptance

- selecting a timeline row reveals the matching session
- newly completed sessions show exercise names and set completion
- older sessions show a useful muscle-volume fallback
- optional notes remain hidden until a session is deliberately opened
- malformed history is filtered before rendering
- no more than 90 validated sessions are retained in dashboard state
