# WhatsApp Pad B — Cloud API Setup Roadmap

**Datum:** 2026-05-07
**Doel:** AMOS rechtstreeks naar WhatsApp posten via Meta WhatsApp Cloud API (geen handmatige share). Vereist Meta Business Account + KYB + Phone Number registratie + template approval.
**Niet vereist voor go-live week 19.** Pad A (manual share) blijft default.

---

## 1. Pad A vs Pad B — verschil

| | Pad A: Manual Share | Pad B: Cloud API |
|---|---|---|
| Wie post | User typt/plakt zelf in WhatsApp Business app | AMOS roept API → bericht verschijnt automatisch |
| Setup vereist | Geen | Meta KYB + WABA + Phone + Template approval |
| Setup-doorlooptijd | 0 dagen | 2-4 weken |
| Setup-kosten | €0 | €0 (gratis tot 1000 conversaties/mo) |
| Lopende kosten | €0 | Per-conversation €0.005 - €0.05 (regio-afhankelijk) |
| Ondersteunt media | Ja | Ja (image, video, document, location) |
| Ondersteunt Status | Ja (manueel) | ❌ Geen Status-API |
| Use case | 1-op-1 afzonderlijk delen | 1-op-1 + 1-op-veel met opt-in lijst |
| Risico account ban | Laag (gewone gebruikersactie) | Medium (regels strict, opt-in vereist) |
| Verplichtingen | Geen | Privacy policy update + opt-in flow |

**Voor AMOS v1 (week 19):** Pad A is voldoende. Pad B als post-launch roadmap-item.

---

## 2. Voor wie is Pad B nuttig?

Pad B heeft alleen waarde als minimaal één van deze use-cases relevant is:

1. **Broadcast naar opt-in lijst** — bv. "Inclufy weekly update" naar 200+ gebruikers die zich hebben aangemeld
2. **Automatische publish bij events** — capture in AMOS → direct naar WA-broadcast list zonder manuele tap
3. **Customer service follow-up** — geautomatiseerde berichten na demo-aanmelding

Voor pure 1-op-1 delen met collegas (Inclufy team intern) is Pad A simpeler en goedkoper.

---

## 3. Vereisten — wat heeft Inclufy nodig?

### 3.1 Meta Business Account (gratis)

- Sami's bestaande Meta Business Manager (waar AMOS app `78sy9roeoz1143` ook in zit) kan gebruikt worden.
- Geen extra registratie.

### 3.2 WhatsApp Business Account (WABA)

- Aangemaakt onder Meta Business Manager
- Vereist: bedrijfsnaam, KvK, adres, contactpersoon
- 1× per bedrijf — Inclufy BV

### 3.3 KYB (Know Your Business) verificatie

- Meta verifieert: bedrijfsregistratie matches KvK 35193999
- Documenten: KvK-uittreksel + identificatie eigenaar (Sami)
- Doorlooptijd: 1-7 werkdagen
- Status: niet gestart

### 3.4 Phone Number registratie

- Apart phone number (mag GEEN bestaande WhatsApp-account hebben)
- Aanbevolen: VoIP-nummer (via SIPgate, 6,99 €/mo) of geheime nummer
- **NIET het Inclufy-hoofdnummer gebruiken** — dat zou bestaande WhatsApp-account opheffen
- Aanvraag via Cloud API console → Meta belt het nummer voor verificatie
- Doorlooptijd: 1-3 werkdagen na KYB

### 3.5 Display name approval

- Wat klanten zien als afzender
- Voorbeeld: "Inclufy" of "Inclufy AMOS"
- Aanvragen via WABA Manager
- Doorlooptijd: 1-3 werkdagen
- Regels: geen "official", geen "support" suffix, matcht bedrijfsnaam

### 3.6 Message template approval

- Voor outbound berichten naar users buiten 24-uur-window
- Templates in 4 categorieën:
  - **Marketing** (broadcast updates, promo)
  - **Utility** (notifications, transactional)
  - **Authentication** (OTP)
  - **Service** (customer service replies)
- Per template: NL + EN versie aanleveren
- Doorlooptijd: 1-3 werkdagen per template

### 3.7 Webhook endpoint (server-side)

- Voor inbound berichten + delivery confirmations
- HTTPS endpoint met SSL-cert
- Onze stack: Supabase edge function (`whatsapp-webhook`)
- Verify token: random string in env-var

---

## 4. Technische integratie — code-impact

### 4.1 Nieuwe edge function: `whatsapp-publish`

```
POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {SYSTEM_USER_ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "31612345678",
  "type": "image",
  "image": {
    "link": "https://...image.jpg",
    "caption": "AI-generated caption"
  }
}
```

### 4.2 Database aanpassingen

```sql
-- Nieuwe rij in social_accounts voor WA Business
INSERT INTO social_accounts (
  user_id, platform, platform_account_id, account_name,
  account_type, status
) VALUES (
  '<user-id>', 'whatsapp', '<phone-number-id>', 'Inclufy WA',
  'business', 'active'
);

-- Nieuwe tabel voor opt-in lijst
CREATE TABLE whatsapp_optin_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  display_name TEXT,
  optin_at TIMESTAMPTZ DEFAULT NOW(),
  optout_at TIMESTAMPTZ,
  source TEXT, -- bv. "amos-website", "demo-form"
  UNIQUE(user_id, phone_number)
);
```

### 4.3 PostReview UI update

- Nieuwe WhatsApp tab in PostReview
- Picker: kies "Manueel delen" (Pad A) of "Cloud API broadcast" (Pad B)
- Bij Cloud API: toon recipient count + opt-in lijst-status

### 4.4 Settings update

- Nieuwe "WhatsApp Business" sectie in Settings
- Toon: phone number, status (verified / pending), opt-in lijst beheer
- Verbinden = check Meta business + display name + phone number IDs

---

## 5. Compliance & GDPR

### 5.1 Opt-in vereist

WhatsApp Cloud API vereist **expliciete opt-in van de ontvanger** vóór elk bericht. Geen opt-in = account ban.

Opt-in mechanismen:
1. Webform op inclufy.com waar bezoeker phone + checkbox "Ja, ik wil WA-updates"
2. Tijdens demo-aanmelding extra checkbox
3. Bestaande klanten: éénmalige opt-in mail met link

### 5.2 Opt-out

Elke marketing-template moet "STOP om af te melden" bevatten. AMOS-webhook luistert op inbound "STOP" → markeert `optout_at` in DB → blokkeert verdere sends.

### 5.3 Privacy Policy update

Sectie toevoegen aan inclufy.com/privacy:

```
2.8 WhatsApp Business communicatie
Wanneer u zich aanmeldt voor WhatsApp-updates van Inclufy via AMOS:
- Wij slaan uw telefoonnummer + opt-in datum op
- Berichten worden verzonden via Meta WhatsApp Cloud API
- U kunt op elk moment "STOP" sturen om af te melden
- Phone numbers worden niet gedeeld met derden, alleen verwerkt door Meta voor verzending
```

---

## 6. Kosten-inschatting

### Setup eenmalig

| Item | Kosten |
|---|---|
| KYB verificatie | €0 |
| Phone number (VoIP, SIPgate) | €6,99/mo doorlopend |
| Display name approval | €0 |
| Eerste 5 templates | €0 |
| Dev-werk (40 uur) | €4000-€6000 (intern) |

### Doorlopend per maand (bij gemiddeld gebruik)

| Volume | Marketing kosten | Utility kosten | Service-window |
|---|---|---|---|
| 100 conversaties/mo | €0,80 | €0,40 | Gratis (eerste 1000 user-initiated) |
| 1000 conversaties/mo | €8 | €4 | Gratis |
| 10.000 conversaties/mo | €80 | €40 | €0 boven 1000 |

(NL marketing tarief €0,008/conv. NL utility €0,004/conv. — peildatum mei 2026, controleer bij implementatie.)

### Eerste-jaar TCO (geschat)

- Setup + dev: €5000
- Phone number: €84
- API: €100-€500 (afhankelijk volume)
- **Totaal jaar 1: €5184 - €5584**

---

## 7. Roadmap (post-launch)

| Sprint | Werk | Lever |
|---|---|---|
| Week 22 | KYB-aanvraag + VoIP-nummer aanvragen | Verificatie pending |
| Week 23 | Wacht op Meta verificatie | KYB approved |
| Week 24 | Phone number registratie + Display name | Phone verified |
| Week 25 | Eerste 3 templates aanvragen + edge function dev | Templates approved + code merged |
| Week 26 | Webhook + opt-in webform op inclufy.com | End-to-end test |
| Week 27 | UI integratie in PostReview + Settings | Beta release naar 5 users |
| Week 28 | Publieke beschikbaarheid + Privacy Policy update | Live |

**Total doorlooptijd:** 6-8 weken vanaf start.

---

## 8. Risico's & beslis-momenten

| Risico | Mitigatie |
|---|---|
| KYB rejectie door onduidelijke bedrijfsdocumentatie | Vooraf KvK-uittreksel + statuten + bewijs handelsadres klaar |
| Phone number permanent verbonden met WA — toekomstige wisselingen zijn duur | Documenteer keuze + procedure voor migratie |
| Account ban bij opt-in violations | Strict opt-in flow + duidelijke STOP-instructies in elke template |
| Meta API price-stijgingen | Maandelijkse review van costs in financiële rapportage |
| Lage adoptie van WA-broadcast door Inclufy klanten | Pilot met 5 klanten week 27 — ga/no-go beslissing |

---

## 9. Beslismoment voor Sami

**Vraag:** is Pad B-investering (€5k + €100/mo) gerechtvaardigd voor AMOS' use cases?

| Use case | Pad A volstaat? | Pad B nodig? |
|---|---|---|
| Inclufy team interne updates | ✅ | Nee |
| 1-op-1 klant communicatie | ✅ | Nee |
| Broadcast naar opt-in nieuwsbrief | ❌ | Ja |
| Auto-post bij elke capture | ❌ | Ja |
| Customer service replies | ⚠️ | Ja (24h response window) |

**Aanbeveling:** wacht met Pad B totdat:
1. AMOS productie launch (week 19) is stabiel
2. ≥10 klanten WA-updates expliciet vragen
3. Of: customer service via WA wordt strategisch prio

Tot die tijd: Pad A blijft default in AMOS, Pad B-skeleton kan in roadmap blijven.

---

*Dit document update zodra KYB-aanvraag wordt gestart of als de strategische prio shift.*
