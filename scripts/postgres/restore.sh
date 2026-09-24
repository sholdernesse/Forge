#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: DATABASE_URL=... CONFIRM_RESTORE=forge scripts/postgres/restore.sh <backup.dump>" >&2
  exit 2
fi
: "${DATABASE_URL:?DATABASE_URL must identify the PostgreSQL database to restore}"
if [[ "${CONFIRM_RESTORE:-}" != "forge" ]]; then
  echo "Refusing destructive restore: set CONFIRM_RESTORE=forge" >&2
  exit 2
fi

backup_path="$1"
[[ -f "$backup_path" ]] || { echo "Backup not found: $backup_path" >&2; exit 1; }
[[ -f "${backup_path}.sha256" ]] || { echo "Checksum not found: ${backup_path}.sha256" >&2; exit 1; }
command -v pg_restore >/dev/null || { echo "pg_restore is required" >&2; exit 1; }
command -v sha256sum >/dev/null || { echo "sha256sum is required" >&2; exit 1; }

(cd "$(dirname "$backup_path")" && sha256sum --check "$(basename "$backup_path").sha256")
pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner --no-acl --exit-on-error "$backup_path"
printf 'Restore completed from %s\n' "$backup_path"

