# Sprint 4.27 — Warm-up-Aware Training

## Goal

Let users prepare for loaded work without allowing warm-up activity to distort training volume, progression targets, or strength records.

## Delivered

- explicit warm-up and working-set classification with backward-compatible persisted data
- Add warm-up and Remove warm-up controls for repetition exercises
- visually distinct warm-up rows and numbering in the active workout
- one editable warm-up set automatically planned before the primary compound lift on upper- and lower-strength days
- no automatic loaded warm-up in recovery sessions
- warm-up exclusion from weekly muscle volume, exercise summaries, progression history, estimated-max trends, and personal-record detection
- completed warm-ups remain protected from accidental removal
- deterministic tests across set lifecycle, planning, volume, and progression

## Planning boundary

The automatic warm-up is a conservative starting point at approximately 50% of the first working-set load. It is editable and removable. Forge does not treat it as a universal readiness test or permission to continue through pain.

## Acceptance

- ready-state strength plans place a warm-up before the primary compound movement
- recovery plans do not introduce a loaded warm-up
- users can add more warm-ups or remove incomplete warm-ups
- completed warm-ups contribute to workout completion but not working-volume targets
- warm-up loads never create estimated-max records or personal-record markers
- historical sessions without a set classification continue to behave as working sets
