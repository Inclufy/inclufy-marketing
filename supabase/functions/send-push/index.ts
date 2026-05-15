// ═══════════════════════════════════════════════════════════════════════════
// send-push — fan out an Expo push notification to all active devices of
// one or more users.
//
// Called server-to-server, typically from:
//  • The notify-on-go-notifications-insert DB trigger (default path —
//    every new in-app notification also triggers a native push)
//  • Other edge functions that want to ping a user directly (e.g.
//    publish-social on critical failure)
//
// Wire format (all server-to-server):
//   POST /functions/v1/send-push
//   {
//     user_ids: ["uuid", ...],          // fan out to all active devices
//     title: "Post gepubliceerd",
//     body: "Je post staat live op LinkedIn.",
//     data?: { route: "Notifications", notification_id: "..." }
//   }
//
// Returns: { ok: true, sent: <count>, failed: <count>, deactivated: [...] }
//
// Expo response handling:
//  • status="ok" → success
//  • status="error" + DeviceNotRegistered → mark device inactive
//  • status="error" + InvalidCredentials → log + bail (re-issue creds)
//
// Expo accepts up to 100 messages per HTTP call — we batch automatically.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Optional Expo access token for higher rate limits + push receipts.
// If unset, send-push still works.
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN') ?? '';
// Shared secret — REQUIRED. The DB trigger on go_notifications INSERT
// posts here with this header; any other unauthenticated invocation
// (curl-spam, scraped UUID lists) is rejected. Without this gate, anyone
// on the internet can push notifications to any user.
const INTERNAL_PUSH_SECRET = Deno.env.get('INTERNAL_PUSH_SECRET') ?? '';

// Per-user rate-limit. Defense-in-depth against a logged-in user (or a
// trigger gone runaway) hammering send-push. Default 100 pushes per
// user per hour. Override via env. 0 = disabled (not recommended).
const MAX_PUSHES_PER_HOUR_PER_USER = Number(
  Deno.env.get('MAX_PUSHES_PER_HOUR_PER_USER') ?? '100',
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushBody {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Override sound/vibration/priority. Defaults to 'default' (on iOS), high prio. */
  sound?: 'default' | null;
  /** iOS badge count override. */
  badge?: number;
  /** Channel id for Android Oreo+ — must match a channel created in the app. */
  channel_id?: string;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fetchActiveTokens(userIds: string[]): Promise<{ id: string; user_id: string; expo_push_token: string }[]> {
  const { data, error } = await supa
    .from('user_devices')
    .select('id, user_id, expo_push_token')
    .in('user_id', userIds)
    .eq('is_active', true);
  if (error) {
    console.error('[send-push] fetch tokens failed', error.message);
    return [];
  }
  return data ?? [];
}

async function postBatchToExpo(messages: ExpoMessage[]): Promise<ExpoTicket[]> {
  if (messages.length === 0) return [];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };
  if (EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${EXPO_ACCESS_TOKEN}`;

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  // Expo returns { data: [...tickets] } when sent as array
  return Array.isArray(json?.data) ? json.data : [];
}

async function deactivateDevices(deviceIds: string[]): Promise<void> {
  if (deviceIds.length === 0) return;
  const { error } = await supa
    .from('user_devices')
    .update({ is_active: false })
    .in('id', deviceIds);
  if (error) console.error('[send-push] deactivate failed', error.message);
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);

  // Refuse to run without the shared secret configured — better to fail
  // closed than ship an open relay.
  if (!INTERNAL_PUSH_SECRET) {
    console.error('[send-push] INTERNAL_PUSH_SECRET not set — refusing all calls');
    return jsonResponse({ error: 'service unavailable' }, 503);
  }
  const providedSecret = req.headers.get('x-internal-secret') ?? '';
  if (!constantTimeEquals(providedSecret, INTERNAL_PUSH_SECRET)) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  let body: PushBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const userIds = Array.isArray(body.user_ids) ? body.user_ids.filter(Boolean) : [];
  if (userIds.length === 0) return jsonResponse({ error: 'user_ids required' }, 400);
  if (!body.title || !body.body) return jsonResponse({ error: 'title and body required' }, 400);

  // Per-user rate-limit. Count sends to each user_id in trailing 1h;
  // any user over the cap gets short-circuited (and logged with
  // status='rate_limited' for forensics — see Scenario D in
  // BREACH_RESPONSE_RUNBOOK.md).
  const overCap = new Set<string>();
  if (MAX_PUSHES_PER_HOUR_PER_USER > 0) {
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    for (const uid of userIds) {
      const { count } = await supa
        .from('push_send_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('status', 'sent')
        .gte('sent_at', sinceIso);
      if ((count ?? 0) >= MAX_PUSHES_PER_HOUR_PER_USER) overCap.add(uid);
    }
    if (overCap.size > 0) {
      const rateLimitedRows = [...overCap].map((uid) => ({
        user_id: uid,
        title: body.title,
        body: body.body,
        status: 'rate_limited' as const,
        status_detail: `>${MAX_PUSHES_PER_HOUR_PER_USER} in last hour`,
      }));
      await supa.from('push_send_log').insert(rateLimitedRows);
      // If ALL recipients are over cap, refuse outright with 429.
      if (overCap.size === userIds.length) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'rate_limited',
            limit_per_hour: MAX_PUSHES_PER_HOUR_PER_USER,
            over_cap_users: [...overCap],
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': '3600',
            },
          },
        );
      }
      // Otherwise filter out the capped users and proceed with the rest
      // — partial delivery is better than total failure for batch sends.
    }
  }

  const eligibleUserIds = userIds.filter((u) => !overCap.has(u));
  const devices = await fetchActiveTokens(eligibleUserIds);
  if (devices.length === 0) {
    // Log no-devices for the eligible users
    if (eligibleUserIds.length > 0) {
      await supa.from('push_send_log').insert(
        eligibleUserIds.map((uid) => ({
          user_id: uid,
          title: body.title,
          body: body.body,
          status: 'no_devices' as const,
        })),
      );
    }
    return jsonResponse({
      ok: true,
      sent: 0,
      failed: 0,
      rate_limited: overCap.size,
      reason: 'no active devices',
    });
  }

  // Build messages — keep token→device-id and token→user-id maps so we
  // can deactivate stale tokens AND log per-user send results.
  const tokenToDevice = new Map<string, string>();
  const tokenToUser = new Map<string, string>();
  const messages: ExpoMessage[] = devices.map((d) => {
    tokenToDevice.set(d.expo_push_token, d.id);
    tokenToUser.set(d.expo_push_token, d.user_id);
    return {
      to: d.expo_push_token,
      title: body.title,
      body: body.body,
      data: body.data ?? {},
      sound: body.sound === null ? null : 'default',
      badge: body.badge,
      channelId: body.channel_id,
      priority: 'high',
      ttl: 60 * 60 * 24, // 24h — drop if undelivered after a day
    };
  });

  // Batch — Expo accepts ≤100 per call
  const batchSize = 100;
  let sent = 0;
  let failed = 0;
  const deactivate: string[] = [];
  const logRows: Array<{
    user_id: string;
    expo_push_id: string | null;
    title: string;
    body: string;
    status: 'sent' | 'failed';
    status_detail: string | null;
  }> = [];

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    try {
      const tickets = await postBatchToExpo(batch);
      tickets.forEach((ticket, idx) => {
        const tokenForThisTicket = batch[idx].to;
        const userIdForThisTicket = tokenToUser.get(tokenForThisTicket) ?? null;
        if (ticket.status === 'ok') {
          sent += 1;
          if (userIdForThisTicket) {
            logRows.push({
              user_id: userIdForThisTicket,
              expo_push_id: ticket.id ?? null,
              title: body.title,
              body: body.body,
              status: 'sent',
              status_detail: null,
            });
          }
        } else {
          failed += 1;
          // DeviceNotRegistered → token is dead, mark inactive
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const deviceId = tokenToDevice.get(tokenForThisTicket);
            if (deviceId) deactivate.push(deviceId);
          }
          if (userIdForThisTicket) {
            logRows.push({
              user_id: userIdForThisTicket,
              expo_push_id: null,
              title: body.title,
              body: body.body,
              status: 'failed',
              status_detail: ticket.details?.error ?? ticket.message ?? 'unknown',
            });
          }
          console.warn(`[send-push] ticket error: ${ticket.message} (${ticket.details?.error})`);
        }
      });
    } catch (e: any) {
      failed += batch.length;
      console.error('[send-push] batch failed', e?.message ?? String(e));
    }
  }

  // Best-effort log write — chunked to avoid hitting Supabase row limits.
  if (logRows.length > 0) {
    for (let i = 0; i < logRows.length; i += 200) {
      await supa.from('push_send_log').insert(logRows.slice(i, i + 200));
    }
  }
  await deactivateDevices(deactivate);

  return jsonResponse({
    ok: true,
    sent,
    failed,
    rate_limited: overCap.size,
    deactivated: deactivate.length,
    total_devices: devices.length,
  });
});
