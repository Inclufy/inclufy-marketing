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
  created_at: string;
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
