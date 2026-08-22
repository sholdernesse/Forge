# Sprint 4.15 — User-controlled Training Export

## Goal

Give users a portable copy of their training history without sending that history to another service.

## Delivered

- one-click CSV export from Training History
- chronological session rows with ISO dates
- duration, effort, discomfort, and optional feedback context
- deterministic muscle-volume summary
- exercise-level set completion when available
- stable date-based filename
- RFC-style quote and line-break escaping
- spreadsheet-formula prefix protection for user-controlled text
- disabled export action when no sessions exist

## Privacy boundary

Export generation happens entirely in the browser from the already loaded dashboard state. Forge does not upload the file or send the export to a third party. Downloading the file is an explicit user action.

## Acceptance

- export contains one header and one row per retained session
- sessions are ordered oldest to newest for external analysis
- missing optional fields remain empty rather than fabricated
- commas, quotes, and line breaks remain valid CSV
- formula-like user text cannot execute directly when opened in a spreadsheet
- the filename contains only the Forge prefix and a safe ISO date
