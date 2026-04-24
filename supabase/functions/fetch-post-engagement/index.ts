// Supabase Edge Function: Fetch Post Engagement
// Given a go_posts.id, fetches current engagement metrics from the platform API
// and writes them back to go_posts.engagement JSONB.
// Supports: LinkedIn (ugcPosts socialActions), Facebook (Graph API), Instagram (Graph API)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ═══════════════════════════════════════════════════════
// Token Validation Helper (mirrors publish-social)
// ═══════════════════════════════════════════════════════

async function ensureValidToken(
  db: ReturnType<typeof createClient>,
  tokenData: {
    access_token: string;
    refresh_token?: string | null;
    expires_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  },
  socialAccountId: string,
  channel: string,
): Promise<{ valid: boolean; token?: string; action?: 'reconnect'; error?: string }> {
  const now = Date.now();
  const ZOMBIE_AGE_MS = 45 * 24 * 60 * 60 * 1000;
  const tokenAgeRef = tokenData.updated_at || tokenData.created_at;
  const isZombie =
    !tokenData.expires_at &&
    tokenAgeRef &&
    now - new Date(tokenAgeRef).getTime() > ZOMBIE_AGE_MS;

  if (isZombie) {
    if (channel === 'facebook' || channel === 'instagram') {
      await db.from('social_accounts').update({ status: 'expired' }).eq('id', socialAccountId);
    }
    return {
      valid: false,
      action: 'reconnect',
      error: `${channel} token is zombie (geen expires_at, >45 dagen oud). Koppel je account opnieuw.`,
    };
  }

  if (!tokenData.expires_at || new Date(tokenData.expires_at) >= new Date()) {
    return { valid: true, token: tokenData.access_token };
  }

  // LinkedIn: try refresh_token grant
  if (channel === 'linkedin' && tokenData.refresh_token) {
    try {
      const refreshRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenData.refresh_token,
          client_id: Deno.env.get('LINKEDIN_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('LINKEDIN_CLIENT_SECRET') ?? '',
        }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        await db
          .from('oauth_tokens')
          .update({
            access_token: refreshData.access_token,
            expires_at: new Date(
              Date.now() + (refreshData.expires_in || 5184000) * 1000,
            ).toISOString(),
            refresh_token: refreshData.refresh_token || tokenData.refresh_token,
          })
          .eq('social_account_id', socialAccountId);
        return { valid: true, token: refreshData.access_token };
      }
    } catch {
      // fall through to reconnect
    }
    return {
      valid: false,
      action: 'reconnect',
      error: 'OAuth token verlopen en refresh mislukt. Koppel je account opnieuw.',
    };
  }

  // Facebook / Instagram: cannot refresh server-side
  if (channel === 'facebook' || channel === 'instagram') {
    await db.from('social_accounts').update({ status: 'expired' }).eq('id', socialAccountId);
    return {
      valid: false,
      action: 'reconnect',
      error: `${channel} token verlopen — koppel je account opnieuw`,
    };
  }

  return {
    valid: false,
    action: 'reconnect',
    error: 'OAuth token verlopen. Koppel je account opnieuw in Instellingen.',
  };
}

// ═══════════════════════════════════════════════════════
// Platform Engagement Fetchers
// ═══════════════════════════════════════════════════════

interface EngagementCounts {
  likes: number;
  comments: number;
  shares: number;
}

/**
 * LinkedIn engagement via UGC socialActions endpoint.
 * Tries the socialActions aggregate first; falls back to
 * separate /likes?count=0 + /comments?count=0 for counts.
 */
async function fetchLinkedInEngagement(
  accessToken: string,
  publishedPostId: string,
): Promise<{ success: boolean; counts?: EngagementCounts; error?: string }> {
  // Normalise the post ID to the full URN form expected by the API.
  // The stored ID may already be a full URN (urn:li:ugcPost:...) or just the numeric part.
  const postUrn = publishedPostId.startsWith('urn:')
    ? publishedPostId
    : `urn:li:ugcPost:${publishedPostId}`;

  // Validate: URN must contain only valid characters after the scheme
  if (!/^urn:li:[a-zA-Z:0-9]+$/.test(postUrn)) {
    return { success: false, error: `Malformed LinkedIn post URN: ${postUrn}` };
  }

  const encoded = encodeURIComponent(postUrn);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'X-Restli-Protocol-Version': '2.0.0',
  };

  // Attempt socialActions aggregate (returns numLikes, numComments in one call)
  const aggUrl = `https://api.linkedin.com/v2/socialActions/${encoded}`;
  try {
    const aggRes = await fetch(aggUrl, { headers });

    if (aggRes.status === 401) {
      return { success: false, error: '401' };
    }

    if (aggRes.ok) {
      const data = await aggRes.json();
      return {
        success: true,
        counts: {
          likes: data.numLikes ?? 0,
          comments: data.numComments ?? 0,
          shares: data.numShares ?? 0,
        },
      };
    }

    console.warn('[fetch-engagement:linkedin] socialActions aggregate failed:', aggRes.status);
  } catch (err: any) {
    console.error('[fetch-engagement:linkedin] aggregate fetch error:', err.message);
  }

  // Fallback: separate likes/comments count calls
  try {
    const [likesRes, commentsRes] = await Promise.all([
      fetch(`https://api.linkedin.com/v2/socialActions/${encoded}/likes?count=0`, { headers }),
      fetch(`https://api.linkedin.com/v2/socialActions/${encoded}/comments?count=0`, { headers }),
    ]);

    if (likesRes.status === 401 || commentsRes.status === 401) {
      return { success: false, error: '401' };
    }

    const likesData = likesRes.ok ? await likesRes.json() : { paging: { total: 0 } };
    const commentsData = commentsRes.ok ? await commentsRes.json() : { paging: { total: 0 } };

    return {
      success: true,
      counts: {
        likes: likesData.paging?.total ?? 0,
        comments: commentsData.paging?.total ?? 0,
        shares: 0, // LinkedIn doesn't expose share counts via API
      },
    };
  } catch (err: any) {
    return { success: false, error: `LinkedIn engagement fetch error: ${err.message}` };
  }
}

/**
 * Facebook engagement via Graph API.
 * Requests likes.summary, comments.summary, and shares in a single call.
 */
async function fetchFacebookEngagement(
  accessToken: string,
  publishedPostId: string,
): Promise<{ success: boolean; counts?: EngagementCounts; error?: string }> {
  // Validate: Facebook post IDs are numeric or in the form <page_id>_<post_id>
  if (!/^[\d_]+$/.test(publishedPostId)) {
    return { success: false, error: `Malformed Facebook post ID: ${publishedPostId}` };
  }

  const url =
    `https://graph.facebook.com/v20.0/${publishedPostId}` +
    `?fields=likes.summary(true),comments.summary(true),shares` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url);

    if (res.status === 401) {
      return { success: false, error: '401' };
    }

    if (!res.ok) {
      const body = await res.text();
      const safe = body.replace(/"access_token"\s*:\s*"[^"]*"/g, '"access_token":"[REDACTED]"');
      return { success: false, error: `Facebook API ${res.status}: ${safe}` };
    }

    const data = await res.json();
    return {
      success: true,
      counts: {
        likes: data.likes?.summary?.total_count ?? 0,
        comments: data.comments?.summary?.total_count ?? 0,
        shares: data.shares?.count ?? 0,
      },
    };
  } catch (err: any) {
    return { success: false, error: `Facebook engagement fetch error: ${err.message}` };
  }
}

/**
 * Instagram engagement via Graph API (Instagram Business / Creator).
 * Requires an IG media ID and the page access token (stored in oauth_tokens).
 */
async function fetchInstagramEngagement(
  accessToken: string,
  publishedPostId: string,
): Promise<{ success: boolean; counts?: EngagementCounts; error?: string }> {
  // Instagram media IDs are purely numeric
  if (!/^\d+$/.test(publishedPostId)) {
    return { success: false, error: `Malformed Instagram media ID: ${publishedPostId}` };
  }

  const url =
    `https://graph.facebook.com/v20.0/${publishedPostId}` +
    `?fields=like_count,comments_count` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url);

    if (res.status === 401) {
      return { success: false, error: '401' };
    }

    if (!res.ok) {
      const body = await res.text();
      const safe = body.replace(/"access_token"\s*:\s*"[^"]*"/g, '"access_token":"[REDACTED]"');
      return { success: false, error: `Instagram API ${res.status}: ${safe}` };
    }

    const data = await res.json();
    return {
      success: true,
      counts: {
        likes: data.like_count ?? 0,
        comments: data.comments_count ?? 0,
        shares: 0, // Instagram does not expose share counts via API
      },
    };
  } catch (err: any) {
    return { success: false, error: `Instagram engagement fetch error: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Internal-call escape (cron / scheduled jobs) ──
  const internalSecret = Deno.env.get('INTERNAL_CALL_SECRET') ?? '';
  const xInternalCall = req.headers.get('x-internal-call') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  const isInternalCall =
    !!internalSecret &&
    xInternalCall === internalSecret &&
    authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

  let jwtUser: { id: string } | null = null;

  if (isInternalCall) {
    console.log('[fetch-post-engagement] internal call accepted');
  } else {
    // ── JWT authentication (normal app calls) ──
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const jwt = authHeader.slice(7);
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const {
      data: { user: jwtUserData },
      error: jwtErr,
    } = await authClient.auth.getUser();
    if (jwtErr || !jwtUserData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    jwtUser = jwtUserData;
  }

  try {
    const body = await req.json();
    const { post_id, user_id } = body as { post_id?: string; user_id?: string };

    if (!post_id || !user_id) {
      return new Response(JSON.stringify({ error: 'post_id and user_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Assert JWT user matches body user_id (skipped for internal calls)
    if (!isInternalCall && jwtUser && jwtUser.id !== user_id) {
      return new Response(JSON.stringify({ error: 'Forbidden: user_id mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch the post
    const { data: post, error: postErr } = await db
      .from('go_posts')
      .select('id, user_id, channel, published_post_id, engagement')
      .eq('id', post_id)
      .eq('status', 'published')
      .maybeSingle();

    if (postErr) {
      console.error('[fetch-post-engagement] DB error fetching post:', postErr.message);
      return new Response(JSON.stringify({ error: 'Database error', details: postErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!post) {
      return new Response(
        JSON.stringify({ success: false, error: 'Post not found or not published' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Check published_post_id exists
    if (!post.published_post_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Post not published yet or missing post ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const channel: string = String(post.channel).toLowerCase();

    // Validate channel
    if (!['linkedin', 'facebook', 'instagram'].includes(channel)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Engagement fetch is not supported for channel: ${channel}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. Find social_account for this channel + user
    const { data: socialAccount } = await db
      .from('social_accounts')
      .select('id, platform, platform_account_id, account_type')
      .eq('user_id', user_id)
      .ilike('platform', channel)
      .limit(1)
      .maybeSingle();

    if (!socialAccount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Geen ${channel} account gekoppeld`,
          action: 'connect_account',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Manual accounts have no token — skip engagement fetch
    if (socialAccount.account_type === 'manual') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Engagement fetch niet beschikbaar voor handmatige accounts',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Fetch OAuth token
    const { data: tokenData } = await db
      .from('oauth_tokens')
      .select('access_token, refresh_token, expires_at, created_at, updated_at')
      .eq('social_account_id', socialAccount.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tokenData?.access_token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Geen geldig OAuth token. Koppel je account opnieuw.',
          action: 'reconnect',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 5. Validate / refresh token
    const tokenCheck = await ensureValidToken(db, tokenData, socialAccount.id, channel);
    if (!tokenCheck.valid) {
      return new Response(
        JSON.stringify({ success: false, action: tokenCheck.action, error: tokenCheck.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const accessToken = tokenCheck.token!;

    // 6. Fetch engagement from platform
    let fetchResult: { success: boolean; counts?: EngagementCounts; error?: string };

    switch (channel) {
      case 'linkedin':
        fetchResult = await fetchLinkedInEngagement(accessToken, post.published_post_id);
        break;
      case 'facebook':
        fetchResult = await fetchFacebookEngagement(accessToken, post.published_post_id);
        break;
      case 'instagram':
        fetchResult = await fetchInstagramEngagement(accessToken, post.published_post_id);
        break;
      default:
        fetchResult = { success: false, error: `Unsupported channel: ${channel}` };
    }

    // Surface 401s from platform as reconnect signal
    if (!fetchResult.success && fetchResult.error === '401') {
      if (channel === 'facebook' || channel === 'instagram') {
        await db
          .from('social_accounts')
          .update({ status: 'expired' })
          .eq('id', socialAccount.id);
      }
      return new Response(
        JSON.stringify({
          success: false,
          action: 'reconnect',
          error: `${channel} token ongeldig. Koppel je account opnieuw.`,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!fetchResult.success) {
      console.error('[fetch-post-engagement] platform fetch failed:', fetchResult.error);
      return new Response(
        JSON.stringify({ success: false, error: fetchResult.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const counts = fetchResult.counts!;
    const fetchedAt = new Date().toISOString();

    // 7. Merge new counts into existing engagement JSONB (preserve extra_images, overlay_config, etc.)
    const existingEngagement: Record<string, unknown> =
      typeof post.engagement === 'object' && post.engagement !== null
        ? (post.engagement as Record<string, unknown>)
        : {};

    const updatedEngagement = {
      ...existingEngagement,
      likes: counts.likes,
      comments: counts.comments,
      shares: counts.shares,
      engagement_last_fetched_at: fetchedAt,
    };

    const { error: updateErr } = await db
      .from('go_posts')
      .update({ engagement: updatedEngagement })
      .eq('id', post_id);

    if (updateErr) {
      console.error('[fetch-post-engagement] DB update error:', updateErr.message);
      return new Response(
        JSON.stringify({ error: 'Failed to save engagement', details: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(
      `[fetch-post-engagement] Updated engagement for post ${post_id}: likes=${counts.likes} comments=${counts.comments} shares=${counts.shares}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        engagement: {
          likes: counts.likes,
          comments: counts.comments,
          shares: counts.shares,
          fetched_at: fetchedAt,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[fetch-post-engagement] Unhandled error:', err.message ?? err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
