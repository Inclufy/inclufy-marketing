/**
 * ai-ad-variants — generates 3 AI ad creative variants from an organic post.
 *
 * Roadmap §4.3 step "AMOS AI suggests: 3 creative variants".
 *
 * Input:
 *   POST { post_id, campaign_id, channel, brand_voice_id?, target_emotion? }
 *
 * Output:
 *   { variants: [{ label, headline, primary_text, description, cta, ai_rationale, ai_target_emotion }] }
 *
 * The variants get persisted to campaign_creatives so PostReview/BoostFlow
 * can show them as A/B/C cards. Each variant targets a different emotion:
 *   - A: Aspiration (forward-looking, premium tone)
 *   - B: Social proof (testimonial-style, trust)
 *   - C: Urgency (limited-time, FOMO)
 *
 * Falls back to deterministic templates if OpenAI key missing.
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
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

// Per-channel character limits — copied from Meta/TikTok/LinkedIn ad specs
const LIMITS: Record<string, { headline: number; primary: number; description: number }> = {
  meta:      { headline: 40,  primary: 125, description: 30 },   // FB/IG feed ad
  tiktok:    { headline: 100, primary: 150, description: 0  },   // single-line TikTok ad
  linkedin:  { headline: 70,  primary: 600, description: 0  },   // Sponsored Content
  pinterest: { headline: 100, primary: 500, description: 0  },   // Promoted Pin
  snapchat:  { headline: 34,  primary: 250, description: 0  },   // Snap Ad
  google:    { headline: 30,  primary: 90,  description: 90 },   // Search ad headline + 2 descriptions
};

const VARIANT_BLUEPRINTS = [
  {
    label: 'A',
    emotion: 'aspiration',
    rationale: 'Premium aspirational tone — appeals to brand-affinity buyers',
    promptHint: 'Use forward-looking, premium language. Imagine the buyer becoming their best self with this product/service.',
  },
  {
    label: 'B',
    emotion: 'social_proof',
    rationale: 'Trust-building via testimonial framing — appeals to evidence-driven buyers',
    promptHint: 'Use third-person testimonial-style framing or stat (e.g. "Used by 1000+ teams"). Convey trust + community.',
  },
  {
    label: 'C',
    emotion: 'urgency',
    rationale: 'FOMO-driven — appeals to action-oriented buyers',
    promptHint: 'Use action verbs + scarcity cues (limited time, exclusive, today only). Drive immediate click.',
  },
];

async function callOpenAI(prompt: string, system: string): Promise<string> {
  if (!OPENAI_API_KEY) return '';
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  } catch {
    return '';
  }
}

function fallbackVariant(blueprint: typeof VARIANT_BLUEPRINTS[number], originalText: string, channel: string) {
  const limit = LIMITS[channel] ?? LIMITS.meta;
  const truncate = (s: string, n: number) => s.length <= n ? s : s.substring(0, n - 1) + '…';
  const base = (originalText || 'Ontdek meer.').replace(/\n+/g, ' ').trim();

  const headlines: Record<string, string> = {
    aspiration:    'Begin vandaag aan jouw verandering',
    social_proof:  'Wat 1000+ teams al doen',
    urgency:       'Nog 48u — pak deze kans',
  };
  const ctas: Record<string, string> = {
    aspiration:   'LEARN_MORE',
    social_proof: 'SIGN_UP',
    urgency:      'SHOP_NOW',
  };

  return {
    label: blueprint.label,
    headline: truncate(headlines[blueprint.emotion] ?? base, limit.headline),
    primary_text: truncate(base, limit.primary),
    description: limit.description ? truncate('Gegenereerd door AMOS', limit.description) : '',
    call_to_action: ctas[blueprint.emotion] ?? 'LEARN_MORE',
    ai_rationale: blueprint.rationale,
    ai_target_emotion: blueprint.emotion,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { post_id, campaign_id, channel, brand_voice_id, target_emotion } = body;

    if (!campaign_id || !channel) {
      return new Response(
        JSON.stringify({ error: 'campaign_id and channel required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const auth = req.headers.get('Authorization') ?? '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: auth } },
    });

    // Fetch source post for context
    let originalText = '';
    let imageUrl: string | undefined;
    if (post_id) {
      const { data: post } = await supabase
        .from('go_posts')
        .select('text_content, image_url, branded_image_url, hashtags')
        .eq('id', post_id)
        .maybeSingle();
      originalText = post?.text_content ?? '';
      imageUrl = post?.branded_image_url ?? post?.image_url;
    }

    // Fetch brand voice if specified
    let brandVoice = '';
    if (brand_voice_id) {
      const { data: bv } = await supabase
        .from('brand_voice_profiles')
        .select('tone, voice_descriptors, primary_language')
        .eq('id', brand_voice_id)
        .maybeSingle();
      if (bv) {
        brandVoice = `Tone: ${bv.tone}. Voice: ${(bv.voice_descriptors ?? []).join(', ')}. Language: ${bv.primary_language}.`;
      }
    }

    // Generate variants — focus only target_emotion if specified, else all 3
    const blueprintsToUse = target_emotion
      ? VARIANT_BLUEPRINTS.filter(b => b.emotion === target_emotion)
      : VARIANT_BLUEPRINTS;

    const limit = LIMITS[channel] ?? LIMITS.meta;
    const variants: any[] = [];

    for (const blueprint of blueprintsToUse) {
      const system = `You are AMOS Ads Creative AI — generate paid ad copy that converts. Always respond with valid JSON: {"headline": string, "primary_text": string, "description": string, "call_to_action": "LEARN_MORE"|"SHOP_NOW"|"BOOK_NOW"|"SIGN_UP"|"GET_QUOTE"|"CONTACT_US"|"DOWNLOAD"|"SUBSCRIBE"}`;

      const prompt = `Original organic post (basis for ad):
"""
${originalText.substring(0, 800)}
"""

Channel: ${channel}
Variant emotion: ${blueprint.emotion}
Variant strategy: ${blueprint.promptHint}
Brand voice: ${brandVoice || 'professional, inclusive, warm'}

Limits: headline max ${limit.headline} chars, primary_text max ${limit.primary} chars${limit.description ? `, description max ${limit.description} chars` : ''}.

Generate the ad creative now. Stay native to ${channel} — no hashtags in headline, emojis OK in primary_text.`;

      const aiResponse = await callOpenAI(prompt, system);
      let parsed: any = null;
      if (aiResponse) {
        try { parsed = JSON.parse(aiResponse); } catch { /* fall through to fallback */ }
      }

      const variant = parsed
        ? {
            label: blueprint.label,
            headline: (parsed.headline ?? '').substring(0, limit.headline),
            primary_text: (parsed.primary_text ?? '').substring(0, limit.primary),
            description: limit.description ? (parsed.description ?? '').substring(0, limit.description) : '',
            call_to_action: parsed.call_to_action ?? 'LEARN_MORE',
            ai_rationale: blueprint.rationale,
            ai_target_emotion: blueprint.emotion,
          }
        : fallbackVariant(blueprint, originalText, channel);

      // Persist to campaign_creatives
      const { data: inserted, error: insErr } = await supabase
        .from('campaign_creatives')
        .insert({
          campaign_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          variant_label: variant.label,
          headline: variant.headline,
          primary_text: variant.primary_text,
          description: variant.description,
          call_to_action: variant.call_to_action,
          image_url: imageUrl,
          ai_rationale: variant.ai_rationale,
          ai_target_emotion: variant.ai_target_emotion,
        })
        .select()
        .single();

      if (insErr) {
        console.error('[ai-ad-variants] Insert failed:', insErr);
      }

      variants.push(inserted ?? variant);
    }

    return new Response(
      JSON.stringify({ variants }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[ai-ad-variants] Error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
