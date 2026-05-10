// ═══════════════════════════════════════════════════════════════════════════
// register-push-token — upsert an Expo push token for the calling user.
//
// Called by the mobile app on cold-start (after permission granted) and
// after sign-in. Idempotent: re-registering the same token bumps
// last_seen_at and re-binds to the new user_id if the token was previously
// linked to a different account (account switch on shared device).
//
// Wire format:
//   POST /functions/v1/register-push-token
//   Authorization: Bearer <user_jwt>
//   {
//     expo_push_token: "ExponentPushToken[xxxxx]",
//     platform: "ios" | "android" | "web",
//     device_name?: string,
//     app_version?: string
//   }
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);

  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return jsonResponse({ error: 'Missing auth' }, 401);

  // Resolve caller via user JWT
  const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  let body: {
    expo_push_token?: string;
    platform?: 'ios' | 'android' | 'web';
    device_name?: string;
    app_version?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const token = (body.expo_push_token ?? '').trim();
  if (!token) return jsonResponse({ error: 'expo_push_token required' }, 400);
  // Reject obviously-bogus tokens early — Expo tokens have a fixed prefix
  if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
    return jsonResponse({ error: 'Invalid Expo token format' }, 400);
  }

  const platform = body.platform ?? null;
  if (platform && !['ios', 'android', 'web'].includes(platform)) {
    return jsonResponse({ error: 'platform must be ios|android|web' }, 400);
  }

  // Service-role client to perform the upsert (bypasses RLS so we can
  // re-bind a token from a previous user to the current one).
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await adminClient
    .from('user_devices')
    .upsert(
      {
        user_id: user.id,
        expo_push_token: token,
        platform,
        device_name: body.device_name ?? null,
        app_version: body.app_version ?? null,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'expo_push_token' },
    )
    .select('id, user_id, platform, last_seen_at')
    .single();

  if (error) {
    console.error('[register-push-token] upsert failed', error.message);
    return jsonResponse({ error: 'Upsert failed', detail: error.message }, 500);
  }

  return jsonResponse({ ok: true, device: data });
});
