# Sprint 4.83 — Windows HTTPS Launcher Repair

## Goal

Correct the Windows Node 22 process-launch failure discovered during physical acceptance of Sprint 4.82.

## Delivered

- Removed direct `spawnSync` and `spawn` calls to `corepack.cmd`, which returned `EINVAL` on the review computer.
- Runs the fixed nested Corepack commands through the Windows command shell, which is the supported execution path for `.cmd` shims.
- Keeps direct argument-based Corepack execution on Unix-like development systems.
- Retains the PostgreSQL startup, readiness, migration, API, and HTTPS web sequence from Sprint 4.82.

## Acceptance

- `corepack pnpm dev:https` no longer attempts to execute `corepack.cmd` directly through Node's unsupported Windows child-process path.
- Database credentials, loopback exposure, and phone proxy boundaries remain unchanged.
