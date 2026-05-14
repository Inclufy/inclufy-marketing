# Backup Readiness Audit — 2026-05-14 (Pre-Demo)

Audited: 2026-05-14 21:49 local. Read-only. No backups taken, no cron modified, secrets not altered.

---

## 1. Backup Integrity

### AMOS Marketing (mpxkugfqzmxydxnlxqoj)

| Check | Result |
|---|---|
| Latest daily | `backup_20260514_030001.tar.gz` — 13 MB — timestamped 03:00 today |
| Archive contents | `schema_20260514_030001.sql` + `data_20260514_030001.sql` present |
| `--verify` output | PASS — 260 CREATE TABLEs, 260 COPYs |
| iCloud off-site | `~/Library/Mobile Documents/com~apple~CloudDocs/inclufy-backups/inclufy-marketing/daily/backup_20260514_030001.tar.gz` — 13 MB present |

Previous dailies on disk: 2026-05-10 (x2), 2026-05-11, 2026-05-14. Weekly/monthly tiers not yet populated (first weekly fires Sunday, first monthly fires 2026-06-01 — expected).

### AI Finance (nruqfegrngpzoigflexn)

| Check | Result |
|---|---|
| Latest daily | `backup_20260514_033001.tar.gz` — 49 MB — timestamped 03:30 today |
| Archive contents | `schema_20260514_033001.sql` + `data_20260514_033001.sql` present |
| `--verify` output | PASS — 155 CREATE TABLEs, 155 COPYs |
| iCloud off-site | `~/Library/Mobile Documents/com~apple~CloudDocs/inclufy-backups/inclufy-finance/daily/backup_20260514_033001.tar.gz` — 49 MB present |

Finance latest archive grew from 40 MB (May 10) to 49 MB (today) — 22% growth in 4 days. Monitor; at this rate the Finance daily will exceed 100 MB within ~2 weeks.

---

## 2. Restore-Ability Dry-Check

| Check | Result |
|---|---|
| `AMOS_DB_PASSWORD` in secrets | Present — length 14 — not a placeholder |
| `FINANCE_DB_PASSWORD` in secrets | Present — length 21 — not a placeholder |
| `~/.inclufy-backup-secrets` permissions | 600 (owner read/write only) |
| Pooler `aws-0-eu-west-1.pooler.supabase.com:5432` | TCP OPEN |
| Pooler `aws-1-eu-west-1.pooler.supabase.com:5432` | TCP OPEN |
| AMOS restore script production-confirmation gate | Requires typing literal `PRODUCTION` at prompt; aborts on mismatch; takes pre-restore safety dump before any destructive step |
| Finance restore script production-confirmation gate | Same pattern — identical safety gate |

Both restore scripts abort if the pre-restore safety dump comes back empty, preventing a blind overwrite.

---

## 3. Cron Readiness

Crontab shows exactly 8 entries — 4 AMOS + 4 Finance:

```
0  3  * * *   backup-database.sh              # AMOS daily
0  4  * * 0   backup-database.sh --weekly     # AMOS weekly (Sunday)
0  5  1 * *   backup-database.sh --monthly    # AMOS monthly (1st)
0  6  1 * *   backup-database.sh --verify     # AMOS monthly verify
30 3  * * *   finance/backup-database.sh      # Finance daily
30 4  * * 0   finance/backup-database.sh --weekly
30 5  1 * *   finance/backup-database.sh --monthly
30 6  1 * *   finance/backup-database.sh --verify
```

Full Disk Access for `/usr/sbin/cron`: the binary has NO `com.apple.macl` extended attribute. The `ls -la@` output showed no xattr lines at all. This is the expected appearance for a system binary — FDA is granted to the cron daemon via the TCC database, not via xattr on the binary itself. STATUS: UNVERIFIED. The cron entries fired successfully at 03:00 and 03:30 this morning (confirmed by the backup timestamps), which is strong evidence FDA is granted. However, it cannot be confirmed purely from file metadata. If tomorrow morning's 03:00 run produces a fresh archive, FDA is confirmed.

---

## 4. Disaster Scenarios

| Scenario | Rating | Notes |
|---|---|---|
| Mac Studio dies tonight — restore on new Mac from iCloud | READY | Both latest dailies are in iCloud Drive. New Mac needs: `supabase` CLI, Postgres `psql`, secrets re-entered. Scripts are self-contained in repo (cloneable from GitHub). Estimated RTO ~45 min. |
| Sami accidentally deletes a critical row during demo — restore latest daily to staging | READY | Restore script offers staging target (option 1). Latest daily is from 03:00 this morning. RPO = up to ~21 hours of data. For a demo database this is acceptable. |
| Supabase project gets wiped — restore daily into new project | DEGRADED | Restore script is parameterised for the known project refs. Restoring into a brand-new project ref requires editing the `TARGET_REF` variable manually before running. Not documented in the script. Gap: add a `--target-ref` CLI flag or document the manual step in the runbook. |

---

## 5. Pre-Demo Readiness Signal

Demo-ready from a backup/recovery perspective — the one gap to close before going to production at scale is adding a `--target-ref` override to the restore scripts so a full-project-wipe recovery does not require manual script editing under pressure.
