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
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Get LinkedIn user URN
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return { success: false, error: `LinkedIn profile error: ${profileRes.status}` };
    }

    const profile = await profileRes.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

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

    // If image URL, upload via LinkedIn Image Upload API for native image display
    if (imageUrl) {
      try {
        // Step 1: Register an image upload
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
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent',
                },
              ],
            },
          }),
        });

        if (!registerRes.ok) {
          const regErr = await registerRes.text();
          console.error('[LinkedIn] Register upload error:', registerRes.status, regErr);
          // Fallback: post without image rather than failing entirely
          console.warn('[LinkedIn] Falling back to text-only post');
        } else {
          const registerData = await registerRes.json();
          const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
          const assetUrn = registerData.value?.asset;

          if (!uploadUrl || !assetUrn) {
            console.error('[LinkedIn] Missing uploadUrl or asset from register response');
          } else {
            // Step 2: Download the image from our storage
            const imgRes = await fetch(imageUrl);
            if (!imgRes.ok) {
              console.error('[LinkedIn] Failed to download image:', imgRes.status);
            } else {
              const imgBlob = await imgRes.blob();
              const imgBuffer = await imgBlob.arrayBuffer();

              // Step 3: Upload the image binary to LinkedIn
              const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': imgBlob.type || 'image/jpeg',
                },
                body: imgBuffer,
              });

              if (!uploadRes.ok) {
                const uploadErr = await uploadRes.text();
                console.error('[LinkedIn] Image upload error:', uploadRes.status, uploadErr);
              } else {
                // Step 4: Use IMAGE share category with the uploaded asset
                postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
                postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [
                  {
                    status: 'READY',
                    media: assetUrn,
                  },
                ];
                console.log('[LinkedIn] Image uploaded successfully, asset:', assetUrn);
              }
            }
          }
        }
      } catch (imgErr: any) {
        console.error('[LinkedIn] Image upload exception:', imgErr.message);
        // Continue with text-only post
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
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!imageUrl) {
      return { success: false, error: 'Instagram vereist een afbeelding voor publicatie' };
    }

    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v18.0/${igBusinessAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
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
    const { proposal_id, post_id, user_id, channel: directChannel, text: directText, image_url: directImageUrl } = body;

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

      // Find social account
      const { data: socialAccount } = await db
        .from('social_accounts')
        .select('id, platform, platform_account_id, account_type')
        .eq('user_id', user_id)
        .eq('platform', channel)
        .eq('status', 'active')
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

      // Fetch OAuth token
      const { data: tokenData } = await db
        .from('oauth_tokens')
        .select('access_token')
        .eq('social_account_id', socialAccount.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tokenData?.access_token) {
        return new Response(
          JSON.stringify({ error: 'Geen geldig OAuth token. Koppel je account opnieuw.' }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Publish
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

    // 3. Fetch OAuth token
    const { data: tokenData } = await db
      .from('oauth_tokens')
      .select('access_token')
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
