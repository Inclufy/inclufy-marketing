// ════════════════════════════════════════════════════════════════════
// AI Connection Helper — supports the social media wizard
// Endpoints (via `mode` field in body):
//   - 'scope-explain'         → plain-language uitleg per OAuth scope
//   - 'prerequisite-explain'  → uitleg wat user moet doen vóór connect
//   - 'error-troubleshoot'    → human-friendly error diagnosis
//   - 'onboarding-recommend'  → smart pre-select platforms o.b.v. industry
//
// All explanations are cached in `ai_explanation_cache` for 180 days
// to avoid repeated LLM calls (these explanations are static per
// scope/platform, not per user).
// ════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  checkAiQuota,
  logAiCall,
  rateLimitResponse,
} from '../_shared/ai-rate-limit.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const FN_NAME = 'ai-connection-helper';

interface AiCtx {
  supa: SupabaseClient;
  userId: string;
  organizationId: string | null;
}

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

async function callOpenAI(ctx: AiCtx | null, messages: object[], maxTokens = 400): Promise<string> {
  const model = 'gpt-4o-mini';
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.4, // tightly factual
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (ctx) {
      await logAiCall(ctx.supa, {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        functionName: FN_NAME,
        provider: 'openai',
        model,
        inputTokens: data.usage?.prompt_tokens ?? null,
        outputTokens: data.usage?.completion_tokens ?? null,
        status: 'sent',
      });
    }
    return (data.choices?.[0]?.message?.content ?? '').trim();
  } catch (err) {
    if (ctx) {
      await logAiCall(ctx.supa, {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        functionName: FN_NAME,
        provider: 'openai',
        model,
        status: 'failed',
        statusDetail: (err as Error).message?.slice(0, 500),
      });
    }
    throw err;
  }
}

// ─── Cache helpers ──────────────────────────────────────────────────
async function getCached(key: string): Promise<string | null> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await db
    .from('ai_explanation_cache')
    .select('explanation, expires_at')
    .eq('cache_key', key)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  return data.explanation;
}

async function setCached(key: string, explanation: string, language: string) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  await db
    .from('ai_explanation_cache')
    .upsert({ cache_key: key, explanation, language }, { onConflict: 'cache_key' });
}

// ─── 1. scope-explain ────────────────────────────────────────────────
async function scopeExplain(ctx: AiCtx | null, platform: string, scope: string, language = 'nl'): Promise<string> {
  const cacheKey = `scope-explain:${platform}:${scope}:${language}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const langInstr = language === 'nl' ? 'Schrijf in Nederlands.' :
                    language === 'fr' ? 'Écris en français.' :
                    language === 'ar' ? 'اكتب بالعربية.' :
                    'Write in English.';

  const prompt = `Je bent een privacy-vriendelijke gids in een mobiele marketing-app (AMOS).
Een gebruiker wil weten waarom AMOS de OAuth scope "${scope}" voor platform "${platform}" vraagt.

Schrijf een uitleg van MAX 2 zinnen die:
1. Concreet zegt wat AMOS doet met deze scope (geen jargon)
2. Expliciet zegt wat AMOS NIET doet (privacy-grens)

${langInstr} Geen markdown. Geen kop. Alleen 2 zinnen.`;

  const reply = await callOpenAI(ctx, [{ role: 'user', content: prompt }], 200);
  await setCached(cacheKey, reply, language);
  return reply;
}

// ─── 2. prerequisite-explain ────────────────────────────────────────
async function prerequisiteExplain(ctx: AiCtx | null, platform: string, language = 'nl'): Promise<string> {
  const cacheKey = `prerequisite-explain:${platform}:${language}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const langInstr = language === 'nl' ? 'Schrijf in Nederlands.' :
                    language === 'fr' ? 'Écris en français.' :
                    language === 'ar' ? 'اكتب بالعربية.' :
                    'Write in English.';

  const prompt = `Je helpt een gebruiker van AMOS (een mobiele marketing-app) bij het verbinden van platform "${platform}".

Schrijf een korte gids (max 4 bullet points) met wat de gebruiker MOET hebben/doen vóór de OAuth-flow start. Voorbeelden:
- Voor Instagram: Business of Creator account + gekoppeld aan Facebook Page
- Voor LinkedIn: account moet ingelogd zijn op linkedin.com
- Voor Facebook: admin-rol op minstens 1 Page

Specifieke instructies indien relevant: hoe IG omschakelen naar Business (Settings → Account type → Business). Hoe FB Page maken. Etc.

${langInstr} Format: bullet list met "•". Max 4 punten. Geen kop.`;

  const reply = await callOpenAI(ctx, [{ role: 'user', content: prompt }], 300);
  await setCached(cacheKey, reply, language);
  return reply;
}

// ─── 3. error-troubleshoot ──────────────────────────────────────────
async function errorTroubleshoot(
  ctx: AiCtx | null,
  platform: string,
  errorMessage: string,
  language = 'nl',
): Promise<string> {
  // Errors are too varied to cache — always re-run
  const langInstr = language === 'nl' ? 'Schrijf in Nederlands.' :
                    language === 'fr' ? 'Écris en français.' :
                    language === 'ar' ? 'اكتب بالعربية.' :
                    'Write in English.';

  const prompt = `Je bent een support-coach in AMOS (mobiele marketing-app).
Een gebruiker probeerde "${platform}" te verbinden via OAuth en kreeg deze error:

"${errorMessage}"

Schrijf een hulp-antwoord met:
1. Eén zin: wat ging er mis (in mensentaal, geen API-jargon)
2. 1-3 concrete stappen die de gebruiker NU kan doen om het op te lossen

${langInstr} Format: zin 1 dan bullet list. Max 5 zinnen totaal.`;

  return await callOpenAI(ctx, [{ role: 'user', content: prompt }], 350);
}

// ─── 4. onboarding-recommend ────────────────────────────────────────
async function onboardingRecommend(
  ctx: AiCtx | null,
  industry: string,
  audience: string,
  language = 'nl',
): Promise<{ recommended: string[]; reason: string }> {
  const langInstr = language === 'nl' ? 'Schrijf reason in Nederlands.' :
                    language === 'fr' ? 'Écris le reason en français.' :
                    language === 'ar' ? 'اكتب reason بالعربية.' :
                    'Write reason in English.';

  const prompt = `Je adviseert welke social media platforms een AMOS-gebruiker moet verbinden.

Beschikbare platforms: facebook, instagram, linkedin, tiktok.
NIET beschikbaar voor publiceren: snapchat, x.

Gebruiker:
- Industrie: ${industry || 'onbekend'}
- Doelgroep: ${audience || 'algemeen'}

Beveel 1-3 platforms aan die het meeste impact zullen hebben voor deze use case. Filter alleen uit beschikbare lijst.

${langInstr}

Geef antwoord als JSON: { "recommended": ["platform1", ...], "reason": "1 zin uitleg" }
Geen markdown wrappers, alleen pure JSON.`;

  const reply = await callOpenAI(ctx, [{ role: 'user', content: prompt }], 200);
  try {
    const clean = reply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      recommended: Array.isArray(parsed.recommended) ? parsed.recommended : ['linkedin', 'instagram', 'facebook'],
      reason: parsed.reason ?? '',
    };
  } catch {
    return { recommended: ['linkedin', 'instagram', 'facebook'], reason: '' };
  }
}

// ─── Main handler ───────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { mode, platform, scope, errorMessage, industry, audience, language = 'nl' } = await req.json();

    if (!mode) return jsonResp({ error: 'Missing mode' }, 400);

    // ─── AI rate-limit (Sprint-3 #17) ───
    // Function has no formal auth — JWT is optional. When present, enforce the
    // per-user cap; otherwise (anonymous / service-role) skip both quota & log.
    let aiCtx: AiCtx | null = null;
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get('Authorization') ?? '';
    if (authHeader && authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
      try {
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const quota = await checkAiQuota(db, { userId: user.id, functionName: FN_NAME });
          if (!quota.ok) return rateLimitResponse(quota);
          aiCtx = { supa: db, userId: user.id, organizationId: null };
        }
      } catch {
        // best-effort
      }
    }

    switch (mode) {
      case 'scope-explain':
        if (!platform || !scope) return jsonResp({ error: 'Missing platform or scope' }, 400);
        return jsonResp({ explanation: await scopeExplain(aiCtx, platform, scope, language) });

      case 'prerequisite-explain':
        if (!platform) return jsonResp({ error: 'Missing platform' }, 400);
        return jsonResp({ explanation: await prerequisiteExplain(aiCtx, platform, language) });

      case 'error-troubleshoot':
        if (!platform || !errorMessage) return jsonResp({ error: 'Missing platform or errorMessage' }, 400);
        return jsonResp({ explanation: await errorTroubleshoot(aiCtx, platform, errorMessage, language) });

      case 'onboarding-recommend':
        return jsonResp(await onboardingRecommend(aiCtx, industry || '', audience || '', language));

      default:
        return jsonResp({ error: `Unknown mode: ${mode}` }, 400);
    }
  } catch (err) {
    console.error('[ai-connection-helper] error:', err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
