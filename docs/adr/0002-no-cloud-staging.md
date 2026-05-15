# ADR-0002 — Geen cloud staging, wel CI migration-apply gate

- **Status**: Accepted
- **Datum**: 2026-05-15
- **Beslisser**: Sami Loukile
- **Vervangt**: oorspronkelijke Sprint-3 #14 (staging Supabase project)

## Context

Op 2026-05-15 hit een schema-fout in de `v_push_engagement_by_type` view de prod-Supabase: de view refereerde naar `go_notifications.read_at` (kolom bestaat niet — alleen `read boolean` + `created_at`). Postgres rolde de hele transactie terug, geen schade, maar wel zichtbaar als "Failed to run SQL" in de editor.

Dit triggerde Sprint-3 #14: een staging Supabase project aanmaken zodat we migrations daar eerst kunnen testen vóór paste-in-prod.

We hebben het staging project ook daadwerkelijk aangemaakt (`hlsifthnhsrlqfzdoion`, eu-west-1, free tier) en alle 30 edge functions ge-deployed. Daarna pauzeerden we de schema-clone om te valideren of staging écht waarde toevoegt.

## Heroverweging

Honest assessment van staging-waarde voor de huidige situatie:

| Pijnpunt | Heb je dit? | Oplost staging dit? | Goedkoper alternatief? |
|----------|-------------|---------------------|------------------------|
| Schema-migratie kapot maken prod | Ja (vandaag) | Ja | **CI-gate met postgres-service** ✓ |
| Multi-engineer merge-conflicts | Nee (solo dev) | n.v.t. | — |
| Beta backend voor TestFlight reviewers | Reviewers gebruiken prod | Ja | — |
| Load-test zonder prod data te vervuilen | <100 users | n.v.t. | — |
| Demo-omgeving voor enterprise prospects | Pas later (Morocco/UAE pilots) | Ja | Apart prospect-environment per pilot |
| Pre-prod validation van monitoring config | Vandaag spannend | Ja | One-shot lokale Docker stack |

Verdict: **alleen schema-migratie-validatie is een echt pijnpunt vandaag**, en dat is oplosbaar met een 30-sec CI-job die ~99% goedkoper is dan een full-time second Supabase project.

Lokale dev draait op `:8082` (marketing-web Vite) en `:8081` (AMOS Metro) en raakt al **prod** Supabase aan — dus lokale dev catched UI/API bugs maar niet server-side schema-fails.

## Beslissing

1. **Cloud staging project pauzeren** in plaats van actief onderhouden. Free tier auto-pause na 7 dagen idle. Komt evt. terug als enterprise pilots concrete demo-environments nodig hebben.
2. **CI migration-apply gate** toevoegen in `.github/workflows/ci.yml` als job `migrations-apply-check`:
   - Spin-up `postgres:16` als GitHub Actions service container
   - Bootstrap minimaal Supabase-achtig schema (auth.users + stubs van pre-migration-tracking tables)
   - Apply elke `supabase/migrations/*.sql` chronologisch via `psql -v ON_ERROR_STOP=1`
   - Fail de PR als één migratie struikelt
3. **`.env.staging` files** blijven gitignored bestaan in beide repos — geen kosten, makkelijk te re-activeren als we van mening veranderen.

## Consequenties

**Positief**:
- ~€20/mnd bespaard zodra we free tier zouden ontgroeien
- Geen schema-drift tussen staging + prod te bewaken
- CI-gate vangt 99% van migratie-fouten 30 seconden na een PR-open in plaats van post-deploy
- Mobile app reviewers + iOS App Review blijft op prod (zelfde als nu)

**Negatief**:
- Geen separate omgeving voor risico-volle batch-data-experimenten (mitigatie: dump prod naar lokale Postgres, experimenteer daar)
- Geen voorbereide demo-environment voor first enterprise pilot (mitigatie: spin-up dan ad-hoc een nieuw Supabase project per pilot, gebruik [seed-data scripts])

## Implementatie

Zie commit `<TODO add commit SHA>`:
- `.github/workflows/ci.yml` → `migrations-apply-check` job
- Cloud staging project `hlsifthnhsrlqfzdoion` → handmatig gepauzeerd via Supabase dashboard
- `.env.staging` files → behouden, gitignored

## Heroverwegen wanneer?

- Eerste enterprise pilot (Morocco/UAE/Dar Group) krijgt eigen environment-eis
- Team groeit naar 2+ engineers die parallel aan schema werken
- Migration-fail in CI gate die NIET in `migrations-apply-check` werd gevangen (signal dat de gate niet voldoende is)
