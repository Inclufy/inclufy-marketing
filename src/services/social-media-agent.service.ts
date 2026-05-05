// src/services/social-media-agent.service.ts
// Social Media Agent — per-platform publishing rules, content specs, and AMOS capability map.
// Used by AMOS AI to avoid hallucinating valid publishing flows.

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ContentSpec {
  type: 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'text' | 'link' | 'document' | 'short_video' | 'live';
  supported: boolean;
  maxFileSizeMB?: number;
  maxDurationSec?: number;
  aspectRatios?: string[];     // e.g. ['1:1', '4:5', '16:9']
  minResolution?: string;      // e.g. '1080x1080'
  formats?: string[];          // e.g. ['jpg', 'png', 'mp4']
  notes?: string;
}

export interface PublishingRule {
  requiresBusinessAccount: boolean;   // true = personal accounts CANNOT publish via API
  requiresCreatorAccount?: boolean;
  apiAvailable: boolean;              // official API publishing exists
  apiType?: 'official' | 'unofficial' | 'webhook' | 'none';
  schedulingSupported: boolean;       // can posts be scheduled via API?
  maxPostsPerDay?: number;
  apiRateLimitNote?: string;
  oauthScopes?: string[];             // scopes needed for publish permission
  publishMethod: 'direct_api' | 'container_api' | 'manual_only' | 'webhook';
}

export interface CharacterLimits {
  caption?: number;
  bio?: number;
  title?: number;
  comment?: number;
  hashtags?: number;   // max hashtag count
}

export interface SocialPlatform {
  id: string;                         // e.g. 'instagram'
  name: string;                       // e.g. 'Instagram'
  icon: string;                       // Ionicons name
  color: string;                      // brand hex
  accountTypes: string[];             // e.g. ['Personal', 'Business', 'Creator']
  publishing: PublishingRule;
  content: ContentSpec[];
  characterLimits: CharacterLimits;
  dos: string[];                      // 3-6 concrete do's
  donts: string[];                    // 3-6 concrete don'ts
  bestPostingTimes?: string;          // general guidance
  amosCapabilities: string[];         // what AMOS can automate on this platform
  amosLimitations: string[];          // what AMOS cannot do / requires manual action
}

// ─── Platform Data ────────────────────────────────────────────────────────────

export const SOCIAL_PLATFORMS: SocialPlatform[] = [

  // ── Instagram ──────────────────────────────────────────────────────────────
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    accountTypes: ['Personal', 'Business', 'Creator'],
    publishing: {
      requiresBusinessAccount: true,
      requiresCreatorAccount: false,
      apiAvailable: true,
      apiType: 'official',
      schedulingSupported: true,
      maxPostsPerDay: 25,
      apiRateLimitNote: 'Graph API: 200 calls/hour per token. Container creation + publish = 2 calls per post.',
      oauthScopes: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
      publishMethod: 'container_api',
    },
    content: [
      {
        type: 'image',
        supported: true,
        maxFileSizeMB: 8,
        aspectRatios: ['1:1', '4:5', '1.91:1'],
        minResolution: '320x320',
        formats: ['jpg', 'png'],
        notes: 'Recommended: 1080x1080 (square) or 1080x1350 (portrait). PNG converted to JPEG internally.',
      },
      {
        type: 'video',
        supported: true,
        maxFileSizeMB: 100,
        maxDurationSec: 3600,
        aspectRatios: ['4:5', '1.91:1', '1:1'],
        minResolution: '600x315',
        formats: ['mp4', 'mov'],
        notes: 'Feed video up to 60 min. Min duration 3s. H.264 codec, AAC audio.',
      },
      {
        type: 'carousel',
        supported: true,
        maxFileSizeMB: 8,
        formats: ['jpg', 'png', 'mp4', 'mov'],
        notes: 'Max 10 slides per carousel. Mix images and videos allowed. Each video max 60s.',
      },
      {
        type: 'reel',
        supported: true,
        maxFileSizeMB: 1000,
        maxDurationSec: 90,
        aspectRatios: ['9:16'],
        minResolution: '500x888',
        formats: ['mp4', 'mov'],
        notes: 'Via API max 90s. In-app up to 15 min. Recommended: 1080x1920. H.264, AAC audio.',
      },
      {
        type: 'story',
        supported: false,
        notes: 'Stories cannot be published via the Graph API. Must be done in-app or via approved third-party tools using Content Publishing API (limited access).',
      },
      {
        type: 'live',
        supported: false,
        notes: 'Live streams cannot be initiated via API. In-app only.',
      },
    ],
    characterLimits: {
      caption: 2200,
      bio: 150,
      comment: 2200,
      hashtags: 30,
    },
    dos: [
      'Use a Business or Creator account — personal accounts cannot use the Graph API to publish',
      'Use the 2-step container API: create container first, then publish with container ID',
      'Keep captions under 125 chars for non-truncated display in feed',
      'Use 3–5 relevant hashtags for best reach (algorithm deprioritises keyword stuffing)',
      'Reels perform best at 9:16, 1080x1920, under 30s for maximum distribution',
    ],
    donts: [
      'Do NOT attempt to publish Stories via the API — not supported',
      'Do NOT use more than 30 hashtags — posts may be silently suppressed',
      'Do NOT exceed 10 slides in a carousel',
      'Do NOT publish more than 25 API posts per day (rate limit)',
      'Do NOT use personal account tokens for publishing — Graph API will reject them',
    ],
    bestPostingTimes: 'Tue–Fri, 9–11am and 7–9pm local time. Avoid Mondays and weekends for B2B.',
    amosCapabilities: [
      'Generate and publish feed images via Graph API container flow',
      'Generate and publish Reels (up to 90s via API)',
      'Generate and publish carousel posts (up to 10 slides)',
      'Schedule posts up to 75 days in advance via API',
      'Suggest captions with hashtag recommendations within limits',
      'Read engagement metrics (likes, comments, reach) via Insights API',
    ],
    amosLimitations: [
      'Cannot publish Stories — manual action required in Instagram app',
      'Cannot publish Live streams — in-app only',
      'Cannot publish to personal (non-Business/Creator) accounts',
      'Cannot upload GIFs as animated content — treated as static images',
      'Cannot manage DMs or comment replies via the API without additional permissions',
    ],
  },

  // ── Facebook ───────────────────────────────────────────────────────────────
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877F2',
    accountTypes: ['Personal Profile', 'Page', 'Group'],
    publishing: {
      requiresBusinessAccount: false,
      apiAvailable: true,
      apiType: 'official',
      schedulingSupported: true,
      maxPostsPerDay: 50,
      apiRateLimitNote: 'Graph API: 200 calls/hour per user token. Page publishing: 50 posts/day per Page.',
      oauthScopes: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement', 'publish_to_groups'],
      publishMethod: 'direct_api',
    },
    content: [
      {
        type: 'text',
        supported: true,
        notes: 'Plain text posts. Up to 63,206 characters. Link preview auto-generated if URL included.',
      },
      {
        type: 'image',
        supported: true,
        maxFileSizeMB: 30,
        formats: ['jpg', 'png', 'gif', 'bmp', 'tiff'],
        notes: 'Recommended: 1200x630 for link posts, 1080x1080 for feed photos.',
      },
      {
        type: 'video',
        supported: true,
        maxFileSizeMB: 10240,
        maxDurationSec: 14400,
        formats: ['mp4', 'mov', 'avi', 'wmv'],
        notes: 'Up to 240 min (4 hours), max 10 GB. Recommended: 1280x720+, H.264, AAC.',
      },
      {
        type: 'carousel',
        supported: true,
        notes: 'Link carousel ads only via Ads API. Organic carousel posts require manual creation or third-party tools.',
      },
      {
        type: 'story',
        supported: false,
        notes: 'Facebook Stories cannot be published via the Graph API for Pages. In-app only.',
      },
      {
        type: 'reel',
        supported: true,
        maxFileSizeMB: 1000,
        maxDurationSec: 90,
        aspectRatios: ['9:16'],
        formats: ['mp4', 'mov'],
        notes: 'Facebook Reels via Video API. Recommended 9:16, 1080x1920.',
      },
      {
        type: 'live',
        supported: true,
        notes: 'Live streaming via Facebook Live API (requires live_video publish permission). Stream key approach.',
      },
      {
        type: 'link',
        supported: true,
        notes: 'Include URL in post text; Facebook auto-generates link preview. Can suppress preview with no_story parameter.',
      },
    ],
    characterLimits: {
      caption: 63206,
      bio: 255,
      comment: 8000,
    },
    dos: [
      'Use Page tokens (not user tokens) for publishing to Facebook Pages',
      'Include a link preview image at 1200x630 for best click-through rates',
      'Schedule posts via the published_time parameter (Unix timestamp)',
      'Use video uploads for Reels — short vertical videos get extra distribution',
      'Request pages_manage_posts scope for full page publishing capability',
    ],
    donts: [
      'Do NOT publish Stories via Graph API — not supported for Pages',
      'Do NOT exceed 50 posts/day per Page to stay within rate limits',
      'Do NOT use personal profile tokens for Page publishing',
      'Do NOT rely on organic carousels via API — use Ads API or manual creation',
      'Do NOT omit pages_read_engagement scope if you need analytics',
    ],
    bestPostingTimes: 'Wed–Fri, 1–3pm. B2B best: Tue–Thu 10am–12pm.',
    amosCapabilities: [
      'Publish text, image, and video posts to Facebook Pages via Graph API',
      'Schedule posts up to 6 months ahead via published_time parameter',
      'Publish Reels to Facebook via Video API',
      'Read Page insights (reach, engagement, impressions)',
      'Publish to Groups if publish_to_groups permission granted',
    ],
    amosLimitations: [
      'Cannot publish Stories to Pages via API — in-app only',
      'Cannot manage organic carousel posts — requires manual or Ads API',
      'Cannot reply to comments or DMs without additional messaging permissions',
      'Cannot publish to personal profiles reliably — Graph API restricts personal content publishing',
    ],
  },

  // ── LinkedIn ───────────────────────────────────────────────────────────────
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'logo-linkedin',
    color: '#0077B5',
    accountTypes: ['Personal Profile', 'Company Page', 'Showcase Page'],
    publishing: {
      requiresBusinessAccount: false,
      apiAvailable: true,
      apiType: 'official',
      schedulingSupported: false,
      maxPostsPerDay: 150,
      apiRateLimitNote: 'UGC Posts API: 150 API calls/day for member tokens. Company page requires admin token via LMDP approval.',
      oauthScopes: ['openid', 'profile', 'email', 'w_member_social', 'r_organization_social', 'w_organization_social', 'rw_organization_admin'],
      publishMethod: 'direct_api',
    },
    content: [
      {
        type: 'text',
        supported: true,
        notes: 'Plain text posts up to 3000 chars for personal profiles, 700 chars for Company Pages. Hashtags included in character count.',
      },
      {
        type: 'image',
        supported: true,
        maxFileSizeMB: 100,
        formats: ['jpg', 'png', 'gif'],
        notes: 'Upload via Assets API first, then attach URN to post. Max 20 images per post. Recommended: 1200x627 landscape.',
      },
      {
        type: 'video',
        supported: true,
        maxFileSizeMB: 5120,
        maxDurationSec: 600,
        formats: ['mp4', 'avi', 'mov', 'wmv'],
        notes: 'Upload via Video API. Max 10 min, 5 GB. Recommended: MP4, 1920x1080, H.264.',
      },
      {
        type: 'document',
        supported: true,
        maxFileSizeMB: 100,
        formats: ['pdf', 'ppt', 'pptx', 'doc', 'docx'],
        notes: 'Document/PDF posts (carousel-style) via Assets API. Up to 300 pages. Very high engagement format.',
      },
      {
        type: 'link',
        supported: true,
        notes: 'Include URL in post; LinkedIn auto-generates preview. Can use SHARE_URL media type for rich link.',
      },
      {
        type: 'carousel',
        supported: false,
        notes: 'Native carousels not available via API. Use document/PDF upload to simulate carousel effect.',
      },
      {
        type: 'story',
        supported: false,
        notes: 'LinkedIn Stories was discontinued in September 2021. Not supported.',
      },
      {
        type: 'live',
        supported: true,
        notes: 'LinkedIn Live via Live Events API requires application approval from LinkedIn. Not available for all accounts.',
      },
    ],
    characterLimits: {
      caption: 3000,
      bio: 2600,
      title: 120,
      comment: 1250,
      hashtags: 30,
    },
    dos: [
      'Personal profiles CAN publish via UGC Posts API without business approval — use w_member_social scope',
      'Company Pages require LMDP (LinkedIn Marketing Developer Platform) approval for w_organization_social',
      'Use document/PDF posts for carousel-style content — highest engagement rate on LinkedIn',
      'Include 3–5 hashtags in the post body for discoverability',
      'Upload media assets first via Assets API, then reference the returned URN in the post',
    ],
    donts: [
      'Do NOT request LMDP scopes (r_organization_social, w_organization_social) before LinkedIn LMDP approval — the entire auth request will be rejected',
      'Do NOT attempt native carousels via API — they are not supported; use PDF instead',
      'Do NOT publish Stories — discontinued since September 2021',
      'Do NOT rely on API scheduling — LinkedIn UGC Posts API does not natively support scheduled posts',
      'Do NOT exceed 150 API calls/day per member token',
    ],
    bestPostingTimes: 'Tue–Thu, 8–10am and 12pm. Avoid weekends for B2B content.',
    amosCapabilities: [
      'Publish text posts to personal profiles via UGC Posts API (w_member_social)',
      'Publish image posts after uploading assets via LinkedIn Assets API',
      'Publish video posts via LinkedIn Video API',
      'Publish document/PDF posts (carousel-style) via Assets API',
      'Publish to Company Pages if LMDP approval obtained and admin token available',
      'Read post analytics if r_organization_social scope granted',
    ],
    amosLimitations: [
      'Cannot schedule posts via API — LinkedIn UGC Posts API has no native scheduling',
      'Cannot publish native carousel posts — workaround: PDF upload',
      'Cannot publish to Company Pages without LMDP approval from LinkedIn',
      'Cannot manage comments or DMs via the standard publishing API',
      'LinkedIn Live requires separate application approval — not available by default',
    ],
  },

  // ── TikTok ─────────────────────────────────────────────────────────────────
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'musical-notes',
    color: '#010101',
    accountTypes: ['Personal', 'Business', 'Creator'],
    publishing: {
      requiresBusinessAccount: true,
      apiAvailable: true,
      apiType: 'official',
      schedulingSupported: false,
      maxPostsPerDay: 20,
      apiRateLimitNote: 'Content Posting API: 20 posts/day per account. Requires Business account or Creator approval.',
      oauthScopes: ['user.info.basic', 'video.publish', 'video.list'],
      publishMethod: 'direct_api',
    },
    content: [
      {
        type: 'video',
        supported: true,
        maxFileSizeMB: 4096,
        maxDurationSec: 600,
        aspectRatios: ['9:16', '1:1', '16:9'],
        minResolution: '540x960',
        formats: ['mp4', 'webm', 'mov'],
        notes: 'Min 3s, max 10 min via API (15 min in-app for some accounts). Recommended: 1080x1920, H.264, AAC. 9:16 preferred.',
      },
      {
        type: 'short_video',
        supported: true,
        maxFileSizeMB: 287,
        maxDurationSec: 60,
        aspectRatios: ['9:16'],
        formats: ['mp4', 'mov'],
        notes: 'Standard TikTok short-form. 15-60s sweet spot for the algorithm.',
      },
      {
        type: 'image',
        supported: false,
        notes: 'Photo mode exists in-app but is not available via the Content Posting API as of 2024.',
      },
      {
        type: 'carousel',
        supported: false,
        notes: 'Carousels (photo slideshow mode) are in-app only. Not available via API.',
      },
      {
        type: 'live',
        supported: false,
        notes: 'TikTok Live cannot be initiated via the API. In-app only. Requires 1,000+ followers.',
      },
    ],
    characterLimits: {
      caption: 2200,
      bio: 80,
      comment: 150,
      hashtags: 100,
    },
    dos: [
      'Use a TikTok Business account — personal accounts cannot use Content Posting API',
      'Upload videos in 9:16 ratio at 1080x1920 for maximum organic reach',
      'Keep caption concise — first 150 chars shown before "more" truncation',
      'Use trending sounds and hashtags for discoverability (sounds cannot be set via API)',
      'Videos between 15–60s consistently outperform longer content on the FYP',
    ],
    donts: [
      'Do NOT attempt to post via API with a personal account — will fail with permission error',
      'Do NOT use carousels or photo posts via API — not supported',
      'Do NOT exceed 20 API posts/day per account',
      'Do NOT rely on API for scheduling — TikTok Content Posting API does not support scheduled posts',
      'Do NOT post videos under 3s — rejected by the API',
    ],
    bestPostingTimes: 'Tue, Thu, Fri: 7–9am, 12–3pm, 7–11pm. Local timezone matters significantly.',
    amosCapabilities: [
      'Upload and publish videos via TikTok Content Posting API (Business accounts)',
      'Generate captions with hashtag suggestions within character limits',
      'Pull video performance metrics via TikTok Research API',
    ],
    amosLimitations: [
      'Cannot publish to personal accounts — Business account required',
      'Cannot schedule posts via API — TikTok has no API scheduling',
      'Cannot set background music/sounds via API — manual action in TikTok Studio',
      'Cannot publish carousels or photo posts via API',
      'Cannot initiate TikTok Live — in-app only',
      'Cannot manage comments or DMs via the standard API without additional approvals',
    ],
  },

  // ── WhatsApp Business ──────────────────────────────────────────────────────
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: 'logo-whatsapp',
    color: '#25D366',
    accountTypes: ['WhatsApp Business Account (WABA)', 'Business App'],
    publishing: {
      requiresBusinessAccount: true,
      apiAvailable: true,
      apiType: 'official',
      schedulingSupported: false,
      maxPostsPerDay: 1000,
      apiRateLimitNote: 'Messaging limit depends on tier: Tier 1 = 1K unique recipients/day, Tier 2 = 10K, Tier 3 = 100K. Template messages only for initial outreach.',
      oauthScopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
      publishMethod: 'webhook',
    },
    content: [
      {
        type: 'text',
        supported: true,
        notes: 'Template messages must be pre-approved by Meta. Free-form text allowed in 24h customer service window only.',
      },
      {
        type: 'image',
        supported: true,
        maxFileSizeMB: 5,
        formats: ['jpg', 'png'],
        notes: 'Images can be sent in approved template messages (header component) or in 24h window.',
      },
      {
        type: 'video',
        supported: true,
        maxFileSizeMB: 16,
        maxDurationSec: 600,
        formats: ['mp4', '3gp'],
        notes: 'Videos in template messages or 24h service window. Max 16 MB.',
      },
      {
        type: 'document',
        supported: true,
        maxFileSizeMB: 100,
        formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
        notes: 'Documents (PDF, Office) can be sent in conversations or templates.',
      },
      {
        type: 'carousel',
        supported: true,
        notes: 'Carousel templates available in WhatsApp Business API — up to 10 cards with images/text/buttons.',
      },
      {
        type: 'story',
        supported: false,
        notes: 'WhatsApp Status (Stories) cannot be managed via the Business API.',
      },
    ],
    characterLimits: {
      caption: 1024,
      title: 60,
    },
    dos: [
      'Always use pre-approved message templates for first-contact outreach',
      'Keep template body text under 1024 characters',
      'Use the 24-hour conversation window for free-form replies after customer initiates',
      'Set up webhook to receive delivery receipts and incoming messages',
      'Request explicit opt-in before sending template broadcasts — required by Meta policy',
    ],
    donts: [
      'Do NOT send promotional messages outside approved templates — violates WhatsApp policy',
      'Do NOT send unsolicited broadcasts without user opt-in — risk of account ban',
      'Do NOT manage WhatsApp Status (Stories) via API — not supported',
      'Do NOT exceed daily messaging tier limits without requesting a tier upgrade',
      'Do NOT use personal WhatsApp numbers — WABA required for API access',
    ],
    bestPostingTimes: 'For broadcast campaigns: weekdays 10am–12pm or 6–8pm local time. Response rates highest within 1h of send.',
    amosCapabilities: [
      'Send approved template messages to opted-in recipients via Cloud API',
      'Send image, video, and document attachments in templates',
      'Send carousel templates (up to 10 cards) for product showcases',
      'Receive and process incoming messages via webhook',
      'Track delivery, read receipts, and reply rates',
    ],
    amosLimitations: [
      'Cannot send free-form broadcast messages — templates must be pre-approved by Meta',
      'Cannot manage WhatsApp Status (Stories) via API',
      'Cannot initiate conversations without a pre-approved template',
      'Cannot exceed account messaging tier limits without manual tier upgrade request',
      'All templates must be submitted and approved in Meta Business Manager before use',
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: 'logo-twitter',
    color: '#1DA1F2',
    accountTypes: ['Free', 'Basic', 'Premium (X Premium)', 'Business (Verified Org)'],
    publishing: {
      requiresBusinessAccount: false,
      apiAvailable: true,
      apiType: 'official',
      schedulingSupported: false,
      maxPostsPerDay: 2400,
      apiRateLimitNote: 'API v2 Free tier: 1,500 tweets/month write limit. Basic: 3,000/month. Pro: 300,000/month. Read limits also tiered.',
      oauthScopes: ['tweet.read', 'tweet.write', 'users.read', 'media.write'],
      publishMethod: 'direct_api',
    },
    content: [
      {
        type: 'text',
        supported: true,
        notes: 'Standard accounts: 280 chars. X Premium (paid): 25,000 chars long-form posts. URLs count as 23 chars regardless of length.',
      },
      {
        type: 'image',
        supported: true,
        maxFileSizeMB: 5,
        formats: ['jpg', 'png', 'gif', 'webp'],
        notes: 'Up to 4 images per tweet. Upload via v1.1 media/upload endpoint, attach media_id to v2 tweet. Animated GIF max 15 MB.',
      },
      {
        type: 'video',
        supported: true,
        maxFileSizeMB: 512,
        maxDurationSec: 140,
        formats: ['mp4', 'mov'],
        notes: 'Max 1 video per tweet (cannot combine with images). Max 512 MB, 2min 20s. Recommended: MP4, H.264, AAC, 1280x720+.',
      },
      {
        type: 'link',
        supported: true,
        notes: 'URLs auto-shortened to t.co links and count as 23 chars in the character limit.',
      },
      {
        type: 'live',
        supported: false,
        notes: 'Twitter Spaces (audio) and live video exist but cannot be initiated via the v2 API.',
      },
    ],
    characterLimits: {
      caption: 280,
      bio: 160,
      comment: 280,
    },
    dos: [
      'Use OAuth 2.0 with PKCE for v2 API access (tweet.write scope required)',
      'Upload media via v1.1 media/upload endpoint first, then attach media_id to v2 tweet creation',
      'Keep tweets concise — engagement drops significantly above 100 chars',
      'Use threads (reply chain) for long-form content on standard accounts',
      'Include alt text for images via media metadata endpoint for accessibility',
    ],
    donts: [
      'Do NOT exceed 280 chars for standard account tweets — API returns validation error',
      'Do NOT attach more than 4 images or 1 video per tweet',
      'Do NOT combine images and video in the same tweet',
      'Do NOT rely on API for scheduling — Twitter v2 API does not natively support scheduled tweets',
      'Do NOT exceed monthly write limits for your API tier (Free: 1,500/month)',
    ],
    bestPostingTimes: 'Mon–Fri 8–10am and 6–9pm. News/tech: constant. Engagement peaks during commute hours.',
    amosCapabilities: [
      'Publish tweets with text and up to 4 images via API v2',
      'Publish tweets with a single video attachment',
      'Generate tweet copy within character limits',
      'Create tweet threads (reply chains) for long-form content',
      'Read tweet metrics (impressions, engagements, retweets) via v2 API',
    ],
    amosLimitations: [
      'Cannot schedule tweets via the v2 API — scheduling requires manual action or third-party tools',
      'Cannot initiate Twitter Spaces or live video via API',
      'Cannot exceed API tier monthly limits (Free: 1,500 tweets/month)',
      'Cannot post long-form content (>280 chars) without X Premium subscription',
      'Media upload still requires v1.1 endpoint — requires app-level auth token alongside user OAuth2',
    ],
  },

  // ── Pinterest ──────────────────────────────────────────────────────────────
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'logo-pinterest',
    color: '#E60023',
    accountTypes: ['Personal', 'Business'],
    publishing: {
      requiresBusinessAccount: true,
      apiAvailable: true,
      apiType: 'official',
      schedulingSupported: true,
      maxPostsPerDay: 200,
      apiRateLimitNote: 'Pinterest API v5: 10 requests/second per app. Pin creation: up to 200 pins/day per account.',
      oauthScopes: ['boards:read', 'boards:write', 'pins:read', 'pins:write'],
      publishMethod: 'direct_api',
    },
    content: [
      {
        type: 'image',
        supported: true,
        maxFileSizeMB: 32,
        aspectRatios: ['2:3', '1:1', '4:5'],
        minResolution: '600x900',
        formats: ['jpg', 'png', 'webp'],
        notes: 'Recommended: 1000x1500 (2:3) for standard pins. Square (1:1) also works. Taller images get more feed space.',
      },
      {
        type: 'video',
        supported: true,
        maxFileSizeMB: 2048,
        maxDurationSec: 900,
        aspectRatios: ['1:1', '2:3', '9:16'],
        formats: ['mp4', 'mov', 'avi'],
        notes: 'Video Pins via API v5. Max 15 min, 2 GB. Min 4s. Recommended: MP4, H.264, 1:1 or 9:16.',
      },
      {
        type: 'carousel',
        supported: false,
        notes: 'Idea Pins (formerly Story Pins) which support multi-frame/carousel content are not available via the API. Only standard image and video pins can be created programmatically.',
      },
      {
        type: 'story',
        supported: false,
        notes: 'Idea Pins (Pinterest Stories) cannot be published via API v5. In-app creation only.',
      },
    ],
    characterLimits: {
      caption: 500,
      title: 100,
      bio: 160,
    },
    dos: [
      'Use a Business account — personal accounts cannot access the Pinterest API for publishing',
      'Use 2:3 aspect ratio (1000x1500px) for standard pins — tallest format allowed in feed',
      'Include keyword-rich descriptions for SEO — Pinterest is a search engine',
      'Add a destination link to every pin to drive traffic',
      'Schedule pins during peak times using the publish_date parameter',
    ],
    donts: [
      'Do NOT publish Idea Pins (carousels/Stories) via API — not supported',
      'Do NOT exceed 500 chars in pin description — truncated in feed display',
      'Do NOT use personal account tokens for API publishing',
      'Do NOT post more than 200 pins/day per account',
      'Do NOT omit a destination URL — pins without links have significantly lower click-through rates',
    ],
    bestPostingTimes: 'Sat–Sun 8–11pm, weekdays 8–11pm. Best: Fri evening, Sat morning.',
    amosCapabilities: [
      'Create standard image pins on specified boards via API v5',
      'Create video pins on boards via API v5',
      'Schedule pins up to 30 days in advance via publish_date parameter',
      'Generate keyword-rich pin descriptions for SEO',
      'Read board and pin analytics (impressions, saves, clicks)',
    ],
    amosLimitations: [
      'Cannot publish Idea Pins (multi-frame/carousel Stories) via API — in-app only',
      'Cannot create or manage boards automatically without user interaction for initial setup',
      'Cannot publish to personal Pinterest accounts — Business account required',
      'Pinterest shopping features require separate Product Catalog setup outside AMOS',
    ],
  },

  // ── YouTube ────────────────────────────────────────────────────────────────
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'logo-youtube',
    color: '#FF0000',
    accountTypes: ['Standard', 'Brand Account', 'YouTube Partner'],
    publishing: {
      requiresBusinessAccount: false,
      apiAvailable: true,
      apiType: 'official',
      schedulingSupported: true,
      maxPostsPerDay: 2000,
      apiRateLimitNote: 'YouTube Data API v3: 10,000 units/day quota. Video upload = 1,600 units. Listing = 1 unit. Quota reset daily at midnight Pacific.',
      oauthScopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtubepartner'],
      publishMethod: 'direct_api',
    },
    content: [
      {
        type: 'video',
        supported: true,
        maxFileSizeMB: 256000,
        maxDurationSec: 43200,
        aspectRatios: ['16:9', '4:3', '1:1'],
        minResolution: '426x240',
        formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'],
        notes: 'Max 256 GB or 12 hours. Unverified accounts: 15 min max. Recommended: MP4, H.264, 1920x1080, AAC audio.',
      },
      {
        type: 'short_video',
        supported: true,
        maxFileSizeMB: 256000,
        maxDurationSec: 60,
        aspectRatios: ['9:16'],
        minResolution: '1080x1920',
        formats: ['mp4', 'mov'],
        notes: 'YouTube Shorts = vertical video ≤60s. Use #Shorts in title or description for classification. Recommended: 1080x1920.',
      },
      {
        type: 'live',
        supported: true,
        notes: 'YouTube Live via LiveBroadcasts and LiveStreams API. Requires channel verification and no community strikes.',
      },
    ],
    characterLimits: {
      caption: 5000,
      title: 100,
      bio: 1000,
      comment: 10000,
    },
    dos: [
      'Use OAuth 2.0 with youtube.upload scope for video uploads',
      'Set privacyStatus to "private" first, then update to "public" after processing to avoid failed-state public videos',
      'Include #Shorts in title or description for vertical videos ≤60s to ensure Short classification',
      'Upload thumbnail separately via thumbnails.set endpoint (requires channel verification)',
      'Use the resumable upload method for videos >5 MB to handle network interruptions',
    ],
    donts: [
      'Do NOT upload videos longer than 15 min on unverified accounts — API will reject with quota error',
      'Do NOT skip the resumable upload protocol for large files — direct upload will time out',
      'Do NOT exceed 10,000 API units/day — video uploads are expensive (1,600 units each)',
      'Do NOT set Shorts videos to landscape or longer than 60s — will not appear in Shorts feed',
      'Do NOT rely on API for Chapters/end screens/cards — requires manual setup in YouTube Studio',
    ],
    bestPostingTimes: 'Fri–Sun 2–4pm and 6–9pm. B2B tutorials: Tue–Thu 10am–12pm.',
    amosCapabilities: [
      'Upload videos to YouTube via Data API v3 resumable upload',
      'Set title, description, tags, category, and privacy status via API',
      'Schedule video publish time via publishAt parameter (set to private + future time)',
      'Upload YouTube Shorts by setting vertical 9:16 video ≤60s with #Shorts tag',
      'Read video analytics (views, watch time, likes) via YouTube Analytics API',
      'Set video thumbnail via thumbnails.set (requires verified channel)',
    ],
    amosLimitations: [
      'Cannot add end screens, cards, or chapters via the API — YouTube Studio only',
      'Cannot exceed 10,000 API units/day without requesting increased quota from Google',
      'Cannot upload videos >15 min on unverified YouTube channels',
      'Cannot manage YouTube Live without additional LiveBroadcasts API setup',
      'Cannot auto-generate subtitles via the API — manual upload via captions.insert or YouTube Studio',
    ],
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Look up a platform by its string ID (e.g. 'instagram', 'tiktok').
 * Returns undefined if not found.
 */
export function getPlatformById(id: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find(p => p.id === id);
}

/**
 * Returns platforms where a Business account is required for API publishing.
 * AMOS should surface these prominently during account setup.
 */
export function getPlatformsRequiringBusiness(): SocialPlatform[] {
  return SOCIAL_PLATFORMS.filter(p => p.publishing.requiresBusinessAccount);
}

/**
 * Returns platforms that support native scheduled publishing via the API.
 * Note: Twitter and TikTok are NOT in this list despite being popular — they
 * do not support API-level scheduling.
 */
export function getPlatformsSupportingScheduling(): SocialPlatform[] {
  return SOCIAL_PLATFORMS.filter(p => p.publishing.schedulingSupported);
}

/**
 * Validates whether AMOS can fulfil a publish request before attempting it.
 *
 * @param platformId   - Platform ID (e.g. 'instagram')
 * @param contentType  - Content type being published (e.g. 'reel')
 * @param accountType  - Caller-provided account type string (e.g. 'Personal')
 * @returns { valid: boolean; reason?: string }
 */
export function validatePublishRequest(
  platformId: string,
  contentType: ContentSpec['type'],
  accountType: string,
): { valid: boolean; reason?: string } {
  const platform = getPlatformById(platformId);

  if (!platform) {
    return { valid: false, reason: `Unknown platform: "${platformId}". Supported platforms: ${SOCIAL_PLATFORMS.map(p => p.id).join(', ')}.` };
  }

  if (!platform.publishing.apiAvailable) {
    return { valid: false, reason: `${platform.name} does not have an official API. Publishing requires manual action.` };
  }

  // Check if content type is supported
  const spec = platform.content.find(c => c.type === contentType);
  if (!spec) {
    return { valid: false, reason: `Content type "${contentType}" is not defined for ${platform.name}.` };
  }
  if (!spec.supported) {
    return {
      valid: false,
      reason: `${platform.name} does not support "${contentType}" via API. ${spec.notes ?? ''}`.trim(),
    };
  }

  // Check business account requirement
  if (platform.publishing.requiresBusinessAccount) {
    const isPersonal = accountType.toLowerCase().includes('personal');
    if (isPersonal) {
      return {
        valid: false,
        reason: `${platform.name} requires a Business or Creator account for API publishing. Personal accounts cannot publish via the API.`,
      };
    }
  }

  return { valid: true };
}
