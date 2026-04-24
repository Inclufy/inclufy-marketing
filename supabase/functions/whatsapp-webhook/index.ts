// Supabase Edge Function: whatsapp-webhook
// Receives Meta's WhatsApp Cloud API delivery/read/failed status webhooks.
//
// GET  ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
//      → responds with hub.challenge (Meta webhook verification handshake)
//
// POST → validates x-hub-signature-256 HMAC, then updates whatsapp_sends rows
//        with delivery status (delivered | read | failed).
//
// This endpoint is PUBLIC — no JWT. Security is via x-hub-signature-256.
//
// Required env vars:
//   WHATSAPP_APP_SECRET   — Meta App Secret (used for HMAC verification)
//   WHATSAPP_VERIFY_TOKEN — arbitrary token you set in Meta dashboard for GET verification
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')              ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WHATSAPP_APP_SECRET       = Deno.env.get('WHATSAPP_APP_SECRET')       ?? '';
const WHATSAPP_VERIFY_TOKEN     = Deno.env.get('WHATSAPP_VERIFY_TOKEN')     ?? '';

// ─── HMAC-SHA256 signature validation ───────────────────────────────
async function validateHmac(body: ArrayBuffer, signatureHeader: string | null): Promise<boolean> {
  if (!WHATSAPP_APP_SECRET) {
    console.warn('[whatsapp-webhook] WHATSAPP_APP_SECRET not set — skipping signature check (dev mode)');
    return true; // allow in local dev; must be set in production
  }
  if (!signatureHeader?.startsWith('sha256=')) return false;

  const expectedSig = signatureHeader.slice('sha256='.length);
  const keyData     = new TextEncoder().encode(WHATSAPP_APP_SECRET);

  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig  = await crypto.subtle.sign('HMAC', key, body);
  const hex  = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hex === expectedSig;
}

// ─── Status normalization ────────────────────────────────────────────
type WaMsgStatus = 'sent' | 'delivered' | 'read' | 'failed';

function normalizeStatus(raw: string): WaMsgStatus | null {
  switch (raw) {
    case 'sent':      return 'sent';
    case 'delivered': return 'delivered';
    case 'read':      return 'read';
    case 'failed':    return 'failed';
    default:          return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // ─── GET: Meta webhook verification challenge ─────────────────
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN && challenge) {
      console.log('[whatsapp-webhook] Webhook verification successful');
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    console.warn('[whatsapp-webhook] Verification failed — token mismatch or missing params');
    return new Response('Forbidden', { status: 403 });
  }

  // ─── POST: status update payload ─────────────────────────────
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Read raw body first for HMAC verification
  const rawBody    = await req.arrayBuffer();
  const sigHeader  = req.headers.get('x-hub-signature-256');
  const isValid    = await validateHmac(rawBody, sigHeader);

  if (!isValid) {
    console.error('[whatsapp-webhook] Invalid x-hub-signature-256 — ignoring payload');
    return new Response('Forbidden', { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return new Response('Bad Request: invalid JSON', { status: 400 });
  }

  // Meta payload shape:
  // { object: "whatsapp_business_account", entry: [{ changes: [{ value: { statuses: [...] } }] }] }
  const entries = (payload as Record<string, unknown>)?.entry;
  if (!Array.isArray(entries)) {
    // Acknowledgement — Meta sometimes sends pings with no entry
    return new Response('OK', { status: 200 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let processed = 0;
  let ignored   = 0;

  for (const entry of entries) {
    const changes = (entry as Record<string, unknown>)?.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value    = (change as Record<string, unknown>)?.value as Record<string, unknown> | undefined;
      const statuses = value?.statuses;
      if (!Array.isArray(statuses)) continue;

      for (const statusObj of statuses) {
        const s = statusObj as Record<string, unknown>;
        const messageId = s.id as string | undefined;
        const rawStatus = s.status as string | undefined;

        if (!messageId || !rawStatus) { ignored++; continue; }

        const status = normalizeStatus(rawStatus);
        if (!status) { ignored++; continue; }

        // Collect optional error details for 'failed' status
        const errPayload    = s.errors as Array<Record<string, unknown>> | undefined;
        const errorText     = errPayload?.[0]
          ? `${errPayload[0].code}: ${errPayload[0].title}`
          : null;

        // Update the most recent matching send row
        try {
          const { error: updateErr } = await db
            .from('whatsapp_sends')
            .update({
              status,
              error: errorText ?? undefined,
            })
            .eq('meta_message_id', messageId);

          if (updateErr) {
            console.error(`[whatsapp-webhook] DB update error for ${messageId}: ${updateErr.message}`);
            ignored++;
          } else {
            processed++;
          }
        } catch (dbErr: unknown) {
          const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
          console.error(`[whatsapp-webhook] DB exception for ${messageId}: ${msg}`);
          ignored++;
        }
      }
    }
  }

  console.log(`[whatsapp-webhook] Processed ${processed} status updates, ignored ${ignored}`);
  // Meta requires a 200 response — always return 200 even on partial failures
  return new Response(JSON.stringify({ processed, ignored }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
