// Supabase Edge Function: OAuth Callback
// Handles OAuth callbacks for LinkedIn, Meta (Facebook/Instagram), and TikTok.
// Exchanges the authorization code for tokens, stores the social account,
// and redirects the user back to the app.
// Also supports fetching Facebook Pages and Instagram Business accounts.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const META_APP_ID = Deno.env.get('META_APP_ID') ?? '';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET') ?? '';
const TIKTOK_CLIENT_KEY = Deno.env.get('TIKTOK_CLIENT_KEY') ?? '';
const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET') ?? '';

// The redirect URI must exactly match what's registered in developer consoles
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/oauth-callback`;

function successPage(platform: string, accountName: string, pages?: Array<{id: string, name: string}>) {
  const pagesHtml = pages && pages.length > 0
    ? `<div style="margin-top:16px;text-align:left">
        <p style="font-size:14px;color:#333;font-weight:600;margin-bottom:8px">Bedrijfspagina's gevonden:</p>
        ${pages.map(p => `<div style="padding:8px 12px;background:#F3F0FF;border-radius:8px;margin-bottom:6px;font-size:13px;color:#5B21B6">✅ ${p.name}</div>`).join('')}
       </div>`
    : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verbonden!</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;display:flex;justify-content:center;align-items:center;
  min-height:100vh;margin:0;background:linear-gradient(135deg,#F7F6FF,#EDE9FE);color:#1a1a2e}
  .card{background:#fff;border-radius:20px;padding:48px 32px;text-align:center;max-width:400px;
  box-shadow:0 8px 32px rgba(124,58,237,.12)}
  .icon{font-size:64px;margin-bottom:16px}
  h1{font-size:24px;margin:0 0 8px;color:#7C3AED}
  p{color:#666;margin:0 0 16px;line-height:1.5}
</style></head>
<body><div class="card">
  <div class="icon">✅</div>
  <h1>Verbonden!</h1>
  <p><strong>${platform.charAt(0).toUpperCase() + platform.slice(1)}</strong> is succesvol verbonden met AMOS${accountName ? ` als <strong>${accountName}</strong>` : ''}.</p>
  ${pagesHtml}
  <p style="font-size:14px;color:#999;margin-top:16px">Je kunt dit venster sluiten en teruggaan naar de app.</p>
</div></body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function errorPage(platform: string, reason: string, details?: string) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fout</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;display:flex;justify-content:center;align-items:center;
  min-height:100vh;margin:0;background:#FFF5F5;color:#1a1a2e}
  .card{background:#fff;border-radius:20px;padding:48px 32px;text-align:center;max-width:400px;
  box-shadow:0 8px 32px rgba(220,38,38,.12)}
  .icon{font-size:64px;margin-bottom:16px}
  h1{font-size:24px;margin:0 0 8px;color:#DC2626}
  p{color:#666;margin:0 0 24px;line-height:1.5}
  .detail{font-size:11px;color:#aaa;word-break:break-all;margin-top:8px;padding:8px;background:#f5f5f5;border-radius:8px;text-align:left}
</style></head>
<body><div class="card">
  <div class="icon">❌</div>
  <h1>Verbinding mislukt</h1>
  <p>Er ging iets mis bij het verbinden van <strong>${platform}</strong>.</p>
  <p style="font-size:13px;color:#999">Fout: ${reason}<br>Probeer het opnieuw vanuit de app.</p>
  ${details ? `<div class="detail">${details}</div>` : ''}
</div></body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function upsertSocialAccount(
  db: any,
  userId: string,
  platform: string,
  profileId: string,
  profileName: string,
  profilePicture: string,
  accessToken: string,
  accountType: string = 'personal',
  pageAccessToken?: string,
) {
  // Try to find existing account by user_id + platform + platform_account_id
  const { data: existing } = await db
    .from('social_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('platform_account_id', profileId)
    .maybeSingle();

  let socialAccountId: string;

  const accountData: any = {
    account_name: profileName,
    profile_image_url: profilePicture,
    status: 'active',
    account_type: accountType,
  };

  if (existing) {
    socialAccountId = existing.id;
    const { error: updateErr } = await db
      .from('social_accounts')
      .update(accountData)
      .eq('id', socialAccountId);
    if (updateErr) {
      console.error('Update social_accounts error:', updateErr);
    }
  } else {
    const insertData: any = {
      user_id: userId,
      platform,
      platform_account_id: profileId,
      ...accountData,
    };

    // Try with organization_id first, fall back without it
    try {
      const { data: inserted, error: insertErr } = await db
        .from('social_accounts')
        .insert({ ...insertData, organization_id: userId })
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      socialAccountId = inserted.id;
    } catch (err1: any) {
      console.log('Insert with organization_id failed, trying without:', err1.message);
      // Try without organization_id (column might not exist)
      const { data: inserted, error: insertErr } = await db
        .from('social_accounts')
        .insert(insertData)
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      socialAccountId = inserted!.id;
    }
  }

  // Upsert oauth token
  const tokenToStore = pageAccessToken || accessToken;
  const { data: existingToken } = await db
    .from('oauth_tokens')
    .select('id')
    .eq('social_account_id', socialAccountId)
    .maybeSingle();

  const tokenRecord = {
    social_account_id: socialAccountId,
    platform,
    access_token: tokenToStore,
  };

  if (existingToken) {
    await db.from('oauth_tokens').update(tokenRecord).eq('id', existingToken.id);
  } else {
    await db.from('oauth_tokens').insert(tokenRecord);
  }

  return socialAccountId;
}

serve(async (req) => {
  const url = new URL(req.url);
  console.log('OAuth callback hit:', url.pathname + url.search);

  // ── Handle CORS preflight ──
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // ── Handle manual account connection (POST) ──
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { userId, platform, accountName, accountUrl, accountType } = body;

      if (!userId || !platform || !accountName) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const accountId = await upsertSocialAccount(
        db, userId, platform,
        accountUrl || accountName, // use URL as platform_account_id if available
        accountName,
        '', // no profile picture for manual connections
        '', // no access token for manual connections
        accountType || 'manual',
      );

      return new Response(JSON.stringify({ success: true, id: accountId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (err: any) {
      console.error('Manual connect error:', err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  // ── Handle OAuth callback (GET) ──
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  const errorParam = url.searchParams.get('error');
  const errorDesc = url.searchParams.get('error_description') ?? '';

  console.log('OAuth params:', { code: code ? 'present' : 'missing', state, error: errorParam });

  if (errorParam) {
    console.error('OAuth error:', errorParam, errorDesc);
    return errorPage('social media', errorParam, errorDesc);
  }

  if (!code) {
    return errorPage('social media', 'Geen autorisatiecode ontvangen');
  }

  // Parse state → "user_id:organization_id:platform"
  const parts = state.split(':');
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    console.error('Invalid state parameter:', state);
    return errorPage('social media', 'Ongeldige state parameter');
  }
  const userId = parts[0];
  const platform = parts[2] || parts[1] || 'facebook';

  try {
    let accessToken: string;
    let profileId: string;
    let profileName: string;
    let profilePicture: string;
    let pages: Array<{id: string, name: string, access_token: string, ig_id?: string}> = [];

    if (platform === 'linkedin') {
      // ─── LinkedIn ─────────────────────────────────────────────────
      const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID') ?? '';
      const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET') ?? '';

      console.log('LinkedIn token exchange with redirect_uri:', REDIRECT_URI);

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
        return errorPage('LinkedIn', 'Token exchange mislukt', err);
      }
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token;

      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!profileRes.ok) {
        const err = await profileRes.text();
        console.error('LinkedIn profile fetch failed:', err);
        return errorPage('LinkedIn', 'Profiel ophalen mislukt', err);
      }
      const profile = await profileRes.json();
      profileId = profile.sub ?? '';
      profileName = profile.name ?? '';
      profilePicture = profile.picture ?? '';

    } else if (platform === 'tiktok') {
      // ─── TikTok ───────────────────────────────────────────────────
      console.log('TikTok token exchange');

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
        return errorPage('TikTok', 'Token exchange mislukt', err);
      }
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token ?? tokenData.data?.access_token ?? '';
      const openId = tokenData.open_id ?? tokenData.data?.open_id ?? '';

      const profileRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profileData = profileRes.ok ? await profileRes.json() : { data: { user: {} } };
      const user = profileData.data?.user ?? {};
      profileId = openId || user.open_id || '';
      profileName = user.display_name || 'TikTok User';
      profilePicture = user.avatar_url || '';

    } else {
      // ─── Meta (Facebook/Instagram) ────────────────────────────────
      console.log('Meta token exchange for platform:', platform);

      const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
      tokenUrl.searchParams.set('client_id', META_APP_ID);
      tokenUrl.searchParams.set('client_secret', META_APP_SECRET);
      tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      tokenUrl.searchParams.set('code', code);

      const tokenRes = await fetch(tokenUrl.toString());
      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error('Meta token exchange failed:', err);
        return errorPage(platform, 'Token exchange mislukt', err);
      }
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token;

      // Get long-lived token
      try {
        const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
        longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
        longLivedUrl.searchParams.set('client_id', META_APP_ID);
        longLivedUrl.searchParams.set('client_secret', META_APP_SECRET);
        longLivedUrl.searchParams.set('fb_exchange_token', accessToken);
        const longLivedRes = await fetch(longLivedUrl.toString());
        if (longLivedRes.ok) {
          const longLivedData = await longLivedRes.json();
          accessToken = longLivedData.access_token || accessToken;
          console.log('Got long-lived token');
        }
      } catch { /* keep short-lived token */ }

      // Fetch user profile
      const profileRes = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,picture.type(large)&access_token=${accessToken}`,
      );
      if (!profileRes.ok) {
        const err = await profileRes.text();
        console.error('Meta profile fetch failed:', err);
        return errorPage(platform, 'Profiel ophalen mislukt', err);
      }
      const profile = await profileRes.json();
      profileId = profile.id ?? '';
      profileName = profile.name ?? '';
      profilePicture = profile.picture?.data?.url ?? '';

      // ─── Fetch Facebook Pages (for business page support) ────────
      try {
        const pagesRes = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,profile_picture_url}&access_token=${accessToken}`,
        );
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          pages = (pagesData.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            access_token: p.access_token,
            ig_id: p.instagram_business_account?.id,
            ig_name: p.instagram_business_account?.username || p.instagram_business_account?.name,
            ig_picture: p.instagram_business_account?.profile_picture_url,
          }));
          console.log(`Found ${pages.length} Facebook Pages`);
        }
      } catch (e) {
        console.error('Failed to fetch pages:', e);
      }
    }

    // ─── Store accounts ─────────────────────────────────────────────
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Store main personal account
    await upsertSocialAccount(db, userId, platform, profileId, profileName, profilePicture, accessToken, 'personal');

    // Store Facebook Pages as separate accounts
    const connectedPages: Array<{id: string, name: string}> = [];
    for (const page of pages) {
      try {
        await upsertSocialAccount(
          db, userId, 'facebook',
          page.id, `${page.name} (Pagina)`, '',
          accessToken, 'page', page.access_token,
        );
        connectedPages.push({ id: page.id, name: page.name });

        // Also connect Instagram Business Account if linked to this page
        if ((page as any).ig_id) {
          await upsertSocialAccount(
            db, userId, 'instagram',
            (page as any).ig_id,
            (page as any).ig_name || `${page.name} Instagram`,
            (page as any).ig_picture || '',
            accessToken, 'business', page.access_token,
          );
          connectedPages.push({ id: (page as any).ig_id, name: `${(page as any).ig_name || page.name} (Instagram)` });
        }
      } catch (e) {
        console.error(`Failed to store page ${page.name}:`, e);
      }
    }

    console.log(`Social account connected: platform=${platform} account=${profileName} pages=${connectedPages.length}`);

    return successPage(platform, profileName, connectedPages.length > 0 ? connectedPages : undefined);

  } catch (err: any) {
    console.error('OAuth callback error:', err);
    return errorPage(platform, 'Server error', err?.message);
  }
});
