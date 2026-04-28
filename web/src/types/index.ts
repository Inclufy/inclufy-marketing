// Shared types — mirrors mobile app types

export type Channel = 'linkedin' | 'instagram' | 'x' | 'facebook' | 'tiktok';
export type EventStatus = 'upcoming' | 'active' | 'completed' | 'archived';
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'failed' | 'in_review';
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'scheduled' | 'published' | 'expired';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';

export interface Event {
  id: string;
  user_id: string;
  name: string;
  description: string;
  location: string;
  event_date: string;
  event_start_time: string | null;
  event_end_time: string | null;
  channels: Channel[];
  hashtags: string[];
  default_tags: string[];
  goals: string[];
  brand_kit_id: string | null;
  status: EventStatus;
  cover_image_url: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  type: string;
  description: string;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number | null;
  spent_amount: number | null;
  channels: Channel[];
  created_at: string;
}

export interface ContentProposal {
  id: string;
  user_id: string;
  title: string;
  content_text: string;
  channel: Channel;
  scheduled_for: string | null;
  based_on: Record<string, unknown> | null;
  hashtags: string[];
  status: ProposalStatus;
  tone: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description: string;
  trigger_type: string;
  actions: Record<string, unknown>;
  is_active: boolean;
  icon: string;
  color: string;
  autopilot_mode: string;
  cooldown_minutes: number;
  stats: { runs: number; successes: number; last_run: string | null };
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  price: number | null;
  image_url: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  role: string;
  expertise: string[];
  image_url: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  user_id: string;
  name: string;
  description: string;
  pitch: string | null;
  boilerplate: string | null;
  industry: string | null;
  website: string | null;
  created_at: string;
}

export interface MarketingStrategy {
  id: string;
  user_id: string;
  goals: string[];
  budget_monthly: number | null;
  channels: Record<string, { active: boolean; priority: number }>;
  content_mix: Record<string, number>;
  posts_per_week: number;
  posting_days: string[];
  autonomy_level: 'conservative' | 'balanced' | 'aggressive';
  personas: Persona[];
  created_at: string;
}

export type PersonaTone = 'formal' | 'casual' | 'inspirational';

export interface Persona {
  id: string;
  name: string;
  role: string;
  pain_points: string[];
  tone: PersonaTone;
  channels: Channel[];
}

// ─── Event Posts (per-channel posts created from captures/events) ──────

export interface EventPost {
  id: string;
  capture_id: string | null;
  event_id: string | null;
  user_id: string;
  channel: Channel;
  text_content: string;
  hashtags: string[];
  branded_image_url: string | null;
  video_url?: string | null;
  media_type?: 'photo' | 'video' | null;
  image_format: 'square' | 'story' | 'landscape';
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  publish_error: string | null;
  published_post_id?: string | null;
  first_comment?: string | null;
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    extra_images?: string[];
    fetched_at?: string;
  };
  whatsapp_cta_enabled?: boolean;
  whatsapp_cta_phone?: string | null;
  whatsapp_cta_message?: string | null;
  created_at: string;
  updated_at: string;
}

export type PostUpdate = Partial<
  Pick<
    EventPost,
    | 'text_content' | 'hashtags' | 'status' | 'scheduled_at'
    | 'branded_image_url' | 'engagement' | 'first_comment'
    | 'whatsapp_cta_enabled' | 'whatsapp_cta_phone' | 'whatsapp_cta_message'
  >
>;

// ─── Library Posts (imported pre-designed product posts) ────────────────

export type LibraryPostType = 'single' | 'carousel' | 'video';
export type LibraryPostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived';
export type LibraryLanguage = 'nl' | 'en' | 'fr';

export interface LibraryPostTranslation {
  image_url: string | null;
  caption: string;
  hashtags: string[];
  cta: string;
}

export interface LibraryPost {
  id: string;
  user_id: string;
  import_id: string | null;
  product_id: string | null;
  external_id: string | null;
  campaign: string | null;
  post_type: LibraryPostType;
  translations: Record<LibraryLanguage, LibraryPostTranslation>;
  channels: Channel[];
  primary_language: LibraryLanguage;
  overlay_config: Record<string, unknown>;
  scheduled_for: string | null;
  status: LibraryPostStatus;
  published_at: string | null;
  publish_results: Record<string, { post_id?: string; url?: string; error?: string }>;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: Channel;
  platform_account_id: string;
  account_name: string;
  profile_image_url: string | null;
  status: string;
  account_type: string;
  created_at: string;
}

export interface BrandKit {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  font_family: string;
  tagline: string | null;
  is_default: boolean;
}
