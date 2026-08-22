#!/usr/bin/env bash
set -euo pipefail

umask 077
: "${DATABASE_URL:?DATABASE_URL must identify the PostgreSQL database to back up}"

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="${backup_dir}/forge-${timestamp}.dump"
mkdir -p "$backup_dir"

command -v pg_dump >/dev/null || { echo "pg_dump is required" >&2; exit 1; }
command -v sha256sum >/dev/null || { echo "sha256sum is required" >&2; exit 1; }

pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl --file="$backup_path"
sha256sum "$backup_path" > "${backup_path}.sha256"
printf 'Backup written to %s\n' "$backup_path"

