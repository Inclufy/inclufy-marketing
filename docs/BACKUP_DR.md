# Backup & Disaster Recovery Plan — Inclufy

## Data Storage
| Project | Database | Storage | Backups |
|---|---|---|---|
| Marketing Web/Mobile | Supabase (AWS EU) | Supabase Storage | Daily automated (Supabase Pro) |
| Inclufy Finance | Supabase (AWS EU) | Supabase Storage | Daily automated |
| Inclufy Ignite | PostgreSQL (self-hosted) | Django media | Manual — configure pg_dump cron |
| ProjeXtPal | PostgreSQL (Django) | Django media | Manual — configure pg_dump cron |
| IQ Helix | SQLite/PostgreSQL | Local/S3 | Alembic migrations + manual |

## Recovery Procedures
### Supabase Projects (Marketing, Finance)
1. Supabase provides point-in-time recovery (Pro plan)
2. Dashboard: Project Settings → Database → Backups
3. RTO: <1 hour | RPO: <24 hours

### Self-Hosted Projects (Ignite, ProjeXtPal, IQ Helix)
1. Restore from latest pg_dump: `pg_restore -d dbname backup.dump`
2. Redeploy application from git
3. RTO: <4 hours | RPO: depends on backup frequency

## Recommended Cron Schedule
```
# Daily database backup at 3am
0 3 * * * pg_dump -Fc dbname > /backups/db_$(date +\%Y\%m\%d).dump
# Keep 30 days of backups
0 4 * * * find /backups -mtime +30 -delete
```

## Incident Response
1. Assess impact and scope
2. Notify team via Slack/email
3. Isolate affected systems
4. Restore from backup
5. Post-incident review within 48 hours
6. GDPR: notify Autoriteit Persoonsgegevens within 72 hours if personal data affected
