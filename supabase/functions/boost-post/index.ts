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
      // PLACEHOLDER — actual Meta Marketing API call goes here once
      // ads_management scope is approved. Will:
      //   1. POST /{ad_account_id}/campaigns
      //   2. POST /{ad_account_id}/adsets with audience_config + budget
      //   3. POST /{ad_account_id}/adcreatives with first variant
      //   4. POST /{ad_account_id}/ads linking adset + creative
      //   5. Update campaign.external_campaign_id, status='pending_approval'
      console.log('[boost-post] Meta Marketing API not yet wired (waiting App Review)');
      nextStep = 'platform_pending';
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
