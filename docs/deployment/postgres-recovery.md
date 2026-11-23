# PostgreSQL backup and restore

Forge uses provider-neutral PostgreSQL custom-format backups. The scripts require PostgreSQL client tools and read credentials only from `DATABASE_URL`; URLs are never printed.

## Back up

```bash
DATABASE_URL='<source-url>' BACKUP_DIR=./backups scripts/postgres/backup.sh
```

The script applies a restrictive umask, uses `pg_dump --format=custom`, excludes provider ownership and ACL metadata, and writes a SHA-256 sidecar. Encrypt the dump at rest, copy it to a separate failure domain, restrict access, and test it before relying on it. The `backups/` directory is ignored by Git.

## Restore drill

Restore only into an empty, isolated drill database. The command verifies the checksum and requires an explicit destructive confirmation before `pg_restore --clean --if-exists`:

Run the preflight before creating a backup. It verifies required clients and connectivity, rejects a source/target identity match, and refuses a target that already has user tables:

```bash
SOURCE_DATABASE_URL='<source-url>' \
TARGET_DATABASE_URL='<empty-isolated-target-url>' \
CONFIRM_DRILL=forge-isolated scripts/postgres/drill-preflight.sh
```

```bash
DATABASE_URL='<target-url>' CONFIRM_RESTORE=forge \
  scripts/postgres/restore.sh backups/forge-<timestamp>.dump
```

After restoration, run the API migration, check `/health`, compare representative row counts, and exercise authenticated dashboard reads and writes. Record the recovery point and elapsed recovery time, then securely delete drill resources and local plaintext artifacts.

Use [`postgres-recovery-drill-record.md`](postgres-recovery-drill-record.md) to capture authorization, timings, validation, RPO/RTO, cleanup, and reviewer sign-off without placing secrets or health data in Git.
