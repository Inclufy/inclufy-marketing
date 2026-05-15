# Inclufy Marketing — Breach Response Runbook

**Scope:** Inclufy Marketing ecosystem — AMOS mobile (`com.inclufy.go`) + marketing-web (`marketing.inclufy.com`) + the AMOS Supabase project (`mpxkugfqzmxydxnlxqoj`).
**Audience:** Inclufy founder + future on-call engineer.
**Version:** v1.0 (2026-05-15) — DPA §8 commitment fulfilled.
**Activation trigger:** Any of [§2 — Detection sources](#2-detection-sources) — *act immediately, no approval needed*.

> ⚠️ **Print this file or save it offline.** A real breach may take down
> Supabase / GitHub / Notion / Slack. Keep a paper copy or PDF on your
> phone. The legal clock (72h to AP) starts ticking from **discovery**,
> not from when systems are restored.

---

## 1. Roles + contacts

| Role | Today | Backup | Contact |
|---|---|---|---|
| Incident Commander | Sami | (none yet — bus factor 1) | sami@inclufy.com / +31-... |
| Data Protection contact (DPA §10) | Sami | — | support@inclufy.com |
| Supabase ops | Sami | Supabase support | dashboard.supabase.com |
| Resend ops | Sami | Resend support | resend.com/support |
| Meta / LinkedIn / TikTok ops | Sami | Per platform | (OAuth re-issue page) |
| Legal counsel (DPA + AP notification) | TBD | — | TBD before first paying customer |
| AP (NL Supervisory Authority) | — | — | https://autoriteitpersoonsgegevens.nl/meldingen |

**Bus-factor warning:** today only Sami knows the full stack. Document
the runbook's "containment" steps so a contractor or backup engineer
can execute them solo if Sami is unreachable. Top priority for the
first hire onboarding pack.

---

## 2. Detection sources

How an incident gets discovered, ordered by typical first-touch:

1. **Sentry** — error spike, crash-free-rate drops, new exception type. Set up alerts for: `event_count > 50/min` or `crash_free_session_rate < 99.5%`.
2. **UptimeRobot** — endpoint down >2 min triggers email + (optional) SMS/Slack.
3. **Customer email / WhatsApp** to support@inclufy.com — "I see someone else's data" / "I got an OAuth token email I didn't request" / similar.
4. **GitHub / GitLab security advisory** on a dependency we ship (`npm audit` weekly cron — TODO add).
5. **Supabase Dashboard banner** — service alerts, suspicious-login flags.
6. **Sami noticing weirdness during normal use** — most common in solo phase.
7. **Mailbox provider bounce-spike** in Resend dashboard — early sign of DNS tampering or domain blacklisting.
8. **Resend webhook → `email_send_log`** — spike in `status='complained'`.

---

## 3. Incident severity matrix

| Class | Criteria | Time to first action | Who decides |
|---|---|---|---|
| **SEV-0** | Confirmed personal-data exposure beyond authorized recipients. Examples: cross-tenant data leak, public Supabase Storage bucket, leaked service-role key in a git push. | **Immediate** (drop everything) | Sami unilaterally |
| **SEV-1** | Probable breach pending forensic confirmation. Examples: send-push fan-out to wrong users; an attacker has a valid session token of a non-attacker user. | <30 min | Sami |
| **SEV-2** | Security gap with no confirmed exposure. Examples: an open relay you find before anyone exploited it (today's send-push fix was SEV-2). | <4h | Sami |
| **SEV-3** | Operational outage with no PII implications. Service down, broken deploy. | <24h | Sami |

⚠️ **SEV-0 + SEV-1 trigger the GDPR 72-hour clock**. SEV-2 does not (no
data subject affected → no Art. 33 obligation, but still document
internally). SEV-3 is not a personal-data breach.

---

## 4. Decision tree — is this a personal-data breach?

```
                Anomaly detected
                       │
                       ▼
       Could personal data have been ACCESSED,
       ALTERED, or DESTROYED beyond intent?
                       │
              ┌────────┴────────┐
              │                 │
            NO                 YES → continue
              │
              ▼
       SEV-3 — operational
       outage. Fix per §9.
       Not a personal-data
       breach. Log internally.

       Continued from YES:
                       │
                       ▼
       Was the affected data PII or special-cat?
       (auth.users, profiles, oauth_tokens,
       go_captures images of identifiable people,
       go_events attendee lists, email recipients,
       push tokens linked to user_id)
                       │
              ┌────────┴────────┐
              │                 │
            NO                 YES → continue
              │
              ▼
       Document internally.
       Not GDPR-reportable.

       Continued from YES:
                       │
                       ▼
       Likelihood of risk to data subjects'
       rights and freedoms?  (Art. 33(1) test)
                       │
              ┌────────┴────────────────┐
              │                         │
       LOW likelihood            HIGH likelihood
       (e.g. internal           (e.g. password,
       only, immediately        financial, public
       contained)               account info,
                                stalking risk)
              │                         │
              ▼                         ▼
       Internal log +            Art. 33 AP notify
       prep-but-don't-           within 72h
       file unless                       +
       evidence shifts.          Art. 34 affected
                                 data-subject
                                 notify if HIGH
                                 risk.
```

---

## 5. The 72-hour clock — Hour-by-hour checklist

### T+0 — Detection
- [ ] Note **exact UTC timestamp of first awareness** (this is the "discovery" point per Art. 33).
- [ ] Open a new doc `docs/incidents/INCIDENT_YYYYMMDD_HHMM.md` (gitignore-OK — incident docs may contain PII; do NOT commit before redaction). Capture:
  - Detection source + timestamp
  - First-sighting description
  - Initial guess at severity (SEV-0..3)

### T+0 to T+1h — Containment (the bleed-stop)
- [ ] **Identify the scope** — which table, which user_ids, which endpoint? Look at Sentry + Supabase logs.
- [ ] **Stop the bleed**, in escalating order of disruption:
  - [ ] Revoke compromised credential (if known): rotate `SUPABASE_SERVICE_ROLE_KEY` via Supabase Dashboard → Settings → API → Reset
  - [ ] Disable the affected edge function: `supabase functions delete <name>` (last resort — breaks UX but stops bleed)
  - [ ] Toggle the offending feature flag off (if relevant)
  - [ ] Block the attacker IP via Cloudflare WAF (if attacker IP known)
- [ ] **Take a forensic snapshot** before further changes corrupt evidence:
  ```bash
  cd "/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main"
  ./backup-database.sh   # captures current state
  ```
- [ ] **Lock the audit trail**: dump `auth.audit_log_entries`, `pg_stat_activity`, `net._http_response` from last 7 days. Save into incident doc.

### T+1h to T+6h — Forensic + scope confirmation
- [ ] How many data subjects affected? Run SQL:
  ```sql
  -- Example: if cross-tenant leak through edge function
  SELECT count(distinct user_id) FROM <affected_table> WHERE <leak_condition>;
  ```
- [ ] What data was exposed (categories per Art. 33(3)(a))?
- [ ] What is the likely consequence (Art. 33(3)(c))?
- [ ] Were any sub-processors involved? (Resend logs, Meta API call logs, etc.)
- [ ] Make the AP-notification call: is this Art. 33 reportable? Use §4 decision tree.

### T+6h to T+24h — Containment hardening + remediation
- [ ] Push the actual fix to prod (after the bleed-stop).
- [ ] Verify fix with the same SQL or curl that exposed the bug — must now return correct error or empty result.
- [ ] Run the security audit subset that covers this class of bug (see commit history for `data-leak-hunter` agent prompts).
- [ ] Internal post-mortem note in incident doc: "what we did wrong + what we changed + why this can't recur".

### T+24h to T+72h — Notifications
**If SEV-0 or SEV-1 confirmed reportable:**
- [ ] Draft AP notification using template in §7. Submit via https://autoriteitpersoonsgegevens.nl/meldingen
- [ ] Notify each affected customer's contracted contact in writing (DPA §8) within 24h of confirmed AP report.
- [ ] If HIGH risk to data subjects (Art. 34): notify the data subjects directly. Template in §7.

### T+72h onwards — Closure
- [ ] Update incident doc with: total affected users, durations of exposure, remediation timeline, learnings.
- [ ] Redact PII from incident doc + commit to `docs/incidents/`.
- [ ] Add a regression test or static-analysis rule to prevent recurrence.
- [ ] Schedule a 30-day check-in to confirm no late-arriving evidence changes the picture.

---

## 6. Containment playbook — common scenarios

### Scenario A — Service-role key leaked (e.g. accidental git push)
1. **Rotate immediately**: Supabase Dashboard → Settings → API → Reset service_role key. This invalidates all edge functions using it until env vars are updated.
2. **Update env on all functions**: Supabase auto-handles `SUPABASE_SERVICE_ROLE_KEY` for edge functions. But verify the legacy JWT hardcoded in `supabase/migrations/20260510120000_email_on_product_issue.sql` and `20260510160000_user_devices_push.sql` is the LEGACY long-lived JWT, not the new one. If you rotated the legacy JWT, you need to update those migrations and re-apply.
3. **Audit usage**: `SELECT * FROM auth.audit_log_entries WHERE created_at > '<leak_time>' AND payload::text LIKE '%service_role%'`.
4. **Scrub git history**: `bfg --delete-files <leaked-file>` or `git filter-repo`. Force-push (this is the *one* case where force-push to main is justified). Notify all collaborators.

### Scenario B — Cross-tenant data leak via edge function
1. **Disable the function**: `supabase functions delete <name>` (immediate stop).
2. **Identify affected users**: query the function's recent calls in Supabase logs.
3. **Fix the function** (typically: missing `auth.uid()` filter, or `service_role` used without body-`user_id`-vs-JWT assertion — the `publish-social` commit `f7b54b4` pattern).
4. **Redeploy with verify**.
5. **Reverse-engineer what each affected user saw**: was it just headers, or full row data? Categorize per Art. 33(3)(a).

### Scenario C — OAuth token theft (compromised user account)
1. **Revoke the token**: `DELETE FROM oauth_tokens WHERE user_id = '<victim>' AND platform = '<platform>'`.
2. **Reach the user**: email via send-email with type=`oauth_token_expired` — already templated, instructs reconnect.
3. **Force re-auth**: revoke the Supabase session: `UPDATE auth.users SET banned_until = now() + interval '1 hour' WHERE id = '<victim>'`. They must re-login + reconnect.
4. **Audit cross-account access**: any posts published from victim's social channels during the breach window? Notify them, offer to delete.

### Scenario D — Push spam (open send-push relay re-emerges)
1. **Confirm**: `SELECT count(*) FROM user_devices WHERE last_seen_at > now() - interval '5 min'` — anomalous?
2. **Disable**: rotate `INTERNAL_PUSH_SECRET`: `supabase secrets set INTERNAL_PUSH_SECRET=<new> --project-ref mpxkugfqzmxydxnlxqoj`. This breaks legit pushes until you also update the DB trigger; that's acceptable as a bleed-stop.
3. **Update trigger** with new secret (re-run `apply-trigger-secret` style temp function or in-place DDL).
4. **Notify affected users** ONLY if push content was sensitive. Generic "[notification]" pushes do not require Art. 34.

### Scenario E — Resend account breach (someone sending mail from your domain)
1. **Rotate `RESEND_API_KEY`** in Supabase secrets.
2. **Check `email_send_log`** for unknown recipients in the breach window: `SELECT recipient FROM email_send_log WHERE sent_at > '<breach>' ORDER BY sent_at`.
3. **DKIM-rotate** if needed: Resend dashboard → Domains → rotate keys → update DNS CNAME.
4. **Inform recipients** of any phishing mail using a properly-signed mail from a new key.

### Scenario F — Backup corrupted / wrong restore
1. Run `./restore-database.sh --target-ref <fresh staging>` with the latest known-good archive.
2. Validate sanity counts: `SELECT count(*) FROM go_posts`, `SELECT count(*) FROM auth.users`.
3. Only after staging restore looks correct: production restore using `restore-database.sh` interactive flow.
4. Pre-restore safety dump retained at `~/backups/inclufy-marketing/pre-restore/` — that's the rollback if step 3 was wrong.

### Scenario G — Mac Studio compromised / lost / stolen
1. Revoke from Apple ID → Mark As Lost.
2. Rotate ALL secrets that were on disk: `~/.inclufy-backup-secrets`, `~/.aws/credentials` (if present), npm/expo tokens.
3. Restore backups from iCloud Drive on a clean Mac (iCloud is the only off-site copy).
4. Re-issue all Supabase service-role keys (they may have been cached in Supabase CLI auth).
5. Re-login to all dev accounts (Sentry, Resend, GitHub, GitLab, Apple Developer, Google Play, Meta, LinkedIn).

---

## 7. Communication templates

### 7a. AP (Autoriteit Persoonsgegevens) notification

> **Onderwerp:** Melding datalek — Inclufy B.V., [datum]
>
> **1. Aanmelder:** Inclufy B.V., KvK [nr], DPO support@inclufy.com.
>
> **2. Aard van het datalek:** [vertrouwelijkheid / integriteit / beschikbaarheid — kies één of meerdere]
>
> **3. Categorieën van betrokkenen + aantallen:** ongeveer [N] [klanten / gebruikers / werknemers]
>
> **4. Categorieën persoonsgegevens:** [auth credentials / contact-info / inhoud van content captures / OAuth tokens / etc.]
>
> **5. Waarschijnlijke gevolgen:** [identiteitsfraude / spam / publieke blootstelling van content / etc.]
>
> **6. Maatregelen:** [bleed-stop / fix / notificatie aan betrokkenen — verwijzen naar §7b]
>
> **7. Tijdlijn:** ontdekt [T+0 UTC]; gemeld AP [T+xh UTC].

Submit via https://autoriteitpersoonsgegevens.nl/meldingen.

### 7b. Affected data subject (when HIGH risk → Art. 34 required)

```
Onderwerp: Belangrijke beveiligingsmelding — Inclufy AMOS / Inclufy account

Beste [naam],

Op [datum] hebben we een beveiligingsincident vastgesteld waarbij
gegevens van jouw Inclufy-account mogelijk zichtbaar waren voor
[andere gebruikers / een onbevoegde partij]. Concreet gaat het om:
  - [data category 1]
  - [data category 2]

We hebben het lek direct dichtgemaakt en je account is opnieuw
beveiligd. Geen actie van jouw kant is verplicht, maar we adviseren:
  - Wachtwoord wijzigen via [link]
  - Verbonden sociale accounts opnieuw koppelen via Instellingen → Sociale media

We hebben deze melding ook gedaan bij de Autoriteit Persoonsgegevens
en zijn beschikbaar voor vragen via support@inclufy.com.

Met vriendelijke groet,
Sami Loukile — Inclufy B.V.
```

### 7c. Internal status update (Slack / WhatsApp)

```
[SEV-N] Inclufy Marketing incident @ <UTC timestamp>
Detection: <source>
Scope: <component / users affected>
Status: containing / contained / monitoring
Next update: <T+1h>
Owner: <name>
```

---

## 8. Tooling references

| Need | Where |
|---|---|
| Supabase admin auth log | Dashboard → Logs → Auth |
| Edge function logs | Dashboard → Edge Functions → <name> → Logs |
| pg_net call history | `SELECT * FROM net._http_response ORDER BY created DESC LIMIT 100;` |
| Recent Resend emails | resend.com/emails |
| OAuth tokens still active | `SELECT user_id, platform, expires_at FROM oauth_tokens WHERE expires_at > now()` |
| Push devices | `SELECT user_id, platform, last_seen_at FROM user_devices WHERE is_active = true` |
| Email send-log | `SELECT * FROM email_send_log WHERE sent_at > now() - interval '24h' ORDER BY sent_at DESC LIMIT 200;` |
| Backup integrity | `./backup-database.sh --verify` |
| Restore (safe) | `./restore-database.sh` (interactive — demands PRODUCTION literal) |
| Restore (CLI) | `./restore-database.sh --target-ref <ref> --archive <path>` |
| Rotate INTERNAL_PUSH_SECRET | `supabase secrets set INTERNAL_PUSH_SECRET=<new> --project-ref mpxkugfqzmxydxnlxqoj` then update trigger |
| Rotate service_role key | Supabase Dashboard → Settings → API → Reset |

---

## 9. Post-incident — within 7 days

- [ ] Update [`docs/SECURITY_AUDIT_2026-05-10.md`](SECURITY_AUDIT_2026-05-10.md) with the new failure class.
- [ ] Add a regression test or `data-leak-hunter` agent prompt that specifically targets this scenario.
- [ ] Update [`docs/DPA_SUBPROCESSORS.md`](DPA_SUBPROCESSORS.md) §7 if the incident reveals a missing sub-processor or new transfer mechanism.
- [ ] Send written closure to the customer (DPA §8 requires this — "measures taken to address the breach").
- [ ] If the breach involved a sub-processor, request their incident-report from them (we are joint controllers if they processed our user data).

---

## 10. Don'ts

- ❌ **Don't communicate publicly** about a confirmed personal-data breach BEFORE notifying AP. The 72h clock and the timing of public disclosure interact — let legal counsel sequence it.
- ❌ **Don't delete the audit trail** in panic. Even messy logs are evidence.
- ❌ **Don't fix-then-investigate** if there's any chance the attacker is still active — investigate first OR isolate fully (Scenario A's rotate before forensic-snapshot is the exception).
- ❌ **Don't force-push to main** unless Scenario A (leaked credential) — and even then, coordinate with everyone else with the repo cloned.
- ❌ **Don't email affected users** without legal review of the wording if breach involves financial data, health data, or anything categorized as special-category Art. 9 GDPR.

---

## 11. Drill schedule

- [ ] Q3 2026 — tabletop exercise on Scenario B (cross-tenant leak), use staging Supabase project.
- [ ] Q4 2026 — tabletop on Scenario G (Mac Studio compromised). Practice restoring from iCloud.
- [ ] H1 2027 — third-party pen test booked (commitment from `docs/DPA_SUBPROCESSORS.md` §9).

---

**Maintenance:** review this runbook after every incident + at least quarterly. Bump `Version:` field. If you make structural changes, note the rationale in the commit message.
