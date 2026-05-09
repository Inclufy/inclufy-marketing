# media-proxy-router

Cloudflare Worker that reverse-proxies `https://images.inclufy.com/*` to the
Supabase `media-proxy` edge function. Used by AMOS social publishers
(TikTok, Meta IG Reels, Pinterest, Threads, Facebook) so all media URLs
sit behind one host we control and have verified with each platform.

## Why a Worker, not a CNAME?

Both `inclufy.com` and `*.supabase.co` are Cloudflare-protected zones.
A direct CNAME between them triggers Cloudflare error **1014 ("CNAME
Cross-User Banned")**. A Worker bypasses this because outbound `fetch()`
is a regular HTTPS request from this account — no cross-zone CNAME.

## Request flow

```
TikTok / Meta / Pinterest
  → GET https://images.inclufy.com/media/<path>
  → Cloudflare Worker (this file)
  → fetch https://<project>.supabase.co/functions/v1/media-proxy/media/<path>
  → Supabase media-proxy → storage download → byte stream
  → Response back to platform
```

## Deploy

Two paths:

### 1. Auto-deploy via Cloudflare's GitHub integration (recommended)

In Cloudflare Dashboard:
1. **Workers & Pages → Create application → Connect GitHub**
2. Repo: `Inclufy/inclufy-marketing-mobile`, branch: `main`
3. **Root directory**: `workers/media-proxy-router`
4. Build/deploy commands: leave defaults (Cloudflare auto-detects
   `wrangler.toml` and runs `wrangler deploy`)
5. After first deploy, attach the route in the Worker's
   **Settings → Domains & Routes**:
   - Route: `images.inclufy.com/*`
   - Zone: `inclufy.com`

Every push to `main` that touches files under this directory triggers a
new deploy.

### 2. Manual via wrangler CLI

```bash
cd workers/media-proxy-router
npm install
npx wrangler login          # one-time
npx wrangler deploy
```

## Verify

```bash
curl -I "https://images.inclufy.com/media/<some-existing-storage-path>.jpg"
```

Expected response includes:

```
HTTP/2 200
content-type: image/jpeg
x-media-proxy: inclufy-media-proxy                 # from Supabase function
x-proxied-by: cloudflare-worker:media-proxy-router  # from this Worker
```

If you only see `x-media-proxy` (no Worker header) the route isn't bound.
If you see neither, something's wrong with the Cloudflare → Supabase hop.

## Security model

- Read-only: only `GET`, `HEAD`, `OPTIONS` are forwarded; everything else
  returns 405. (The Supabase function rejects them too; this is a fast
  fail at the edge.)
- No credentials are forwarded — Cloudflare-injected headers
  (`cf-connecting-ip`, `cf-ray`, `x-forwarded-*`) are stripped before
  the upstream fetch. Supabase's `media-proxy` enforces a bucket
  allow-list (only `media`).
- No auth on this Worker. The trust boundary is the Supabase
  `media-proxy` bucket allow-list.
