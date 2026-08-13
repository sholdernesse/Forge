# Sprint 4.4 — Portable Release and Recovery Foundation

## Goal

Reduce provider lock-in and make a controlled service recovery possible without weakening Forge's private network or identity boundaries.

## Delivered

- dormant Render Blueprint with manual deployment triggers, a public web gateway, private API, and private PostgreSQL access
- runtime-configured, provider-neutral private API routing through `FORGE_API_UPSTREAM`
- portable PostgreSQL custom-format backup and destructive-restore scripts with checksums and explicit confirmation
- CI validation for deployment boundaries and recovery-script syntax
- operator runbooks for backups, restoration drills, Render activation, DNS cutover, and failback

## Safety decisions

- the standby is not activated by this change and may create billable resources only when an operator creates its Blueprint
- the API is never public, development tokens are excluded, and identity verification remains in the API
- backups live outside Git and require separate encryption, retention, and access controls
- failover is active/passive; running two writable primaries is explicitly unsupported

## Remaining acceptance work

- complete an isolated backup restoration drill and record recovery time and recovery point
- conduct an authorized Render activation exercise, including identity and account-isolation tests
- verify DNS cutover and failback with production owners before adopting the runbook

