# AMOS — Feature Inventory voor Marketing Website

**Datum**: 2026-05-04
**Bron**: code-scan van `/Users/samiloukile/InclufyMarketing` (mobile, 56 screens) + `web/src/app/(app)/` (web, 21+ pagina's)
**Doel**: input voor herschrijven van marketing.inclufy.com

**Totaal**: 28 functionele features, 8 thema's.

---

## 1. Strategie & Planning

| Feature | Omschrijving | Rol | Pijn | Code Ref |
|---|---|---|---|---|
| Marketing Strategy Planner | Definieer doelen, budget, posting-frequentie, channel-mix per week | Marketer / Manager | Geen centraal strategieplan = inconsistentie | `web/src/app/(app)/strategy/page.tsx` |
| Campaign Management | Multi-channel campagnes maken/beheren met status (draft/active/completed) | Marketer | Ad-hoc creatie zonder structuur | `web/src/app/(app)/campaigns/page.tsx` |
| Event Setup & Management | Events met kanalen, doelen, hashtags, tracking per event | Event Marketer | Geen gecentraliseerd event-management | `src/screens/EventSetupScreen.tsx` |
| Budget Monitoring | Realtime budget per channel + overschrijdingsalerts | Manager | Onzichtbare budget leaks over kanalen | `src/screens/BudgetMonitorScreen.tsx` |

## 2. Content Creatie & Voorbereiding

| Feature | Omschrijving | Rol | Pijn | Code Ref |
|---|---|---|---|---|
| AI Copilot | Conversationele AI voor content-ideeën, strategische tips, LinkedIn-post-generatie | Marketer | Lege-pagina-syndroom | `web/src/app/(app)/copilot/page.tsx` |
| Post Review & Editing | Review, annotate, edit posts per event, batch publishing | Marketer | Manueel review zonder versiecontrole | `src/screens/PostReviewScreen.tsx` |
| Brand Kit Manager | Centraal merkbeheer (kleuren, fonts, tagline) per account | Manager | Brand-inconsistentie door losse assets | `web/src/app/(app)/brand-kit/page.tsx` |
| Library / Content Hub | Herbruikbare templates (NL/EN/FR) met lifecycle | Marketer | Content-duplication, copy-paste workflow | `src/screens/LibraryScreen.tsx` + `web/.../library/page.tsx` |
| Product Catalog | Product/service-info voor mention in social posts | Product Manager | Inconsistente productinfo in posts | `web/src/app/(app)/products/page.tsx` |

## 3. Publicatie & Automatisering

| Feature | Omschrijving | Rol | Pijn | Code Ref |
|---|---|---|---|---|
| Multi-Channel Publishing | Eén actie → LinkedIn + Instagram + Facebook + TikTok + X + WhatsApp | Marketer | Handmatig per kanaal = veel fouten | `src/screens/AllPostsScreen.tsx` + `web/.../posts/page.tsx` |
| Smart Scheduling | Inplannen op optimal timing per kanaal, status-tracking | Marketer | Suboptimale post-times verlagen reach | `web/src/app/(app)/posts/page.tsx` |
| Automation Workflows | Trigger-based automations (bv. post bij event-start) + success-tracking | Manager | Repetitieve taken | `web/src/app/(app)/automations/page.tsx` |
| WhatsApp Business Integration | Template-management + recipient-list voor WhatsApp Cloud API | Marketer | Aparte WhatsApp workflow buiten social | `src/screens/WhatsAppSettingsScreen.tsx` |
| Post Duplication & Batch Ops | Duplicate / bulk-actions op meerdere posts | Marketer | One-by-one edits voor varianten | `src/screens/AllPostsScreen.tsx` |

## 4. Analytics & Intelligence

| Feature | Omschrijving | Rol | Pijn | Code Ref |
|---|---|---|---|---|
| Campaign ROI Dashboard | Realtime performance (costs, revenue, ROI%) per channel | Manager | Blind op marketing-ROI | `src/screens/CampaignListScreen.tsx` |
| Engagement Tracking | Likes/comments/shares per platform, gevisualiseerd | Marketer | Impact niet meetbaar | `src/screens/AllPostsScreen.tsx` |
| Opportunity Radar | AI-suggesties: trending topics, budget-gaps, content-gaps, channel-gaps | Manager | Geen quick-win zicht | `src/screens/OpportunityRadarScreen.tsx` |
| Event Intelligence | Score events op audience-fit, ROI, networking-value | Event Marketer | Trial-and-error eventkeuze | `src/screens/EventIntelligenceScreen.tsx` |
| Analytics Overview | Cross-campaign KPI-dashboard | Manager | Versnipperd performance-zicht | `web/src/app/(app)/analytics/page.tsx` |

## 5. Lead & Contact Management

| Feature | Omschrijving | Rol | Pijn | Code Ref |
|---|---|---|---|---|
| Lead Capture | Manual entry (naam, email, company, source-tags) met source-tracking | Sales | Geen centraal lead-repo | `src/screens/LeadCaptureScreen.tsx` |
| Smart Lead Scoring | QR + business-card scanning + geo-tagging | Event Marketer | Trage manual entry op events | `src/screens/SmartLeadScreen.tsx` |
| Event Scanner / Badge Reader | Scan attendee-QRs voor bulk contact-import | Event Organizer | Handmatige namenlijsten | `src/screens/EventScannerScreen.tsx` |
| Contacts / CRM | Centraal contact-DB met zoek, filter, bulk-import, notes | Sales / Marketer | Contacts verspreid over email/Excel/LinkedIn | `web/src/app/(app)/contacts/page.tsx` |
| Contact Stats | Aggregated metrics (bron, totaal, kwaliteit) | Sales | Lastig contactkwaliteit beoordelen | `web/.../contacts/page.tsx` |

## 6. Team & Collaboration

| Feature | Omschrijving | Rol | Pijn | Code Ref |
|---|---|---|---|---|
| Team Member Management | Invite, rollen (editor/contributor/viewer) per event + org | Manager | Geen granular access-control | `src/screens/TeamManageScreen.tsx` + `web/.../team/page.tsx` |
| Team Directory | Centraal team-overzicht met expertise-tags | Manager | Lastig juiste persoon vinden | `web/src/app/(app)/team/page.tsx` |
| Role-Based Access Control | Editor/Contributor/Viewer per asset | Manager | Iedereen ziet alles = security-risk | `src/screens/TeamManageScreen.tsx` |

## 7. Integraties & Platformen

| Feature | Omschrijving | Rol | Pijn | Code Ref |
|---|---|---|---|---|
| Social Account Linking | OAuth: LinkedIn, Facebook, Instagram, TikTok, X. Manual: Telegram | Marketer | Account-switching = fouten | `web/src/app/(app)/integrations/page.tsx` |
| Event Organizer Integration | Sync met event-organisers voor attendee-data | Event Marketer | Manual event-data-entry | `src/screens/FollowedOrganizersScreen.tsx` |
| Calendar Sync | Import/export posts/events naar iCal | Marketer | Dubbel calendar-beheer | `web/src/app/(app)/calendar/page.tsx` |
| Proposal / Pitch Module | AI-assisted proposal-generation voor agencies | Agency | Manual pitch-decks | `web/src/app/(app)/proposals/page.tsx` |

## 8. Overig

| Feature | Omschrijving | Rol | Pijn | Code Ref |
|---|---|---|---|---|
| Notifications & Alerts | Realtime notifs voor post-failures, budget-warnings, engagement-milestones | All | Critical issues laat opmerken | `web/src/app/(app)/notifications/page.tsx` |
| Demo Environment | Sandbox voor training/onboarding | Admin / Trainer | Geen safe training-space | `src/screens/DemoEnvironmentScreen.tsx` |
| Organization Settings | Workspace config, branding, member-roles, integrations | Admin | Scattered settings | `src/screens/OrganizationScreen.tsx` |
| Onboarding Flow | Interactive product-tour voor new users | User | Steile learning curve | `src/screens/OnboardingScreen.tsx` |

---

## 🎯 Top 5 Meest Verkoopbare Features

1. **Multi-Channel Publishing** — Eén klik → LinkedIn + Instagram + Facebook tegelijk
2. **AI Copilot** — ChatGPT-stijl content-ideation + post-generatie (time-to-content ÷ 10)
3. **Event Intelligence** — AI scoort events op fit & ROI vóór je een kaartje koopt
4. **Campaign ROI Dashboard** — Realtime spend ↔ revenue tracking
5. **Lead Scanning** — QR + visitekaart-scan + auto-scoring (event follow-up ÷ 8)

## Top 5 Onderbenutte Differentiators (op website nog niet uitgelicht)

1. **Opportunity Radar** — AI ziet content-gaps, budget-leaks, channel-gaps proactief
2. **Brand Kit central** — single-source-of-truth voor kleuren/fonts/tagline (anti-drift)
3. **Multi-locale Content Library** — NL/EN/FR templates lifecycle
4. **WhatsApp Business native** — geen losse Twilio/MessageBird setup
5. **Granular RBAC per asset** — agency-veilig: client A ziet niet wat client B doet
