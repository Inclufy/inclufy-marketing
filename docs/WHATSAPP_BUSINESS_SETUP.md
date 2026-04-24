# WhatsApp Business — Setup Guide

AMOS ondersteunt 3 paden voor WhatsApp-integratie. Elk pad vereist andere setup.

---

## Pad A — Manual copy-paste (LIVE vandaag)

**Status**: 🟢 Werkt direct. Geen setup nodig.

1. In AMOS: ga naar Settings → Social Media
2. Koppel een WhatsApp "account" (type 'manual') met je telefoonnummer of bedrijfsnaam als label
3. Maak een post aan met WhatsApp als kanaal
4. Publish → "📋 Klaar om te posten" alert verschijnt met twee knoppen:
   - **OK** — sluit alert, post staat als "published" in DB (voor audit)
   - **Open WhatsApp** — opent WhatsApp app/web met de caption al geplakt; jij plakt in Status / Channel / Broadcast

Geen kosten, geen verificatie, werkt voor elke WhatsApp use-case (Status posts, Channels, groups, broadcasts, individuele chats).

---

## Pad B — WhatsApp Cloud API template broadcast

**Status**: 🟡 Code live op main + edge functions deployed. Activatie vereist multi-week Meta setup.

### Wat dit is
Programmatisch templates sturen naar opted-in klanten via Meta's Graph API. Elke ontvanger krijgt een gepersonaliseerde 1-op-1 message — geen "post naar followers" zoals LinkedIn.

### Wat dit NIET is
- Niet posten naar je WhatsApp Status of Channel (Meta staat API-publicatie niet toe)
- Niet spammen naar lijsten (strenge ToS + opt-in verplicht)
- Niet gratis — ~€0,05–€0,15 per bericht afhankelijk van land en template-categorie

### Setup (geschat 2-3 weken doorlooptijd)

#### Stap 1 — Meta Business Account
1. https://business.facebook.com → maak Business Account
2. Complete business verification (KYB): upload KvK uittreksel, bedrijfsadres, domein verificatie via DNS TXT record
3. Wachttijd: 1-5 werkdagen

#### Stap 2 — WABA aanmaken
1. Business Settings → WhatsApp Accounts → **Add**
2. Selecteer je business portfolio
3. WABA wordt aangemaakt; noteer **WABA ID** (bv. `102284528765432`)

#### Stap 3 — Telefoonnummer registreren
1. WhatsApp Manager → Phone Numbers → **Add phone number**
2. **Belangrijk**: gebruik een nummer dat NIET al actief is in WhatsApp (wordt mogelijk gedeactiveerd op je persoonlijke telefoon)
3. Verifieer via SMS of spraakoproep
4. Noteer **phone_number_id** (bv. `523876214521983`) en **display_phone_number** (bv. `+31612345678`)

#### Stap 4 — Permanent Access Token
1. Business Settings → Users → **System Users**
2. **Add** → Name "AMOS System User" → Role: Admin
3. **Generate New Token** → select je app + scope `whatsapp_business_messaging` + `whatsapp_business_management`
4. Expiry: **Never**
5. Kopieer direct (Meta toont hem maar één keer)

#### Stap 5 — Message Templates
Elke message die je via API wilt sturen moet eerst goedgekeurd worden door Meta.

1. WhatsApp Manager → Message Templates → **Create Template**
2. Category kies:
   - `MARKETING` — promotionele broadcasts (hoogste opt-in eisen + hogere prijs)
   - `UTILITY` — transactioneel (bestel bevestigingen, updates — lager geprijsd)
   - `AUTHENTICATION` — OTPs en login codes
3. Language: `nl` / `en` / etc.
4. Body: tekst met placeholders `{{1}}`, `{{2}}` etc. — voorbeeld:
   ```
   Hoi {{1}},
   Ons nieuwste event is er! Kijk op {{2}} voor meer info.
   ```
5. Submit voor review
6. **Wachttijd**: 24-72h per template (snelste kant). Afwijzingen kunnen gebeuren op spam-achtige taal, slechte opmaak, claims zonder disclaimer.

#### Stap 6 — Secrets in Supabase
Dashboard → Project Settings → Edge Functions → Secrets → Add:

| Key | Value |
|-----|-------|
| `WHATSAPP_APP_SECRET` | Meta App Dashboard → Settings → Basic → App Secret |
| `WHATSAPP_VERIFY_TOKEN` | Jij verzint een willekeurige string, bv. `amos-webhook-$(openssl rand -hex 16)` |

#### Stap 7 — Webhook configureren
1. Meta App Dashboard → WhatsApp → Configuration → **Webhooks**
2. Callback URL: `https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/whatsapp-webhook`
3. Verify Token: dezelfde string als in stap 6
4. Klik **Verify and Save** — Meta doet een GET naar je webhook, onze code geeft de challenge terug
5. Subscribe webhook events: `messages` (om delivery/read status te krijgen)

#### Stap 8 — DB rows invoeren
In Supabase Dashboard → SQL Editor:

```sql
-- Voeg jouw WABA config toe
INSERT INTO public.whatsapp_config (
  user_id, waba_id, phone_number_id, display_phone_number, business_name, access_token
) VALUES (
  'd9605654-3c00-4dee-a908-dc46f3c5f27b',  -- jouw Supabase user_id (sami@inclufy.com)
  '102284528765432',                        -- WABA ID uit stap 2
  '523876214521983',                        -- phone_number_id uit stap 3
  '+31612345678',                            -- display number
  'Inclufy',                                 -- display name
  'EAAP...XYZ'                               -- permanent token uit stap 4
);

-- Voeg elk goedgekeurd template toe
INSERT INTO public.whatsapp_templates (
  waba_config_id, name, language, category, status, body_text
) VALUES (
  (SELECT id FROM public.whatsapp_config WHERE user_id = 'd9605654-...'),
  'event_announcement',                      -- naam EXACT zoals in Meta dashboard
  'nl',
  'MARKETING',
  'approved',                                 -- pas na Meta approval
  'Hoi {{1}}, Ons nieuwste event is er!...'
);

-- Voeg opt-in recipients toe (voor demo/test)
INSERT INTO public.whatsapp_recipients (
  user_id, waba_config_id, phone_e164, display_name, opt_in_at, source
) VALUES (
  'd9605654-...',
  (SELECT id FROM public.whatsapp_config WHERE user_id = 'd9605654-...'),
  '+31687654321',
  'Test contact',
  now(),
  'manual'
);
```

### Compliance

- **Opt-in verplicht**: ontvangers moeten expliciet toestemming geven om WhatsApp-berichten te ontvangen. Verzamel via landing page formulier, inschrijfscherm, of bestaande klantrelatie. Bewaar proof (timestamp, IP, source).
- **24h customer window**: buiten 24h na laatste gebruikersbericht mag je ALLEEN templates sturen, geen free-form
- **Opt-out moet eenvoudig zijn**: gebruikers die "STOP" sturen moeten automatisch opt-out krijgen (TODO in AMOS: handle inbound webhook messages)
- **GDPR**: recipient data is persoonsgegevens → DPA met Inclufy BV, bewaartermijn beperkt, recht op verwijdering

### Kosten indicatie (Meta pricing 2026, Nederland)

| Categorie | Kost per conversatie (24h window) |
|-----------|-----------------------------------|
| Marketing | ~€0,0817 |
| Utility | ~€0,0227 |
| Authentication | ~€0,0175 |
| Service (binnen window) | Gratis (tot 1000/maand) |

Bij 10k marketing messages/maand: ~€800. Voor experimenteren budget minimaal €50/maand in Meta Business credit.

---

## Pad C — Click-to-WhatsApp CTA (LIVE vandaag)

**Status**: 🟢 Werkt direct. Geen setup nodig.

Voegt een WhatsApp link toe aan LinkedIn/FB/IG posts zodat lezers direct kunnen chatten met jou.

### Gebruik

1. In PostReviewScreen: scroll naar sectie "💬 WhatsApp CTA toevoegen" (onder de first-comment sectie)
2. Toggle aan
3. Vul in:
   - Telefoonnummer in E164 formaat: `+31612345678`
   - Optioneel: prefill message (default: "Hi, ik zag je post")
4. Klik Save
5. Preview toont de exacte URL die aan de post toegevoegd wordt
6. Bij publish: de URL wordt aan het einde van de post-tekst gehangen zoals:
   ```
   [je post tekst]
   
   #hashtag #tags
   
   💬 Chat met ons: https://wa.me/31612345678?text=Hi%2C%20ik%20zag%20je%20post
   ```

LinkedIn, Facebook en Instagram renderen `wa.me` links als tappable — lezers tikken, WhatsApp opent op hun kant met jouw nummer + geplakte message.

### Default nummer instellen (organisatie-breed)

Je kan een default nummer + message instellen op organisatie-niveau (`go_organization.default_whatsapp_cta_phone`). Nieuwe posts erven dan automatisch het CTA-toggle + default nummer.

TODO UI: nu per-post handmatig invullen. Default-setting UI is niet gebouwd in deze sessie.

---

## Vergelijking van 3 paden

| Dimensie | A: Manual | B: Cloud API | C: CTA |
|----------|-----------|--------------|--------|
| Setup tijd | 0 min | 2-3 weken | 0 min |
| Kosten | Gratis | €0,02-€0,15/bericht | Gratis |
| Meta verificatie | Niet nodig | Volledig BV KYB | Niet nodig |
| Compliance overhead | Geen (user eigen verantwoordelijkheid) | Streng (opt-in + 24h window + templates) | Geen |
| Use case | Status/Channels broadcasten zelf | Gestuurde 1-op-velen campagnes | Conversie kanaal op andere posts |
| Schaalbaar? | Max 256 per broadcast (app limiet) | 10k+ bericht/dag | Niet-limiterend (wa.me link) |
| Bewezen werkt | Ja (manual flow = trivial) | Ja, na Meta approval | Ja (wa.me is Meta protocol) |

---

## Deployed edge functions

| Function | Versie | Pad | Auth |
|----------|--------|-----|------|
| publish-social | v29 | A (manual whatsapp case) | User JWT |
| whatsapp-send | v1 | B (template broadcast) | User JWT |
| whatsapp-webhook | v1 | B (delivery status) | verify_jwt=false (Meta calls) |

---

*Gegenereerd 2026-04-24.*
