# PostgreSQL recovery drill record

Copy this file to the restricted operational evidence store for each drill. Do not commit database URLs, credentials, dumps, checksums, tokens, or user health data.

## Authorization and scope

- Change/incident reference:
- Operator and reviewer:
- Candidate commit and environment:
- Source backup policy / approved recovery point:
- Isolated target owner and deletion deadline:
- UTC drill start:
- Expected RPO and RTO:

## Preflight

Install compatible PostgreSQL client tools, provision a new empty target in a separate failure domain, and export the two URLs only in the current shell. The preflight connects to both databases, rejects identical resolved database identities, and refuses a target containing user tables.

```bash
SOURCE_DATABASE_URL='<source-url>' \
TARGET_DATABASE_URL='<empty-isolated-target-url>' \
CONFIRM_DRILL=forge-isolated scripts/postgres/drill-preflight.sh
```

- [ ] Authorization and maintenance window confirmed.
- [ ] Source is read-only for the operator except for normal backup access.
- [ ] Target is isolated, empty, non-production, and denied inbound application traffic.
- [ ] Encryption, retention, and separate-failure-domain storage are confirmed.
- [ ] PostgreSQL server and client versions recorded:

## Timed execution

Record UTC timestamps around each command. `backup.sh` creates a restrictive custom-format dump and checksum; `restore.sh` validates that checksum before restoring.

```bash
DATABASE_URL="$SOURCE_DATABASE_URL" BACKUP_DIR='<encrypted-working-directory>' \
  scripts/postgres/backup.sh

DATABASE_URL="$TARGET_DATABASE_URL" CONFIRM_RESTORE=forge \
  scripts/postgres/restore.sh '<encrypted-working-directory>/forge-<timestamp>.dump'

DATABASE_URL="$TARGET_DATABASE_URL" pnpm --filter @forge/api migrate
```

- Backup began/completed (UTC):
- Recovery point represented by backup (UTC):
- Restore began/completed (UTC):
- Migration began/completed (UTC):
- Dump size and checksum verification result:
- Warnings/errors and disposition:

## Validation

- [ ] Start an isolated API against the target and confirm `GET /health` returns `200` with `{"status":"ok"}`.
- [ ] Compare source and target counts for `dashboard_snapshots` at the captured recovery point; explain any expected delta.
- [ ] Compare a sample of revisions and update timestamps without copying dashboard payloads into evidence.
- [ ] Authenticate as two authorized drill subjects and confirm dashboard reads remain isolated.
- [ ] Write and read back a disposable drill subject, exercise optimistic revision conflict handling, then delete or destroy the target.
- [ ] Confirm source availability and data were unaffected throughout the drill.

## Outcome and cleanup

- Observed RPO (drill start minus recovery point):
- Observed RTO (restore start to validated service):
- Result (`PASS`, `FAIL`, or `BLOCKED`):
- Follow-up owners and due dates:
- Reviewer approval and UTC time:
- [ ] Isolated API and database destroyed.
- [ ] Local plaintext artifacts securely removed according to platform capabilities.
- [ ] Encrypted backup retained or destroyed according to the approved retention policy.
- [ ] Redacted evidence attached to the operational record and PR disposition updated.
