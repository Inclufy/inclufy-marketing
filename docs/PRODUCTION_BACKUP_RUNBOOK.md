# Production Backup Runbook — Inclufy AMOS + Finance

Production-grade backup system for both Supabase managed databases. Mirrors
the ProjeXtPal pattern: 3-tier rotation, sandbox-restore drill, optional
GPG-AES256 encryption, and three off-site copy options.

**Last reviewed:** 2026-05-10

---

## Strategy

| Tier | Schedule | Retention | Purpose |
|---|---|---|---|
| **Daily** | Every day 03:00 (AMOS) / 03:30 (Finance) | 7 days | Recover from "I deleted the wrong row this morning" |
| **Weekly** | Sunday 04:00 / 04:30 | 4 weeks | Recover from "we noticed something broke 3 weeks ago" |
| **Monthly** | 1st of month 05:00 / 05:30 | 12 months | GDPR compliance + long-tail audit |
| **Verify** | 1st of month 06:00 / 06:30 | n/a | Drill: "is the latest daily backup actually restoreable?" |

Retention is per-tier — daily files live in `daily/`, weekly in `weekly/`,
monthly in `monthly/`. A daily file aging past 7 days is deleted, but the
weekly that was made the same week stays for 28 days, etc.

## What gets backed up

Each archive `backup_YYYYMMDD_HHMMSS.tar.gz` (optionally `.gpg`) contains:
- `schema_<ts>.sql` — all tables, views, indexes, RLS policies, triggers,
  functions in schema `public`. Captures the structural state of your DB.
- `data_<ts>.sql` — every row in `public.*`, dumped via `COPY` for speed.

What is **not** captured (and why it's OK):

| Not in backup | Why it's still safe |
|---|---|
| Storage bucket files (media, invoices PDFs) | Supabase manages these in S3 with their own retention. For belt-and-braces add a separate `rclone` of the Storage API. |
| `auth.users` schema | Pooler can't dump auth schema. Supabase Pro covers this with their own daily backups (7d retention free). |
| Edge function code | Lives in git, redeployable. |
| Secrets / DNS | Lives in Supabase Dashboard / Cloudflare. |

## 2-minute setup (one-time)

### 1. Get the database passwords

| Project | Where |
|---|---|
| AMOS | https://supabase.com/dashboard/project/mpxkugfqzmxydxnlxqoj/settings/database |
| Finance | https://supabase.com/dashboard/project/nruqfegrngpzoigflexn/settings/database |

Click **Show password** under Connection string, copy.

### 2. Save secrets

```bash
cat > ~/.inclufy-backup-secrets <<'EOF'
AMOS_DB_PASSWORD=<paste>
FINANCE_DB_PASSWORD=<paste>

# Optional — turn on for at-rest encryption (recommended for off-site)
# BACKUP_GPG_PASSPHRASE=<long-random-string>

# Optional — sandbox project for full --verify restore drills
# AMOS_SANDBOX_DB_URL=postgresql://postgres.xxxxxxxx:pass@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
# FINANCE_SANDBOX_DB_URL=postgresql://...
EOF
chmod 600 ~/.inclufy-backup-secrets
```

`~/.inclufy-backup-secrets` is outside both git repos — no risk of
committing it.

### 3. First run — prove it works

```bash
cd "/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main"
./backup-database.sh
./backup-database.sh --verify

cd "/Users/samiloukile/Dropbox/Inclufy Finance/inclufy-finance"
./backup-database.sh
./backup-database.sh --verify
```

Expected:
```
[03:00:00] Starting daily backup → backup_20260510_030000.tar.gz
[03:00:14] Backup written: 12M
[03:00:14] Done.

[06:00:00] Verifying restore from: backup_20260510_030000.tar.gz
[06:00:01] ✅ Integrity OK — schema=42 tables, data=38 COPYs
```

### 4. Install cron — 30 seconds

```bash
crontab -e
```

Press `i` for insert mode. Paste:

```cron
# Inclufy AMOS — Postgres backups
0 3 * * *   /Users/samiloukile/Dropbox/Inclufy\ Marketing/Inclufy\ Marketing-main/backup-database.sh
0 4 * * 0   /Users/samiloukile/Dropbox/Inclufy\ Marketing/Inclufy\ Marketing-main/backup-database.sh --weekly
0 5 1 * *   /Users/samiloukile/Dropbox/Inclufy\ Marketing/Inclufy\ Marketing-main/backup-database.sh --monthly
0 6 1 * *   /Users/samiloukile/Dropbox/Inclufy\ Marketing/Inclufy\ Marketing-main/backup-database.sh --verify

# Inclufy Finance — Postgres backups (30 min later to spread load)
30 3 * * *  /Users/samiloukile/Dropbox/Inclufy\ Finance/inclufy-finance/backup-database.sh
30 4 * * 0  /Users/samiloukile/Dropbox/Inclufy\ Finance/inclufy-finance/backup-database.sh --weekly
30 5 1 * *  /Users/samiloukile/Dropbox/Inclufy\ Finance/inclufy-finance/backup-database.sh --monthly
30 6 1 * *  /Users/samiloukile/Dropbox/Inclufy\ Finance/inclufy-finance/backup-database.sh --verify
```

Press `Esc`, type `:wq`, Enter. Verify:
```bash
crontab -l
```

⚠️ **macOS Full Disk Access**: System Settings → Privacy & Security →
Full Disk Access → `+` → `Cmd+Shift+G` → `/usr/sbin/cron` → add. Without
this, cron jobs may silently fail on protected paths.

### 5. Activate off-site copy — 1 min

Edit either `backup-database.sh` (look near the bottom for "Off-site copy")
and uncomment exactly **ONE** option. Run again to test:

```bash
./backup-database.sh
ls -lh ~/Library/Mobile\ Documents/com~apple~CloudDocs/inclufy-backups/  # if A
```

| Option | Setup | Best for |
|---|---|---|
| **A. iCloud Drive** | 0 setup — Apple already syncs | EU servers, auto multi-device |
| **B. rclone** | `brew install rclone && rclone config` | S3 / B2 / multiple destinations |
| **C. External disk** | Plug in `/Volumes/InclufyBackups` | Cold storage, ransomware-immune unplugged |

**Recommended for live klant:** Option A first (immediate), add Option B
within a week (true geo-redundancy).

---

## Restore runbook

### When NOT to restore immediately

If you suspect data loss, **stop and think before restoring**. Restore is
destructive — it overwrites whatever is currently there. Decision tree:

```
Data looks wrong/missing?
  │
  ├── Is anyone still writing to the DB right now?
  │     ├── YES → STOP writes first. A live restore loses concurrent edits.
  │     │        Disable the app or revoke service-role keys before restore.
  │     └── NO  → continue
  │
  ├── Could it be RLS / a query bug, not actual data loss?
  │     ├── YES → check via service-role; data is probably fine.
  │     └── NO  → continue
  │
  ├── Was the change in the last 28 days?
  │     ├── YES → use Supabase Pro PITR if available (cleaner, second-precision)
  │     └── NO  → continue with our backup
  │
  └── Pick the most recent backup BEFORE the data loss event.
       Restore to a STAGING project first, verify the data is what you expect,
       THEN restore to production with the safety dump.
```

### Restore procedure

```bash
cd "/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main"  # or finance
./restore-database.sh
```

The script:
1. Lists all archives across daily/weekly/monthly tiers
2. Asks which one to restore
3. Asks STAGING (default) or PRODUCTION (requires typing literal `PRODUCTION`)
4. **Takes a pre-restore safety dump** of the TARGET database first
   (saved to `~/backups/<project>/pre-restore/`)
5. Drops + recreates `public` schema on the target
6. Restores schema, then data
7. Logs the operation with the safety-dump path so you can roll back

### Rolling back a restore

If the restore was a bad idea:

```bash
# Find the safety dump
ls -lt ~/backups/inclufy-marketing/pre-restore/

# Restore from it
gunzip -c ~/backups/inclufy-marketing/pre-restore/pre_restore_xxx.sql.gz \
  | psql "postgresql://postgres.<ref>:<pw>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

The pre-restore dumps are kept indefinitely (no auto-deletion) because
they may be the only copy of state captured at a critical moment.

---

## Daily status check

Run any morning to see what backups exist:

```bash
echo "=== AMOS ==="
ls -lh ~/backups/inclufy-marketing/daily/ | tail -7
tail -10 ~/backups/inclufy-marketing/backup.log
echo ""
echo "=== Finance ==="
ls -lh ~/backups/inclufy-finance/daily/ | tail -7
tail -10 ~/backups/inclufy-finance/backup.log
```

Healthy output:
- 7 daily archives, growing in age
- Each `[HH:MM:SS] Backup written` followed by `[HH:MM:SS] Done.`
- Verify entries on the 1st of every month showing `Verify OK`

Unhealthy signs:
- Gap of >1 day in backup.log → cron isn't running (Full Disk Access?)
- "❌ One of the dumps came back empty" → password rotated, update `.inclufy-backup-secrets`
- Verify shows `❌ Backup looks corrupt` → STOP using new backups, investigate before more cron runs

---

## GDPR notes

For EU customer data (Finance especially):

| Requirement | How |
|---|---|
| Data minimization | Backups contain only `public.*`. Auth + Storage handled by Supabase managed (covered by their DPA). |
| Encryption at rest | Set `BACKUP_GPG_PASSPHRASE` in secrets file. Local `.tar.gz` becomes `.tar.gz.gpg` (AES256). Mandatory if using Option B/C off-site. |
| Encryption in transit | All `pg_dump` runs against the pooler over TLS by default (Supabase enforces). |
| Geographic location | Both Supabase projects in `aws-1-eu-west-1` (Ireland). iCloud / Backblaze B2 EU also EU. |
| Right-to-erasure | When deleting a user, ALSO note the request — restore drills against month-old backups will resurrect them. Document a "post-restore re-erasure" task. |
| Retention limit | 12 months max via monthly tier. Anything older auto-deleted. |
| Audit trail | `backup.log` records every operation timestamped. Safe-restore dumps preserved per restore event. |

---

## File locations

| Path | Contents |
|---|---|
| `~/.inclufy-backup-secrets` | All passwords + optional GPG passphrase + sandbox URLs |
| `~/backups/inclufy-marketing/{daily,weekly,monthly}/` | AMOS archives |
| `~/backups/inclufy-marketing/pre-restore/` | Safety dumps before each restore |
| `~/backups/inclufy-marketing/backup.log` | Append-only audit log |
| `~/backups/inclufy-finance/...` | Finance, same layout |
| `<repo>/backup-database.sh` | Backup script in each repo |
| `<repo>/restore-database.sh` | Restore script in each repo |

## Disaster scenarios + recovery time

| Scenario | RPO | RTO | How |
|---|---|---|---|
| Accidental DELETE on one row | 24h | 5 min | Latest daily restore to staging, copy the row back manually |
| Bad migration corrupted schema | 24h | 10 min | Daily restore to production with safety-dump fallback |
| Mac Studio dies | 7d | 30 min | Restore from iCloud / B2 / external disk to new Mac, then restore latest tier to staging Supabase |
| Supabase project deleted accidentally | 24h | 1h | Create new Supabase project, restore latest daily tarball |
| Ransomware on Mac | 0–7d | 1h | Tarballs in iCloud / B2 are GPG-encrypted; cold-disk option is air-gapped |
| Whole data center loss | 24h | 2h | Off-site copy → spin up new Supabase EU project → full restore |

## What's NOT in the runbook (deferred)

- **Multi-region replica** — overkill for current scale, ~$200/mnd add-on
- **Per-table point-in-time** — Supabase Pro PITR addon does this, ~$100/mnd
- **Auto-rotation of secrets** — manual quarterly via Dashboard for now
- **Backup-from-replica** — Supabase doesn't expose read-replica creds yet
