# Database Backup Setup — Inclufy Marketing (AMOS) + AI Finance

Volgt het ProjeXtPal-patroon: één bash-script per project, lokaal `pg_dump`,
gzipped tarball in `~/backups/...`, retention via `find -mtime +30 -delete`.
Geen Docker nodig (gebruikt de Postgres.app `pg_dump`).

## 2-minute setup (one-time)

### 1. Get the database passwords from Supabase Dashboard

Open elke project apart:

| Project | Dashboard URL |
|---|---|
| AMOS | https://supabase.com/dashboard/project/mpxkugfqzmxydxnlxqoj/settings/database |
| Finance | https://supabase.com/dashboard/project/nruqfegrngpzoigflexn/settings/database |

Onder **Connection string** → klik op **Show password** → copy.

### 2. Save passwords in a single secrets file

```bash
cat > ~/.inclufy-backup-secrets <<'EOF'
AMOS_DB_PASSWORD=<paste-amos-password-here>
FINANCE_DB_PASSWORD=<paste-finance-password-here>
EOF
chmod 600 ~/.inclufy-backup-secrets
```

`chmod 600` = alleen jij kan het lezen. Bestand staat OUTSIDE van beide
git-repos dus geen risico op per ongeluk committen.

### 3. First backup run (test)

```bash
cd "/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main"
./backup-database.sh

cd "/Users/samiloukile/Dropbox/Inclufy Finance/inclufy-finance"
./backup-database.sh
```

Verwachte output per script:
```
📦 [AMOS] Starting backup: 20260510_180000
✅ Backup complete: 12M — /Users/samiloukile/backups/inclufy-marketing/backup_20260510_180000.tar.gz
🧹 Cleaned old backups (>30 days)
```

### 4. Schedule daily auto-backup via cron

```bash
crontab -e
```

Voeg toe (AMOS om 03:00, Finance om 03:30 — verspringen om resource-piek te
vermijden):

```
0 3 * * * cd "/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main" && ./backup-database.sh >> $HOME/backups/inclufy-marketing/cron.log 2>&1
30 3 * * * cd "/Users/samiloukile/Dropbox/Inclufy Finance/inclufy-finance" && ./backup-database.sh >> $HOME/backups/inclufy-finance/cron.log 2>&1
```

Save + close. Check `crontab -l` om te bevestigen.

⚠️ **macOS specifiek**: cron heeft Full Disk Access nodig.
System Settings → Privacy & Security → Full Disk Access → `+` → typ Cmd+Shift+G
→ `/usr/sbin/cron` → toevoegen.

### 5. Verify cron triggers correctly the next morning

```bash
ls -la ~/backups/inclufy-marketing/
cat ~/backups/inclufy-marketing/backup.log
```

Je moet een nieuwe `backup_YYYYMMDD_030000.tar.gz` zien.

## Restore

```bash
cd "/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main"
./restore-database.sh
```

Het script:
1. Lijst alle beschikbare backups
2. Vraagt welke je wil restoren
3. Vraagt welk **doel-project** (staging of PRODUCTION)
4. Voor production: vraagt om letterlijk `PRODUCTION` te typen als bevestiging
5. Pipet `psql` op het doel-project

Voor restore-drills (recommended monthly): kies een **lege staging** Supabase
project en restore daarheen. Test dan dat een paar kritische queries
correct draaien (bv. `select count(*) from go_posts`). Dat is het bewijs
dat je backup gezond is — een backup zonder geteste restore is geen backup.

## What's in a backup

Elke `backup_YYYYMMDD_HHMMSS.tar.gz` bevat:
- `schema_*.sql` — alle tables, views, indexes, RLS policies, functions in
  schema `public`. ~50–200KB.
- `data_*.sql` — alle rows van schema `public`, via `COPY` (compact).
  Grootte schaalt met data-volume.

Wat **niet** wordt geback-upt:
- Storage bucket bestanden (media-uploads). Supabase managed dit zelf met
  hun eigen retention. Voor extra zekerheid: aparte rclone/aws-s3 sync
  vanuit de Storage API.
- `auth.users` (auth schema). Sits in een aparte schema die de Supabase
  CLI standaard niet exporteert via pooler — wel restoreable via Supabase
  Dashboard's eigen daily backups (Pro tier, 7-dagen retention).
- Supabase-managed configuratie: secrets, edge function code (in git
  bewaard), DNS records (Cloudflare).

## Hardening voor productie (optioneel — niet ProjeXtPal-niveau)

Het ProjeXtPal-patroon dekt **niveau 1+2** (daily backup + retention). Voor
GDPR-grade productie zou je extra willen:

| Niveau | Hoe |
|---|---|
| 3. Off-site copy | `rclone copy ~/backups/inclufy-marketing/ b2:inclufy-backups-eu/marketing/` (Backblaze B2 Frankfurt, ~$0.005/GB/mo) of S3 EU. Achter cron-job na de backup. |
| 4. Restore drill | Maandelijkse cron: trekt nieuwste backup, restoret naar staging-project, runt 3 sanity-queries, mailt resultaat naar `support@inclufy.com`. |
| 5. Encryption at rest | `gpg --symmetric --cipher-algo AES256 backup.tar.gz` met passphrase in 1Password. Maakt off-site copy in Backblaze meteen GDPR-compliant qua "passende technische maatregelen". |

Niet vandaag bouwen — eerst de basis draaien, dan zie je wat je echt nodig
hebt voor de schaal van data en risk-tolerance van je klant.

## Backup Pro-tier (Supabase parallel)

Niveau 1+2 wordt OOK al gedaan door Supabase Pro automatisch:
- Daily backup, 7 dagen retention, gratis bij Pro-tier
- Optioneel: PITR-addon voor point-in-time recovery tot 28 dagen terug,
  ~$100/mnd per project

Je hebt dus straks **drie parallelle bronnen**: Supabase auto, jouw
lokale tarball, en (als je niveau 3 toevoegt) off-site copy. Als de demo
morgen iets eet, heb je 3 ringen verdediging.
