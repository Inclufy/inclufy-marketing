import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function publishToLinkedIn(imageBase64: string, caption: string): Promise<{ success: boolean; error?: string; postId?: string }> {
  const accessToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
  
  if (!accessToken) {
    return { success: false, error: "LinkedIn access token not configured" };
  }

  try {
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!profileRes.ok) {
      return { success: false, error: "Failed to get LinkedIn profile" };
    }
    
    const profile = await profileRes.json();
    const personUrn = `urn:li:person:${profile.sub}`;

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
      return { success: false, error: "Failed to register image upload" };
    }

    const registerData = await registerRes.json();
    const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    const asset = registerData.value.asset;

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
      return { success: false, error: "Failed to upload image" };
    }

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
      return { success: false, error: "Failed to create post" };
    }

    const postData = await postRes.json();
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
    return { success: false, error: "Facebook credentials not configured" };
  }

  try {
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
      return { success: false, error: error.error?.message || "Failed to post to Facebook" };
    }

    const data = await res.json();
    return { success: true, postId: data.post_id || data.id };
  } catch (error: unknown) {
    console.error("Facebook error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Processing scheduled posts...");

    // Get pending posts that are due
    const { data: pendingPosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching posts:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingPosts?.length || 0} posts to process`);

    const results = [];

    for (const post of pendingPosts || []) {
      console.log(`Processing post ${post.id} for ${post.platform}`);

      let result;
      switch (post.platform) {
        case 'linkedin':
          result = await publishToLinkedIn(post.image_base64, post.caption);
          break;
        case 'facebook':
          result = await publishToFacebook(post.image_base64, post.caption);
          break;
        default:
          result = { success: false, error: `Unsupported platform: ${post.platform}` };
      }

      // Update post status
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          status: result.success ? 'published' : 'failed',
          error_message: result.error || null,
          published_at: result.success ? new Date().toISOString() : null,
        })
        .eq('id', post.id);

      if (updateError) {
        console.error(`Error updating post ${post.id}:`, updateError);
      }

      results.push({ postId: post.id, ...result });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("Process error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
