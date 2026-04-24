// Supabase Edge Function: whatsapp-send
// Sends WhatsApp template messages via Meta's Cloud API to opted-in recipients.
//
// POST body: {
//   post_id?:       string          — go_posts.id (optional, for audit linkage)
//   user_id:        string          — owner's auth.users.id
//   template_name:  string          — Meta-approved template name
//   template_lang:  string          — e.g. "nl" | "en_US"
//   recipients:     string[]        — E.164 phone numbers e.g. ["+31612345678"]
//   variables?:     Record<string,string>  — body component variables keyed "1","2",...
// }
//
// Returns: { sent: N, failed: M, skipped: O, total_cost_usd: number }
//
// Auth: user JWT (normal) OR service-role + x-internal-call header (cron/internal)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')              ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')         ?? '';
const INTERNAL_CALL_SECRET      = Deno.env.get('INTERNAL_CALL_SECRET')      ?? '';

const GRAPH_API_VERSION = 'v20.0';
const BATCH_SIZE        = 10;   // send at most 10 per tick to respect ~80 msg/s WABA rate limit

// ─── WhatsApp message pricing by country prefix + category ────────────
// Source: Meta Cloud API pricing (April 2026 approximate).
// Only common prefixes listed; defaults to MARKETING rate for unknown.
const PRICE_TABLE: Record<string, { MARKETING: number; UTILITY: number; AUTHENTICATION: number }> = {
  '+31': { MARKETING: 0.0814, UTILITY: 0.0398, AUTHENTICATION: 0.0398 }, // NL
  '+32': { MARKETING: 0.0814, UTILITY: 0.0398, AUTHENTICATION: 0.0398 }, // BE
  '+49': { MARKETING: 0.1288, UTILITY: 0.0578, AUTHENTICATION: 0.0578 }, // DE
  '+33': { MARKETING: 0.1288, UTILITY: 0.0578, AUTHENTICATION: 0.0578 }, // FR
  '+44': { MARKETING: 0.0814, UTILITY: 0.0328, AUTHENTICATION: 0.0328 }, // UK
  '+212': { MARKETING: 0.0392, UTILITY: 0.0128, AUTHENTICATION: 0.0128 }, // MA
  '+971': { MARKETING: 0.0614, UTILITY: 0.0200, AUTHENTICATION: 0.0200 }, // AE
};
const DEFAULT_PRICE = { MARKETING: 0.0814, UTILITY: 0.0398, AUTHENTICATION: 0.0398 };

function getPriceUsd(phoneE164: string, category: string): number {
  const prefix = Object.keys(PRICE_TABLE).find(p => phoneE164.startsWith(p));
  const row    = prefix ? PRICE_TABLE[prefix] : DEFAULT_PRICE;
  return row[category as keyof typeof row] ?? row.MARKETING;
}

// ─── CORS headers ────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-call',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Send a single WhatsApp template message ─────────────────────────
async function sendTemplateMessage(
  phoneNumberId: string,
  accessToken:   string,
  toPhone:       string,
  templateName:  string,
  lang:          string,
  variables:     Record<string, string>,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Strip leading '+' — Meta expects E.164 without the plus sign
  const to = toPhone.startsWith('+') ? toPhone.slice(1) : toPhone;

  // Build body parameters array from variables object (keys "1","2",...)
  const varKeys = Object.keys(variables).sort((a, b) => Number(a) - Number(b));
  const bodyParams = varKeys.map(k => ({ type: 'text', text: variables[k] }));

  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
      ...(bodyParams.length > 0
        ? { components: [{ type: 'body', parameters: bodyParams }] }
        : {}),
    },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[whatsapp-send] Meta API error for ${toPhone}: ${res.status} ${errText}`);
      return { success: false, error: `Meta API ${res.status}: ${errText}` };
    }

    const data = await res.json();
    // Response shape: { messages: [{ id: "wamid.XXXX" }] }
    const messageId = (data.messages as Array<{ id: string }>)?.[0]?.id;
    return { success: true, messageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[whatsapp-send] Fetch exception for ${toPhone}: ${msg}`);
    return { success: false, error: `Network error: ${msg}` };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ─── Auth ───────────────────────────────────────────────────────
  const authHeader      = req.headers.get('Authorization') ?? '';
  const xInternalCall   = req.headers.get('x-internal-call') ?? '';
  const isInternalCall  = !!INTERNAL_CALL_SECRET
    && xInternalCall === INTERNAL_CALL_SECRET
    && authHeader     === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

  let jwtUserId: string | null = null;

  if (isInternalCall) {
    console.log('[whatsapp-send] internal call accepted');
  } else {
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const jwt = authHeader.slice(7);
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user }, error: jwtErr } = await authClient.auth.getUser();
    if (jwtErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    jwtUserId = user.id;
  }

  try {
    const body = await req.json() as {
      post_id?:       string;
      user_id:        string;
      template_name:  string;
      template_lang?: string;
      recipients:     string[];
      variables?:     Record<string, string>;
    };

    const { post_id, user_id, template_name, template_lang = 'nl', recipients, variables = {} } = body;

    if (!user_id || !template_name || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'user_id, template_name, and recipients[] are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify JWT user matches body user_id
    if (!isInternalCall && jwtUserId && jwtUserId !== user_id) {
      return new Response(JSON.stringify({ error: 'Forbidden: user_id mismatch' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ─── 1. Load active WABA config ────────────────────────────
    const { data: config, error: configErr } = await db
      .from('whatsapp_config')
      .select('id, phone_number_id, access_token, status')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (configErr || !config) {
      return new Response(
        JSON.stringify({ error: 'Geen actieve WhatsApp Business configuratie gevonden. Voeg je WABA in de instellingen toe.', action: 'setup_waba' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ─── 2. Verify approved template ───────────────────────────
    const { data: template, error: tplErr } = await db
      .from('whatsapp_templates')
      .select('id, name, language, category, status')
      .eq('waba_config_id', config.id)
      .eq('name', template_name)
      .eq('language', template_lang)
      .maybeSingle();

    if (tplErr || !template) {
      return new Response(
        JSON.stringify({ error: `Template '${template_name}' (${template_lang}) niet gevonden. Voeg het toe in WhatsApp instellingen.` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (template.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: `Template '${template_name}' heeft status '${template.status}' — wacht op Meta-goedkeuring.` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ─── 3. Load opted-in recipients ───────────────────────────
    const { data: optedInRows } = await db
      .from('whatsapp_recipients')
      .select('id, phone_e164, opt_in_at, opt_out_at')
      .eq('user_id', user_id)
      .eq('waba_config_id', config.id)
      .in('phone_e164', recipients);

    const optedInMap = new Map<string, string>(); // phone → recipient_id
    const optedOut   = new Set<string>();

    for (const row of optedInRows ?? []) {
      if (row.opt_in_at && !row.opt_out_at) {
        optedInMap.set(row.phone_e164, row.id);
      } else {
        optedOut.add(row.phone_e164);
      }
    }

    // Phones not in our recipients table at all are also skipped (not opted in)
    const unknownPhones = recipients.filter(p => !optedInMap.has(p) && !optedOut.has(p));
    const skipped       = optedOut.size + unknownPhones.length;
    const toSend        = [...optedInMap.keys()];

    // ─── 4. Send in batches ────────────────────────────────────
    let sent           = 0;
    let failed         = 0;
    let totalCostUsd   = 0;

    for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
      const batch = toSend.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (phone) => {
        const result = await sendTemplateMessage(
          config.phone_number_id,
          config.access_token,
          phone,
          template_name,
          template_lang,
          variables,
        );

        const costUsd = result.success
          ? getPriceUsd(phone, template.category)
          : 0;

        if (result.success) {
          sent++;
          totalCostUsd += costUsd;
        } else {
          failed++;
        }

        // Audit log row (non-fatal if this fails)
        try {
          await db.from('whatsapp_sends').insert({
            user_id,
            post_id:         post_id ?? null,
            recipient_id:    optedInMap.get(phone) ?? null,
            template_id:     template.id,
            phone_e164:      phone,
            meta_message_id: result.messageId ?? null,
            status:          result.success ? 'sent' : 'failed',
            error:           result.error ?? null,
            cost_usd:        result.success ? costUsd : null,
            sent_at:         new Date().toISOString(),
          });
        } catch (auditErr: unknown) {
          const msg = auditErr instanceof Error ? auditErr.message : String(auditErr);
          console.warn(`[whatsapp-send] Audit insert failed for ${phone}: ${msg}`);
        }
      }));

      // Small pause between batches to stay well under the 80 msg/s WABA limit
      if (i + BATCH_SIZE < toSend.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        skipped,
        total_recipients: recipients.length,
        total_cost_usd: Math.round(totalCostUsd * 100000) / 100000,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[whatsapp-send] Unhandled error:', msg);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
