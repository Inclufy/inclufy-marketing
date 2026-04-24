// Supabase Edge Function: Scheduled Publisher
//
// Picks up go_posts with status='scheduled' AND scheduled_at <= now(),
// and triggers publish-social for each. Intended to be called once per
// minute by pg_cron (see supabase/migrations/.._cron_scheduled_publisher.sql).
//
// Auth: this function is itself called WITHOUT a user JWT (pg_cron has no
// session). We use the service_role key via INTERNAL_CALL_SECRET header
// when calling publish-social, which has a matching escape hatch.
//
// Idempotency: each post is marked 'publishing' before the call, so if
// the cron fires overlapping runs (or this function retries) we don't
// double-publish. On success → 'published'. On failure → 'failed' with
// publish_error populated. Retries are bounded by publish_retries column.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const INTERNAL_CALL_SECRET = Deno.env.get('INTERNAL_CALL_SECRET') ?? '';

const MAX_RETRIES = 3;
const BATCH_SIZE = 20; // Don't overwhelm rate limits

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-call',
};

interface PublishResult {
  post_id: string;
  user_id: string;
  channel: string;
  success: boolean;
  error?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const startedAt = new Date().toISOString();
  const results: PublishResult[] = [];

  try {
    // 1. Find due scheduled posts (status='scheduled' AND scheduled_at <= now()).
    //    We also include retry eligibility: status='failed' with retries < MAX.
    const { data: duePosts, error: queryErr } = await db
      .from('go_posts')
      .select('id, user_id, channel, scheduled_at, publish_retries')
      .or(`and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`)
      .limit(BATCH_SIZE);

    if (queryErr) {
      console.error('[scheduled-publisher] Query failed:', queryErr);
      return new Response(
        JSON.stringify({ error: 'Query failed', details: queryErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!duePosts || duePosts.length === 0) {
      return new Response(
        JSON.stringify({ startedAt, processed: 0, results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[scheduled-publisher] Found ${duePosts.length} due posts`);

    // 2. For each, atomically flip status scheduled→publishing to prevent
    //    double-publish if another cron run fires before this one completes.
    //    We use a conditional update: only transition from 'scheduled' so
    //    concurrent runs won't both claim the same row.
    for (const post of duePosts) {
      const { data: claimed, error: claimErr } = await db
        .from('go_posts')
        .update({ status: 'publishing' })
        .eq('id', post.id)
        .eq('status', 'scheduled')
        .select('id')
        .maybeSingle();

      if (claimErr || !claimed) {
        console.log(`[scheduled-publisher] Skip ${post.id} (race lost or already claimed)`);
        continue;
      }

      // 3. Call publish-social via internal auth.
      try {
        const pubRes = await fetch(`${SUPABASE_URL}/functions/v1/publish-social`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'x-internal-call': INTERNAL_CALL_SECRET,
          },
          body: JSON.stringify({
            post_id: post.id,
            user_id: post.user_id,
            channel: post.channel,
          }),
        });

        const pubBody = await pubRes.json().catch(() => ({}));

        if (pubRes.ok && pubBody?.success) {
          results.push({
            post_id: post.id,
            user_id: post.user_id,
            channel: post.channel,
            success: true,
          });
          // publish-social already updated status='published', published_at, published_post_id
        } else {
          // Publish failed. Revert publishing→failed and record error.
          const errorMsg = pubBody?.error || `HTTP ${pubRes.status}`;
          const nextRetries = (post.publish_retries ?? 0) + 1;
          const newStatus = nextRetries >= MAX_RETRIES ? 'failed' : 'scheduled';
          await db
            .from('go_posts')
            .update({
              status: newStatus,
              publish_error: errorMsg,
              publish_retries: nextRetries,
            })
            .eq('id', post.id);
          results.push({
            post_id: post.id,
            user_id: post.user_id,
            channel: post.channel,
            success: false,
            error: errorMsg,
          });
          console.warn(`[scheduled-publisher] Post ${post.id} failed (retry ${nextRetries}/${MAX_RETRIES}): ${errorMsg}`);
        }
      } catch (err: any) {
        // Network / unexpected error — revert to scheduled for retry
        const nextRetries = (post.publish_retries ?? 0) + 1;
        const newStatus = nextRetries >= MAX_RETRIES ? 'failed' : 'scheduled';
        await db
          .from('go_posts')
          .update({
            status: newStatus,
            publish_error: `Scheduler network error: ${err.message}`,
            publish_retries: nextRetries,
          })
          .eq('id', post.id);
        results.push({
          post_id: post.id,
          user_id: post.user_id,
          channel: post.channel,
          success: false,
          error: err.message,
        });
        console.error(`[scheduled-publisher] Post ${post.id} exception:`, err.message);
      }
    }

    return new Response(
      JSON.stringify({
        startedAt,
        finishedAt: new Date().toISOString(),
        processed: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[scheduled-publisher] Top-level error:', err);
    return new Response(
      JSON.stringify({ error: 'Scheduler error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
