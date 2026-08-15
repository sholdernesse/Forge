# Sprint 4.10 — Post-workout Feedback Loop

## Goal

Capture how a completed session actually felt so Forge can distinguish planned training load from the user's experienced effort.

## Delivered

- post-workout check-in before the session is finalized
- bounded 1–10 perceived-exertion input
- explicit no, mild, or stopped discomfort signal
- optional 240-character context note
- conservative safety language without diagnosis or injury claims
- feedback stored with the workout and summarized into training history
- experienced effort replaces the previous hard-coded training RPE
- completed workouts cannot be accidentally finalized a second time from review mode

## Data boundary

Feedback remains part of the existing local-first dashboard payload and follows the same authenticated cross-device synchronization path. Notes are optional, length-bounded, and rejected if malformed during stored-session validation.

## Safety boundary

The discomfort signal informs conservative future planning; it is not a diagnosis. Forge directs users toward qualified care for severe, persistent, or worsening symptoms.

## Acceptance

- a workout with completed work opens the feedback step before finalization
- effort and discomfort are required and bounded
- notes remain optional and length-bounded
- Today records the user's reported effort rather than a fixed value
- workout and session history retain feedback across refresh and synchronization
- reviewing a completed workout cannot duplicate its history records
