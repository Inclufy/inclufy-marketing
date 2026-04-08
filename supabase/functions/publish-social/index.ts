// Supabase Edge Function: Publish Social
// Publishes approved content proposals to social media platforms.
// Supports: LinkedIn (v2 API), Facebook Pages (Graph API), Instagram (Graph API via Pages)
// Fetches OAuth tokens from oauth_tokens table, posts content, updates proposal status.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ═══════════════════════════════════════════════════════
// Platform Publishers
// ═══════════════════════════════════════════════════════

async function publishToLinkedIn(
  accessToken: string,
  profileId: string,
  text: string,
  imageUrl?: string,
  accountType?: string, // 'personal' | 'company'
  extraImageUrls?: string[], // additional images for multi-image posts
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    let authorUrn: string;

    if (accountType === 'company' && profileId) {
      // Company page — profileId contains the organization ID
      authorUrn = profileId.startsWith('urn:') ? profileId : `urn:li:organization:${profileId}`;
    } else {
      // Personal profile — fetch user URN from LinkedIn API
      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileRes.ok) {
        return { success: false, error: `LinkedIn profile error: ${profileRes.status}` };
      }

      const profile = await profileRes.json();
      authorUrn = `urn:li:person:${profile.sub}`;
    }

    // Create post
    const postBody: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Helper: upload a single image to LinkedIn and return its asset URN
    async function uploadImageToLinkedIn(url: string): Promise<string | null> {
      try {
        const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: authorUrn,
              serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
            },
          }),
        });
        if (!registerRes.ok) {
          console.error('[LinkedIn] Register upload error:', registerRes.status);
          return null;
        }
        const registerData = await registerRes.json();
        const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
        const assetUrn = registerData.value?.asset;
        if (!uploadUrl || !assetUrn) return null;

        const imgRes = await fetch(url);
        if (!imgRes.ok) return null;
        const imgBlob = await imgRes.blob();
        const imgBuffer = await imgBlob.arrayBuffer();

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': imgBlob.type || 'image/jpeg' },
          body: imgBuffer,
        });
        if (!uploadRes.ok) return null;
        console.log('[LinkedIn] Image uploaded successfully, asset:', assetUrn);
        return assetUrn;
      } catch (err: any) {
        console.error('[LinkedIn] Image upload exception:', err.message);
        return null;
      }
    }

    // Upload all images (primary + extras) for multi-image LinkedIn posts
    const allImageUrls = [imageUrl, ...(extraImageUrls || [])].filter(Boolean) as string[];
    if (allImageUrls.length > 0) {
      const uploadedAssets: string[] = [];
      for (const url of allImageUrls) {
        const assetUrn = await uploadImageToLinkedIn(url);
        if (assetUrn) uploadedAssets.push(assetUrn);
      }
      if (uploadedAssets.length > 0) {
        const category = uploadedAssets.length > 1 ? 'IMAGE' : 'IMAGE'; // LinkedIn uses IMAGE for both single and multi
        postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = category;
        postBody.specificContent['com.linkedin.ugc.ShareContent'].media = uploadedAssets.map(urn => ({
          status: 'READY',
          media: urn,
        }));
      }
    }

    const publishRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });

    if (!publishRes.ok) {
      const errBody = await publishRes.text();
      console.error('[LinkedIn] Publish error:', publishRes.status, errBody);
      return { success: false, error: `LinkedIn API error ${publishRes.status}: ${errBody}` };
    }

    const postId = publishRes.headers.get('x-restli-id') || 'unknown';
    return { success: true, postId };
  } catch (err: any) {
    return { success: false, error: `LinkedIn exception: ${err.message}` };
  }
}

async function publishToFacebook(
  accessToken: string,
  pageId: string,
  text: string,
  imageUrl?: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    let url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    const params: any = {
      message: text,
      access_token: accessToken,
    };

    if (imageUrl) {
      url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      params.url = imageUrl;
      params.caption = text;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[Facebook] Publish error:', res.status, errBody);
      return { success: false, error: `Facebook API error ${res.status}: ${errBody}` };
    }

    const data = await res.json();
    return { success: true, postId: data.id || data.post_id };
  } catch (err: any) {
    return { success: false, error: `Facebook exception: ${err.message}` };
  }
}

async function publishToInstagram(
  accessToken: string,
  igBusinessAccountId: string,
  text: string,
  imageUrl?: string,
  extraImageUrls?: string[], // for carousel posts
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!imageUrl) {
      return { success: false, error: 'Instagram vereist een afbeelding voor publicatie' };
    }

    // Ensure image URL is publicly accessible — generate fresh signed URL if needed
    let publicImageUrl = imageUrl;
    if (imageUrl.includes('supabase') && !imageUrl.includes('/public/')) {
      // Extract storage path and generate a long-lived signed URL
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const pathMatch = imageUrl.match(/\/media\/(.+?)(\?|$)/);
      if (pathMatch) {
        const { data: signData } = await db.storage.from('media').createSignedUrl(pathMatch[1], 3600);
        if (signData?.signedUrl) publicImageUrl = signData.signedUrl;
      }
    }

    const allImages = [publicImageUrl, ...(extraImageUrls || [])].filter(Boolean) as string[];

    // Multi-image: use carousel container
    if (allImages.length > 1) {
      // Step 1: Create individual media items
      const childIds: string[] = [];
      for (const url of allImages) {
        const childRes = await fetch(
          `https://graph.facebook.com/v18.0/${igBusinessAccountId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: url,
              is_carousel_item: true,
              access_token: accessToken,
            }),
          },
        );
        if (childRes.ok) {
          const { id } = await childRes.json();
          childIds.push(id);
        }
      }

      if (childIds.length === 0) {
        return { success: false, error: 'Instagram carousel: geen items konden worden aangemaakt' };
      }

      // Step 2: Create carousel container
      const carouselRes = await fetch(
        `https://graph.facebook.com/v18.0/${igBusinessAccountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: 'CAROUSEL',
            children: childIds.join(','),
            caption: text,
            access_token: accessToken,
          }),
        },
      );

      if (!carouselRes.ok) {
        const errBody = await carouselRes.text();
        return { success: false, error: `Instagram carousel error: ${errBody}` };
      }

      const { id: containerId } = await carouselRes.json();

      // Step 3: Publish carousel
      const publishRes = await fetch(
        `https://graph.facebook.com/v18.0/${igBusinessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
        },
      );
      if (!publishRes.ok) {
        const errBody = await publishRes.text();
        return { success: false, error: `Instagram carousel publish error: ${errBody}` };
      }
      const data = await publishRes.json();
      return { success: true, postId: data.id };
    }

    // Single image post
    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v18.0/${igBusinessAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: publicImageUrl,
          caption: text,
          access_token: accessToken,
        }),
      },
    );

    if (!createRes.ok) {
      const errBody = await createRes.text();
      return { success: false, error: `Instagram create error: ${errBody}` };
    }

    const { id: containerId } = await createRes.json();

    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${igBusinessAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      },
    );

    if (!publishRes.ok) {
      const errBody = await publishRes.text();
      return { success: false, error: `Instagram publish error: ${errBody}` };
    }

    const data = await publishRes.json();
    return { success: true, postId: data.id };
  } catch (err: any) {
    return { success: false, error: `Instagram exception: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { proposal_id, post_id, user_id, channel: directChannel, text: directText, image_url: directImageUrl, extra_image_urls: directExtraImageUrls, account_id: directAccountId } = body;

    // ── Direct post publish (from go_posts via mobile app) ──
    if (post_id && user_id) {
      const channel = directChannel;
      const text = directText;
      const imageUrl = directImageUrl;

      if (!channel || !text) {
        return new Response(
          JSON.stringify({ error: 'channel and text are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Find social account — use specific account_id if provided (for multi-account support)
      let socialAccountQuery = db
        .from('social_accounts')
        .select('id, platform, platform_account_id, account_type, account_name')
        .eq('user_id', user_id)
        .eq('platform', channel)
        .eq('status', 'active');
      if (directAccountId) {
        socialAccountQuery = socialAccountQuery.eq('id', directAccountId);
      }
      const { data: socialAccount } = await socialAccountQuery
        .limit(1)
        .maybeSingle();

      if (!socialAccount) {
        return new Response(
          JSON.stringify({ error: `Geen ${channel} account gekoppeld`, action: 'connect_account', channel }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Manual account — mark as published
      if (socialAccount.account_type === 'manual') {
        return new Response(
          JSON.stringify({ success: true, published: false, manual: true, message: `Content klaar om te kopiëren naar ${channel}.` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Fetch OAuth token (check expiry)
      const { data: tokenData } = await db
        .from('oauth_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('social_account_id', socialAccount.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tokenData?.access_token) {
        return new Response(
          JSON.stringify({ error: 'Geen geldig OAuth token. Koppel je account opnieuw.', action: 'reconnect', channel }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Check if token is expired
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        // Try to refresh if we have a refresh_token
        if (tokenData.refresh_token && channel === 'linkedin') {
          try {
            const refreshRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: tokenData.refresh_token,
                client_id: Deno.env.get('LINKEDIN_CLIENT_ID') ?? '',
                client_secret: Deno.env.get('LINKEDIN_CLIENT_SECRET') ?? '',
              }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              tokenData.access_token = refreshData.access_token;
              // Update token in database
              await db
                .from('oauth_tokens')
                .update({
                  access_token: refreshData.access_token,
                  expires_at: new Date(Date.now() + (refreshData.expires_in || 5184000) * 1000).toISOString(),
                  refresh_token: refreshData.refresh_token || tokenData.refresh_token,
                })
                .eq('social_account_id', socialAccount.id);
            } else {
              return new Response(
                JSON.stringify({ error: 'OAuth token verlopen en refresh mislukt. Koppel je account opnieuw.', action: 'reconnect', channel }),
                { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
              );
            }
          } catch {
            return new Response(
              JSON.stringify({ error: 'Token refresh mislukt. Koppel je account opnieuw.', action: 'reconnect', channel }),
              { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
        } else if (tokenData.refresh_token && (channel === 'facebook' || channel === 'instagram')) {
          // Facebook/Instagram: exchange for long-lived token
          try {
            const refreshRes = await fetch(
              `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get('META_APP_ID')}&client_secret=${Deno.env.get('META_APP_SECRET')}&fb_exchange_token=${tokenData.access_token}`
            );
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              tokenData.access_token = refreshData.access_token;
              await db
                .from('oauth_tokens')
                .update({
                  access_token: refreshData.access_token,
                  expires_at: new Date(Date.now() + (refreshData.expires_in || 5184000) * 1000).toISOString(),
                })
                .eq('social_account_id', socialAccount.id);
            }
          } catch {
            // Continue with existing token — it might still work
          }
        } else {
          return new Response(
            JSON.stringify({ error: 'OAuth token verlopen. Koppel je account opnieuw in Instellingen.', action: 'reconnect', channel }),
            { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
      }

      // Check Instagram requires an image
      if (channel === 'instagram' && !imageUrl) {
        return new Response(
          JSON.stringify({ error: 'Instagram vereist een afbeelding. Voeg een foto toe aan je post.', action: 'add_image', channel }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Publish
      let result: { success: boolean; postId?: string; error?: string };
      switch (channel) {
        case 'linkedin':
          result = await publishToLinkedIn(tokenData.access_token, socialAccount.platform_account_id, text, imageUrl, socialAccount.account_type === 'company' ? 'company' : 'personal', directExtraImageUrls);
          break;
        case 'facebook':
          result = await publishToFacebook(tokenData.access_token, socialAccount.platform_account_id, text, imageUrl);
          break;
        case 'instagram':
          result = await publishToInstagram(tokenData.access_token, socialAccount.platform_account_id, text, imageUrl, directExtraImageUrls);
          break;
        default:
          result = { success: false, error: `Platform '${channel}' wordt nog niet ondersteund` };
      }

      return new Response(
        JSON.stringify(result.success ? { success: true, published: true, postId: result.postId, channel } : { success: false, error: result.error }),
        { status: result.success ? 200 : 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Legacy proposal publish (from go_content_proposals) ──
    if (!proposal_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'proposal_id/post_id and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 1. Fetch the proposal
    const { data: proposal, error: proposalErr } = await db
      .from('go_content_proposals')
      .select('*')
      .eq('id', proposal_id)
      .eq('user_id', user_id)
      .single();

    if (proposalErr || !proposal) {
      return new Response(
        JSON.stringify({ error: 'Voorstel niet gevonden', details: proposalErr?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (proposal.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'Voorstel moet eerst goedgekeurd zijn', status: proposal.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const channel = proposal.channel; // linkedin, facebook, instagram, etc.
    const text = proposal.content_text + (proposal.hashtags?.length > 0 ? '\n\n' + proposal.hashtags.join(' ') : '');
    const imageUrl = proposal.media_url || undefined;

    // 2. Find social account for this channel
    const { data: socialAccount } = await db
      .from('social_accounts')
      .select('id, platform, platform_account_id, account_type')
      .eq('user_id', user_id)
      .eq('platform', channel)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!socialAccount) {
      // Update proposal with error
      await db
        .from('go_content_proposals')
        .update({
          status: 'approved', // keep approved, not published
          review_note: `Geen ${channel} account gekoppeld. Koppel je account in Instellingen.`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal_id);

      return new Response(
        JSON.stringify({
          error: `Geen ${channel} account gekoppeld`,
          action: 'connect_account',
          channel,
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. Fetch OAuth token (with expiry check)
    const { data: tokenData } = await db
      .from('oauth_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('social_account_id', socialAccount.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tokenData?.access_token) {
      // Manual account without token — mark as published anyway (simulated)
      if (socialAccount.account_type === 'manual') {
        await db
          .from('go_content_proposals')
          .update({
            status: 'published',
            reviewed_at: new Date().toISOString(),
            review_note: `Gepubliceerd (handmatig account — kopieer de tekst naar ${channel})`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', proposal_id);

        return new Response(
          JSON.stringify({
            success: true,
            published: false,
            manual: true,
            message: `Content klaar om te kopiëren naar ${channel}. Account is handmatig gekoppeld.`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ error: 'Geen geldig OAuth token gevonden. Koppel je account opnieuw.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Publish to the platform
    let result: { success: boolean; postId?: string; error?: string };

    switch (channel) {
      case 'linkedin':
        result = await publishToLinkedIn(tokenData.access_token, socialAccount.platform_account_id, text, imageUrl);
        break;
      case 'facebook':
        result = await publishToFacebook(tokenData.access_token, socialAccount.platform_account_id, text, imageUrl);
        break;
      case 'instagram':
        result = await publishToInstagram(tokenData.access_token, socialAccount.platform_account_id, text, imageUrl);
        break;
      default:
        result = { success: false, error: `Platform '${channel}' wordt nog niet ondersteund voor automatisch publiceren` };
    }

    // 5. Update proposal status
    if (result.success) {
      await db
        .from('go_content_proposals')
        .update({
          status: 'published',
          reviewed_at: new Date().toISOString(),
          review_note: `Gepubliceerd op ${channel} (post ID: ${result.postId})`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal_id);

      // Log to automation logs if automation exists for content_scheduled
      const { data: automation } = await db
        .from('go_automations')
        .select('id')
        .eq('user_id', user_id)
        .eq('trigger_type', 'content_scheduled')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (automation) {
        await db.from('go_automation_logs').insert({
          user_id,
          automation_id: automation.id,
          status: 'success',
          trigger_data: { proposal_id, channel },
          actions_executed: [{ type: 'post_social', channel, post_id: result.postId }],
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 0,
        });

        // Update automation stats
        await db
          .from('go_automations')
          .update({
            total_runs: (automation as any).total_runs ? (automation as any).total_runs + 1 : 1,
            last_run_at: new Date().toISOString(),
          })
          .eq('id', automation.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          published: true,
          channel,
          postId: result.postId,
          message: `Succesvol gepubliceerd op ${channel}!`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } else {
      // Publishing failed
      await db
        .from('go_content_proposals')
        .update({
          review_note: `Publicatie mislukt: ${result.error}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal_id);

      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          channel,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  } catch (err: any) {
    console.error('[publish-social] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Server error', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
