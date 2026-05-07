// ════════════════════════════════════════════════════════════════════
// AI Brand Voice Analyzer
// Fetches up to 20 recent posts from a connected social account,
// analyzes tone/structure/hashtags via LLM, stores result as
// brand_voice_profile row in DB, returns profile to caller.
//
// Trigger: from SocialMediaWizard Step 4 ("Wil je dat AMOS je
// merkstem leert?") with social_account_id of newly-connected
// account.
//
// Cost per call: ~$0.01-0.03 (gpt-4o-mini, 20 posts as input)
// Cache: 90 days per (user, social_account) pair.
// ════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Fetch posts per platform ───────────────────────────────────────
async function fetchFacebookPagePosts(pageId: string, accessToken: string): Promise<Array<{ message: string; created_time: string }>> {
  const url = `https://graph.facebook.com/v20.0/${pageId}/posts?fields=message,created_time&limit=20&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[brand-voice] FB posts fetch failed: ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  return (data.data ?? [])
    .filter((p: any) => p.message && p.message.length > 20) // skip media-only posts
    .map((p: any) => ({ message: p.message, created_time: p.created_time }));
}

async function fetchInstagramPosts(igId: string, accessToken: string): Promise<Array<{ message: string; created_time: string }>> {
  const url = `https://graph.facebook.com/v20.0/${igId}/media?fields=caption,timestamp&limit=20&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[brand-voice] IG posts fetch failed: ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  return (data.data ?? [])
    .filter((p: any) => p.caption && p.caption.length > 20)
    .map((p: any) => ({ message: p.caption, created_time: p.timestamp }));
}

async function fetchLinkedInPosts(personUrn: string, accessToken: string): Promise<Array<{ message: string; created_time: string }>> {
  // LinkedIn /v2/ugcPosts requires LMDP for org pages. For personal we use /v2/socialActions.
  // For personal feed posts: GET /v2/ugcPosts?q=authors&authors=List({personUrn})&count=20
  const url = `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent(personUrn)})&count=20`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' },
  });
  if (!res.ok) {
    console.error(`[brand-voice] LI posts fetch failed: ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  return (data.elements ?? [])
    .map((p: any) => ({
      message: p.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text ?? '',
      created_time: new Date(p.created?.time ?? 0).toISOString(),
    }))
    .filter((p: any) => p.message && p.message.length > 20);
}

// ─── LLM analysis ───────────────────────────────────────────────────
async function analyzeWithLLM(posts: Array<{ message: string }>): Promise<any> {
  if (posts.length === 0) {
    return {
      tone: 'unknown',
      avg_post_length: 0,
      common_hashtags: [],
      post_structure: 'unknown',
      emoji_usage: 'unknown',
      voice_descriptors: [],
      primary_language: 'unknown',
      summary: 'Geen posts gevonden om te analyseren.',
    };
  }

  const postsText = posts.map((p, i) => `Post ${i + 1}:\n${p.message}`).join('\n\n---\n\n');

  const prompt = `Je analyseert de brand voice van een social media account aan de hand van ${posts.length} recente posts.

Posts:
${postsText}

Geef een JSON-analyse met deze velden:
- tone: kies uit "professional-warm" | "casual" | "authoritative" | "playful" | "inspirational" | "data-driven" | "empathetic"
- avg_post_length: gemiddeld aantal characters
- common_hashtags: top 5 meest gebruikte hashtags (zonder #)
- post_structure: kies uit "story-then-cta" | "question-then-list" | "data-then-takeaway" | "quote-then-context" | "announcement" | "tip-list"
- emoji_usage: kies uit "none" | "minimal" | "moderate" | "heavy"
- voice_descriptors: 3-5 nederlandse adjectieven die de stem beschrijven (bv "mensgericht", "data-gedreven", "empathisch", "doelgericht")
- primary_language: kies uit "nl" | "en" | "fr" | "ar" | "mixed"
- summary: 1 zin Nederlandse samenvatting van de brand voice voor een marketeer

Antwoord met PURE JSON, geen markdown wrappers.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('LLM returned invalid JSON');
  }
}

// ─── Token retrieval ────────────────────────────────────────────────
async function getAccountTokenAndDetails(socialAccountId: string, db: ReturnType<typeof createClient>) {
  const { data: account, error: accErr } = await db
    .from('social_accounts')
    .select('id, user_id, platform, account_type, platform_account_id, account_name')
    .eq('id', socialAccountId)
    .maybeSingle();
  if (accErr || !account) throw new Error('Social account not found');

  const { data: token, error: tokErr } = await db
    .from('oauth_tokens')
    .select('access_token, expires_at')
    .eq('social_account_id', socialAccountId)
    .maybeSingle();
  if (tokErr || !token) throw new Error('No OAuth token for this account');

  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    throw new Error('Token expired — reconnect required');
  }

  return { account, accessToken: token.access_token as string };
}

// ─── Main handler ───────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { social_account_id } = await req.json();
    if (!social_account_id) return jsonResp({ error: 'Missing social_account_id' }, 400);

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first (90-day reuse window)
    const { data: cached } = await db
      .from('brand_voice_profiles')
      .select('*')
      .eq('social_account_id', social_account_id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (cached) {
      return jsonResp({ profile: cached, cached: true });
    }

    const { account, accessToken } = await getAccountTokenAndDetails(social_account_id, db);

    // Fetch posts per platform
    let posts: Array<{ message: string; created_time: string }> = [];
    if (account.platform === 'facebook' && account.account_type === 'page') {
      posts = await fetchFacebookPagePosts(account.platform_account_id, accessToken);
    } else if (account.platform === 'instagram' && account.account_type === 'business') {
      posts = await fetchInstagramPosts(account.platform_account_id, accessToken);
    } else if (account.platform === 'linkedin' && account.account_type === 'personal') {
      posts = await fetchLinkedInPosts(`urn:li:person:${account.platform_account_id}`, accessToken);
    } else {
      return jsonResp({
        error: `Brand voice analysis not supported for ${account.platform} ${account.account_type}`,
      }, 400);
    }

    if (posts.length < 3) {
      return jsonResp({
        error: 'Te weinig posts gevonden voor zinvolle analyse (minimum 3 nodig)',
        posts_found: posts.length,
      }, 422);
    }

    // Analyze
    const analysis = await analyzeWithLLM(posts);
    const avgLen = Math.round(posts.reduce((sum, p) => sum + p.message.length, 0) / posts.length);

    const dateRange = posts.length > 0
      ? {
          start: posts[posts.length - 1].created_time,
          end: posts[0].created_time,
        }
      : { start: null, end: null };

    // Upsert profile
    const profileRow = {
      user_id: account.user_id,
      social_account_id: account.id,
      tone: analysis.tone ?? 'unknown',
      avg_post_length: analysis.avg_post_length ?? avgLen,
      common_hashtags: analysis.common_hashtags ?? [],
      post_structure: analysis.post_structure ?? 'unknown',
      emoji_usage: analysis.emoji_usage ?? 'unknown',
      voice_descriptors: analysis.voice_descriptors ?? [],
      primary_language: analysis.primary_language ?? 'unknown',
      posts_analyzed: posts.length,
      date_range_start: dateRange.start,
      date_range_end: dateRange.end,
      raw_analysis: analysis,
      status: 'active',
      analyzed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const { data: saved, error: saveErr } = await db
      .from('brand_voice_profiles')
      .upsert(profileRow, { onConflict: 'user_id,social_account_id' })
      .select()
      .maybeSingle();
    if (saveErr) throw saveErr;

    return jsonResp({ profile: saved, cached: false, posts_analyzed: posts.length });
  } catch (err) {
    console.error('[ai-brand-voice-analyzer] error:', err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
