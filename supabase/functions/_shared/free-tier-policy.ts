// ─────────────────────────────────────────────────────────────────────────
// Free-tier publish-policy gate (Sprint-3 closeout — server-side mirror).
//
// Mirrors the client-side caps enforced in src/utils/userTier.ts:
//   - postsPerDayLimit(free) = 1   → max 1 unique post per rolling 24h
//   - channelsPerPostLimit(free) = 3 → max 3 channel fanouts on a post
//
// These checks run inside publish-social BEFORE any provider API call.
// Bypassing the mobile app client (or building a custom client that
// skips the userTier check) doesn't help — the edge function refuses
// the publish with HTTP 429.
//
// Tier source-of-truth: public.profiles.tier (text). If profiles row
// is missing or tier is null/empty/'free', the user is treated as free.
//
// Failure mode: fail-OPEN on DB errors. Reasoning identical to the
// AI-rate-limit middleware: a Postgres outage shouldn't be exploitable
// as a "paywall lifted" exploit, but on a real outage blocking publishes
// for paying users is worse than letting one free user squeak through.
// ─────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type Tier = 'free' | 'pro' | 'promote' | 'ads' | 'enterprise';

const FREE_DAILY_CAP = 1;
const FREE_CHANNELS_PER_POST_CAP = 3;

export interface PolicyCheckResult {
  ok: boolean;
  /** HTTP status code to return. 429 for cap-hit, 451 for tier-forbidden. */
  status?: number;
  /** Stable machine code for client to interpret. */
  reason?:
    | 'free_daily_cap'
    | 'free_channels_per_post_cap'
    | 'free_watermark_required';
  /** Human-readable explanation (Dutch — client localises). */
  message?: string;
  /** Numeric cap that was hit, for client display. */
  limit?: number;
  /** Seconds until the user could retry (24h for daily cap). */
  retryAfter?: number;
}

/**
 * Looks up the user's tier from public.profiles.tier. Returns 'free' when
 * the row is missing, tier is null, or any error occurs — safest default.
 */
export async function fetchUserTier(
  db: SupabaseClient,
  userId: string,
): Promise<Tier> {
  try {
    const { data, error } = await db
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn(`[free-tier-policy] tier lookup failed for ${userId}: ${error.message}`);
      return 'free';
    }
    const raw = (data?.tier ?? '').toString().toLowerCase();
    if (raw === 'pro' || raw === 'promote' || raw === 'ads' || raw === 'enterprise') return raw;
    return 'free';
  } catch (err: any) {
    console.warn(`[free-tier-policy] tier lookup threw for ${userId}: ${err?.message}`);
    return 'free';
  }
}

/**
 * Daily publish cap check. Counts distinct rows in go_posts (= event_posts)
 * where the user has a published row in the last 24h. Cross-channel fanout
 * reuses the same post.id, so 1 post × 3 channels = 1 toward the cap.
 *
 * Pass the post_id being published — it's excluded from the count so the
 * same post being re-published to a new channel doesn't double-count.
 */
export async function checkDailyCap(
  db: SupabaseClient,
  args: { userId: string; tier: Tier; postId: string },
): Promise<PolicyCheckResult> {
  if (args.tier !== 'free') return { ok: true };

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await db
      .from('go_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', args.userId)
      .eq('status', 'published')
      .gte('published_at', since)
      .neq('id', args.postId);

    if (error) {
      console.warn(`[free-tier-policy] daily-cap query failed: ${error.message} — failing open`);
      return { ok: true };
    }

    if ((count ?? 0) >= FREE_DAILY_CAP) {
      return {
        ok: false,
        status: 429,
        reason: 'free_daily_cap',
        message: `Free-tier abonnement staat ${FREE_DAILY_CAP} post per dag toe. Upgrade naar Pro voor ongelimiteerd.`,
        limit: FREE_DAILY_CAP,
        retryAfter: 24 * 60 * 60,
      };
    }

    return { ok: true };
  } catch (err: any) {
    console.warn(`[free-tier-policy] daily-cap threw: ${err?.message} — failing open`);
    return { ok: true };
  }
}

/**
 * Channels-per-post cap check. Counts how many distinct social_account_id
 * targets this post has already been published to in social_publish_log
 * (or similar audit table). If incoming publish would push past 3 fanouts,
 * refuse.
 *
 * Implementation note: AMOS doesn't currently have a separate publish-log
 * with per-channel rows — go_posts.status='published' captures the FIRST
 * publish only. So this check is a best-effort using engagement metadata
 * if present, else permissive. The client-side gate (TODO: filter
 * selectable-accounts UI to 3 max) is the primary defense; this server
 * check picks up the bypass case when it lands in publish-social.
 */
export async function checkChannelsPerPost(
  db: SupabaseClient,
  args: { userId: string; tier: Tier; postId: string; targetAccountId: string },
): Promise<PolicyCheckResult> {
  if (args.tier !== 'free') return { ok: true };

  try {
    // We use the engagement.published_account history if available.
    // Schema: go_posts.engagement.published_accounts is an array of
    // { id, name, type, image_url } pushed on each fanout publish.
    // Falls back to 0 if missing.
    const { data, error } = await db
      .from('go_posts')
      .select('engagement')
      .eq('id', args.postId)
      .maybeSingle();

    if (error || !data) {
      // No row, no history — first publish, allowed.
      return { ok: true };
    }

    const eng: any = data.engagement ?? {};
    const history: any[] = Array.isArray(eng.published_accounts)
      ? eng.published_accounts
      : [];
    // Filter out the current target so a retry on the same account
    // doesn't double-count.
    const distinctPrior = new Set(
      history.map((h) => h?.id).filter((id) => id && id !== args.targetAccountId),
    );

    if (distinctPrior.size >= FREE_CHANNELS_PER_POST_CAP) {
      return {
        ok: false,
        status: 429,
        reason: 'free_channels_per_post_cap',
        message: `Free-tier staat publicatie naar maximaal ${FREE_CHANNELS_PER_POST_CAP} channels per post toe. Upgrade voor onbeperkt cross-channel.`,
        limit: FREE_CHANNELS_PER_POST_CAP,
        retryAfter: 0,
      };
    }

    return { ok: true };
  } catch (err: any) {
    console.warn(`[free-tier-policy] channels-per-post threw: ${err?.message} — failing open`);
    return { ok: true };
  }
}

/**
 * Build a 429 Response from a failed policy check. Convenience wrapper.
 */
export function policyDenyResponse(
  check: PolicyCheckResult,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: check.reason ?? 'free_tier_policy_denied',
      message: check.message,
      limit: check.limit,
      retry_after: check.retryAfter,
    }),
    {
      status: check.status ?? 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(check.retryAfter ?? 3600),
      },
    },
  );
}
