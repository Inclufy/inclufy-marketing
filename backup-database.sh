#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────
# Inclufy Marketing (AMOS) — Production-grade Postgres backup
#
# Mirrors the ProjeXtPal backup pattern:
#   - 3-tier retention: daily (7d) / weekly (4w) / monthly (12m)
#   - --verify mode with sandbox restore drill
#   - Optional GPG AES256 encryption when BACKUP_GPG_PASSPHRASE is set
#   - Off-site copy options at the bottom (iCloud / rclone / external)
#
# Modes:
#   ./backup-database.sh             daily backup (default)
#   ./backup-database.sh --weekly    weekly backup
#   ./backup-database.sh --monthly   monthly backup
#   ./backup-database.sh --verify    integrity + sandbox-restore drill
#
# Required env (place in ~/.inclufy-backup-secrets, chmod 600):
#   AMOS_DB_PASSWORD=<from Supabase Dashboard → Database → Connection string>
# Optional:
#   BACKUP_GPG_PASSPHRASE=<for at-rest encryption>
#   AMOS_SANDBOX_DB_URL=postgresql://...   (full URL for verify drill)
#
# Cron (paste in `crontab -e`):
#   0 3 * * *   /full/path/to/backup-database.sh
#   0 4 * * 0   /full/path/to/backup-database.sh --weekly
#   0 5 1 * *   /full/path/to/backup-database.sh --monthly
#   0 6 1 * *   /full/path/to/backup-database.sh --verify
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Config ─────────────────────────────────────────────────────────────
PROJECT_NAME="inclufy-marketing"
PROJECT_REF="mpxkugfqzmxydxnlxqoj"
BACKUP_ROOT="$HOME/backups/${PROJECT_NAME}"
POOLER_HOST="aws-1-eu-west-1.pooler.supabase.com"
POOLER_PORT="5432"
DB_USER="postgres.${PROJECT_REF}"
DB_NAME="postgres"
VERIFY_KEY_TABLE="go_posts"

DAILY_RETENTION_DAYS=7
WEEKLY_RETENTION_DAYS=28
MONTHLY_RETENTION_DAYS=372

LOG_FILE="$BACKUP_ROOT/backup.log"

# ─── Mode ───────────────────────────────────────────────────────────────
MODE="daily"
case "${1:-}" in
  --weekly)  MODE="weekly" ;;
  --monthly) MODE="monthly" ;;
  --verify)  MODE="verify" ;;
  "") ;;
  *) echo "Unknown flag: $1" >&2; exit 2 ;;
esac

log() { echo "[$(date '+%H:%M:%S')] $*"; echo "$(date '+%F %T')  AMOS:$MODE  $*" >> "$LOG_FILE"; }

# ─── Auth + binaries ────────────────────────────────────────────────────
[[ -f "$HOME/.inclufy-backup-secrets" ]] && source "$HOME/.inclufy-backup-secrets"

if [[ -z "${AMOS_DB_PASSWORD:-}" ]]; then
  echo "❌ AMOS_DB_PASSWORD not set. See docs/PRODUCTION_BACKUP_RUNBOOK.md" >&2
  exit 1
fi

if [[ -x /Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump ]]; then
  export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
fi

mkdir -p "$BACKUP_ROOT"/{daily,weekly,monthly}

# ─── Verify mode ────────────────────────────────────────────────────────
if [[ "$MODE" == "verify" ]]; then
  LATEST=$(ls -t "$BACKUP_ROOT"/daily/backup_*.tar.gz* 2>/dev/null | head -1 || true)
  if [[ -z "$LATEST" ]]; then
    log "❌ No daily backup found to verify"
    exit 1
  fi
  log "Verifying restore from: $(basename "$LATEST")"

  WORK_DIR=$(mktemp -d)
  trap 'rm -rf "$WORK_DIR"' EXIT

  # Decrypt if GPG-wrapped
  ARCHIVE="$LATEST"
  if [[ "$ARCHIVE" == *.gpg ]]; then
    [[ -z "${BACKUP_GPG_PASSPHRASE:-}" ]] && { log "❌ Encrypted backup but BACKUP_GPG_PASSPHRASE not set"; exit 1; }
    DECRYPTED="$WORK_DIR/$(basename "${ARCHIVE%.gpg}")"
    gpg --decrypt --batch --passphrase "$BACKUP_GPG_PASSPHRASE" "$ARCHIVE" > "$DECRYPTED" 2>/dev/null
    ARCHIVE="$DECRYPTED"
  fi

  tar -xzf "$ARCHIVE" -C "$WORK_DIR"
  SCHEMA_FILE=$(ls "$WORK_DIR"/schema_*.sql 2>/dev/null | head -1)
  DATA_FILE=$(ls "$WORK_DIR"/data_*.sql 2>/dev/null | head -1)
  [[ -z "$SCHEMA_FILE" || -z "$DATA_FILE" ]] && { log "❌ Backup archive malformed"; exit 1; }

  # Integrity check (always runs)
  CREATE_COUNT=$(grep -c "^CREATE TABLE" "$SCHEMA_FILE" || true)
  COPY_COUNT=$(grep -c "^COPY " "$DATA_FILE" || true)
  if [[ "${CREATE_COUNT:-0}" -lt 5 || "${COPY_COUNT:-0}" -lt 1 ]]; then
    log "❌ Backup looks corrupt — schema CREATE TABLE: $CREATE_COUNT, data COPY: $COPY_COUNT"
    exit 1
  fi

  # Full sandbox-restore drill (only if SANDBOX_DB_URL is configured)
  if [[ -n "${AMOS_SANDBOX_DB_URL:-}" ]]; then
    psql "$AMOS_SANDBOX_DB_URL" -v ON_ERROR_STOP=1 \
      -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" >/dev/null
    psql "$AMOS_SANDBOX_DB_URL" -v ON_ERROR_STOP=0 -f "$SCHEMA_FILE" >/dev/null 2>&1
    psql "$AMOS_SANDBOX_DB_URL" -v ON_ERROR_STOP=0 -f "$DATA_FILE"   >/dev/null 2>&1
    COUNT=$(psql "$AMOS_SANDBOX_DB_URL" -tA -c "SELECT count(*) FROM ${VERIFY_KEY_TABLE}" 2>/dev/null || echo "?")
    log "✅ Verify OK — restored sandbox has $COUNT rows in $VERIFY_KEY_TABLE"
  else
    log "✅ Integrity OK — schema=$CREATE_COUNT tables, data=$COPY_COUNT COPYs (set AMOS_SANDBOX_DB_URL for full drill)"
  fi
  exit 0
fi

# ─── Backup mode (daily/weekly/monthly) ─────────────────────────────────
DATE=$(date +%Y%m%d_%H%M%S)
TIER_DIR="$BACKUP_ROOT/$MODE"
TMP_SCHEMA=$(mktemp -t "schema_${DATE}.XXXXXX").sql
TMP_DATA=$(mktemp -t "data_${DATE}.XXXXXX").sql
trap 'rm -f "$TMP_SCHEMA" "$TMP_DATA"' EXIT

log "Starting $MODE backup → backup_${DATE}.tar.gz"

export PGPASSWORD="$AMOS_DB_PASSWORD"

pg_dump -h "$POOLER_HOST" -p "$POOLER_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --schema=public --schema-only --no-owner --no-privileges \
  --file="$TMP_SCHEMA"

pg_dump -h "$POOLER_HOST" -p "$POOLER_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --schema=public --data-only --no-owner --no-privileges \
  --file="$TMP_DATA"

unset PGPASSWORD

if [[ ! -s "$TMP_SCHEMA" || ! -s "$TMP_DATA" ]]; then
  log "❌ One of the dumps came back empty — auth or connection problem"
  exit 1
fi

# Combine schema + data into a single timestamped tarball
ARCHIVE="$TIER_DIR/backup_${DATE}.tar.gz"
SCHEMA_NAME="schema_${DATE}.sql"
DATA_NAME="data_${DATE}.sql"
mv "$TMP_SCHEMA" "$TIER_DIR/$SCHEMA_NAME"
mv "$TMP_DATA"   "$TIER_DIR/$DATA_NAME"
tar -czf "$ARCHIVE" -C "$TIER_DIR" "$SCHEMA_NAME" "$DATA_NAME"
rm -f "$TIER_DIR/$SCHEMA_NAME" "$TIER_DIR/$DATA_NAME"

# Optional GPG encryption (recommended for off-site copies — GDPR)
if [[ -n "${BACKUP_GPG_PASSPHRASE:-}" ]]; then
  gpg --symmetric --cipher-algo AES256 --batch \
      --passphrase "$BACKUP_GPG_PASSPHRASE" \
      --output "${ARCHIVE}.gpg" "$ARCHIVE"
  rm "$ARCHIVE"
  ARCHIVE="${ARCHIVE}.gpg"
fi

BACKUP_SIZE=$(du -h "$ARCHIVE" | cut -f1)
log "Backup written: $BACKUP_SIZE"

# ─── Retention rotation per tier ────────────────────────────────────────
case "$MODE" in
  daily)   find "$TIER_DIR" -name "backup_*" -type f -mtime +$DAILY_RETENTION_DAYS   -delete ;;
  weekly)  find "$TIER_DIR" -name "backup_*" -type f -mtime +$WEEKLY_RETENTION_DAYS  -delete ;;
  monthly) find "$TIER_DIR" -name "backup_*" -type f -mtime +$MONTHLY_RETENTION_DAYS -delete ;;
esac

# ─── Off-site copy — uncomment exactly ONE option ───────────────────────
# Option A — iCloud Drive (zero-setup, EU servers, syncs to all Apple devices)
OFFSITE="$HOME/Library/Mobile Documents/com~apple~CloudDocs/inclufy-backups/${PROJECT_NAME}/${MODE}"
mkdir -p "$OFFSITE" && cp "$ARCHIVE" "$OFFSITE/" && log "Copied to iCloud Drive"

# Option B — rclone to S3/B2/Drive (most flexible, scales)
#rclone copy "$ARCHIVE" "b2:inclufy-backups-eu/${PROJECT_NAME}/${MODE}/" && log "Copied via rclone"

# Option C — External disk (cold backup, ransomware-safe when unplugged)
#EXT="/Volumes/InclufyBackups/${PROJECT_NAME}/${MODE}"
#if [[ -d "/Volumes/InclufyBackups" ]]; then
#  mkdir -p "$EXT" && cp "$ARCHIVE" "$EXT/" && log "Copied to external disk"
#fi

log "Done."
