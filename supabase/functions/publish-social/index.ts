import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  platform: 'linkedin' | 'facebook' | 'instagram';
  imageBase64: string;
  caption: string;
}

async function publishToLinkedIn(imageBase64: string, caption: string): Promise<{ success: boolean; error?: string; postId?: string }> {
  const accessToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
  
  if (!accessToken) {
    return { success: false, error: "LinkedIn access token not configured. Please add LINKEDIN_ACCESS_TOKEN in Cloud secrets." };
  }

  try {
    // Step 1: Get user profile ID
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!profileRes.ok) {
      const error = await profileRes.text();
      console.error("LinkedIn profile error:", error);
      return { success: false, error: "Failed to get LinkedIn profile. Token may be expired." };
    }
    
    const profile = await profileRes.json();
    const personUrn = `urn:li:person:${profile.sub}`;
    console.log("LinkedIn person URN:", personUrn);

    // Step 2: Register image upload
    const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: personUrn,
          serviceRelationships: [{
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent"
          }]
        }
      }),
    });

    if (!registerRes.ok) {
      const error = await registerRes.text();
      console.error("LinkedIn register error:", error);
      return { success: false, error: "Failed to register image upload" };
    }

    const registerData = await registerRes.json();
    const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    const asset = registerData.value.asset;
    console.log("LinkedIn asset:", asset);

    // Step 3: Upload image
    const imageBuffer = Uint8Array.from(atob(imageBase64.split(',')[1] || imageBase64), c => c.charCodeAt(0));
    
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/png",
      },
      body: imageBuffer,
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      console.error("LinkedIn upload error:", error);
      return { success: false, error: "Failed to upload image" };
    }

    // Step 4: Create post
    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: caption },
            shareMediaCategory: "IMAGE",
            media: [{
              status: "READY",
              media: asset,
            }]
          }
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
      }),
    });

    if (!postRes.ok) {
      const error = await postRes.text();
      console.error("LinkedIn post error:", error);
      return { success: false, error: "Failed to create post" };
    }

    const postData = await postRes.json();
    console.log("LinkedIn post created:", postData);
    return { success: true, postId: postData.id };
  } catch (error: unknown) {
    console.error("LinkedIn error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function publishToFacebook(imageBase64: string, caption: string): Promise<{ success: boolean; error?: string; postId?: string }> {
  const pageAccessToken = Deno.env.get("META_PAGE_ACCESS_TOKEN");
  const pageId = Deno.env.get("META_PAGE_ID");

  if (!pageAccessToken || !pageId) {
    return { success: false, error: "Facebook credentials not configured. Please add META_PAGE_ACCESS_TOKEN and META_PAGE_ID in Cloud secrets." };
  }

  try {
    // Upload photo to page
    const imageBuffer = Uint8Array.from(atob(imageBase64.split(',')[1] || imageBase64), c => c.charCodeAt(0));
    
    const formData = new FormData();
    formData.append('source', new Blob([imageBuffer], { type: 'image/png' }), 'image.png');
    formData.append('message', caption);
    formData.append('access_token', pageAccessToken);

    const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Facebook error:", error);
      return { success: false, error: error.error?.message || "Failed to post to Facebook" };
    }

    const data = await res.json();
    console.log("Facebook post created:", data);
    return { success: true, postId: data.post_id || data.id };
  } catch (error: unknown) {
    console.error("Facebook error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function publishToInstagram(imageBase64: string, caption: string): Promise<{ success: boolean; error?: string; postId?: string }> {
  const pageAccessToken = Deno.env.get("META_PAGE_ACCESS_TOKEN");
  const instagramAccountId = Deno.env.get("META_INSTAGRAM_ACCOUNT_ID");

  if (!pageAccessToken || !instagramAccountId) {
    return { success: false, error: "Instagram credentials not configured. Please add META_PAGE_ACCESS_TOKEN and META_INSTAGRAM_ACCOUNT_ID in Cloud secrets." };
  }

  try {
    // Instagram requires a public URL for images, so we need to use a temporary hosting
    // For now, return an error explaining this limitation
    return { 
      success: false, 
      error: "Instagram API requires images to be hosted on a public URL. Please download the image and post manually, or configure image hosting." 
    };
  } catch (error: unknown) {
    console.error("Instagram error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, imageBase64, caption }: PublishRequest = await req.json();
    console.log(`Publishing to ${platform}, caption: ${caption.substring(0, 50)}...`);

    let result;
    switch (platform) {
      case 'linkedin':
        result = await publishToLinkedIn(imageBase64, caption);
        break;
      case 'facebook':
        result = await publishToFacebook(imageBase64, caption);
        break;
      case 'instagram':
        result = await publishToInstagram(imageBase64, caption);
        break;
      default:
        result = { success: false, error: `Unknown platform: ${platform}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 400,
    });
  } catch (error: unknown) {
    console.error("Publish error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
