// Supabase Edge Function: OAuth Callback
// Handles OAuth callbacks for LinkedIn, Meta (Facebook/Instagram), and TikTok.
// Exchanges the authorization code for tokens, stores the social account,
// and redirects the user back to the app.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const META_APP_ID = Deno.env.get('META_APP_ID') ?? '';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET') ?? '';
const TIKTOK_CLIENT_KEY = Deno.env.get('TIKTOK_CLIENT_KEY') ?? '';
const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET') ?? '';
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') ?? 'https://app.inclufy.nl';

// The redirect URI must exactly match what's registered in Meta developer console
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/oauth-callback`;

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

function successPage(platform: string) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verbonden!</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;display:flex;justify-content:center;align-items:center;
  min-height:100vh;margin:0;background:linear-gradient(135deg,#F7F6FF,#EDE9FE);color:#1a1a2e}
  .card{background:#fff;border-radius:20px;padding:48px 32px;text-align:center;max-width:360px;
  box-shadow:0 8px 32px rgba(124,58,237,.12)}
  .icon{font-size:64px;margin-bottom:16px}
  h1{font-size:24px;margin:0 0 8px;color:#7C3AED}
  p{color:#666;margin:0 0 24px;line-height:1.5}
  .btn{display:inline-block;background:#7C3AED;color:#fff;padding:14px 32px;border-radius:12px;
  text-decoration:none;font-weight:600;font-size:16px}
</style></head>
<body><div class="card">
  <div class="icon">✅</div>
  <h1>Verbonden!</h1>
  <p><strong>${platform.charAt(0).toUpperCase() + platform.slice(1)}</strong> is succesvol verbonden met AMOS.</p>
  <p style="font-size:14px;color:#999">Je kunt dit venster sluiten en teruggaan naar de app.</p>
</div></body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function errorPage(platform: string, reason: string) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fout</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;display:flex;justify-content:center;align-items:center;
  min-height:100vh;margin:0;background:#FFF5F5;color:#1a1a2e}
  .card{background:#fff;border-radius:20px;padding:48px 32px;text-align:center;max-width:360px;
  box-shadow:0 8px 32px rgba(220,38,38,.12)}
  .icon{font-size:64px;margin-bottom:16px}
  h1{font-size:24px;margin:0 0 8px;color:#DC2626}
  p{color:#666;margin:0 0 24px;line-height:1.5}
</style></head>
<body><div class="card">
  <div class="icon">❌</div>
  <h1>Verbinding mislukt</h1>
  <p>Er ging iets mis bij het verbinden van <strong>${platform}</strong>.</p>
  <p style="font-size:13px;color:#999">Fout: ${reason}<br>Probeer het opnieuw vanuit de app.</p>
</div></body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

serve(async (req) => {
  const url = new URL(req.url);

  console.log('OAuth callback hit:', url.toString());

  // Meta sends ?code=...&state=...
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  const errorParam = url.searchParams.get('error');

  console.log('OAuth params:', { code: code ? 'present' : 'missing', state, error: errorParam });

  if (errorParam) {
    console.error('OAuth error from Meta:', errorParam, url.searchParams.get('error_description'));
    return errorPage('unknown', errorParam ?? 'unknown');
  }

  if (!code) {
    return errorPage('unknown', 'no_code');
  }

  // Parse state → "user_id:organization_id:platform" (3 parts) or "user_id:organization_id" (2 parts)
  const parts = state.split(':');
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    console.error('Invalid state parameter:', state, 'parts:', parts);
    return errorPage('unknown', `invalid_state (got ${parts.length} parts: ${state})`);
  }
  const userId = parts[0];
  const organizationId = parts[1];
  const platform = parts[2] || 'facebook'; // default to facebook if not specified

  try {
    let accessToken: string;
    let profileId: string;
    let profileName: string;
    let profilePicture: string;

    if (platform === 'linkedin') {
      // ─── LinkedIn: Exchange code for access token ─────────────────
      const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID') ?? '';
      const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET') ?? '';

      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error('LinkedIn token exchange failed:', err);
        return errorPage(platform, 'token_exchange_failed');
      }
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token;

      // Fetch LinkedIn profile
      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!profileRes.ok) {
        console.error('LinkedIn profile fetch failed:', await profileRes.text());
        return errorPage(platform, 'profile_failed');
      }
      const profile = await profileRes.json();
      profileId = profile.sub ?? '';
      profileName = profile.name ?? '';
      profilePicture = profile.picture ?? '';

    } else if (platform === 'tiktok') {
      // ─── TikTok: Exchange code for access token ───────────────────
      const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: TIKTOK_CLIENT_KEY,
          client_secret: TIKTOK_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error('TikTok token exchange failed:', err);
        return errorPage(platform, 'token_exchange_failed');
      }
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token ?? tokenData.data?.access_token ?? '';
      const openId = tokenData.open_id ?? tokenData.data?.open_id ?? '';

      // Fetch TikTok user info
      const profileRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!profileRes.ok) {
        console.error('TikTok profile fetch failed:', await profileRes.text());
        return errorPage(platform, 'profile_failed');
      }
      const profileData = await profileRes.json();
      const user = profileData.data?.user ?? {};
      profileId = openId || user.open_id || '';
      profileName = user.display_name || 'TikTok User';
      profilePicture = user.avatar_url || '';

    } else {
      // ─── Meta (Facebook/Instagram): Exchange code for access token ─
      const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
      tokenUrl.searchParams.set('client_id', META_APP_ID);
      tokenUrl.searchParams.set('client_secret', META_APP_SECRET);
      tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      tokenUrl.searchParams.set('code', code);

      const tokenRes = await fetch(tokenUrl.toString());
      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error('Meta token exchange failed:', err);
        return errorPage(platform, 'token_exchange_failed');
      }
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token;

      // Fetch Meta profile
      const profileRes = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,picture.type(large)&access_token=${accessToken}`,
      );
      if (!profileRes.ok) {
        console.error('Meta profile fetch failed:', await profileRes.text());
        return errorPage(platform, 'profile_failed');
      }
      const profile = await profileRes.json();
      profileId = profile.id ?? '';
      profileName = profile.name ?? '';
      profilePicture = profile.picture?.data?.url ?? '';
    }

    // ─── Upsert social_accounts + oauth_tokens ────────────────────────
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if already exists
    const { data: existing } = await db
      .from('social_accounts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('platform', platform)
      .eq('platform_account_id', profileId)
      .maybeSingle();

    let socialAccountId: string;

    if (existing) {
      socialAccountId = existing.id;
      await db
        .from('social_accounts')
        .update({
          account_name: profileName,
          profile_image_url: profilePicture,
          status: 'active',
        })
        .eq('id', socialAccountId);
    } else {
      const { data: inserted, error: insertErr } = await db
        .from('social_accounts')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          platform,
          platform_account_id: profileId,
          account_name: profileName,
          profile_image_url: profilePicture,
          status: 'active',
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      socialAccountId = inserted.id;
    }

    // Upsert oauth token
    const { data: existingToken } = await db
      .from('oauth_tokens')
      .select('id')
      .eq('social_account_id', socialAccountId)
      .maybeSingle();

    const tokenRecord = {
      social_account_id: socialAccountId,
      platform,
      access_token: accessToken,
    };

    if (existingToken) {
      await db.from('oauth_tokens').update(tokenRecord).eq('id', existingToken.id);
    } else {
      await db.from('oauth_tokens').insert(tokenRecord);
    }

    console.log(`Social account connected: platform=${platform} account=${profileName} org=${organizationId}`);

    // ─── Step 4: Show success page ─────────────────────────────────
    return successPage(platform);

  } catch (err) {
    console.error('OAuth callback error:', err);
    return errorPage(platform, 'server_error');
  }
});
