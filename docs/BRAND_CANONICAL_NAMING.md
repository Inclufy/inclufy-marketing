# Brand canonical naming — Inclufy ecosystem

> Single source of truth for hoe elke sub-brand wordt geschreven, gepresenteerd, en geïdentificeerd over alle surfaces.
> Laatste herziening: 2026-05-15 (Sami Loukile)

## Beslissingen

### 1. AMOS — Marketing mobile

| Surface | Canonical |
|---------|-----------|
| **App Store / Play Store listing naam** | `AMOS` |
| **App Store subtitle** (NL) | `Event marketing AI — by Inclufy` |
| **App Store subtitle** (EN) | `Event marketing AI — by Inclufy` |
| **iOS home-screen label** | `AMOS` |
| **Permission strings** (NSCameraUsageDescription etc.) | `AMOS needs camera access to...` |
| **In-app branding** | `AMOS` (logo + wordmark) |
| **Marketing copy** | `AMOS` (uppercase, niet "Amos" of "amos") |
| **LinkedIn page** | `AMOS` |
| **Brand-pairing** | `AMOS by Inclufy` in sales / pitch contexts |

**NIET veranderen** (legacy technische identifiers — App Store + analytics breekt):
- Bundle ID: `com.inclufy.go`
- Expo slug: `inclufy-go`
- URL scheme: `inclufy-go://`
- Storage keys: `inclufy_go_biometric_enabled` etc.
- Repo name: `inclufy-marketing-mobile`

Rationale: 289 builds + tienduizenden user-installs leven onder `com.inclufy.go`. Bundle-ID wijzigen = nieuwe App Store listing + alle bestaande users opnieuw laten installeren. AMOS = marketing-naam, `inclufy.go` = technisch erfgoed.

### 2. ProjeXtPal — Projects platform

| Surface | Canonical |
|---------|-----------|
| **Product naam** | `ProjeXtPal` (X uppercase, één woord) |
| **NIET** | `ProjextPal`, `Projextpal`, `Project Pal`, `Projext Pal` |
| **URL** | `projextpal.com`, `app.projextpal.com` |
| **Bundle ID / repo** | bestaand laten (technisch) |
| **LinkedIn page** | rename "ProjextPal" → `ProjeXtPal` (openstaand 2026-05-15) |

### 3. Inclufy Solutions (was: Inclufy-AI)

Werkt **optioneel** zoals beslist 2026-05-07. Houdt de 4 productlijnen Finance, Ignite, Hub, Connect bij elkaar:

| Component | Canonical |
|-----------|-----------|
| **LinkedIn page** | `Inclufy Solutions` (rename open van "Inclufy-AI") |
| **Marketing copy** | `Inclufy Solutions` (paraplu over Finance / Ignite / Hub / Connect) |

### 4. Inclufy Finance, Ignite, Hub, Connect

Sub-products onder de "Inclufy Solutions" paraplu. Vandaag NOG geen aparte LinkedIn pages — publiceren onder `Inclufy Solutions` page.

| Sub-product | Canonical |
|-------------|-----------|
| Finance | `Inclufy Finance` (twee woorden) |
| Ignite | `Inclufy Ignite` |
| Hub | `Inclufy Hub` |
| Connect | `Inclufy Connect` |

### 5. Academy

| Surface | Canonical |
|---------|-----------|
| Product naam | `Inclufy Academy` |
| LinkedIn page | `Inclufy Academy` |

### 6. Consulting

| Surface | Canonical |
|---------|-----------|
| Product naam | `Inclufy Consulting` |
| LinkedIn page | `Inclufy Consulting` |

### 7. Ecosystem hoofdpage

| Surface | Canonical |
|---------|-----------|
| **LinkedIn hoofdpage** (vandaag) | `Inclufy_Ecosystem` (178 followers, sinds 2026-05-07) |
| **Marketing copy / brand book** | `Inclufy` (zonder underscore) |
| **Eventueel later** | rename naar `Inclufy` als volume justifies risico van follower-loss |

## Niet-Inclufy pages

| Page | Decision |
|------|----------|
| LEADERS NETWORK | Out of Inclufy ecosystem scope, leave alone |
| PROQURELY (legacy) | Niet gebruiken; geen actieve communicatie |
| ePROCURE (legacy) | Niet gebruiken; geen actieve communicatie |

## Wanneer dit document updaten

- Nieuwe sub-brand toegevoegd (bv. Inclufy Mobility, Inclufy Health, etc.)
- LinkedIn page rename uitgevoerd → update ✅
- App Store listing edit → update voorbeeldsubtitle hier
- Brand-book revisie

## Praktische impact 2026-05-15

Op vandaag actief gewijzigd:
- ✅ `app.json` permission strings: `Inclufy GO needs camera` → `AMOS needs camera` (en 12 andere)
- ✅ `PLAY_STORE_LISTING.md`: 18 occurrences `InclufyGO` → `AMOS`
- ✅ `app.json` `privacyPolicyUrl` + `supportUrl` verplaatst van `extra.{}` naar top-level (anders leest App Store Connect ze niet)

Nog openstaand (handmatig in dashboards):
- LinkedIn page "ProjextPal" → `ProjeXtPal` (30 sec)
- App Store Connect listing-tekst: subtitle aanpassen naar "Event marketing AI — by Inclufy" indien anders
- (Optioneel) LinkedIn page "Inclufy-AI" → `Inclufy Solutions`
