# Sprint 4.12 — Inspectable Training History

## Goal

Make the synchronized training record understandable to the user instead of leaving completed-session evidence hidden inside planning state.

## Delivered

- responsive recent-training timeline in Today
- newest-first ordering with a six-session display boundary
- duration and completed hard-set summaries
- primary trained-muscle summary
- perceived-effort display when feedback exists
- distinct mild-discomfort and stopped-session treatment
- recovery-work fallback for sessions without hard-set volume
- safe empty state before the first completed session

## Data boundary

The timeline is a projection of existing synchronized `TrainingSessionRecord` data. It creates no second history store and does not expose optional feedback notes in the compact timeline.

## Acceptance

- recent completed sessions appear newest first
- each row exposes date, title, duration, and completed volume
- effort and discomfort appear only when recorded
- stopped sessions are visually distinct without making a diagnosis
- the layout remains readable on phone and desktop widths
- an empty history does not break Today
