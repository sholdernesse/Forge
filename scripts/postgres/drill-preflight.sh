#!/usr/bin/env bash
set -euo pipefail

: "${SOURCE_DATABASE_URL:?SOURCE_DATABASE_URL must identify the PostgreSQL database to back up}"
: "${TARGET_DATABASE_URL:?TARGET_DATABASE_URL must identify the isolated PostgreSQL drill database}"

if [[ "${CONFIRM_DRILL:-}" != "forge-isolated" ]]; then
  echo "Refusing drill preflight: set CONFIRM_DRILL=forge-isolated" >&2
  exit 2
fi
if [[ "$SOURCE_DATABASE_URL" == "$TARGET_DATABASE_URL" ]]; then
  echo "Refusing drill preflight: source and target URLs are identical" >&2
  exit 2
fi

for command_name in pg_dump pg_restore psql sha256sum; do
  command -v "$command_name" >/dev/null || {
    echo "$command_name is required" >&2
    exit 1
  }
done

database_identity_sql="select current_database() || '@' || coalesce(inet_server_addr()::text, 'local') || ':' || inet_server_port();"
source_identity="$(psql "$SOURCE_DATABASE_URL" -AtX --set ON_ERROR_STOP=1 --command "$database_identity_sql")"
target_identity="$(psql "$TARGET_DATABASE_URL" -AtX --set ON_ERROR_STOP=1 --command "$database_identity_sql")"

if [[ "$source_identity" == "$target_identity" ]]; then
  echo "Refusing drill preflight: source and target resolve to the same database" >&2
  exit 2
fi

target_table_count="$(psql "$TARGET_DATABASE_URL" -AtX --set ON_ERROR_STOP=1 --command \
  "select count(*) from pg_catalog.pg_tables where schemaname not in ('pg_catalog', 'information_schema');")"
if [[ ! "$target_table_count" =~ ^[0-9]+$ ]]; then
  echo "Could not determine whether the drill target is empty" >&2
  exit 1
fi
if (( target_table_count != 0 )); then
  echo "Refusing drill preflight: target contains $target_table_count user tables" >&2
  exit 2
fi

echo "PostgreSQL drill preflight passed."
echo "Source: $source_identity"
echo "Target: $target_identity (empty)"
echo "Client: $(pg_restore --version)"
