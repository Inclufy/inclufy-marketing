#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────
# Inclufy Marketing (AMOS) — Database Restore Script
#
# Lists local backups, prompts for one, asks for the TARGET project ref
# (default: a STAGING ref, NOT production — explicit override required to
# restore into prod), then pipes the dumps through psql.
#
# Usage:
#   ./restore-database.sh
#
# Safety: production restore demands typing the literal word "PRODUCTION".
# This is a deliberate paper-cut — accidental prod restore wipes user data.
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="$HOME/backups/inclufy-marketing"
PROD_REF="mpxkugfqzmxydxnlxqoj"

if [[ ! -d "$BACKUP_DIR" ]]; then
  echo "❌ No backups directory at $BACKUP_DIR — run ./backup-database.sh first."
  exit 1
fi

echo "Available backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null || { echo "  (none)"; exit 1; }
echo ""

read -rp "Enter backup filename to restore (e.g. backup_20260510_030000.tar.gz): " BACKUP_FILE
ARCHIVE="$BACKUP_DIR/$BACKUP_FILE"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "❌ Backup file not found: $ARCHIVE"
  exit 1
fi

echo ""
echo "Target project options:"
echo "  1) STAGING / new project (recommended for restore drills)"
echo "  2) PRODUCTION ($PROD_REF) — destructive, wipes current data"
read -rp "Choose 1 or 2: " CHOICE

case "$CHOICE" in
  1)
    read -rp "Enter target project ref: " TARGET_REF
    ;;
  2)
    echo ""
    echo "⚠️  ⚠️  ⚠️  PRODUCTION RESTORE  ⚠️  ⚠️  ⚠️"
    echo "This will OVERWRITE the AMOS production database."
    echo "All current rows in public.* will be replaced by the backup contents."
    read -rp 'Type the literal word PRODUCTION to confirm: ' CONFIRM
    if [[ "$CONFIRM" != "PRODUCTION" ]]; then
      echo "❌ Confirmation failed. Aborting."
      exit 1
    fi
    TARGET_REF="$PROD_REF"
    ;;
  *)
    echo "❌ Invalid choice. Aborting."
    exit 1
    ;;
esac

if [[ -f "$HOME/.inclufy-backup-secrets" ]]; then
  # shellcheck disable=SC1091
  source "$HOME/.inclufy-backup-secrets"
fi

# Pick the right password for the chosen target.
if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  if [[ "$TARGET_REF" == "$PROD_REF" && -n "${AMOS_DB_PASSWORD:-}" ]]; then
    SUPABASE_DB_PASSWORD="$AMOS_DB_PASSWORD"
  else
    echo "Need the Postgres password for project $TARGET_REF."
    echo "Find it in: Supabase Dashboard → Project Settings → Database → Connection string"
    read -srp "Password: " SUPABASE_DB_PASSWORD
    echo ""
  fi
fi

if [[ -x /Applications/Postgres.app/Contents/Versions/latest/bin/psql ]]; then
  export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
fi

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
echo "📂 Extracting backup to $WORK_DIR..."
tar -xzf "$ARCHIVE" -C "$WORK_DIR"

# Restore via psql against the target project. Pooler in session mode
# (port 5432) supports DDL + COPY which we need; transaction mode (6543)
# does not. Both AMOS and Finance live in eu-west-1.
POOLER_HOST="${SUPABASE_POOLER_HOST:-aws-1-eu-west-1.pooler.supabase.com}"
CONN_STRING="postgresql://postgres.${TARGET_REF}:${SUPABASE_DB_PASSWORD}@${POOLER_HOST}:5432/postgres"
echo "🔄 Restoring schema..."
psql "$CONN_STRING" -v ON_ERROR_STOP=0 -f "$WORK_DIR"/schema_*.sql
echo "🔄 Restoring data..."
psql "$CONN_STRING" -v ON_ERROR_STOP=0 -f "$WORK_DIR"/data_*.sql

echo "✅ Restore complete to project $TARGET_REF."
echo "$(date '+%Y-%m-%d %H:%M:%S')  AMOS  RESTORE → $TARGET_REF  $BACKUP_FILE" >> "$BACKUP_DIR/backup.log"
