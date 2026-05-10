// ═══════════════════════════════════════════════════════════════════════════
// resend-webhook — receives delivery events from Resend and updates
// public.email_send_log + public.email_suppressions accordingly.
//
// Resend posts events as JSON to this endpoint. Configure once in the Resend
// dashboard:
//   Webhooks → Add endpoint → URL = https://<ref>.supabase.co/functions/v1/resend-webhook
//   Events to listen for:
//     email.delivered, email.bounced, email.complained, email.opened, email.clicked
//
// Signature verification (Svix headers): Resend signs payloads with HMAC.
// We require RESEND_WEBHOOK_SECRET to match — if not configured, the
// function refuses requests so you can never accidentally accept unsigned
// events from a stranger.
//
// Schema of an event:
//   { type: "email.bounced", created_at: "...", data: { email_id, to, ... } }
// where `data.to` may be string or array of strings depending on the event.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? '';

interface ResendEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    to?: string | string[];
    bounce?: { type?: string; reason?: string; description?: string };
    click?: { link?: string };
    [k: string]: unknown;
  };
}

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function firstRecipient(to: string | string[] | undefined): string | null {
  if (!to) return null;
  return Array.isArray(to) ? (to[0] ?? null) : to;
}

// Svix signature verification (Resend uses Svix under the hood). Headers:
//   svix-id        — message id
//   svix-timestamp — unix seconds
//   svix-signature — "v1,<base64sig> v1,<base64sig> ..."
async function verifySvix(req: Request, rawBody: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return false;
  const svixId = req.headers.get('svix-id');
  const svixTs = req.headers.get('svix-timestamp');
  const svixSig = req.headers.get('svix-signature');
  if (!svixId || !svixTs || !svixSig) return false;

  // Webhook secret format: "whsec_<base64>"
  const secretPart = WEBHOOK_SECRET.startsWith('whsec_')
    ? WEBHOOK_SECRET.slice('whsec_'.length)
    : WEBHOOK_SECRET;

  let keyBytes: Uint8Array;
  try {
    keyBytes = Uint8Array.from(atob(secretPart), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }

  const toSign = `${svixId}.${svixTs}.${rawBody}`;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(toSign));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

  // Header may contain multiple signatures separated by spaces
  for (const part of svixSig.split(' ')) {
    const [, providedSig] = part.split(',');
    if (providedSig && providedSig === sigB64) return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);

  const rawBody = await req.text();
  if (!(await verifySvix(req, rawBody))) {
    return jsonResponse({ error: 'invalid signature' }, 401);
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'invalid json' }, 400);
  }

  const recipient = firstRecipient(event.data?.to);
  const resendId = event.data?.email_id ?? null;
  const ts = event.created_at ? new Date(event.created_at).toISOString() : new Date().toISOString();

  // ── 1. Update email_send_log row matched by resend_id ─────────────────
  const updates: Record<string, unknown> = {};
  switch (event.type) {
    case 'email.delivered':
      updates.status = 'delivered';
      updates.delivered_at = ts;
      break;
    case 'email.bounced':
      updates.status = 'bounced';
      updates.bounced_at = ts;
      updates.status_detail = event.data?.bounce?.reason ?? event.data?.bounce?.description ?? null;
      break;
    case 'email.complained':
      updates.status = 'complained';
      updates.complained_at = ts;
      break;
    case 'email.opened':
      updates.opened_at = ts;
      break;
    case 'email.clicked':
      updates.clicked_at = ts;
      break;
    default:
      // unknown event type — log & no-op
      console.log(`[resend-webhook] unhandled type=${event.type}`);
      return jsonResponse({ ok: true, ignored: event.type });
  }

  if (resendId && Object.keys(updates).length > 0) {
    const { error } = await supa
      .from('email_send_log')
      .update(updates)
      .eq('resend_id', resendId);
    if (error) {
      console.error('[resend-webhook] update failed', error.message);
    }
  }

  // ── 2. Auto-suppress on hard bounce / complaint ───────────────────────
  if (recipient && (event.type === 'email.bounced' || event.type === 'email.complained')) {
    const isHardBounce =
      event.type === 'email.complained' ||
      (event.type === 'email.bounced' && (event.data?.bounce?.type ?? '').toLowerCase() === 'hardbounce');

    if (isHardBounce) {
      const reason = event.type === 'email.complained' ? 'complaint' : 'hard_bounce';
      const { error } = await supa
        .from('email_suppressions')
        .upsert(
          { email: recipient, reason, source_event: event },
          { onConflict: 'email', ignoreDuplicates: true },
        );
      if (error) {
        console.error('[resend-webhook] suppression upsert failed', error.message);
      }
    }
  }

  return jsonResponse({ ok: true, type: event.type });
});
