#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────
# Inclufy Marketing (AMOS) — Database Backup Script
#
# Mirrors the ProjeXtPal pattern but adapted for Supabase managed Postgres.
# Uses local pg_dump (no Docker required) against the Supabase pooler in
# session mode (port 5432).
#
# Setup (one-time):
#   1. Get the Postgres password from Supabase Dashboard:
#      Settings → Database → Connection string → reveal & copy.
#   2. Save it in ~/.inclufy-backup-secrets like this:
#         AMOS_DB_PASSWORD=...
#         FINANCE_DB_PASSWORD=...
#      (chmod 600 it). The script sources this file if it exists.
#
# Usage:
#   ./backup-database.sh
#   AMOS_DB_PASSWORD=... ./backup-database.sh   (override per run)
#
# Cron (daily at 03:00):
#   crontab -e
#   0 3 * * * cd "/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main" && ./backup-database.sh >> $HOME/backups/inclufy-marketing/cron.log 2>&1
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups/inclufy-marketing"
PROJECT_REF="mpxkugfqzmxydxnlxqoj"
RETENTION_DAYS=30

POOLER_HOST="aws-1-eu-west-1.pooler.supabase.com"
POOLER_PORT="5432"
DB_USER="postgres.${PROJECT_REF}"
DB_NAME="postgres"

# Source secrets file if present
if [[ -f "$HOME/.inclufy-backup-secrets" ]]; then
  # shellcheck disable=SC1091
  source "$HOME/.inclufy-backup-secrets"
fi

if [[ -z "${AMOS_DB_PASSWORD:-}" ]]; then
  echo "❌ AMOS_DB_PASSWORD not set."
  echo "   Either: export AMOS_DB_PASSWORD=...  before running"
  echo "   Or:     create ~/.inclufy-backup-secrets (chmod 600) with"
  echo "             AMOS_DB_PASSWORD=..."
  exit 1
fi

# Use Postgres.app's bundled pg_dump if it exists (Mac default).
if [[ -x /Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump ]]; then
  PG_BIN="/Applications/Postgres.app/Contents/Versions/latest/bin"
  export PATH="$PG_BIN:$PATH"
fi

mkdir -p "$BACKUP_DIR"
echo "📦 [AMOS] Starting backup: $DATE"

TMP_SCHEMA="$BACKUP_DIR/schema_$DATE.sql"
TMP_DATA="$BACKUP_DIR/data_$DATE.sql"

export PGPASSWORD="$AMOS_DB_PASSWORD"

# Schema-only — fast, captures every table/index/policy/function
pg_dump \
  -h "$POOLER_HOST" -p "$POOLER_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --schema=public --schema-only --no-owner --no-privileges \
  --file="$TMP_SCHEMA"

# Data-only with COPY — much smaller + faster restore than INSERTs
pg_dump \
  -h "$POOLER_HOST" -p "$POOLER_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --schema=public --data-only --no-owner --no-privileges \
  --file="$TMP_DATA"

unset PGPASSWORD

# Sanity check — empty dumps mean auth or connection silently failed
if [[ ! -s "$TMP_SCHEMA" ]] || [[ ! -s "$TMP_DATA" ]]; then
  echo "❌ One of the dumps came back empty — auth or connection problem."
  rm -f "$TMP_SCHEMA" "$TMP_DATA"
  exit 1
fi

ARCHIVE="$BACKUP_DIR/backup_$DATE.tar.gz"
tar -czf "$ARCHIVE" -C "$BACKUP_DIR" \
  "schema_$DATE.sql" "data_$DATE.sql"
rm "$TMP_SCHEMA" "$TMP_DATA"

BACKUP_SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo "✅ Backup complete: $BACKUP_SIZE — $ARCHIVE"

find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "🧹 Cleaned old backups (>${RETENTION_DAYS} days)"

echo "$(date '+%Y-%m-%d %H:%M:%S')  AMOS  $BACKUP_SIZE  OK" >> "$BACKUP_DIR/backup.log"
