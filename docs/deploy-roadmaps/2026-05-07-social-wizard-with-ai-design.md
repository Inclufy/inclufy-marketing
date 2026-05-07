# Social Media Connection Wizard + AI Integration — Design

**Datum:** 2026-05-07
**Doel:** Vervangen van de huidige Alert.alert-popup in `SettingsScreen.tsx` door een gegidste wizard met AI-assistentie. Lost 5 huidige UX-pijnen op + voegt 5 AI-features toe die AMOS' core differentiator versterken.
**Status:** Design — nog niet geïmplementeerd. Plan voor **post-launch sprint week 20**.

---

## 1. Pijn in huidige flow

Onderzocht in `SettingsScreen.tsx:529-573` + audit van vandaag:

| Pijn | Voorbeeld | Gevolg |
|---|---|---|
| **Te technische taal** | "OAuth", "scopes", "account_type='business'" | Gebruiker snapt niet wat te kiezen |
| **Geen prerequisites uitleg** | IG vereist Business + FB-koppeling, niet vermeld | OAuth start, mislukt halverwege, gebruiker raakt verloren |
| **Mistagged accounts onzichtbaar** | IG personal-row in picker → silent fail bij publish | Gebruiker denkt "AMOS is broken" |
| **TikTok/Snapchat in UI maar non-functional** | "Binnenkort"-alert na klik | Verwarring + valse hoop |
| **Geen "next steps" na connect** | Account verschijnt in lijst, end | Gebruiker weet niet wat nu |

---

## 2. Wizard-flow (5 stappen)

### Stap 1 — Welkom + Doel

```
┌─────────────────────────────────────────┐
│  📱 Verbind je social accounts          │
│                                         │
│  Welke kanalen wil je gebruiken?        │
│                                         │
│  ☑ Facebook                             │
│  ☑ Instagram                            │
│  ☑ LinkedIn                             │
│  ☐ TikTok       ⚠️ Beta                 │
│  ☐ Snapchat     🔒 Binnenkort            │
│                                         │
│  💡 Tip: voor [B2B] raden we           │
│     LinkedIn + Instagram aan            │
│                                         │
│  [Verder →]                             │
└─────────────────────────────────────────┘
```

**AI-feature 1: smart pre-select**
- Check `qr_profiles.industry` + `qr_profiles.audience` velden
- Stuur naar `/api/ai/onboarding-recommend` → returns geprioriteerde platform-lijst
- Pre-check de aanbevolen platforms

### Stap 2 — Status check per platform

```
┌─────────────────────────────────────────┐
│  Status van je accounts                 │
│                                         │
│  ✅ Facebook                            │
│     Inclufy Ecosystem (Pagina)          │
│                                         │
│  ⚠️ Instagram                           │
│     Niet verbonden — nodig voor IG-post │
│     [Verbind nu →]                      │
│                                         │
│  ✅ LinkedIn                            │
│     Sami Loukile (persoonlijk)          │
│     ⏳ Bedrijfspagina's wachten op       │
│        LinkedIn-goedkeuring             │
│                                         │
│  [Volgende →]                           │
└─────────────────────────────────────────┘
```

**AI-feature 2: prerequisite explanation**
- Per niet-verbonden platform: AI genereert plain-language uitleg
- Bv. IG: *"Je hebt een Instagram Business of Creator account nodig, gekoppeld aan een Facebook Pagina. Geen Business-account? Open IG → Instellingen → Account → Schakel naar professioneel."*
- Endpoint: `/api/ai/prerequisite-explain` (cache 24u, niet per request)

### Stap 3 — Connect (per platform)

```
┌─────────────────────────────────────────┐
│  Instagram verbinden                    │
│                                         │
│  We openen Facebook (IG gebruikt FB     │
│  voor authenticatie). Hier zie je wat   │
│  we vragen:                             │
│                                         │
│  • pages_manage_posts                   │
│    → Posten op je Pagina's              │
│  • instagram_basic                      │
│    → Naam + foto van je IG zien         │
│  • instagram_content_publish            │
│    → Posts publiceren namens jou        │
│                                         │
│  ❓ Wat betekent dit?  [AI-uitleg]      │
│                                         │
│  [Open Facebook-verbinding →]           │
└─────────────────────────────────────────┘
```

**AI-feature 3: scope explanation on demand**
- Bij tap op "AI-uitleg": modal met plain-language uitleg per scope
- "We vragen `instagram_basic` om je naam + foto te tonen in de account-picker, niet om je followers/messages te lezen."
- Endpoint: `/api/ai/scope-explain` (static cached, geen LLM-call elke keer)

### Stap 4 — Verify + Brand Voice analyse (optioneel)

```
┌─────────────────────────────────────────┐
│  ✅ Verbonden!                          │
│                                         │
│  We vonden:                             │
│  • Facebook page Inclufy Ecosystem      │
│  • Instagram Business                   │
│    @inclufy_ecosystem                   │
│                                         │
│  ──────────────────────────────────     │
│                                         │
│  💡 Wil je dat AMOS je merkstem leert? │
│     We scannen je laatste 20 posts en   │
│     bouwen een stijlprofiel. Resultaat: │
│     AMOS-gegenereerde posts klinken     │
│     als jou.                            │
│                                         │
│  [Ja, scan mijn posts]  [Sla over]      │
└─────────────────────────────────────────┘
```

**AI-feature 4: brand voice analysis (de game-changer)**
- Endpoint: `/api/ai/brand-voice-analyze`
- Input: laatste 20 posts van connected page (via `/v20.0/{page-id}/posts`)
- Output:
  ```json
  {
    "tone": "professional-warm",
    "avg_post_length": 280,
    "common_hashtags": ["#inclufy", "#diversiteit", "#AI"],
    "post_structure": "story-then-cta",
    "emoji_usage": "moderate",
    "voice_descriptors": ["mensgericht", "data-gedreven", "Nederlandstalig"]
  }
  ```
- Schrijft `brand_voice_profile` JSON naar `qr_profiles.brand_voice` of nieuwe tabel `brand_voice_profiles`
- Wordt **geïnjecteerd in de AI post-generation prompt** — directe uplift in output-kwaliteit
- Privacy-vriendelijk: alleen op user-eigen content, geen 3rd-party data

### Stap 5 — Eerste post / Klaar

```
┌─────────────────────────────────────────┐
│  🎉 Je bent klaar!                      │
│                                         │
│  Probeer direct een post te maken:      │
│                                         │
│  [📸 Maak nu een post]                  │
│                                         │
│  Of                                     │
│                                         │
│  [Sluit wizard]                         │
└─────────────────────────────────────────┘
```

---

## 3. AI features samenvatting

| # | Feature | Endpoint | Frequency | Cost |
|---|---|---|---|---|
| 1 | Onboarding platform-aanbeveling | `/api/ai/onboarding-recommend` | 1× per nieuwe user | Low (1 LLM call) |
| 2 | Prerequisite uitleg per platform | `/api/ai/prerequisite-explain` | Cached 24h | Very low |
| 3 | Scope plain-language uitleg | `/api/ai/scope-explain` | Static cached | Zero |
| 4 | **Brand voice analyse** | `/api/ai/brand-voice-analyze` | 1× per connect | Medium (vision-able LLM, 20 posts) |
| 5 | OAuth-error troubleshooting | `/api/ai/connection-troubleshoot` | On error | Low |

**Totale extra LLM-kosten per user:** ~$0.05-0.15 (eenmalig bij wizard-doorloop), brand voice analyse is grootste post.

---

## 4. State machine

```typescript
type WizardStep = 'goal' | 'status' | 'connect' | 'verify' | 'brandVoice' | 'firstPost' | 'done';

type WizardState = {
  step: WizardStep;
  selectedPlatforms: PlatformKey[];
  connectionStatuses: Record<PlatformKey, 'pending' | 'connected' | 'failed' | 'skipped'>;
  brandVoiceProfile: BrandVoiceProfile | null;
  errorContext: string | null;
};

// Transitions
const transitions: Record<WizardStep, (state, action) => WizardStep> = {
  goal: (s, a) => a.type === 'NEXT' ? 'status' : s.step,
  status: (s, a) => a.type === 'NEXT' ? 'connect' : 'goal',
  connect: (s, a) =>
    a.type === 'CONNECTED' && allDone(s) ? 'verify' :
    a.type === 'SKIP_PLATFORM' ? 'connect' : // try next
    a.type === 'FAILED' ? 'connect' : // show error UI
    s.step,
  verify: (s, a) => a.type === 'NEXT' ? 'brandVoice' : s.step,
  brandVoice: (s, a) =>
    a.type === 'ANALYZE_DONE' || a.type === 'SKIP' ? 'firstPost' : s.step,
  firstPost: (s, a) =>
    a.type === 'POST_NOW' ? 'done' : // navigate to LiveCapture
    a.type === 'CLOSE' ? 'done' : s.step,
  done: () => 'done',
};
```

---

## 5. Code structuur

```
src/screens/
  SocialMediaWizard.tsx          # Container + state machine
src/components/wizard/
  StepGoal.tsx                   # Stap 1
  StepStatus.tsx                 # Stap 2
  StepConnect.tsx                # Stap 3
  StepVerify.tsx                 # Stap 4 (+ brand voice)
  StepBrandVoice.tsx             # Stap 4 expand
  StepFirstPost.tsx              # Stap 5
  WizardProgress.tsx             # Top progress dots
  AIScopeExplanation.tsx         # AI modal voor scope-uitleg
src/hooks/
  useSocialWizard.tsx            # State + transitions
  useBrandVoiceAnalysis.tsx      # AI brand voice fetch
src/services/
  socialWizardAI.ts              # AI endpoint wrappers
supabase/functions/
  ai-connection-helper/index.ts  # Endpoints 1, 2, 3, 5
  ai-brand-voice-analyzer/       # Endpoint 4 (separate omdat 20-post fetch)
    index.ts
```

---

## 6. Database wijzigingen

```sql
-- Brand voice profile per user
CREATE TABLE brand_voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  tone TEXT,
  avg_post_length INT,
  common_hashtags TEXT[],
  post_structure TEXT,
  emoji_usage TEXT,
  voice_descriptors TEXT[],
  raw_analysis JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX brand_voice_profiles_user_idx ON brand_voice_profiles(user_id);

-- RLS: user kan alleen eigen profiles lezen/schrijven
ALTER TABLE brand_voice_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_brand_voice" ON brand_voice_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Wizard completion tracking (analytics)
ALTER TABLE qr_profiles
  ADD COLUMN IF NOT EXISTS wizard_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wizard_skipped_steps TEXT[];
```

---

## 7. Migratie van huidige flow

| Huidige Alert.alert popup | Wizard equivalent |
|---|---|
| Tap Facebook row in Settings | Settings → tap "Verbind accounts" → Wizard opens at Stap 1 |
| Alert option "🔗 Verbinden via OAuth" | Wizard Stap 3 (per-platform connect) |
| Alert option "✏️ Handmatig koppelen" | Verplaatst naar Settings → "Geavanceerd" sub-screen (rare flow, niet in wizard) |
| Alert option "🔌 Account ontkoppelen" | Blijft in Settings — disconnect is geen wizard-flow |

**Implementatie-strategie:** wizard naast bestaande Alert.alert. Eerst featureflag → stille A/B test → bij ≥10% conversie-uplift volledig vervangen.

---

## 8. Plan-van-aanpak (post-launch sprint week 20)

| Dag | Werk | Lever |
|---|---|---|
| Ma | DB migratie + edge function skeleton + state machine hook | `useSocialWizard` testbaar |
| Di | Stap 1, 2, 3 UI + AI scope-explanation | Wizard tot connect-stap |
| Wo | Stap 4 brand voice analyse + edge function | Brand voice profiel in DB |
| Do | Stap 5 + integratie met LiveCapture (brand voice injectie) | End-to-end demo |
| Vr | Featureflag, instrumentation, beta test 5 users | Production-ready |

**Estimated effort:** 32 dev-uren, 1 sprint week.

---

## 9. Wat dit oplost (vs. blijft bestaan)

✅ **Wel opgelost:**
- Te technische taal → vervangen door plain-language stappen
- Prerequisite uitleg ontbreekt → AI legt uit per platform
- Geen "next steps" na connect → Stap 5 met "maak post"
- IG mistagged-rows confusion → wizard verbergt deze, gebruikt alleen valide accounts
- Brand voice consistency → AI leert merkstem van bestaande posts

❌ **Niet opgelost door wizard alleen:**
- TikTok/Snapchat support (technisch werk, los project)
- LinkedIn LMDP approval (extern, blocker)
- Meta App Review approval (extern, blocker)
- OAuth token expiry (separate fix nodig — proactive refresh)

---

## 10. Risico's

| Risico | Mitigatie |
|---|---|
| AI brand voice analyse kost ~$0.10/user → schaal-issue | Optioneel ("Sla over"-knop), eenmalig per account, cache 90 dagen |
| Wizard te lang → drop-off | Stap 4 + 5 zijn skip-baar. Stap 1-3 kern (max 3 min) |
| Brand voice fetch faalt (Meta-API rate limit) | Async retry queue, niet blokkerend voor wizard-completion |
| Gebruiker raakt na wizard kwijt voor disconnect/reconnect | Disconnect blijft in Settings — niet duplikeren |

---

## 11. Conclusion

Wizard + AI lost de grootste UX-pijn op (de huidige flow is té technisch) en voegt **brand voice analyse** toe als concrete differentiator t.o.v. Buffer/Hootsuite/Later — die hebben dit niet.

**Aanbevolen prioritering post-launch:**
1. Week 20: implementeer wizard + brand voice analyse
2. Week 21: A/B test, meet conversie + brand voice uplift in AI-output
3. Week 22+: roll out naar 100% nieuwe users, sunset Alert.alert flow

Niet doen vóór go-live (week 19) — risico is te groot dat het de demo-video + reviewer-experience breekt.
