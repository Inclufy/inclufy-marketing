# NRTO Keurmerk Aanvraag — Concept-mail

**Status:** klaar voor verzending **NA** CRKBO-audit (21 mei 2026)
**Aanbevolen verzendmoment:** 22-28 mei 2026 (direct na ontvangst CRKBO-certificaat)
**Reden:** dan kan het CPION-certificaat als bijlage mee → vrijstellingsroute 3 → slagingskans van 80% naar 95%+

---

## Mail-readiness checklist (alle 4 voorwaarden vervuld op 2026-05-04)

- [x] Link naar website (inclufy.com) — productiedomein actief
- [x] AV gepubliceerd + in footer gelinkt — `/academy/algemene-voorwaarden`
- [x] NRTO-gedragscode in footer gelinkt — extern naar `nrto.nl/kwaliteit/gedragscode/`
- [x] Lidnummer 5361 publiek vermeld — op `/academy/kwaliteit`
- [x] Klachtenprocedure (in praktijk ook gevraagd) — `/academy/klachtenprocedure`
- [x] Studiegids beschikbaar — `/academy/studiegids`
- [x] Kwaliteitspagina met 6 NRTO-eisen onderbouwd — `/academy/kwaliteit`

---

## Concept-mail

**Aan:** keurmerk@nrto.nl
**CC:** academy@inclufy.com
**Onderwerp:** Verzoek beoordeling NRTO-keurmerk + vrijstelling op grond van CRKBO — Inclufy Academy (lidnr. 5361)

---

Geachte heer/mevrouw,

Als voorwaardelijk lid van de NRTO (lidnummer 5361, mei 2026) verzoeken wij u
om beoordeling voor het NRTO-keurmerk. Inclufy Academy is een handelsnaam van
ePROCURE Consulting B.V. (KvK 66586356, RSIN 856620130, SBI 85.59.2) gevestigd
in WTC Almere, P.J. Oudweg 4, 1314 CH Almere.

Wij verzoeken tegelijk om vrijstelling van de NRTO-kwaliteitsaudit op grond
van onze CRKBO-instellingsregistratie (registratienummer 67622). De CPION-
instellingsaudit is op 21 mei 2026 succesvol afgerond [DATUM EN UITKOMST
INVULLEN NA AUDIT] en omvat drie erkende leertrajecten:

  1. AI Geletterdheid voor Professionals (20 uur, niveau Beginner)
  2. Soft Skills voor de Digitale Werkplek (25 uur, niveau Beginner)
  3. Project Management Fundamentals (25 uur, niveau Beginner)

De volgende NRTO-vereiste documenten zijn publiek beschikbaar op onze website:

  Kwaliteit & Keurmerken:    https://inclufy.com/academy/kwaliteit
  Algemene Voorwaarden:      https://inclufy.com/academy/algemene-voorwaarden
  Klachtenprocedure:         https://inclufy.com/academy/klachtenprocedure
  Studiegids:                https://inclufy.com/academy/studiegids
  NRTO-gedragscode (extern): gelinkt vanuit de footer van iedere pagina

In de footer van iedere pagina is een aparte sectie "Academy Compliance"
opgenomen met directe links naar al deze documenten.

Onze kwaliteitsborging steunt op:
- Wetenschappelijke validatie van de didactische aanpak door een hoogleraar
  gedragswetenschappen van de Universiteit Utrecht
- Evidence-based pedagogiek: Challenge Based Learning, Design Based Learning
  en Wederkerig Leren
- T0/T1/T2 meetprotocol voor competentiegroei
- Systematisch tevredenheidsonderzoek per opleiding met kwartaalrapportage
- Externe beroepsmogelijkheid bij De Geschillencommissie

Bijlagen:
  1. CRKBO-instellingscertificaat (CPION, 21 mei 2026)
  2. Klachtenregister 2026 (overzicht, geanonimiseerd)
  3. Voorbeeld evaluatieformulier en kwartaalrapportage
  4. Profielen hoofddocenten + verklaring wetenschappelijke validatie
     Universiteit Utrecht

Wij ontvangen graag een bevestiging van ontvangst en een indicatie van de
doorlooptijd. Voor vragen ben ik bereikbaar via academy@inclufy.com of
06 30 11 87 82.

Met vriendelijke groet,

Sami Loukile
Directeur — ePROCURE Consulting B.V. h/a Inclufy Academy
academy@inclufy.com · +31 6 30 11 87 82
WTC Almere, P.J. Oudweg 4, 1314 CH Almere

---

## Te-doen vóór verzending

1. **Wacht op CRKBO-audit** — 21 mei 2026
2. **Verzamel bijlagen** (binnen 1 week na audit):
   - [ ] CRKBO-certificaat (PDF van CPION)
   - [ ] Klachtenregister 2026 (geanonimiseerd, leeg = geen klachten = ook OK)
   - [ ] Voorbeeld evaluatieformulier (PDF) + Q1/Q2 2026 rapportage
   - [ ] Profielblad per hoofddocent + UU-validatieverklaring
3. **Pas de mail aan** — vul datum en uitkomst CRKBO-audit in
4. **Verstuur** vanaf academy@inclufy.com naar keurmerk@nrto.nl

## Activeren na NRTO-toekenning

Na bevestiging keurmerk:
- [ ] NRTO-keurmerk logo plaatsen in footer + op `/academy/kwaliteit`
- [ ] Status NRTO-kaart op Quality-pagina van "in-aanvraag" → "behaald"
- [ ] Verwijder "voorwaardelijk" uit beschrijvingen
- [ ] Activeer Artikel 13 in AV (`AcademyAlgemeneVoorwaardenPage.tsx:346` —
      verborgen comment "HIDDEN: Artikel 13 Gedragscode (NRTO)")
- [ ] Activeer NRTO-norm verwijzing in Artikel 9
      (`AcademyAlgemeneVoorwaardenPage.tsx:296`)
- [ ] Activeer NRTO-card op AcademyPage Quality-sectie
      (`AcademyPage.tsx:1047`)
- [ ] Activeer NRTO-gedragscode link in legal links bar
      (`AcademyPage.tsx:1169`)
