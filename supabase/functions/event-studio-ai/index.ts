// Supabase Edge Function: Event Studio AI
// Handles all AI content generation for the mobile app:
// event-post, story-arc, event-recap, transcribe, auto-tag, translate, audience-target

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

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

async function callOpenAI(messages: object[], model = 'gpt-4o-mini', maxTokens = 1500, jsonMode = false) {
  const body: Record<string, unknown> = { model, messages, max_tokens: maxTokens, temperature: 0.7 };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJSON(text: string, fallback: unknown) {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
}

function buildBrandPrompt(base: string, brand?: Record<string, unknown>): string {
  if (!brand) return base;
  const parts = [base];
  if (brand.name) parts.push(`Brand: ${brand.name}`);
  if (brand.tone) parts.push(`Tone of voice: ${brand.tone}`);
  if (brand.industry) parts.push(`Industry: ${brand.industry}`);
  if (brand.target_audience) parts.push(`Target audience: ${brand.target_audience}`);
  if (brand.brand_values?.length) parts.push(`Brand values: ${(brand.brand_values as string[]).join(', ')}`);
  return parts.join('\n');
}

// ─── Action: event-post ────────────────────────────────────────────
async function handleEventPost(body: Record<string, unknown>) {
  const { platform, event_context, capture_note, capture_tags, image_base64, transcript, brand_context } = body;
  const ctx = (event_context || {}) as Record<string, unknown>;

  const systemPrompt = buildBrandPrompt(
    `You are a social media content expert for events. Generate engaging, platform-optimized posts.
Always respond with valid JSON: {"text": string, "hashtags": string[], "image_description": string, "optimal_post_time": string}`,
    brand_context as Record<string, unknown>,
  );

  const userContent: object[] = [
    {
      type: 'text',
      text: `Create a ${platform} post for this event capture.
Event: ${ctx.name || 'Event'}
Description: ${ctx.description || ''}
Location: ${ctx.location || ''}
Hashtags: ${((ctx.hashtags as string[]) || []).join(' ')}
Capture note: ${capture_note || ''}
Tags: ${((capture_tags as string[]) || []).join(', ')}
${transcript ? `Audio transcript: ${transcript}` : ''}

Return JSON with: text (ready to post), hashtags (array, max 10), image_description (what you see), optimal_post_time (suggestion).`,
    },
  ];

  if (image_base64) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${image_base64}`, detail: 'low' },
    });
  }

  const result = await callOpenAI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
    image_base64 ? 'gpt-4o' : 'gpt-4o-mini',
    800,
    false,
  );

  return parseJSON(result, { text: result, hashtags: ctx.hashtags || [], image_description: '', optimal_post_time: '' });
}

// ─── Action: story-arc ─────────────────────────────────────────────
async function handleStoryArc(body: Record<string, unknown>) {
  const { event_name, event_date, event_start_time, event_end_time, channels, hashtags, goals, captures_so_far, brand_context } = body;

  const systemPrompt = buildBrandPrompt(
    `You are a content strategist for live events. Create a story arc posting plan.
Always respond with valid JSON: {"arc": [{time, phase, theme, channel, content_type, tip, caption_template}], "total_planned": number, "narrative_summary": string}`,
    brand_context as Record<string, unknown>,
  );

  const userMsg = `Create a story arc for:
Event: ${event_name}
Date: ${event_date}
Start: ${event_start_time || '09:00'} - End: ${event_end_time || '18:00'}
Channels: ${((channels as string[]) || []).join(', ')}
Hashtags: ${((hashtags as string[]) || []).join(' ')}
Goals: ${((goals as string[]) || []).join(', ')}
Captures so far: ${captures_so_far || 0}

Plan 5-8 posts throughout the day as a narrative arc (arrival → keynote → networking → highlight → wrap-up).
Each arc item: time (HH:MM), phase (string), theme (string), channel (from list), content_type (photo/video/quote/reel), tip (shooting advice), caption_template (template with [brackets]).`;

  const result = await callOpenAI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
    'gpt-4o-mini',
    1200,
    true,
  );

  return parseJSON(result, { arc: [], total_planned: 0, narrative_summary: '' });
}

// ─── Action: event-recap ───────────────────────────────────────────
async function handleEventRecap(body: Record<string, unknown>) {
  const {
    event_name, event_date, location, posts, captures_count, published_count,
    output_format, brand_context, language = 'en', tone = 'standard',
  } = body;

  // Language mapping
  const languageMap: Record<string, string> = {
    nl: 'Dutch (Nederlands). All output — title, content, highlights, CTA, teaser — must be in Dutch.',
    en: 'English. All output must be in English.',
    fr: 'French (Français). All output — title, content, highlights, CTA, teaser — must be in French.',
  };
  const langInstruction = languageMap[language as string] || languageMap.en;

  // Tone / length mapping
  const toneMap: Record<string, string> = {
    compact:  'Keep it concise and punchy. Aim for approximately 250-350 words of content.',
    standard: 'Standard length. Aim for approximately 500-700 words of content.',
    detailed: 'Be thorough and elaborate. Aim for approximately 800-1000 words of content.',
  };
  const toneInstruction = toneMap[tone as string] || toneMap.standard;

  // Format instructions (in English — AI adapts to output language)
  const formatInstructions: Record<string, string> = {
    blog: 'Structure as a blog post with a strong intro, main body with sections, and a conclusion.',
    newsletter: 'Structure as a newsletter recap: conversational, energetic, with a clear subject line feel.',
    linkedin_article: 'Structure as a professional LinkedIn article with thought leadership angle. Start with a hook.',
  };

  const systemPrompt = buildBrandPrompt(
    `You are a content strategist creating post-event content.
Language: Write ENTIRELY in ${langInstruction}
Tone: ${toneInstruction}
Always respond with valid JSON: {"title": string, "content": string, "key_highlights": string[], "suggested_cta": string, "social_teaser": string}
The "key_highlights" should be 3-5 bullet point strings.
The "social_teaser" should be 1-2 sentences max.`,
    brand_context as Record<string, unknown>,
  );

  const postsSummary = ((posts as object[]) || []).slice(0, 10).map((p: Record<string, unknown>) =>
    `[${p.channel}] ${p.text_content}`
  ).join('\n');

  const userMsg = `Create a ${output_format} recap for:
Event: ${event_name}
Date: ${event_date}
Location: ${location || ''}
Total captures: ${captures_count || 0}
Published posts: ${published_count || 0}

Sample posts from the day:
${postsSummary || 'No posts captured yet'}

${formatInstructions[output_format as string] || formatInstructions.blog}
Include 3-5 key highlights, a 1-2 sentence social teaser, and a call-to-action.`;

  const result = await callOpenAI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
    'gpt-4o-mini',
    1800,
    true,
  );

  return parseJSON(result, { title: '', content: '', key_highlights: [], suggested_cta: '', social_teaser: '' });
}

// ─── Action: transcribe ────────────────────────────────────────────
async function handleTranscribe(body: Record<string, unknown>) {
  const { audio_base64 } = body;
  if (!audio_base64) throw new Error('audio_base64 required');

  const audioBytes = Uint8Array.from(atob(audio_base64 as string), (c) => c.charCodeAt(0));
  const formData = new FormData();
  formData.append('file', new Blob([audioBytes], { type: 'audio/wav' }), 'audio.wav');
  formData.append('model', 'whisper-1');
  formData.append('language', 'nl');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Whisper ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { transcript: data.text || '', duration: 0 };
}

// ─── Action: auto-tag ──────────────────────────────────────────────
async function handleAutoTag(body: Record<string, unknown>) {
  const { image_base64, existing_tags } = body;

  const systemPrompt = `You are an image analysis expert for event photography.
Always respond with valid JSON: {"tags": [{type, label, confidence}], "scene_description": string, "suggested_tags": string[], "people_count": number}
Tag types: person, product, location, activity, mood, branding, setup`;

  const userContent: object[] = [
    { type: 'text', text: `Analyze this event photo. Existing tags: ${((existing_tags as string[]) || []).join(', ')}. Identify all elements.` },
  ];
  if (image_base64) {
    userContent.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}`, detail: 'low' } });
  }

  const result = await callOpenAI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
    'gpt-4o',
    600,
    false,
  );

  return parseJSON(result, { tags: [], scene_description: '', suggested_tags: [], people_count: 0 });
}

// ─── Action: translate ─────────────────────────────────────────────
async function handleTranslate(body: Record<string, unknown>) {
  const { text, source_language, target_languages, platform, brand_context } = body;
  const targets = ((target_languages as string[]) || ['en', 'nl', 'fr']);

  const systemPrompt = buildBrandPrompt(
    `You are a professional translator and cultural adaptor for social media.
Always respond with valid JSON: {"translations": {lang: {"text": string, "hashtags": string[], "notes": string}}}`,
    brand_context as Record<string, unknown>,
  );

  const userMsg = `Translate this ${platform || 'social media'} post from ${source_language || 'auto'} to: ${targets.join(', ')}.
Adapt tone, idioms, and hashtags culturally. Text: "${text}"`;

  const result = await callOpenAI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
    'gpt-4o-mini',
    800,
    true,
  );

  return parseJSON(result, { translations: {} });
}

// ─── Action: audience-target ───────────────────────────────────────
async function handleAudienceTarget(body: Record<string, unknown>) {
  const { text_content, channel, event_context, hashtags, brand_context } = body;
  const ctx = (event_context || {}) as Record<string, unknown>;

  const systemPrompt = buildBrandPrompt(
    `You are a marketing strategist. Analyze content and suggest optimal audiences.
Always respond with valid JSON: {"primary": string, "secondary": string, "reasoning": string, "demographics": string, "interests": string[], "optimal_time": string, "engagement_tips": string[]}`,
    brand_context as Record<string, unknown>,
  );

  const userMsg = `Suggest the best target audience for this ${channel} post:
Event: ${ctx.name || ''}
Content: "${text_content}"
Hashtags: ${((hashtags as string[]) || []).join(' ')}`;

  const result = await callOpenAI(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
    'gpt-4o-mini',
    600,
    true,
  );

  return parseJSON(result, { primary: '', secondary: '', reasoning: '', demographics: '', interests: [], optimal_time: '', engagement_tips: [] });
}

// ─── Main handler ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResp({ error: 'Not authenticated' }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonResp({ error: 'Unauthorized' }, 401);

    if (!OPENAI_API_KEY) return jsonResp({ error: 'OpenAI API key not configured' }, 503);

    const body = await req.json() as Record<string, unknown>;
    const action = body.action as string;

    let result: unknown;
    switch (action) {
      case 'event-post':      result = await handleEventPost(body); break;
      case 'story-arc':       result = await handleStoryArc(body); break;
      case 'event-recap':     result = await handleEventRecap(body); break;
      case 'transcribe':      result = await handleTranscribe(body); break;
      case 'auto-tag':        result = await handleAutoTag(body); break;
      case 'translate':       result = await handleTranslate(body); break;
      case 'audience-target': result = await handleAudienceTarget(body); break;
      default: return jsonResp({ error: `Unknown action: ${action}` }, 400);
    }

    return jsonResp({ result });
  } catch (err) {
    console.error('event-studio-ai error:', err);
    return jsonResp({ error: String(err) }, 500);
  }
});
