// Supabase Edge Function: Publish Social
// Publishes approved content proposals to social media platforms.
// Supports: LinkedIn (v2 API), Facebook Pages (Graph API), Instagram (Graph API via Pages)
// Fetches OAuth tokens from oauth_tokens table, posts content, updates proposal status.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

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
  videoUrl?: string, // video URL for video posts
  mediaType?: string, // 'photo' | 'video' | 'audio'
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

    // Helper: upload a video to LinkedIn and return its asset URN.
    // Steps: (1) HEAD the video to get Content-Length, (2) registerUpload with fileSizeBytes,
    // (3) PUT the video bytes to LinkedIn's upload URL, (4) poll until asset is AVAILABLE.
    // Falls back gracefully — returns null on any failure so caller can post text-only.
    async function uploadVideoToLinkedIn(url: string): Promise<string | null> {
      try {
        // Step 1 — determine file size via HEAD request (LinkedIn requires fileSizeBytes).
        // If HEAD is not supported by the storage provider we fall back to fetching the body
        // and using the blob size, which works but is slower for large files.
        let fileSizeBytes = 0;
        try {
          const headRes = await fetch(url, { method: 'HEAD' });
          const cl = headRes.headers.get('content-length');
          if (cl) fileSizeBytes = parseInt(cl, 10);
        } catch {
          // HEAD not supported — will fall back below after fetching blob
        }

        // Step 2 — register upload with LinkedIn
        const registerBody: any = {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
            owner: authorUrn,
            serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
          },
        };
        // fileSizeBytes is optional in the LinkedIn API but improves upload reliability
        if (fileSizeBytes > 0) {
          registerBody.registerUploadRequest.supportedUploadMechanism = ['SYNCHRONOUS_UPLOAD'];
          registerBody.registerUploadRequest.fileSizeBytes = fileSizeBytes;
        }

        const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerBody),
        });
        if (!registerRes.ok) {
          console.error('[LinkedIn] Video register upload error:', registerRes.status, await registerRes.text());
          return null;
        }
        const registerData = await registerRes.json();
        const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
        const assetUrn: string | undefined = registerData.value?.asset;
        if (!uploadUrl || !assetUrn) {
          console.error('[LinkedIn] Video register upload: missing uploadUrl or assetUrn');
          return null;
        }

        // Step 3 — fetch video bytes and PUT to LinkedIn
        const videoRes = await fetch(url);
        if (!videoRes.ok) {
          console.error('[LinkedIn] Could not fetch video from storage:', videoRes.status);
          return null;
        }
        const videoBlob = await videoRes.blob();
        const videoBuffer = await videoBlob.arrayBuffer();
        // Use content-type from source; default to mp4 if unknown
        const contentType = videoBlob.type && videoBlob.type !== 'application/octet-stream'
          ? videoBlob.type
          : 'video/mp4';

        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': contentType,
          },
          body: videoBuffer,
        });
        if (!putRes.ok) {
          console.error('[LinkedIn] Video PUT upload error:', putRes.status, await putRes.text());
          return null;
        }
        console.log('[LinkedIn] Video PUT complete, asset:', assetUrn);

        // Step 4 — poll until asset status is AVAILABLE (max 90s, 5s interval)
        const MAX_POLLS = 18; // 18 × 5s = 90s
        for (let i = 0; i < MAX_POLLS; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          try {
            const assetId = assetUrn.split(':').pop();
            const pollRes = await fetch(`https://api.linkedin.com/v2/assets/${assetId}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (pollRes.ok) {
              const assetData = await pollRes.json();
              const status = assetData.recipes?.[0]?.status ?? assetData.status;
              console.log(`[LinkedIn] Video asset poll ${i + 1}/${MAX_POLLS}: status=${status}`);
              if (status === 'AVAILABLE') {
                return assetUrn;
              }
              if (status === 'PROCESSING_FAILED') {
                console.error('[LinkedIn] Video processing failed on LinkedIn side');
                return null;
              }
            }
          } catch (pollErr: any) {
            console.warn('[LinkedIn] Poll error (non-fatal):', pollErr.message);
          }
        }
        // Polling timed out — LinkedIn sometimes still accepts the post with a not-yet-AVAILABLE
        // asset (it finishes processing asynchronously). Log a warning and continue.
        console.warn('[LinkedIn] Video asset polling timed out after 90s — proceeding with asset:', assetUrn);
        return assetUrn;
      } catch (err: any) {
        console.error('[LinkedIn] uploadVideoToLinkedIn exception:', err.message);
        return null;
      }
    }

    // ── Video post branch ──
    if (mediaType === 'video' && videoUrl) {
      const videoAssetUrn = await uploadVideoToLinkedIn(videoUrl);
      if (videoAssetUrn) {
        postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'VIDEO';
        postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [
          { status: 'READY', media: videoAssetUrn },
        ];
      } else {
        // Video upload failed — fall back to text-only with a warning
        console.warn('[LinkedIn] Video upload failed, posting as text-only');
      }
    } else {
      // ── Image post branch ──
      // Upload all images (primary + extras) for multi-image LinkedIn posts
      const allImageUrls = [imageUrl, ...(extraImageUrls || [])].filter(Boolean) as string[];
      if (allImageUrls.length > 0) {
        const uploadedAssets: string[] = [];
        for (const url of allImageUrls) {
          const assetUrn = await uploadImageToLinkedIn(url);
          if (assetUrn) uploadedAssets.push(assetUrn);
        }
        if (uploadedAssets.length > 0) {
          postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
          postBody.specificContent['com.linkedin.ugc.ShareContent'].media = uploadedAssets.map(urn => ({
            status: 'READY',
            media: urn,
          }));
        }
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
  videoUrl?: string, // video URL for video posts
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // ── Video post branch ──
    // Facebook /videos endpoint accepts a publicly accessible file_url and publishes it
    // as a native video post. The response includes { id } which is the video object ID.
    if (videoUrl) {
      const videoRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: videoUrl,
          description: text,
          access_token: accessToken,
        }),
      });

      if (!videoRes.ok) {
        const errBody = await videoRes.text();
        const safeErrBody = errBody.replace(/"access_token"\s*:\s*"[^"]*"/g, '"access_token":"[REDACTED]"');
        console.error('[Facebook] Video publish error:', videoRes.status, safeErrBody);
        return { success: false, error: `Facebook video API error ${videoRes.status}: ${safeErrBody}` };
      }

      const videoData = await videoRes.json();
      console.log('[Facebook] Video published, id:', videoData.id);
      return { success: true, postId: videoData.id };
    }

    // ── Photo / text post branch (unchanged) ──
    let url = `https://graph.facebook.com/v20.0/${pageId}/feed`;
    const params: any = {
      message: text,
      access_token: accessToken,
    };

    if (imageUrl) {
      url = `https://graph.facebook.com/v20.0/${pageId}/photos`;
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
      const safeErrBody = errBody.replace(/"access_token"\s*:\s*"[^"]*"/g, '"access_token":"[REDACTED]"');
      console.error('[Facebook] Publish error:', res.status, safeErrBody);
      return { success: false, error: `Facebook API error ${res.status}: ${safeErrBody}` };
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
  igFormat: 'feed' | 'story' | 'reel' = 'feed',
  videoUrl?: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // ── Story ──────────────────────────────────────────────────────────────
    if (igFormat === 'story') {
      const hasMedia = !!(imageUrl || videoUrl);
      if (!hasMedia) {
        return { success: false, error: 'Story vereist een afbeelding of video.' };
      }

      const storyBody: Record<string, string> = { media_type: 'STORIES', access_token: accessToken };
      if (videoUrl) {
        storyBody.video_url = videoUrl;
      } else {
        let publicImageUrl = imageUrl!;
        if (imageUrl!.includes('supabase') && !imageUrl!.includes('/public/')) {
          const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          const pathMatch = imageUrl!.match(/\/(?:sign\/)?media\/(.+?)(\?|$)/);
          if (pathMatch) {
            const { data: signData } = await db.storage.from('media').createSignedUrl(pathMatch[1], 3600);
            if (signData?.signedUrl) publicImageUrl = signData.signedUrl;
          }
        }
        storyBody.image_url = publicImageUrl;
      }

      const storyCreateRes = await fetch(
        `https://graph.facebook.com/v20.0/${igBusinessAccountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storyBody),
        },
      );

      if (!storyCreateRes.ok) {
        const errBody = await storyCreateRes.text();
        return { success: false, error: `Instagram Story upload error: ${errBody}` };
      }

      const { id: storyContainerId } = await storyCreateRes.json();

      const storyPublishRes = await fetch(
        `https://graph.facebook.com/v20.0/${igBusinessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: storyContainerId, access_token: accessToken }),
        },
      );

      if (!storyPublishRes.ok) {
        const errBody = await storyPublishRes.text();
        return { success: false, error: `Instagram Story publish error: ${errBody}` };
      }

      const storyData = await storyPublishRes.json();
      return { success: true, postId: storyData.id };
    }

    // ── Reel ───────────────────────────────────────────────────────────────
    if (igFormat === 'reel') {
      if (!videoUrl) {
        return {
          success: false,
          error: 'Reels vereisen een video. Schakel naar Feed of Story, of upload een video.',
        };
      }

      const reelBody: Record<string, string> = {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: text.slice(0, 2200), // Reels support captions up to 2200 chars
        share_to_feed: 'true',
        access_token: accessToken,
      };

      const reelCreateRes = await fetch(
        `https://graph.facebook.com/v20.0/${igBusinessAccountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reelBody),
        },
      );

      if (!reelCreateRes.ok) {
        const errBody = await reelCreateRes.text();
        return { success: false, error: `Instagram Reel upload error: ${errBody}` };
      }

      const { id: reelContainerId } = await reelCreateRes.json();

      const reelPublishRes = await fetch(
        `https://graph.facebook.com/v20.0/${igBusinessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: reelContainerId, access_token: accessToken }),
        },
      );

      if (!reelPublishRes.ok) {
        const errBody = await reelPublishRes.text();
        return { success: false, error: `Instagram Reel publish error: ${errBody}` };
      }

      const reelData = await reelPublishRes.json();
      return { success: true, postId: reelData.id };
    }

    // ── Feed (default) ────────────────────────────────────────────────────
    if (!imageUrl) {
      return { success: false, error: 'Instagram vereist een afbeelding voor publicatie' };
    }

    // Ensure image URL is publicly accessible — generate fresh signed URL if needed
    let publicImageUrl = imageUrl;
    if (imageUrl.includes('supabase') && !imageUrl.includes('/public/')) {
      // Extract storage path and generate a long-lived signed URL
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const pathMatch = imageUrl.match(/\/(?:sign\/)?media\/(.+?)(\?|$)/);
      if (pathMatch) {
        const { data: signData } = await db.storage.from('media').createSignedUrl(pathMatch[1], 3600);
        if (signData?.signedUrl) publicImageUrl = signData.signedUrl;
      } else {
        console.warn('[publish-social] Could not extract storage path from image URL — using original URL:', imageUrl);
      }
    }

    const allImages = [publicImageUrl, ...(extraImageUrls || [])].filter(Boolean) as string[];

    // Multi-image: use carousel container
    if (allImages.length > 1) {
      // Step 1: Create individual media items
      const childIds: string[] = [];
      for (const url of allImages) {
        const childRes = await fetch(
          `https://graph.facebook.com/v20.0/${igBusinessAccountId}/media`,
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
        `https://graph.facebook.com/v20.0/${igBusinessAccountId}/media`,
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
        `https://graph.facebook.com/v20.0/${igBusinessAccountId}/media_publish`,
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
      `https://graph.facebook.com/v20.0/${igBusinessAccountId}/media`,
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
      `https://graph.facebook.com/v20.0/${igBusinessAccountId}/media_publish`,
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
// First-Comment Publishers
// ═══════════════════════════════════════════════════════

/**
 * Post a first comment on a LinkedIn UGC post right after publishing.
 * Endpoint: POST https://api.linkedin.com/v2/socialActions/urn:li:ugcPost:{postId}/comments
 * Requires x-restli-protocol-version 2.0.0 header and the author URN used during publish.
 */
async function postLinkedInFirstComment(
  accessToken: string,
  publishedPostId: string,
  authorUrn: string,
  commentText: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const commentRes = await fetch(
      `https://api.linkedin.com/v2/socialActions/urn:li:ugcPost:${publishedPostId}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          actor: authorUrn,
          object: `urn:li:ugcPost:${publishedPostId}`,
          message: { text: commentText },
        }),
      },
    );
    if (!commentRes.ok) {
      const errBody = await commentRes.text();
      console.error('[LinkedIn] First-comment error:', commentRes.status, errBody);
      return { success: false, error: `LinkedIn comment API error ${commentRes.status}: ${errBody}` };
    }
    console.log('[LinkedIn] First comment posted successfully on post', publishedPostId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `LinkedIn comment exception: ${err.message}` };
  }
}

/**
 * Post a first comment on a Facebook post right after publishing.
 * Endpoint: POST https://graph.facebook.com/v20.0/{postId}/comments
 */
async function postFacebookFirstComment(
  accessToken: string,
  publishedPostId: string,
  commentText: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const commentRes = await fetch(
      `https://graph.facebook.com/v20.0/${publishedPostId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commentText,
          access_token: accessToken,
        }),
      },
    );
    if (!commentRes.ok) {
      const errBody = await commentRes.text();
      const safeErrBody = errBody.replace(/"access_token"\s*:\s*"[^"]*"/g, '"access_token":"[REDACTED]"');
      console.error('[Facebook] First-comment error:', commentRes.status, safeErrBody);
      return { success: false, error: `Facebook comment API error ${commentRes.status}: ${safeErrBody}` };
    }
    console.log('[Facebook] First comment posted successfully on post', publishedPostId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Facebook comment exception: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════
// Token Validation Helper
// ═══════════════════════════════════════════════════════

/**
 * Ensures the stored OAuth token is still valid.
 * - LinkedIn: attempts a real refresh_token flow if expired.
 * - Facebook/Instagram: marks token as expired and signals reconnect (Meta
 *   does not allow server-side refresh with an already-expired token).
 * Returns { valid: true, token } on success or { valid: false, action: 'reconnect' }.
 */
async function ensureValidToken(
  db: ReturnType<typeof createClient>,
  tokenData: { access_token: string; refresh_token?: string | null; expires_at?: string | null; created_at?: string | null; updated_at?: string | null },
  socialAccountId: string,
  channel: string,
): Promise<{ valid: boolean; token?: string; action?: 'reconnect'; error?: string }> {
  // Zombie token detection: expires_at is null (from oauth-callback before v22)
  // AND the token row is older than 45 days → treat as expired (platforms typically
  // invalidate after 60 days). This prevents silently sending a dead token to the API.
  const now = Date.now();
  const ZOMBIE_AGE_MS = 45 * 24 * 60 * 60 * 1000;
  const tokenAgeRef = tokenData.updated_at || tokenData.created_at;
  const isZombie = !tokenData.expires_at
    && tokenAgeRef
    && (now - new Date(tokenAgeRef).getTime() > ZOMBIE_AGE_MS);

  if (isZombie) {
    // Force reconnect flow
    if (channel === 'facebook' || channel === 'instagram') {
      await db.from('social_accounts').update({ status: 'expired' }).eq('id', socialAccountId);
    }
    return {
      valid: false,
      action: 'reconnect',
      error: `${channel} token is zombie (geen expires_at, >${Math.floor(ZOMBIE_AGE_MS / (24*60*60*1000))} dagen oud). Koppel je account opnieuw in Instellingen.`,
    };
  }

  // Token not yet expired (or no expiry stored and young enough) — all good
  if (!tokenData.expires_at || new Date(tokenData.expires_at) >= new Date()) {
    return { valid: true, token: tokenData.access_token };
  }

  // LinkedIn: try real refresh_token grant
  if (channel === 'linkedin' && tokenData.refresh_token) {
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
        await db
          .from('oauth_tokens')
          .update({
            access_token: refreshData.access_token,
            expires_at: new Date(Date.now() + (refreshData.expires_in || 5184000) * 1000).toISOString(),
            refresh_token: refreshData.refresh_token || tokenData.refresh_token,
          })
          .eq('social_account_id', socialAccountId);
        return { valid: true, token: refreshData.access_token };
      }
    } catch {
      // fall through to reconnect
    }
    return { valid: false, action: 'reconnect', error: 'OAuth token verlopen en refresh mislukt. Koppel je account opnieuw.' };
  }

  // Facebook / Instagram: expired token cannot be refreshed server-side
  if (channel === 'facebook' || channel === 'instagram') {
    await db
      .from('social_accounts')
      .update({ status: 'expired' })
      .eq('id', socialAccountId);
    return { valid: false, action: 'reconnect', error: `${channel} token expired — please reconnect your account` };
  }

  // Any other channel without refresh support
  return { valid: false, action: 'reconnect', error: 'OAuth token verlopen. Koppel je account opnieuw in Instellingen.' };
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

  // ── Internal-call escape (scheduled-publisher / system cron) ──
  // Trusted server-side callers (like the scheduled publish worker) hit
  // this endpoint via pg_cron and cannot produce a user JWT. They pass
  // the service-role key as Bearer + a shared INTERNAL_CALL_SECRET.
  // In that mode we skip the per-user JWT check but still trust body.user_id
  // for DB scoping (service-role bypasses RLS).
  const internalSecret = Deno.env.get('INTERNAL_CALL_SECRET') ?? '';
  const xInternalCall = req.headers.get('x-internal-call') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  const isInternalCall = !!internalSecret
    && xInternalCall === internalSecret
    && authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

  let jwtUser: { id: string } | null = null;

  if (isInternalCall) {
    // Trusted internal caller — skip JWT check.
    console.log('[publish-social] internal call accepted');
  } else {
    // ── JWT authentication (normal app calls) ──
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const jwt = authHeader.slice(7);
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user: jwtUserData }, error: jwtErr } = await authClient.auth.getUser();
    if (jwtErr || !jwtUserData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    jwtUser = jwtUserData;
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { proposal_id, post_id, user_id, channel: directChannel, text: directText, image_url: directImageUrl, video_url: directVideoUrl, media_type: directMediaType, extra_image_urls: directExtraImageUrls, account_id: directAccountId, ig_format: directIgFormat } = body;

    // Assert JWT user matches request body user_id (skipped for internal calls)
    if (!isInternalCall && user_id && jwtUser && jwtUser.id !== user_id) {
      return new Response(JSON.stringify({ error: 'Forbidden: user_id mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Direct post publish (from go_posts via mobile app) ──
    if (post_id && user_id) {
      const channel = directChannel;
      const text = directText;
      const imageUrl = directImageUrl;
      const videoUrl = directVideoUrl as string | undefined;
      const mediaType = (directMediaType as string | undefined) ?? 'photo';
      const igFormat = (directIgFormat as 'feed' | 'story' | 'reel' | undefined) ?? 'feed';

      if (!channel || !text) {
        return new Response(
          JSON.stringify({ error: 'channel and text are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Find social account — use specific account_id if provided (for multi-account support)
      // Case-insensitive platform match + fallback without status filter (mirrors mobile fix 6548a90)
      const normalizedChannel = String(channel).toLowerCase();
      let socialAccountQuery = db
        .from('social_accounts')
        .select('id, platform, platform_account_id, account_type, account_name, status')
        .eq('user_id', user_id)
        .ilike('platform', normalizedChannel)
        .eq('status', 'active');
      if (directAccountId) {
        socialAccountQuery = socialAccountQuery.eq('id', directAccountId);
      }
      let { data: socialAccount } = await socialAccountQuery
        .limit(1)
        .maybeSingle();

      // Fallback: retry without status filter (accounts may be 'connected' instead of 'active')
      if (!socialAccount) {
        console.log(`[publish-social] No active ${channel} account — retrying without status filter`);
        let fallbackQuery = db
          .from('social_accounts')
          .select('id, platform, platform_account_id, account_type, account_name, status')
          .eq('user_id', user_id)
          .ilike('platform', normalizedChannel);
        if (directAccountId) {
          fallbackQuery = fallbackQuery.eq('id', directAccountId);
        }
        const { data: fallbackAccount } = await fallbackQuery
          .limit(1)
          .maybeSingle();
        socialAccount = fallbackAccount;
      }

      if (!socialAccount) {
        console.error(`[publish-social] No ${channel} account found for user ${user_id} (directAccountId=${directAccountId || 'none'})`);
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

      // Fetch first_comment from go_posts row (may be null if not set)
      const { data: postRow } = await db
        .from('go_posts')
        .select('first_comment')
        .eq('id', post_id)
        .maybeSingle();
      const firstCommentText: string | null = (postRow as any)?.first_comment ?? null;

      // Fetch OAuth token (check expiry)
      const { data: tokenData } = await db
        .from('oauth_tokens')
        .select('access_token, refresh_token, expires_at, created_at, updated_at')
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

      // Check if token is expired / refresh if needed
      const tokenCheck = await ensureValidToken(db, tokenData, socialAccount.id, channel);
      if (!tokenCheck.valid) {
        const status = (channel === 'facebook' || channel === 'instagram') ? 401 : 422;
        return new Response(
          JSON.stringify({ success: false, action: tokenCheck.action, error: tokenCheck.error, channel }),
          { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      tokenData.access_token = tokenCheck.token!;

      // Instagram feed requires an image; Story/Reel have their own media checks inside publishToInstagram
      if (channel === 'instagram' && igFormat === 'feed' && !imageUrl) {
        return new Response(
          JSON.stringify({ error: 'Instagram vereist een afbeelding. Voeg een foto toe aan je post.', action: 'add_image', channel }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Publish
      let result: { success: boolean; postId?: string; error?: string };
      switch (channel) {
        case 'linkedin':
          result = await publishToLinkedIn(tokenData.access_token, socialAccount.platform_account_id, text, imageUrl, socialAccount.account_type === 'company' ? 'company' : 'personal', directExtraImageUrls, videoUrl, mediaType);
          break;
        case 'facebook':
          result = await publishToFacebook(tokenData.access_token, socialAccount.platform_account_id, text, imageUrl, videoUrl);
          break;
        case 'instagram':
          result = await publishToInstagram(tokenData.access_token, socialAccount.platform_account_id, text, imageUrl, directExtraImageUrls, igFormat, videoUrl);
          break;
        default:
          result = { success: false, error: `Platform '${channel}' wordt nog niet ondersteund` };
      }

      if (!result.success) {
        return new Response(
          JSON.stringify({ success: false, error: result.error }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // ── First-comment auto-post ──────────────────────────────────────────
      // Post a first comment on the just-published post if configured.
      // Failures are non-fatal: we log them and report status in the response
      // but never roll back or fail the entire publish.
      let firstCommentStatus: 'posted' | 'skipped' | 'failed' = 'skipped';

      if (firstCommentText && result.postId) {
        let commentResult: { success: boolean; error?: string };

        if (channel === 'linkedin') {
          // Determine the author URN — must match the one used during publish.
          // Company page: platform_account_id is the org ID or full URN.
          // Personal: fetch sub from /userinfo (same logic as publishToLinkedIn).
          let authorUrn: string;
          if (socialAccount.account_type === 'company' && socialAccount.platform_account_id) {
            authorUrn = socialAccount.platform_account_id.startsWith('urn:')
              ? socialAccount.platform_account_id
              : `urn:li:organization:${socialAccount.platform_account_id}`;
          } else {
            try {
              const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
              });
              const profile = profileRes.ok ? await profileRes.json() : {};
              authorUrn = `urn:li:person:${profile.sub ?? socialAccount.platform_account_id}`;
            } catch {
              authorUrn = `urn:li:person:${socialAccount.platform_account_id}`;
            }
          }
          commentResult = await postLinkedInFirstComment(
            tokenData.access_token,
            result.postId,
            authorUrn,
            firstCommentText,
          );
        } else if (channel === 'facebook') {
          commentResult = await postFacebookFirstComment(
            tokenData.access_token,
            result.postId,
            firstCommentText,
          );
        } else {
          // Instagram: the Meta Graph API does not support posting comments on
          // media published by third-party apps (including Business API clients).
          // Attempting it returns a (200 #15) permissions error. Skip silently.
          console.log('[publish-social] First-comment skipped for Instagram — not supported by Meta Graph API');
          commentResult = { success: false };
          firstCommentStatus = 'skipped';
        }

        if (channel !== 'instagram') {
          if (commentResult.success) {
            firstCommentStatus = 'posted';
            // Stamp first_comment_posted_at in DB (best-effort, non-fatal)
            try {
              await db
                .from('go_posts')
                .update({ first_comment_posted_at: new Date().toISOString() })
                .eq('id', post_id);
            } catch (dbErr: any) {
              console.warn('[publish-social] Could not update first_comment_posted_at:', dbErr.message);
            }
          } else {
            firstCommentStatus = 'failed';
            console.error('[publish-social] First-comment failed (non-fatal):', commentResult.error);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, published: true, postId: result.postId, channel, firstComment: firstCommentStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
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
    const text = proposal.content_text + ((proposal.hashtags ?? []).length > 0 ? '\n\n' + proposal.hashtags.join(' ') : '');
    const imageUrl = proposal.media_url || undefined;

    // 2. Find social account for this channel
    // Case-insensitive platform match + fallback without status filter (mirrors mobile fix 6548a90)
    const normalizedChannel = String(channel).toLowerCase();
    let { data: socialAccount } = await db
      .from('social_accounts')
      .select('id, platform, platform_account_id, account_type, status')
      .eq('user_id', user_id)
      .ilike('platform', normalizedChannel)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    // Fallback: retry without status filter
    if (!socialAccount) {
      console.log(`[publish-social:legacy] No active ${channel} account — retrying without status filter`);
      const { data: fallbackAccount } = await db
        .from('social_accounts')
        .select('id, platform, platform_account_id, account_type, status')
        .eq('user_id', user_id)
        .ilike('platform', normalizedChannel)
        .limit(1)
        .maybeSingle();
      socialAccount = fallbackAccount;
    }

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
      .select('access_token, refresh_token, expires_at, created_at, updated_at')
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

    // 3b. Check token expiry / refresh
    const legacyTokenCheck = await ensureValidToken(db, tokenData, socialAccount.id, channel);
    if (!legacyTokenCheck.valid) {
      const status = (channel === 'facebook' || channel === 'instagram') ? 401 : 422;
      return new Response(
        JSON.stringify({ success: false, action: legacyTokenCheck.action, error: legacyTokenCheck.error, channel }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    tokenData.access_token = legacyTokenCheck.token!;

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
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  } catch (err: any) {
    console.error('[publish-social] Unhandled error:', err.message ?? err);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
