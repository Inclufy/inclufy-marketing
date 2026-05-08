# Stripe → AMOS tier sync — implementation spec for marketing.inclufy.com

**Doel:** marketing.inclufy.com (waar Stripe al draait) updateet AMOS Supabase profiles.tier zodat AMOS feature gates kan toepassen.

---

## 1. Architectuur

```
┌─────────────────────────────┐
│  marketing.inclufy.com      │
│  (Next.js + Stripe)          │
│  - /pricing page            │
│  - Stripe Checkout          │
│  - /api/webhooks/stripe     │
└──────────┬──────────────────┘
           │ Stripe webhook events
           ▼
┌─────────────────────────────┐
│  Stripe Webhook Handler     │
│  (existing on marketing.    │
│   inclufy.com)              │
└──────────┬──────────────────┘
           │ updateert profiles
           ▼
┌─────────────────────────────┐
│  Supabase profiles table    │
│  - tier                      │
│  - stripe_customer_id        │
│  - stripe_subscription_id   │
│  - tier_renewal_at           │
│  - commission_pct            │
└──────────┬──────────────────┘
           │ leest tier
           ▼
┌─────────────────────────────┐
│  AMOS app (mobile + web)    │
│  - useUserTier() hook        │
│  - canBoostMeta(tier)        │
│  - canBoostMultiChannel()    │
└─────────────────────────────┘
```

---

## 2. Stripe Products → AMOS Tiers mapping

Maak in [Stripe Dashboard](https://dashboard.stripe.com/products) deze 4 producten aan (price IDs noteren):

| Product | Stripe Price ID | AMOS tier | €/mo | Wat unlocked |
|---|---|---|---|---|
| AMOS Pro | `price_pro_monthly` | `pro` | €49 | 6 platforms, AI tekst, onbeperkt posten |
| AMOS Promote | `price_promote_monthly` | `promote` | €79 | + Boost (Meta only) + 1 boost/mo inclusief |
| AMOS Ads | `price_ads_monthly` | `ads` | €199 | + Multi-channel ads + 5 boosts/mo |
| AMOS Enterprise | `price_enterprise_monthly` | `enterprise` | €999 | + multi-account + white-label + LMDP |

Voor commission (Model C hybride):
- Maak een **usage-based price** aan: `price_commission_per_cent` (€0.0005 per cent ad spend = 5%)
- Activeer alleen voor `promote` + `ads` + `enterprise` subscribers
- Subscription Item ID opslaan in profiles.stripe_subscription_id voor usage records

---

## 3. Stripe Webhook handler — code voor marketing.inclufy.com

In `marketing.inclufy.com` op `/api/webhooks/stripe/route.ts`:

```typescript
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role — bypass RLS
);

// Map Stripe price ID → AMOS tier
const PRICE_TO_TIER: Record<string, string> = {
  [process.env.STRIPE_PRICE_PRO!]:        'pro',
  [process.env.STRIPE_PRICE_PROMOTE!]:    'promote',
  [process.env.STRIPE_PRICE_ADS!]:        'ads',
  [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature')!;
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0].price.id;
      const tier = PRICE_TO_TIER[priceId] ?? 'free';

      // Map tier → commission_pct (only for tiers that include commission)
      const commission_pct = tier === 'promote' ? 5.0
                          : tier === 'ads'      ? 5.0
                          : tier === 'enterprise' ? 3.0
                          : 0;

      await supabase
        .from('profiles')
        .update({
          tier,
          commission_pct,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          tier_renewal_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('id', userId);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0].price.id;
      const tier = PRICE_TO_TIER[priceId] ?? 'free';

      await supabase
        .from('profiles')
        .update({
          tier,
          tier_renewal_at: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      const sub = event.data.object as Stripe.Subscription;
      // Downgrade to free
      await supabase
        .from('profiles')
        .update({ tier: 'free', commission_pct: 0 })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
  }

  return Response.json({ received: true });
}
```

---

## 4. Stripe Checkout button — code voor marketing.inclufy.com /pricing

```typescript
async function startCheckout(priceId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { router.push('/login?redirect=/pricing'); return; }

  const res = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ price_id: priceId, user_id: user.id }),
  });
  const { url } = await res.json();
  window.location.href = url;
}
```

`/api/checkout/route.ts`:
```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  customer_email: user.email,
  metadata: { user_id: user.id }, // KRITIEK — webhook leest dit
  success_url: 'https://app.amos.inclufy.com/dashboard?tier_upgraded=1',
  cancel_url: 'https://marketing.inclufy.com/pricing',
});
return Response.json({ url: session.url });
```

---

## 5. Commission billing (weekly/monthly cron)

Op marketing.inclufy.com — Vercel cron `/api/cron/commission-billing`:

```typescript
// Run every Monday 04:00 UTC
import { CronJob } from 'next/cron';

export async function GET() {
  // Aggregate unbilled commissions per user
  const { data: unbilled } = await supabase
    .from('ad_commissions')
    .select('user_id, sum:commission_cents.sum()')
    .eq('billed', false)
    .group('user_id');

  for (const row of unbilled ?? []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', row.user_id).single();

    if (!profile?.stripe_subscription_id) continue;

    // Find usage-based subscription item
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const usageItem = sub.items.data.find(i => i.price.recurring?.usage_type === 'metered');
    if (!usageItem) continue;

    // Report usage in cents
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(usageItem.id, {
      quantity: row.sum,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
    });

    // Mark commissions as billed
    await supabase.from('ad_commissions')
      .update({ billed: true, billed_at: new Date().toISOString(), stripe_usage_record_id: usageRecord.id })
      .eq('user_id', row.user_id).eq('billed', false);
  }

  return Response.json({ ok: true });
}
```

---

## 6. AMOS-side reading (already implemented today)

In AMOS code:
```typescript
// Mobile: src/utils/userTier.ts
import { useUserTier, canBoostMeta } from '@/utils/userTier';

const { tier } = useUserTier();
if (canBoostMeta(tier)) {
  // show Boost button
} else {
  // show "Upgrade to Promote" CTA → links to marketing.inclufy.com/pricing
}
```

```typescript
// Server: supabase/functions/boost-post/index.ts
const { data: profile } = await supabase
  .from('profiles').select('tier').eq('id', userId).single();

if (TIER_ORDER[profile?.tier ?? 'free'] < TIER_ORDER['promote']) {
  return new Response(JSON.stringify({
    error: 'Boost requires Promote tier',
    upgrade_url: 'https://marketing.inclufy.com/pricing?upgrade=promote',
  }), { status: 402 });
}
```

---

## 7. Migration to apply

```sql
-- supabase/migrations/20260508230000_user_tiers_and_commissions.sql
-- Already in repo. Run via Supabase Dashboard.
```

---

## 8. Implementation checklist

### marketing.inclufy.com (jouw team):
- [ ] Stripe products aanmaken (4 tiers + commission usage price)
- [ ] Webhook handler op `/api/webhooks/stripe` (sectie 3)
- [ ] Checkout endpoint op `/api/checkout` (sectie 4)
- [ ] Pricing page (sectie 4 button)
- [ ] Commission billing cron (sectie 5)
- [ ] Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

### AMOS (al klaar):
- [x] profiles.tier + stripe_customer_id columns (migration 20260508230000)
- [x] ad_commissions tabel
- [x] tier_features view
- [x] useUserTier hook (mobile + web)
- [x] canBoostMeta / canBoostMultiChannel feature gates
- [x] PostReview Boost button — tier-gated met upgrade CTA
- [x] boost-post edge fn — server-side tier check (402 + upgrade_url)
- [x] ad-performance-monitor — daily commission rows op ad_commissions

### Eindgebruiker flow:
1. Klant ziet "Boost (Promote tier)" lock-icon op gepubliceerde post
2. Tap → opent marketing.inclufy.com/pricing?upgrade=promote
3. Klant kiest plan → Stripe Checkout → betaling
4. Webhook update profiles.tier='promote'
5. Klant terug in AMOS → useUserTier refetcht → Boost knop wordt actief
6. Boost werkt via volledige Capture-to-Ad flow

---

## 9. Testing strategy

| Test | Hoe |
|---|---|
| Free user ziet Boost lock | Set tier='free' in profiles, open PostReview |
| Promote user ziet Boost actief | Set tier='promote', refetch |
| Stripe webhook update | Use Stripe CLI: `stripe listen --forward-to /api/webhooks/stripe` |
| Commission row insert | Set commission_pct=5 + run ad-performance-monitor manually |
| Multi-channel ads block | Promote tier user tries TikTok boost → 402 + upgrade_url |
