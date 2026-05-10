# Native push + Approval-gate — hand-off (2026-05-10)

This session shipped 3 things on top of the email pipeline from earlier today:

1. **Native push notifications** for AMOS (full client + server) and Finance (server only — client wiring deferred)
2. **AMOS approval-gate** — server-side workflow for non-admin team-members to submit posts that require admin sign-off before publish
3. **Capture-to-Ad Boost** — `META_ADS_API_LIVE` flag flipped to `true`, but mobile rebuild + scope addition still needed for live testing

---

## 1. Native Push — what's live

### AMOS

| Component | Path | Status |
|---|---|---|
| `user_devices` table + RLS | [migration](../supabase/migrations/20260510160000_user_devices_push.sql) | ✅ live on DB |
| `register-push-token` edge fn | [code](../supabase/functions/register-push-token/index.ts) | ✅ deployed (verify_jwt=true) |
| `send-push` edge fn (Expo Push API + auto-suppress on DeviceNotRegistered) | [code](../supabase/functions/send-push/index.ts) | ✅ deployed (verify_jwt=false) |
| DB trigger: `go_notifications` INSERT → `send-push` | applied via temp fn | ✅ live |
| `usePushNotifications` hook | [code](../src/hooks/usePushNotifications.ts) | ✅ wired in [App.tsx](../App.tsx) |

### Finance

| Component | Path | Status |
|---|---|---|
| `user_devices` table + RLS | `supabase/migrations/20260510160000_user_devices_push.sql` | ✅ live |
| `register-push-token` + `send-push` edge fns | mirrored from AMOS | ✅ deployed |
| DB trigger: `notifications` INSERT → `send-push` | applied | ✅ live |
| Mobile/web client integration | not done | ❌ TODO |

### To finish Finance native push

Copy [usePushNotifications.ts](../src/hooks/usePushNotifications.ts) to the Finance mobile codebase
(`/Users/samiloukile/Projects/inclufy-auto-finance-main/mobile/` or wherever Finance Expo
app lives) and call it from the app entry point with the session prop. The
edge functions and tables are already waiting.

For the **Finance web app**: web push needs a different setup (VAPID keys + service worker).
Skip unless explicitly needed — the in-app NotificationCenter already polls every 30s.

### Smoke test (after the next AMOS TestFlight build lands)

1. Open the AMOS app, sign in
2. Accept the iOS notification permission prompt when it appears
3. Run from terminal:
   ```bash
   SERVICE_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGt1Z2Zxem14eWR4bmx4cW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ3NjkwMSwiZXhwIjoyMDgyMDUyOTAxfQ.gVkz-16WMgZXTAxv2jGF2OU-hXmMWMZgpUJn_cif1gQ"

   # Verify your token landed in user_devices
   curl -sS "https://mpxkugfqzmxydxnlxqoj.supabase.co/rest/v1/user_devices?select=user_id,platform,last_seen_at&order=last_seen_at.desc&limit=5" \
     -H "apikey: $SERVICE_JWT" -H "Authorization: Bearer $SERVICE_JWT"

   # Direct push test (replace YOUR_USER_ID)
   curl -sS -X POST "https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/send-push" \
     -H "Content-Type: application/json" \
     -d '{"user_ids":["YOUR_USER_ID"],"title":"Test 🚀","body":"Push works!"}'
   ```
4. Lock screen → push banner should appear within 1–2 seconds
5. Inserting a `go_notifications` row also auto-fires push (via DB trigger)

---

## 2. AMOS Approval-gate — what's live

### Server (deployed + tested)

| Piece | Path | Status |
|---|---|---|
| Migration: `requires_post_approval` flag on `organizations` + audit cols on `go_posts` + extended notif types | [migration](../supabase/migrations/20260510170000_post_approval_gate.sql) | ✅ live |
| `submit-post-for-approval` edge fn | [code](../supabase/functions/submit-post-for-approval/index.ts) | ✅ deployed |
| `process-post-approval` edge fn | [code](../supabase/functions/process-post-approval/index.ts) | ✅ deployed |
| `v_pending_post_approvals` view | created | ✅ |
| `org_admin_user_ids(org_id)` helper | created | ✅ |
| **Publish gate enforcement** | already enforced — `publish-social` only allows status='approved' | ✅ implicit |

### State machine

```
   draft ──[submit-post-for-approval]──→ in_review
                                            │
              ┌─────────────────────────────┴─────────────────────────┐
   [process-post-approval: approve]              [process-post-approval: reject]
              │                                       │
              ▼                                       ▼
          approved ──[publish-social]──→ published   draft (with rejection_reason)
```

### How to enable per organization

```sql
update public.organizations
   set requires_post_approval = true
 where id = '<org-uuid>';
```

(This currently has no UI toggle. Add one in SettingsScreen for org admins later.)

### Testing the API directly (with a real user JWT — get one by signing in)

```bash
USER_JWT="<paste your AMOS-app session token>"

# Submit a draft post (must be your own + status=draft)
curl -sS -X POST "https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/submit-post-for-approval" \
  -H "Authorization: Bearer $USER_JWT" -H "Content-Type: application/json" \
  -d '{"post_id":"<uuid>","note":"Klaar voor review"}'

# Approve (admin)
curl -sS -X POST "https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/process-post-approval" \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"post_id":"<uuid>","decision":"approve"}'

# Reject
curl -sS -X POST "https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/process-post-approval" \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"post_id":"<uuid>","decision":"reject","reason":"Wijzig het CTA"}'
```

Each transition writes a notification row → push fires automatically (if the recipient
has a registered device).

### Client UI — what's still TODO

PostReviewScreen: when org has `requires_post_approval=true` and user is not admin:
- Replace **Publish** button with **Submit for review**
- Show rejection_reason banner if status=draft + rejection_reason is set

NotificationsScreen: handle `post_approval_needed` items with inline approve/reject buttons.

A new admin-inbox screen could query `v_pending_post_approvals` directly. Defer to next session.

---

## 3. Capture-to-Ad Boost — current state

| Item | Status |
|---|---|
| `META_ADS_API_LIVE=true` set on AMOS Supabase secrets | ✅ |
| `META_AD_ACCOUNT_ID`, `META_APP_ID`, `META_APP_SECRET` already set | ✅ |
| `boost-post` edge function redeployed for fresh env | ✅ |
| `ads_management` scope in FB OAuth flow | ❌ **NOT YET ADDED** |

To complete boost test, two-line code change still needed in
[SettingsScreen.tsx:732](../src/screens/SettingsScreen.tsx:732) and
[StepConnect.tsx:36-37](../src/components/wizard/StepConnect.tsx:36) — append `ads_management`
to the FB scope arrays. Then rebuild AMOS via EAS, reconnect FB account, and
test boost from BoostFlowScreen with €1 budget. See earlier explanation in chat.

---

## What's still open

- [ ] Apply FB OAuth scope change (`ads_management`) + AMOS rebuild for boost test
- [ ] PostReviewScreen UI for "Submit for review"
- [ ] NotificationsScreen approve/reject inline UI for `post_approval_needed`
- [ ] Org-level toggle UI for `requires_post_approval` in SettingsScreen
- [ ] Mirror `usePushNotifications` to Finance mobile app
- [ ] Resend webhook secret for live bounce-tracking (carry-over from email session)
- [ ] DMARC `p=none` → `p=quarantine` after 1–2 weeks rua-monitoring

---

## Why no UI in this session

UI changes (PostReviewScreen, SettingsScreen, NotificationsScreen) require a new
mobile build to test, and rebuilds eat real time. Server-side workflow being live
means the mobile/web client teams can build to a stable contract. Total
session output: 1 migration + 5 edge functions deployed + 1 hook + App.tsx wiring,
across 2 Supabase projects.
