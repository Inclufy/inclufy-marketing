/**
 * boost-post — turns an organic post into a paid ad campaign.
 *
 * Roadmap §4.3 step "AMOS calls Meta Marketing API → ad live".
 *
 * Flow:
 *   1. Validate input (post_id, channel, budget, duration, audience)
 *   2. Create ad_campaigns row (status='pending_approval')
 *   3. Trigger ai-ad-variants to generate 3 creatives → campaign_creatives
 *   4. If channel=meta + ads_management scope active → push to Marketing API
 *      (placeholder until Meta App Review approves ads_management — uses
 *      DRY-RUN mode that creates the row but doesn't call the API)
 *   5. Return campaign object + variants
 *
 * Input:
 *   POST {
 *     post_id: UUID,
 *     channel: 'meta' | 'tiktok' | 'linkedin' | 'pinterest',
 *     budget_cents: number,
 *     duration_days: number,
 *     audience_config?: {...},
 *     objective?: 'POST_ENGAGEMENT' | ...,
 *     dry_run?: boolean,
 *     auto_generate_variants?: boolean (default true)
 *   }
 *
 * Output:
 *   {
 *     campaign: { id, status, ... },
 *     variants: [...],  // if auto_generate_variants
 *     dry_run: boolean,
 *     next_step: 'review_creatives' | 'platform_pending' | 'live'
 *   }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const META_APP_ID = Deno.env.get('META_APP_ID') ?? '947950264797942';

// Feature flag — set to true once Meta App Review approves ads_management.
// Until then, we run boost-post in DRY-RUN mode: creates rows + AI variants
// but doesn't actually push to Meta Marketing API.
const META_ADS_API_LIVE = Deno.env.get('META_ADS_API_LIVE') === 'true';

/**
 * Map AMOS audience_config preset to Meta Marketing API targeting spec.
 *
 * BUG-NEW-05 fix: defined at module top (not inside Deno.serve) to avoid
 * function-hoisting fragility if anyone refactors to a `const` arrow.
 *
 * Supported audience types:
 *   - lookalike: page_followers (custom_audience created server-side)
 *   - interest: array of interest names mapped to flexible_spec.interests
 *   - geo: only geo_locations.countries
 *   - job_title: future — needs Meta job_titles vocab match
 */
function mapAudienceToMetaTargeting(config: Record<string, unknown>): Record<string, unknown> {
  const targeting: Record<string, unknown> = {
    geo_locations: { countries: [String(config.country ?? 'NL')] },
  };
  if (config.age && Array.isArray(config.age) && config.age.length === 2) {
    targeting.age_min = config.age[0];
    targeting.age_max = config.age[1];
  }
  if (config.type === 'lookalike' && config.source === 'page_followers') {
    targeting.custom_audiences = []; // filled later by lookalike-builder cron
  }
  if (config.type === 'interest' && Array.isArray(config.interests)) {
    targeting.flexible_spec = [{
      interests: (config.interests as string[]).map((name) => ({ name })),
    }];
  }
  return targeting;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      post_id,
      channel,
      budget_cents,
      duration_days = 3,
      audience_config = {},
      objective = 'POST_ENGAGEMENT',
      dry_run: dryRunOverride,
      auto_generate_variants = true,
    } = body;

    if (!post_id || !channel || !budget_cents) {
      return new Response(
        JSON.stringify({ error: 'post_id, channel, budget_cents required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (budget_cents < 500) {
      return new Response(
        JSON.stringify({ error: 'Minimum budget is €5 (500 cents)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const auth = req.headers.get('Authorization') ?? '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: auth } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ─── Server-side tier gate ──────────────────────────────────────
    // Read tier from profiles. Mirror of mobile/web canBoostMeta().
    // Required tier for boost: ≥ promote.
    // For multi-channel ads (TikTok/LinkedIn/Pinterest): ≥ ads.
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, commission_pct')
      .eq('id', user.id)
      .maybeSingle();

    const tier = profile?.tier ?? 'free';
    const TIER_ORDER: Record<string, number> = {
      free: 0, pro: 1, promote: 2, ads: 3, enterprise: 4,
    };

    if (TIER_ORDER[tier] < TIER_ORDER['promote']) {
      return new Response(
        JSON.stringify({
          error: `Boost requires Promote tier or higher. Current tier: ${tier}`,
          upgrade_url: 'https://marketing.inclufy.com/pricing?upgrade=promote',
          required_tier: 'promote',
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Multi-channel ads (TikTok/LinkedIn/Pinterest) require ≥ ads tier
    if (channel !== 'meta' && TIER_ORDER[tier] < TIER_ORDER['ads']) {
      return new Response(
        JSON.stringify({
          error: `Multi-channel ads (${channel}) require Ads tier or higher. Current tier: ${tier}`,
          upgrade_url: 'https://marketing.inclufy.com/pricing?upgrade=ads',
          required_tier: 'ads',
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch source post
    const { data: post, error: postErr } = await supabase
      .from('go_posts')
      .select('id, channel, organization_id, social_account_id, text_content')
      .eq('id', post_id)
      .maybeSingle();
    if (postErr || !post) {
      return new Response(
        JSON.stringify({ error: 'Source post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Decide dry-run mode
    const isDryRun = dryRunOverride !== undefined
      ? !!dryRunOverride
      : (channel === 'meta' && !META_ADS_API_LIVE);

    // Create ad_campaigns row
    const { data: campaign, error: campErr } = await supabase
      .from('ad_campaigns')
      .insert({
        organization_id: post.organization_id,
        user_id: user.id,
        source_post_id: post.id,
        social_account_id: post.social_account_id,
        channel,
        status: isDryRun ? 'draft' : 'pending_creative',
        budget_cents,
        duration_days,
        audience_config,
        objective,
        external_metadata: {
          dry_run: isDryRun,
          api_live_flag: META_ADS_API_LIVE,
        },
      })
      .select()
      .single();

    if (campErr || !campaign) {
      console.error('[boost-post] Campaign create failed:', campErr);
      return new Response(
        JSON.stringify({ error: campErr?.message ?? 'Failed to create campaign' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Trigger AI variants (if requested)
    let variants: any[] = [];
    if (auto_generate_variants) {
      try {
        const variantsRes = await fetch(`${SUPABASE_URL}/functions/v1/ai-ad-variants`, {
          method: 'POST',
          headers: {
            'Authorization': auth,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post_id,
            campaign_id: campaign.id,
            channel,
          }),
        });
        if (variantsRes.ok) {
          const variantsData = await variantsRes.json();
          variants = variantsData.variants ?? [];
        } else {
          console.warn('[boost-post] ai-ad-variants returned', variantsRes.status);
        }
      } catch (e) {
        console.warn('[boost-post] AI variants generation failed, continuing without:', e);
      }
    }

    // Push to platform Marketing API (or stay in dry-run)
    let nextStep: 'review_creatives' | 'platform_pending' | 'live' | 'dry_run' = 'review_creatives';

    if (!isDryRun && channel === 'meta') {
      // ─── Meta Marketing API push (LIVE flow) ────────────────────────
      // Activated when META_ADS_API_LIVE=true. Requires:
      //   - ads_management scope approved (Meta App Review)
      //   - META_AD_ACCOUNT_ID secret set (format: 'act_<id>')
      //   - User has connected FB account with the Page they want to boost
      const META_AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID') ?? '';
      const FB_ACCESS_TOKEN = await (async () => {
        if (!post.social_account_id) return '';
        const { data: acc } = await supabase
          .from('social_accounts')
          .select('access_token')
          .eq('id', post.social_account_id)
          .maybeSingle();
        return acc?.access_token ?? '';
      })();

      if (!META_AD_ACCOUNT_ID || !FB_ACCESS_TOKEN) {
        console.warn('[boost-post] Meta live mode missing AD_ACCOUNT_ID or access_token — falling back to dry_run');
        nextStep = 'platform_pending';
      } else {
        try {
          const fbApi = `https://graph.facebook.com/v20.0/${META_AD_ACCOUNT_ID}`;

          // 1. Create campaign
          const campaignRes = await fetch(`${fbApi}/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              name: `AMOS Boost ${campaign.id.substring(0, 8)}`,
              objective,
              status: 'PAUSED', // start paused — user explicitly resumes
              special_ad_categories: '[]',
              access_token: FB_ACCESS_TOKEN,
            }),
          });
          if (!campaignRes.ok) {
            throw new Error(`Meta campaigns API: ${await campaignRes.text()}`);
          }
          const fbCampaign = await campaignRes.json();
          const fbCampaignId = fbCampaign.id;

          // 2. Create ad set with budget + audience
          // Map our audience_config to Meta's targeting spec
          const targeting = mapAudienceToMetaTargeting(audience_config);
          const adsetRes = await fetch(`${fbApi}/adsets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              name: `AMOS AdSet ${campaign.id.substring(0, 8)}`,
              campaign_id: fbCampaignId,
              daily_budget: String(Math.floor(budget_cents / duration_days)),
              billing_event: 'IMPRESSIONS',
              optimization_goal: objective === 'POST_ENGAGEMENT' ? 'POST_ENGAGEMENT' : 'REACH',
              bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
              targeting: JSON.stringify(targeting),
              status: 'PAUSED',
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000).toISOString(),
              access_token: FB_ACCESS_TOKEN,
            }),
          });
          if (!adsetRes.ok) {
            throw new Error(`Meta adsets API: ${await adsetRes.text()}`);
          }
          const fbAdSet = await adsetRes.json();

          // 3. Update campaign with external IDs
          // BUG-NEW-06 fix: populate started_at so ad-performance-monitor
          // can correctly compute end-of-duration and mark completed.
          // Use now() since Meta starts the ad at creation time (status
          // PAUSED but the ad set start_time is now()).
          await supabase
            .from('ad_campaigns')
            .update({
              external_campaign_id: fbCampaignId,
              external_ad_set_id: fbAdSet.id,
              status: 'pending_approval',
              started_at: new Date().toISOString(),
              external_metadata: {
                ...campaign.external_metadata,
                meta_ad_account: META_AD_ACCOUNT_ID,
                pushed_at: new Date().toISOString(),
              },
            })
            .eq('id', campaign.id);

          nextStep = 'live';
          console.log('[boost-post] Meta campaign created:', fbCampaignId);
        } catch (e: any) {
          console.error('[boost-post] Meta API push failed:', e.message);
          await supabase
            .from('ad_campaigns')
            .update({
              status: 'failed',
              external_metadata: { ...campaign.external_metadata, error: e.message },
            })
            .eq('id', campaign.id);
          nextStep = 'platform_pending';
        }
      }
    }

    if (isDryRun) {
      nextStep = 'dry_run';
    }

    return new Response(
      JSON.stringify({
        campaign,
        variants,
        dry_run: isDryRun,
        next_step: nextStep,
        message: isDryRun
          ? 'Campaign opgeslagen in dry-run mode. Zodra Meta App Review goedkeurt voor ads_management, gaat hij live.'
          : 'Campaign aangemaakt — review de creatives + push naar platform.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[boost-post] Error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
