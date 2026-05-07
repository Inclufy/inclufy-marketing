# Meta App Review — Voice-Over Script (read-along)

**Doel:** Lees dit script woord-voor-woord tijdens screen-recording. Eén take, geen edit — Meta-reviewers letten op natuurlijkheid.
**Totale lengte:** 4:15 min. **Taal:** Engels.
**Toon:** Rustig, professioneel, niet verkopend. Spreek alsof je het uitlegt aan een collega.

---

## 🎙️ Pre-recording: 30-seconden warm-up

Lees dit eerst hardop (wordt niet opgenomen) om je stem warm te maken:

> "AMOS — Autonomous Marketing OS. Sami Loukile, Inclufy BV. pages_manage_posts. instagram_content_publish. business_management."

Dan **diepe ademteug → start recording → wacht 2 sec → start voice-over.**

---

## 🎬 Scene 1 — Introduction [0:00–0:20]

**On screen:** AMOS app icon op iPhone home screen → tap → app opens → Home screen of AMOS.

**Voice-over:**

> "Hi, I'm Sami Loukile, founder of Inclufy BV, based in Almere, Netherlands.
>
> This is AMOS — our event-based marketing app for small and mid-sized businesses. In the next four minutes I'll demonstrate the Facebook Page and Instagram Business publishing flows for which we're requesting App Review approval."

⏱ Pause 1 sec → ga door.

---

## 🎬 Scene 2 — Connected accounts [0:20–0:50]

**On screen:** Tap **Instellingen** (Settings) → scroll to **Social Media** → list with all 4 connected accounts.

**Voice-over:**

> "After signing in, users connect their social accounts in Settings.
>
> Here you see four connected accounts: Facebook page Inclufy Ecosystem, Instagram Business at_inclufy_ecosystem, LinkedIn personal, and LinkedIn company page Inclufy_Ecosystem.
>
> Each account was added through a consent-based OAuth flow with explicit user approval per scope."

⏱ Pause 2 sec op het Settings-scherm zodat reviewer kan lezen.

---

## 🎬 Scene 3 — OAuth consent [0:50–1:20]

**On screen:** Tap Disconnect on Facebook → confirm → tap Reconnect → Meta consent screen opens → **zoom/highlight the scope list**.

**Voice-over:**

> "When connecting Facebook, the Meta consent screen shows exactly which scopes we request: pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish, and business_management.
>
> Nothing is hidden. The user can deny any individual scope or cancel the flow entirely. We never request scopes outside this set."

**On screen:** Tap **Allow** → return to AMOS → Inclufy Ecosystem page now appears.

⏱ Pause 1 sec.

---

## 🎬 Scene 4 — Capture and AI generation [1:20–2:00]

**On screen:** Back to home → tap **+** → choose photo from library (use the prepared test photo) → AI generation runs → PostReview opens with 4 platform tabs.

**Voice-over:**

> "AMOS' core differentiator is on-site capture. I take a photo at a partner event, add a brief note, and our AI generates platform-optimized post drafts in under ten seconds.
>
> Each platform — Facebook, Instagram, LinkedIn, WhatsApp — gets its own tab with appropriate length, tone, and hashtags. Nothing is published yet."

**On screen:** Switch between the four tabs to show the different drafts.

---

## 🎬 Scene 5 — Account picker [2:00–2:40]

**On screen:** On the Facebook tab, tap **Publiceer** (Publish) → account picker modal appears showing Inclufy Ecosystem with logo.

**Voice-over:**

> "Before any publish, AMOS shows an account picker. Even with a single connected page, we never auto-publish — the user must consciously tap the destination.
>
> This per-post confirmation is one of our six anti-abuse measures. There is no bulk auto-posting, no scheduled-without-review, and no implicit destination selection."

**On screen:** Tap Inclufy Ecosystem → confirmation dialog → confirm.

---

## 🎬 Scene 6 — Publish to Facebook [2:40–3:20]

**On screen:** Loading spinner ~3 sec → success alert "✅ Gepubliceerd" → switch to Mac browser tab `facebook.com/inclufyecosystem` → refresh → **the post is live**.

**Voice-over:**

> "Behind the scenes, AMOS uses pages_manage_posts to create a Photo node on the page with the page access token.
>
> The post is now live on facebook.com/inclufyecosystem, attributed to the Inclufy Ecosystem page brand — not to my personal Facebook profile. The pages_show_list and business_management scopes were used earlier to find the page; pages_read_engagement will fetch its likes and comments later."

⏱ Pause 1 sec op de live post.

---

## 🎬 Scene 7 — Publish to Instagram [3:20–4:00]

**On screen:** Switch back to AMOS → IG tab → tap Publiceer → picker shows @inclufy_ecosystem → confirm → loading ~10 sec → success.

**Voice-over:**

> "For Instagram, AMOS uses a two-step flow under instagram_content_publish.
>
> First, slash-ig-id-slash-media creates a media container with the image URL and caption. Second, slash-ig-id-slash-media-publish publishes it. The instagram_basic scope is used to display the handle and profile picture in the picker."

**On screen:** Switch to Mac browser → `instagram.com/inclufy_ecosystem` → refresh → **post is live**.

> "The post is now live on the Instagram Business profile."

⏱ Pause 1 sec.

---

## 🎬 Scene 8 — Engagement metrics + disconnect [4:00–4:30]

**On screen:** Back to AMOS → Library tab → tap the just-published Facebook post → engagement section shows likes/comments/shares.

**Voice-over:**

> "After publishing, pages_read_engagement fetches likes, comments, and shares so users can review their performance without leaving the app. We display this only to the user who created the post."

**On screen:** Settings → Social Media → tap menu on Facebook row → **Disconnect** → confirm → row removed.

> "Finally, disconnecting in Settings revokes our server-side OAuth tokens within thirty seconds and purges all cached page metadata. Users have full control of their data at all times."

---

## 🎬 Scene 9 — Closing [4:30–4:50]

**On screen:** AMOS app icon op home screen, OR Inclufy.com landing page on Mac.

**Voice-over:**

> "AMOS is built for small and mid-sized businesses across the Netherlands and the broader EU who need a professional brand presence without dedicated social media staff.
>
> Multi-channel publishing through the Meta APIs is the core of our value proposition. Thank you for reviewing our application."

⏱ Stop recording.

---

## ✅ Per-permission coverage check

Vóór upload, controleer dat élke permission expliciet wordt benoemd:

| Permission | Scene | Voice-over fragment |
|---|---|---|
| `pages_show_list` | 3, 6 | "scopes we request: pages_show_list..." + "...pages_show_list and business_management scopes were used earlier..." |
| `pages_manage_posts` | 3, 6 | "...pages_manage_posts..." + "AMOS uses pages_manage_posts to create a Photo node..." |
| `pages_read_engagement` | 3, 8 | "...pages_read_engagement..." + "pages_read_engagement fetches likes, comments, and shares..." |
| `instagram_basic` | 3, 7 | "...instagram_basic..." + "The instagram_basic scope is used to display the handle and profile picture..." |
| `instagram_content_publish` | 3, 7 | "...instagram_content_publish..." + "AMOS uses a two-step flow under instagram_content_publish..." |
| `business_management` | 3, 6 | "...business_management..." + "...pages_show_list and business_management..." |

Als één scope ontbreekt → re-record alleen die scene en knip in iMovie.

---

## 🎯 Tips voor de opname

1. **Spreek langzamer dan natuurlijk** — reviewers zijn niet altijd native English. Doel: 130 woorden/min, niet 160.
2. **Pauzeer 1 sec na elke zin** — geeft reviewer tijd om mee te lezen op het scherm.
3. **Gebruik de iPhone in landscape OF portrait — niet wisselen** — kies één en blijf consistent.
4. **Niet-storen aan op iPhone** — geen popup-notificaties.
5. **Test eerst met 30-sec opname** — luister terug op laptop-speakers, check of stem helder is.
6. **Eén take, niet streven naar perfectie** — kleine "uhm" is normaal en authentiek. Reviewers zijn allergisch voor té-perfecte voice-overs (vermoeden vaak fake demo).

---

## 📤 Post-recording

1. **Trim** in iMovie tot 4:30 max
2. **Add lower-third title cards** voor elk Scene-nummer (helpt scannen voor reviewer)
3. **Zoom-in 0.5 sec** op de scope-lijst in Scene 3 (Cmd+Shift+Z in iMovie)
4. **Export** 1080p H.264, max 100 MB
5. **Upload YouTube → Visibility: Unlisted** (NIET Public — review-only)
6. **Test URL in incognito** voordat je 'm in Meta form plakt
7. **Plak dezelfde URL bij élke van de 6 permissions** in de Meta App Review submission form

---

*Dit script bevat 100% van wat Meta-reviewers nodig hebben om alle 6 permissions goed te keuren. Geen extra scenes nodig. Zeg het script woord-voor-woord, of parafraseer in eigen woorden — kies wat natuurlijker klinkt.*
