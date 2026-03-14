// Supabase Edge Function: Setup Agent
// Multi-action AI router for the Setup Copilot — uses GPT-4o with JSON mode
// Actions: analyze-website, analyze-competitors, generate-strategy,
//          suggest-integrations, generate-personas, generate-scoring-model, suggest-templates

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

async function callOpenAI(messages: object[], model = 'gpt-4o', maxTokens = 2000) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '{}';
}

function parseJSON(text: string, fallback: unknown = {}) {
  try {
    return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch {
    return fallback;
  }
}

// ─── Action: analyze-website ──────────────────────────────────────
async function handleAnalyzeWebsite(body: Record<string, unknown>) {
  const { url, language = 'nl', deep = false } = body;
  if (!url) throw new Error('URL is required');

  // Fetch and extract text + metadata from website
  let pageText = '';
  let metaColors: string[] = [];
  let socialLinks: Record<string, string> = {};
  try {
    const res = await fetch(url as string, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InclulyBot/1.0)' },
    });
    const html = await res.text();

    // Extract social media links from HTML before stripping tags
    const socialPatterns: [string, RegExp][] = [
      ['linkedin', /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"']+)["']/i],
      ['instagram', /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/i],
      ['facebook', /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"']+)["']/i],
      ['twitter', /href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"']+)["']/i],
      ['youtube', /href=["'](https?:\/\/(?:www\.)?youtube\.com\/[^"']+)["']/i],
      ['tiktok', /href=["'](https?:\/\/(?:www\.)?tiktok\.com\/[^"']+)["']/i],
    ];
    for (const [platform, regex] of socialPatterns) {
      const m = html.match(regex);
      if (m) socialLinks[platform] = m[1];
    }

    // Extract theme/brand colors from CSS custom properties or meta tags
    const colorMatches = html.match(/--(?:primary|brand|main|accent)[-_]?color\s*:\s*(#[0-9a-fA-F]{3,8})/gi) || [];
    metaColors = colorMatches.map(m => {
      const hex = m.match(/#[0-9a-fA-F]{3,8}/);
      return hex ? hex[0] : '';
    }).filter(Boolean);

    // Strip HTML tags, scripts, styles
    pageText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, deep ? 6000 : 4000);
  } catch {
    pageText = `Website at ${url} (could not fetch content)`;
  }

  const langNote = language === 'nl' ? 'Antwoord in het Nederlands.' : language === 'fr' ? 'Répondez en français.' : 'Respond in English.';

  // Deep mode: extract everything in one large call for onboarding
  if (deep) {
    const colorHint = metaColors.length > 0 ? `Detected CSS colors: ${metaColors.join(', ')}. ` : '';
    const socialHint = Object.keys(socialLinks).length > 0
      ? `Detected social links: ${JSON.stringify(socialLinks)}. `
      : '';

    const result = await callOpenAI([
      {
        role: 'system',
        content: `You are a comprehensive brand & business analysis expert. Analyze the website content and extract ALL available information about the company. ${langNote}
${colorHint}${socialHint}
Return valid JSON with these fields:
{
  "brand_name": "string",
  "description": "string (2-3 sentences about the company)",
  "industry": "string",
  "tone": "string (professional, friendly, innovative, luxury, playful, authoritative, casual)",
  "brand_values": ["array of 3-5 core values"],
  "usps": ["array of 3-5 unique selling points"],
  "primary_color": "#hex (extract from brand colors if found, or #7c3aed as default)",
  "secondary_color": "#hex (complementary, or #ec4899 as default)",
  "tagline": "string (extract or generate a fitting tagline)",
  "mission": "string (company mission statement, extract or infer)",
  "target_audiences": ["array of 2-3 target audience descriptions"],
  "suggested_competitors": ["array of 3-5 likely competitor company names"],
  "products": [
    {
      "name": "string (product or service name)",
      "description": "string (1-2 sentences)",
      "usp": "string (key differentiator)",
      "features": "string (comma-separated key features)"
    }
  ],
  "audiences_detailed": [
    {
      "audienceType": "B2B or B2C or Both",
      "idealCustomer": "string (ideal customer profile description)",
      "customerSector": "string (industry/sector they serve)",
      "companySize": "string (e.g. 10-50, 50-200, 200+, or N/A for B2C)",
      "ageGroup": "string (e.g. 25-45)",
      "occupation": "string (typical job title/role)",
      "painPoints": "string (comma-separated pain points)"
    }
  ],
  "messaging_dos": "string (recommended messaging style and themes, comma-separated)",
  "messaging_donts": "string (what to avoid in messaging, comma-separated)",
  "social_urls": {
    "linkedin": "string (URL or empty)",
    "instagram": "string (URL or empty)",
    "facebook": "string (URL or empty)",
    "twitter": "string (URL or empty)",
    "youtube": "string (URL or empty)",
    "tiktok": "string (URL or empty)"
  }
}
Extract maximum 3 products. If info is not found, make reasonable inferences based on the industry and brand positioning.`,
      },
      { role: 'user', content: `Analyze this website content from ${url}:\n\n${pageText}` },
    ], 'gpt-4o', 4000);

    const parsed = parseJSON(result, {});
    // Merge detected social links with AI-extracted ones
    const finalSocial = {
      linkedin: '', instagram: '', facebook: '', twitter: '', youtube: '', tiktok: '',
      ...socialLinks,
      ...(parsed.social_urls || {}),
    };
    // Prefer detected CSS colors over AI guesses
    return {
      brand_name: parsed.brand_name || '',
      description: parsed.description || '',
      industry: parsed.industry || 'technology',
      tone: parsed.tone || 'professional',
      brand_values: parsed.brand_values || [],
      usps: parsed.usps || [],
      primary_color: metaColors[0] || parsed.primary_color || '#7c3aed',
      secondary_color: metaColors[1] || parsed.secondary_color || '#ec4899',
      tagline: parsed.tagline || '',
      mission: parsed.mission || '',
      target_audiences: parsed.target_audiences || [],
      suggested_competitors: parsed.suggested_competitors || [],
      products: parsed.products || [],
      audiences_detailed: parsed.audiences_detailed || [],
      messaging_dos: parsed.messaging_dos || '',
      messaging_donts: parsed.messaging_donts || '',
      social_urls: finalSocial,
    };
  }

  // Standard (non-deep) mode for sidebar
  const result = await callOpenAI([
    {
      role: 'system',
      content: `You are a brand analysis expert. Analyze the website content and extract brand identity information. ${langNote}
Return valid JSON with these fields:
{
  "brand_name": "string",
  "description": "string (2-3 sentences about the company)",
  "industry": "string",
  "tone": "string (e.g. professional, friendly, innovative)",
  "brand_values": ["array of 3-5 core values"],
  "usps": ["array of 3-5 unique selling points"],
  "primary_color": "#hex (guess from brand feel, or #7c3aed as default)",
  "secondary_color": "#hex (complementary color, or #ec4899 as default)",
  "tagline": "string (extract or generate a fitting tagline)",
  "target_audiences": ["array of 2-3 target audience descriptions"],
  "suggested_competitors": ["array of 3-5 likely competitor company names"]
}`,
    },
    { role: 'user', content: `Analyze this website content from ${url}:\n\n${pageText}` },
  ]);

  return parseJSON(result, {
    brand_name: '',
    description: '',
    industry: 'technology',
    tone: 'professional',
    brand_values: [],
    usps: [],
    primary_color: '#7c3aed',
    secondary_color: '#ec4899',
    tagline: '',
    target_audiences: [],
    suggested_competitors: [],
  });
}

// ─── Action: analyze-competitors ──────────────────────────────────
async function handleAnalyzeCompetitors(body: Record<string, unknown>) {
  const { competitors, industry, our_brand, language = 'nl' } = body;
  if (!competitors || !Array.isArray(competitors)) throw new Error('competitors array required');

  const langNote = language === 'nl' ? 'Antwoord in het Nederlands.' : language === 'fr' ? 'Répondez en français.' : 'Respond in English.';

  const result = await callOpenAI([
    {
      role: 'system',
      content: `You are a competitive analysis expert. ${langNote}
Analyze each competitor and return JSON:
{
  "competitors": [
    {
      "name": "string",
      "description": "string",
      "strengths": ["3-4 strengths"],
      "weaknesses": ["3-4 weaknesses"],
      "key_products": ["main products/services"],
      "pricing_strategy": "string",
      "target_segments": ["target segments"],
      "opportunities": ["2-3 opportunities against this competitor"],
      "threats": ["2-3 threats from this competitor"]
    }
  ]
}`,
    },
    {
      role: 'user',
      content: `Our company: ${our_brand || 'Unknown'} in ${industry || 'technology'}.
Analyze these competitors: ${(competitors as any[]).map(c => c.name || c).join(', ')}`,
    },
  ], 'gpt-4o', 3000);

  return parseJSON(result, { competitors: [] });
}

// ─── Action: generate-strategy ────────────────────────────────────
async function handleGenerateStrategy(body: Record<string, unknown>) {
  const { marketing_goals, industry, brand_name, language = 'nl' } = body;

  const langNote = language === 'nl' ? 'Antwoord in het Nederlands.' : language === 'fr' ? 'Répondez en français.' : 'Respond in English.';

  const result = await callOpenAI([
    {
      role: 'system',
      content: `You are a marketing strategy expert. ${langNote}
Based on the goals, generate strategic objectives. Return JSON:
{
  "objectives": [
    {
      "title": "string",
      "description": "string",
      "objective_type": "revenue|growth|acquisition|engagement|operational",
      "priority": "critical|high|medium|low",
      "target_value": number,
      "current_value": 0,
      "unit": "string (e.g. leads/month, EUR, %, visits)",
      "success_metrics": [{"metric": "string", "target": number}],
      "suggested_actions": ["2-3 action items"]
    }
  ]
}
Generate 4-6 objectives covering different types.`,
    },
    {
      role: 'user',
      content: `Company: ${brand_name || 'Unknown'}, Industry: ${industry || 'technology'}.
Marketing goals: ${Array.isArray(marketing_goals) ? marketing_goals.join(', ') : marketing_goals || 'Grow revenue and leads'}`,
    },
  ]);

  return parseJSON(result, { objectives: [] });
}

// ─── Action: generate-personas ────────────────────────────────────
async function handleGeneratePersonas(body: Record<string, unknown>) {
  const { industry, brand_name, target_audiences, goals, language = 'nl' } = body;

  const langNote = language === 'nl' ? 'Antwoord in het Nederlands.' : language === 'fr' ? 'Répondez en français.' : 'Respond in English.';

  const result = await callOpenAI([
    {
      role: 'system',
      content: `You are a marketing persona expert. ${langNote}
Generate detailed buyer personas. Return JSON:
{
  "personas": [
    {
      "name": "string (creative persona name, e.g. 'Enterprise Emma')",
      "demographics": {
        "age_range": "string",
        "gender": "string",
        "occupation": "string",
        "income_range": "string",
        "location": "string",
        "education": "string"
      },
      "psychographics": {
        "values": ["2-3 values"],
        "interests": ["3-4 interests"],
        "lifestyle": "string",
        "motivations": ["2-3 motivations"]
      },
      "behavioral": {
        "goals": ["3-4 goals"],
        "pain_points": ["3-4 pain points"],
        "preferred_channels": ["2-3 channels"],
        "buying_behavior": "string",
        "decision_style": "string"
      }
    }
  ]
}
Generate 2-3 distinct personas.`,
    },
    {
      role: 'user',
      content: `Company: ${brand_name}, Industry: ${industry}.
Target audiences: ${Array.isArray(target_audiences) ? target_audiences.join(', ') : target_audiences || 'B2B professionals'}.
Marketing goals: ${Array.isArray(goals) ? goals.join(', ') : goals || 'growth'}`,
    },
  ], 'gpt-4o', 3000);

  return parseJSON(result, { personas: [] });
}

// ─── Action: generate-scoring-model ───────────────────────────────
async function handleGenerateScoringModel(body: Record<string, unknown>) {
  const { industry, goals, personas, language = 'nl' } = body;

  const langNote = language === 'nl' ? 'Antwoord in het Nederlands.' : language === 'fr' ? 'Répondez en français.' : 'Respond in English.';

  const result = await callOpenAI([
    {
      role: 'system',
      content: `You are a lead scoring expert. ${langNote}
Generate a lead scoring model. Return JSON:
{
  "model": {
    "name": "string",
    "description": "string",
    "category_weights": { "behavioral": 35, "demographic": 20, "firmographic": 25, "engagement": 20 },
    "threshold_mql": 50,
    "threshold_sql": 75
  },
  "rules": [
    {
      "name": "string",
      "category": "behavioral|demographic|firmographic|engagement",
      "description": "string",
      "condition": {},
      "points": number
    }
  ]
}
Generate 6-8 scoring rules.`,
    },
    {
      role: 'user',
      content: `Industry: ${industry}. Goals: ${goals}. Personas: ${JSON.stringify(personas || []).substring(0, 500)}`,
    },
  ]);

  return parseJSON(result, { model: {}, rules: [] });
}

// ─── Action: suggest-integrations ─────────────────────────────────
async function handleSuggestIntegrations(body: Record<string, unknown>) {
  const { channels, industry, goals, language = 'nl' } = body;

  const langNote = language === 'nl' ? 'Antwoord in het Nederlands.' : language === 'fr' ? 'Répondez en français.' : 'Respond in English.';

  const result = await callOpenAI([
    {
      role: 'system',
      content: `You are a marketing technology expert. ${langNote}
Suggest marketing integrations. Return JSON:
{
  "integrations": [
    {
      "platform": "string (e.g. google_analytics, hubspot, mailchimp)",
      "display_name": "string",
      "category": "analytics|crm|email|social|advertising|automation",
      "reason": "string (why this integration is valuable)",
      "priority": "must_have|recommended|nice_to_have"
    }
  ]
}
Suggest 6-8 integrations based on the channels and goals.`,
    },
    {
      role: 'user',
      content: `Industry: ${industry}. Active channels: ${Array.isArray(channels) ? channels.join(', ') : channels}. Goals: ${goals}`,
    },
  ]);

  return parseJSON(result, { integrations: [] });
}

// ─── Action: suggest-templates ────────────────────────────────────
async function handleSuggestTemplates(body: Record<string, unknown>) {
  const { industry, channels, goals, tone, brand_name, language = 'nl' } = body;

  const langNote = language === 'nl' ? 'Antwoord in het Nederlands.' : language === 'fr' ? 'Répondez en français.' : 'Respond in English.';

  const result = await callOpenAI([
    {
      role: 'system',
      content: `You are a content marketing expert. ${langNote}
Suggest content templates. Return JSON:
{
  "templates": [
    {
      "name": "string",
      "content_type": "blog_post|social_post|email|case_study|whitepaper|landing_page",
      "category": "thought_leadership|social_media|nurture|customer_stories|product",
      "description": "string",
      "prompt_template": "string (AI prompt template with {variables})",
      "variables": ["variable names"],
      "channels": ["applicable channels"]
    }
  ]
}
Suggest 4-6 templates tailored to the brand.`,
    },
    {
      role: 'user',
      content: `Brand: ${brand_name}, Industry: ${industry}, Tone: ${tone}.
Channels: ${Array.isArray(channels) ? channels.join(', ') : channels}. Goals: ${goals}`,
    },
  ]);

  return parseJSON(result, { templates: [] });
}

// ─── Main Router ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResp({ error: 'Not authenticated' }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonResp({ error: 'Unauthorized' }, 401);
    if (!OPENAI_API_KEY) return jsonResp({ error: 'OpenAI API key not configured' }, 503);

    const body = await req.json();
    const { action } = body;

    let result: unknown;
    switch (action) {
      case 'analyze-website':
        result = await handleAnalyzeWebsite(body);
        break;
      case 'analyze-competitors':
        result = await handleAnalyzeCompetitors(body);
        break;
      case 'generate-strategy':
        result = await handleGenerateStrategy(body);
        break;
      case 'generate-personas':
        result = await handleGeneratePersonas(body);
        break;
      case 'generate-scoring-model':
        result = await handleGenerateScoringModel(body);
        break;
      case 'suggest-integrations':
        result = await handleSuggestIntegrations(body);
        break;
      case 'suggest-templates':
        result = await handleSuggestTemplates(body);
        break;
      default:
        return jsonResp({ error: `Unknown action: ${action}` }, 400);
    }

    return jsonResp(result);
  } catch (err) {
    console.error('setup-agent error:', err);
    return jsonResp({ error: err.message || 'Internal error' }, 500);
  }
});
