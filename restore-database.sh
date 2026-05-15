#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────
# Inclufy Marketing (AMOS) — Production-grade Postgres restore
#
# Always takes a "pre-restore safety dump" of the TARGET database before
# overwriting, so you can roll back even if the restore goes wrong. The
# safety dump goes into ~/backups/inclufy-marketing/pre-restore/ with the
# timestamp of the restore attempt.
#
# Production restore demands typing the literal word PRODUCTION as
# confirmation. This is intentional friction.
#
# Usage:
#   ./restore-database.sh
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_NAME="inclufy-marketing"
PROD_REF="mpxkugfqzmxydxnlxqoj"
BACKUP_ROOT="$HOME/backups/${PROJECT_NAME}"
POOLER_HOST="aws-1-eu-west-1.pooler.supabase.com"

[[ -f "$HOME/.inclufy-backup-secrets" ]] && source "$HOME/.inclufy-backup-secrets"
if [[ -x /Applications/Postgres.app/Contents/Versions/latest/bin/psql ]]; then
  export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
fi

if [[ ! -d "$BACKUP_ROOT" ]]; then
  echo "❌ No backups directory at $BACKUP_ROOT — run ./backup-database.sh first."
  exit 1
fi

# ─── CLI flag: --target-ref <ref> ───────────────────────────────────────
# Lets you skip the interactive STAGING/PRODUCTION prompt and aim directly
# at any project ref. Useful for full-project-wipe disaster recovery into
# a brand-new project ref. Pass the password via env: SUPABASE_DB_PASSWORD.
CLI_TARGET_REF=""
CLI_ARCHIVE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-ref) CLI_TARGET_REF="$2"; shift 2 ;;
    --archive)    CLI_ARCHIVE="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--target-ref <project_ref>] [--archive <path>]"
      echo "  Interactive mode if no flags given."
      exit 0 ;;
    *) echo "Unknown flag: $1"; exit 2 ;;
  esac
done

# ─── Step 1: pick a backup ──────────────────────────────────────────────
if [[ -n "$CLI_ARCHIVE" ]]; then
  ARCHIVE="$CLI_ARCHIVE"
else
  echo "Available backups:"
  echo ""
  for tier in daily weekly monthly; do
    echo "  $tier/"
    ls -lh "$BACKUP_ROOT/$tier"/backup_*.tar.gz* 2>/dev/null | awk '{ printf "    %s  %s  %s\n", $5, $9, $6" "$7" "$8 }' || echo "    (none)"
  done
  echo ""
  read -rp "Enter full path of backup to restore: " ARCHIVE
fi
[[ ! -f "$ARCHIVE" ]] && { echo "❌ File not found: $ARCHIVE"; exit 1; }

# ─── Step 2: pick target ────────────────────────────────────────────────
if [[ -n "$CLI_TARGET_REF" ]]; then
  TARGET_REF="$CLI_TARGET_REF"
  TARGET_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
  if [[ "$TARGET_REF" == "$PROD_REF" ]]; then
    echo "⚠️  --target-ref points at PRODUCTION ($PROD_REF). Type PRODUCTION to confirm."
    read -rp '> ' CONFIRM
    [[ "$CONFIRM" != "PRODUCTION" ]] && { echo "❌ Confirmation failed."; exit 1; }
    TARGET_PASSWORD="${AMOS_DB_PASSWORD:-$TARGET_PASSWORD}"
  fi
else
  echo ""
  echo "Target project options:"
  echo "  1) STAGING / new project (recommended for restore drills)"
  echo "  2) PRODUCTION ($PROD_REF) — destructive, wipes current data"
  read -rp "Choose 1 or 2: " CHOICE

  case "$CHOICE" in
    1)
      read -rp "Enter target project ref: " TARGET_REF
      TARGET_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
      ;;
    2)
      echo ""
      echo "⚠️  ⚠️  ⚠️  PRODUCTION RESTORE  ⚠️  ⚠️  ⚠️"
      echo "This will OVERWRITE the AMOS production database."
      echo "A pre-restore safety dump will be taken first — but if that fails,"
      echo "the restore will be aborted."
      read -rp 'Type the literal word PRODUCTION to confirm: ' CONFIRM
      [[ "$CONFIRM" != "PRODUCTION" ]] && { echo "❌ Confirmation failed."; exit 1; }
      TARGET_REF="$PROD_REF"
      TARGET_PASSWORD="${AMOS_DB_PASSWORD:-}"
      ;;
    *) echo "❌ Invalid choice."; exit 1 ;;
  esac
fi

if [[ -z "$TARGET_PASSWORD" ]]; then
  echo "Postgres password for project $TARGET_REF (Dashboard → Settings → Database):"
  read -srp "Password: " TARGET_PASSWORD
  echo ""
fi

CONN="postgresql://postgres.${TARGET_REF}:${TARGET_PASSWORD}@${POOLER_HOST}:5432/postgres"

# ─── Step 3: pre-restore safety dump ────────────────────────────────────
SAFETY_DIR="$BACKUP_ROOT/pre-restore"
mkdir -p "$SAFETY_DIR"
SAFETY_FILE="$SAFETY_DIR/pre_restore_${TARGET_REF}_$(date +%Y%m%d_%H%M%S).sql.gz"

echo "🛟 Taking pre-restore safety dump of $TARGET_REF..."
PGPASSWORD="$TARGET_PASSWORD" pg_dump \
  -h "$POOLER_HOST" -p 5432 -U "postgres.${TARGET_REF}" -d postgres \
  --schema=public --no-owner --no-privileges \
  | gzip > "$SAFETY_FILE"
SAFETY_SIZE=$(du -h "$SAFETY_FILE" | cut -f1)
if [[ ! -s "$SAFETY_FILE" ]]; then
  echo "❌ Safety dump came back empty — aborting restore. Don't risk it."
  exit 1
fi
echo "   Saved $SAFETY_SIZE → $SAFETY_FILE"
echo "   To roll back: gunzip -c '$SAFETY_FILE' | psql '<conn>'"

# ─── Step 4: extract + decrypt ──────────────────────────────────────────
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

EXTRACT_FROM="$ARCHIVE"
if [[ "$ARCHIVE" == *.gpg ]]; then
  [[ -z "${BACKUP_GPG_PASSPHRASE:-}" ]] && {
    read -srp "Encrypted backup. GPG passphrase: " BACKUP_GPG_PASSPHRASE
    echo ""
  }
  EXTRACT_FROM="$WORK_DIR/$(basename "${ARCHIVE%.gpg}")"
  gpg --decrypt --batch --passphrase "$BACKUP_GPG_PASSPHRASE" "$ARCHIVE" > "$EXTRACT_FROM"
fi

tar -xzf "$EXTRACT_FROM" -C "$WORK_DIR"
SCHEMA_FILE=$(ls "$WORK_DIR"/schema_*.sql)
DATA_FILE=$(ls "$WORK_DIR"/data_*.sql)

# ─── Step 5: restore (drop+recreate public, then schema, then data) ────
echo "🔄 Wiping public schema on $TARGET_REF..."
psql "$CONN" -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;" >/dev/null

echo "🔄 Restoring schema..."
psql "$CONN" -v ON_ERROR_STOP=0 -q -f "$SCHEMA_FILE" 2>&1 | tail -5

echo "🔄 Restoring data..."
psql "$CONN" -v ON_ERROR_STOP=0 -q -f "$DATA_FILE" 2>&1 | tail -5

echo "✅ Restore complete to $TARGET_REF."
echo "   Pre-restore safety dump retained at: $SAFETY_FILE"
echo "$(date '+%F %T')  AMOS  RESTORE → $TARGET_REF  $(basename "$ARCHIVE")  safety=$SAFETY_FILE" >> "$BACKUP_ROOT/backup.log"
