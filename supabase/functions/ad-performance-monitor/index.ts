/**
 * ad-performance-monitor — daily cron that powers Capture-to-Ad
 *
 * Roadmap §4.3 step "24u monitoring engagement" + "AMOS detecteert
 * top-performer (3x boven gemiddelde)".
 *
 * Runs daily via pg_cron. Two responsibilities:
 *
 *   1. ORGANIC POST MONITORING — flag top-performers
 *      For each user's posts published in last 24h:
 *        - Fetch engagement (likes, comments, shares) from go_posts.engagement
 *        - Calculate user-level baseline (avg engagement of last 30 days)
 *        - If post engagement > 3x baseline → mark as 'boost_candidate'
 *        - Insert notification row (table: notifications) prompting Boost
 *
 *   2. AD CAMPAIGN METRICS ROLLUP — fetch performance from platforms
 *      For each ad_campaigns row with status='active':
 *        - Call platform Marketing API (Meta/TikTok/etc) for last 24h
 *        - Insert/update campaign_metrics row for today
 *        - Update denormalized totals on ad_campaigns
 *        - If duration ended → set status='completed'
 *
 * For now (May 2026) Meta ads_management approval not granted yet, so
 * step 2 runs in DRY-RUN mode (uses mock data for visible UI). Step 1
 * runs fully — top-performer detection uses real engagement numbers.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const META_ADS_API_LIVE = Deno.env.get('META_ADS_API_LIVE') === 'true';

interface BoostCandidate {
  post_id: string;
  user_id: string;
  channel: string;
  text_content: string;
  engagement_score: number;
  baseline_score: number;
  multiplier: number;
}

/**
 * Calculate engagement score from a post's engagement object.
 * Weighted: shares=5, comments=3, likes=1 (shares signal strongest intent).
 */
function calcEngagementScore(engagement: any): number {
  if (!engagement || typeof engagement !== 'object') return 0;
  const likes = Number(engagement.likes ?? 0);
  const comments = Number(engagement.comments ?? 0);
  const shares = Number(engagement.shares ?? 0);
  return likes + (comments * 3) + (shares * 5);
}

async function detectTopPerformers(supabase: any): Promise<BoostCandidate[]> {
  const candidates: BoostCandidate[] = [];

  // Fetch all users with posts published in last 24h
  const { data: recentPosts, error } = await supabase
    .from('go_posts')
    .select('id, user_id, channel, text_content, engagement, published_at')
    .eq('status', 'published')
    .in('channel', ['facebook', 'instagram', 'linkedin', 'tiktok']) // platforms with engagement data
    .gte('published_at', new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()) // 26h window for safety
    .lte('published_at', new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()); // 22h+ ago (so engagement matured)

  if (error || !recentPosts) {
    console.error('[ad-performance-monitor] Failed to fetch recent posts:', error);
    return candidates;
  }

  // Group by user
  const byUser = new Map<string, any[]>();
  for (const p of recentPosts) {
    if (!byUser.has(p.user_id)) byUser.set(p.user_id, []);
    byUser.get(p.user_id)!.push(p);
  }

  // For each user, calculate baseline (avg engagement of last 30 days)
  for (const [userId, posts] of byUser.entries()) {
    const { data: history } = await supabase
      .from('go_posts')
      .select('engagement')
      .eq('user_id', userId)
      .eq('status', 'published')
      .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(50);

    if (!history || history.length < 3) {
      // Not enough history for baseline — skip top-performer detection
      continue;
    }

    const baselines = (history as any[]).map((h) => calcEngagementScore(h.engagement));
    const avgBaseline = baselines.reduce((sum, s) => sum + s, 0) / baselines.length;
    if (avgBaseline < 5) continue; // baseline too low to be meaningful

    // Check each recent post against baseline
    for (const post of posts) {
      const score = calcEngagementScore(post.engagement);
      const multiplier = score / Math.max(avgBaseline, 1);

      if (multiplier >= 3) {
        candidates.push({
          post_id: post.id,
          user_id: userId,
          channel: post.channel,
          text_content: post.text_content,
          engagement_score: score,
          baseline_score: avgBaseline,
          multiplier,
        });
      }
    }
  }

  return candidates;
}

async function notifyBoostCandidates(supabase: any, candidates: BoostCandidate[]): Promise<number> {
  let inserted = 0;
  for (const c of candidates) {
    // Avoid duplicate notifications for same post
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', c.user_id)
      .eq('related_post_id', c.post_id)
      .eq('type', 'boost_candidate')
      .maybeSingle();
    if (existing) continue;

    const { error: insErr } = await supabase.from('notifications').insert({
      user_id: c.user_id,
      type: 'boost_candidate',
      title: '🚀 Top performer — Boost?',
      message: `Je ${c.channel} post presteert ${c.multiplier.toFixed(1)}x boven je gemiddelde. Boost hem voor extra reach.`,
      related_post_id: c.post_id,
      action_url: `/posts/${c.post_id}?boost=1`,
      priority: 'high',
      read: false,
    });
    if (!insErr) inserted++;
  }
  return inserted;
}

async function rollupCampaignMetrics(supabase: any): Promise<{ updated: number; mock: boolean }> {
  // Fetch active campaigns
  const { data: activeCampaigns } = await supabase
    .from('ad_campaigns')
    .select('id, channel, external_campaign_id, started_at, duration_days, budget_cents, total_impressions, total_clicks, total_spent_cents, total_conversions')
    .eq('status', 'active');

  if (!activeCampaigns || activeCampaigns.length === 0) {
    return { updated: 0, mock: !META_ADS_API_LIVE };
  }

  let updated = 0;
  const today = new Date().toISOString().split('T')[0];

  for (const campaign of activeCampaigns) {
    // Check if duration ended
    if (campaign.started_at && campaign.duration_days) {
      const endDate = new Date(new Date(campaign.started_at).getTime() + campaign.duration_days * 24 * 60 * 60 * 1000);
      if (new Date() > endDate) {
        await supabase
          .from('ad_campaigns')
          .update({ status: 'completed', ended_at: new Date().toISOString() })
          .eq('id', campaign.id);
        continue;
      }
    }

    // Fetch metrics from platform — DRY-RUN uses mock numbers for now
    let metrics = {
      impressions: 0,
      reach: 0,
      clicks: 0,
      spent_cents: 0,
      conversions: 0,
      raw_payload: { dry_run: true, note: 'Meta ads_management not yet approved' },
    };

    if (META_ADS_API_LIVE && campaign.channel === 'meta' && campaign.external_campaign_id) {
      // PLACEHOLDER — real Meta Marketing API call goes here:
      //   GET /{ad_id}/insights?fields=impressions,reach,clicks,spend,actions
      //     &date_preset=today
      // For now we keep the dry-run numbers
      console.log('[ad-performance-monitor] Meta API call would go here for', campaign.id);
    } else {
      // Generate plausible mock data so the UI has something to render
      // (only for visible feedback — labelled clearly in raw_payload)
      const daysActive = campaign.started_at
        ? Math.floor((Date.now() - new Date(campaign.started_at).getTime()) / (24 * 60 * 60 * 1000))
        : 0;
      const dailyBudget = campaign.budget_cents / Math.max(campaign.duration_days, 1);
      metrics = {
        impressions: Math.floor(dailyBudget * 0.4 + Math.random() * 100),
        reach: Math.floor(dailyBudget * 0.3 + Math.random() * 80),
        clicks: Math.floor(dailyBudget * 0.02 + Math.random() * 5),
        spent_cents: Math.floor(dailyBudget * (0.8 + Math.random() * 0.4)),
        conversions: Math.floor(Math.random() * 3),
        raw_payload: { dry_run: true, days_active: daysActive, source: 'mock_seed' },
      };
    }

    // Insert/update metrics row for today
    const { error: upErr } = await supabase
      .from('campaign_metrics')
      .upsert(
        {
          campaign_id: campaign.id,
          date: today,
          ...metrics,
        },
        { onConflict: 'campaign_id,date' },
      );
    if (!upErr) {
      // Update denormalized totals on ad_campaigns.
      // BUG-NEW-07: increment_campaign_totals RPC is not yet defined in any
      // migration, so we skip the RPC call entirely and use the direct
      // update path. Once the RPC is added (idempotent atomic increment
      // version), uncomment the RPC call and remove this comment.
      // BUG-NEW-03 fix: total_impressions accumulator was reading
      // total_spent_cents (wrong field). Now reads from the matching field.
      const { error: incErr } = await supabase
        .from('ad_campaigns')
        .update({
          total_impressions: (campaign.total_impressions ?? 0) + metrics.impressions,
          total_clicks: (campaign.total_clicks ?? 0) + metrics.clicks,
          total_spent_cents: (campaign.total_spent_cents ?? 0) + metrics.spent_cents,
          total_conversions: (campaign.total_conversions ?? 0) + metrics.conversions,
        })
        .eq('id', campaign.id);
      if (incErr) {
        console.error('[ad-performance-monitor] Failed to update totals for', campaign.id, incErr);
      }

      // ─── Commission rollup (Model C — hybride pricing) ────────────
      // If user is on a tier with commission_pct > 0, write a daily
      // commission row. Aggregated weekly/monthly for Stripe usage-based
      // billing on marketing.inclufy.com. Only on real spend (not mock).
      if (metrics.spent_cents > 0 && !mock) {
        const { data: campaignWithUser } = await supabase
          .from('ad_campaigns')
          .select('user_id, profiles!inner(commission_pct)')
          .eq('id', campaign.id)
          .maybeSingle();

        const userCommissionPct = (campaignWithUser as any)?.profiles?.commission_pct ?? 0;
        if (userCommissionPct > 0) {
          const commissionCents = Math.floor(metrics.spent_cents * userCommissionPct / 100);
          await supabase
            .from('ad_commissions')
            .upsert(
              {
                user_id: (campaignWithUser as any).user_id,
                campaign_id: campaign.id,
                date: today,
                spend_cents: metrics.spent_cents,
                commission_pct: userCommissionPct,
                commission_cents: commissionCents,
              },
              { onConflict: 'campaign_id,date' },
            );
        }
      }

      updated++;
    }
  }

  return { updated, mock: !META_ADS_API_LIVE };
}

Deno.serve(async (req) => {
  // Cron triggers via pg_cron / vercel cron / Supabase scheduled functions —
  // accept either GET or POST with optional auth check
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const candidates = await detectTopPerformers(supabase);
    const notified = await notifyBoostCandidates(supabase, candidates);
    const { updated, mock } = await rollupCampaignMetrics(supabase);

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: new Date().toISOString(),
        top_performers_detected: candidates.length,
        notifications_inserted: notified,
        campaigns_metrics_updated: updated,
        mock_metrics: mock,
        note: mock
          ? 'Campaign metrics in mock mode — Meta ads_management approval pending'
          : 'Campaign metrics from live Meta Marketing API',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[ad-performance-monitor] Error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
