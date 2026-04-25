// Supabase Edge Function: Import Library ZIP
// Receives a storage path to an uploaded ZIP, unzips it, parses manifest.json,
// uploads each image to library-posts bucket, and inserts library_posts rows.
//
// Expected ZIP structure:
//   manifest.json
//   images/<filename>.png|jpg|webp
//
// Manifest schema:
// {
//   "product": "academy",                    // or matched by product_id passed in body
//   "brand_name": "Inclufy Academy",
//   "brand_color": "#3B82F6",
//   "campaign": "2026-Q2-launch",
//   "posts": [
//     {
//       "id": "academy-01",
//       "type": "single" | "carousel" | "video",
//       "channels": ["linkedin", "instagram"],
//       "primary_language": "nl",
//       "translations": {
//         "nl": { "image": "images/academy-01-nl.png", "caption": "...", "hashtags": ["#x"], "cta": "..." },
//         "en": { ... },
//         "fr": { ... }
//       },
//       "scheduled_for": "2026-05-12T09:00:00Z",
//       "overlay": { "logo": true, "watermark": "bottom-right" },
//       "sort_order": 1
//     }
//   ]
// }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import JSZip from 'https://esm.sh/jszip@3.10.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_CHANNELS = new Set(['linkedin', 'instagram', 'facebook', 'x', 'tiktok', 'whatsapp']);
const ALLOWED_TYPES = new Set(['single', 'carousel', 'video']);
const ALLOWED_LANGUAGES = new Set(['nl', 'en', 'fr']);

interface ManifestPost {
  id: string;
  type?: string;
  channels: string[];
  primary_language?: string;
  translations: Record<string, {
    image?: string;
    caption?: string;
    hashtags?: string[];
    cta?: string;
  }>;
  scheduled_for?: string;
  overlay?: Record<string, unknown>;
  sort_order?: number;
}

interface Manifest {
  product?: string;
  brand_name?: string;
  brand_color?: string;
  campaign?: string;
  posts: ManifestPost[];
}

function mimeForExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'png':  return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'mp4':  return 'video/mp4';
    default:     return 'application/octet-stream';
  }
}

function validateManifest(m: unknown): { ok: boolean; error?: string; data?: Manifest } {
  if (!m || typeof m !== 'object') return { ok: false, error: 'manifest is not an object' };
  const manifest = m as Manifest;
  if (!Array.isArray(manifest.posts)) return { ok: false, error: 'manifest.posts must be an array' };
  if (manifest.posts.length === 0) return { ok: false, error: 'manifest.posts is empty' };

  for (let i = 0; i < manifest.posts.length; i++) {
    const p = manifest.posts[i];
    if (!p.id) return { ok: false, error: `post[${i}].id is required` };
    if (!Array.isArray(p.channels) || p.channels.length === 0) {
      return { ok: false, error: `post[${i}].channels must be a non-empty array` };
    }
    for (const ch of p.channels) {
      if (!ALLOWED_CHANNELS.has(ch)) {
        return { ok: false, error: `post[${i}] has invalid channel: ${ch}` };
      }
    }
    if (p.type && !ALLOWED_TYPES.has(p.type)) {
      return { ok: false, error: `post[${i}].type invalid: ${p.type}` };
    }
    if (!p.translations || typeof p.translations !== 'object') {
      return { ok: false, error: `post[${i}].translations is required` };
    }
    const langs = Object.keys(p.translations);
    if (langs.length === 0) {
      return { ok: false, error: `post[${i}].translations must have at least one language` };
    }
    for (const lang of langs) {
      if (!ALLOWED_LANGUAGES.has(lang)) {
        return { ok: false, error: `post[${i}].translations has invalid language: ${lang}` };
      }
    }
  }

  return { ok: true, data: manifest };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ─── Auth ─────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'missing bearer token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = userData.user.id;

  // ─── Parse body ───────────────────────────────────────────────────
  let body: { zipPath?: string; productId?: string | null; campaign?: string | null };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!body.zipPath) {
    return new Response(JSON.stringify({ error: 'zipPath is required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  // zipPath must start with userId (RLS already enforces this, double-check)
  if (!body.zipPath.startsWith(`${userId}/`)) {
    return new Response(JSON.stringify({ error: 'zipPath must be in user folder' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ─── Create import record ─────────────────────────────────────────
  const { data: importRow, error: importErr } = await supabase
    .from('library_imports')
    .insert({
      user_id: userId,
      product_id: body.productId ?? null,
      campaign: body.campaign ?? null,
      zip_path: body.zipPath,
      status: 'processing',
    })
    .select()
    .single();

  if (importErr || !importRow) {
    return new Response(JSON.stringify({ error: 'failed to create import record', detail: importErr?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const importId = importRow.id;

  async function failImport(message: string, status = 500) {
    await supabase
      .from('library_imports')
      .update({ status: 'failed', error: message, finished_at: new Date().toISOString() })
      .eq('id', importId);
    return new Response(JSON.stringify({ error: message, importId }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ─── Download ZIP from storage ────────────────────────────────────
  const { data: zipBlob, error: dlErr } = await supabase.storage
    .from('library-imports')
    .download(body.zipPath);

  if (dlErr || !zipBlob) {
    return failImport(`failed to download zip: ${dlErr?.message ?? 'unknown'}`);
  }

  // ─── Unzip ────────────────────────────────────────────────────────
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
  } catch (e) {
    return failImport(`invalid zip: ${(e as Error).message}`, 400);
  }

  // ─── Read + validate manifest.json ────────────────────────────────
  const manifestEntry = zip.file('manifest.json');
  if (!manifestEntry) {
    return failImport('manifest.json missing from zip', 400);
  }
  let manifest: Manifest;
  try {
    const txt = await manifestEntry.async('string');
    const parsed = JSON.parse(txt);
    const v = validateManifest(parsed);
    if (!v.ok || !v.data) return failImport(`manifest validation: ${v.error}`, 400);
    manifest = v.data;
  } catch (e) {
    return failImport(`failed to parse manifest.json: ${(e as Error).message}`, 400);
  }

  // ─── Upload images + build post rows ──────────────────────────────
  const insertRows: Array<Record<string, unknown>> = [];

  for (let i = 0; i < manifest.posts.length; i++) {
    const post = manifest.posts[i];
    const translationsOut: Record<string, unknown> = {};

    for (const [lang, t] of Object.entries(post.translations)) {
      let imageUrl: string | undefined;

      if (t.image) {
        const fileEntry = zip.file(t.image);
        if (!fileEntry) {
          return failImport(`post ${post.id} (${lang}): file ${t.image} missing from zip`, 400);
        }
        const fileBuf = await fileEntry.async('uint8array');
        const ext = t.image.split('.').pop() ?? 'png';
        const storageKey = `${userId}/${importId}/${post.id}-${lang}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('library-posts')
          .upload(storageKey, fileBuf, {
            contentType: mimeForExt(ext),
            upsert: true,
          });

        if (upErr) {
          return failImport(`storage upload failed for ${storageKey}: ${upErr.message}`);
        }

        const { data: pub } = supabase.storage
          .from('library-posts')
          .getPublicUrl(storageKey);
        imageUrl = pub.publicUrl;
      }

      translationsOut[lang] = {
        image_url: imageUrl ?? null,
        caption: t.caption ?? '',
        hashtags: Array.isArray(t.hashtags) ? t.hashtags : [],
        cta: t.cta ?? '',
      };
    }

    insertRows.push({
      user_id: userId,
      import_id: importId,
      product_id: body.productId ?? null,
      external_id: post.id,
      campaign: manifest.campaign ?? body.campaign ?? null,
      post_type: post.type ?? 'single',
      translations: translationsOut,
      channels: post.channels,
      primary_language: post.primary_language ?? Object.keys(post.translations)[0] ?? 'nl',
      overlay_config: post.overlay ?? {},
      scheduled_for: post.scheduled_for ?? null,
      status: post.scheduled_for ? 'scheduled' : 'draft',
      sort_order: post.sort_order ?? i,
    });
  }

  // ─── Insert all posts in one transaction ──────────────────────────
  const { error: insErr, data: insertedPosts } = await supabase
    .from('library_posts')
    .insert(insertRows)
    .select('id');

  if (insErr) {
    return failImport(`failed to insert library_posts: ${insErr.message}`);
  }

  // ─── Mark import completed ────────────────────────────────────────
  await supabase
    .from('library_imports')
    .update({
      status: 'completed',
      posts_created: insertedPosts?.length ?? 0,
      manifest: manifest as unknown as Record<string, unknown>,
      finished_at: new Date().toISOString(),
    })
    .eq('id', importId);

  return new Response(
    JSON.stringify({
      ok: true,
      importId,
      postsCreated: insertedPosts?.length ?? 0,
      campaign: manifest.campaign ?? null,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
