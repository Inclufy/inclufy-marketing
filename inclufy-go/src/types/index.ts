// ─── Event Types ─────────────────────────────────────────────────────

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
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type EventStatus = 'upcoming' | 'active' | 'completed' | 'archived';
export type Channel = 'linkedin' | 'instagram' | 'x' | 'facebook';
export type MediaType = 'photo' | 'video' | 'audio' | 'quote';
export type AIStatus = 'pending' | 'processing' | 'completed' | 'error';
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'failed' | 'in_review';

export type EventInsert = Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type EventUpdate = Partial<EventInsert>;

// ─── Capture Types ───────────────────────────────────────────────────

export interface EventCapture {
  id: string;
  event_id: string;
  user_id: string;
  media_type: MediaType;
  media_url: string;
  storage_path: string;
  thumbnail_url: string | null;
  tags: string[];
  note: string;
  ai_status: AIStatus;
  ai_description: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  captured_at: string;
  created_at: string;
}

export type CaptureInsert = Omit<EventCapture, 'id' | 'user_id' | 'created_at'>;

// ─── Post Types ──────────────────────────────────────────────────────

export interface EventPost {
  id: string;
  capture_id: string;
  event_id: string;
  user_id: string;
  channel: Channel;
  text_content: string;
  hashtags: string[];
  branded_image_url: string | null;
  image_format: 'square' | 'story' | 'landscape';
  status: PostStatus;
  published_at: string | null;
  scheduled_at: string | null;
  publish_error: string | null;
  engagement: { likes: number; comments: number; shares: number };
  created_at: string;
  updated_at: string;
}

export type PostUpdate = Partial<Pick<EventPost, 'text_content' | 'hashtags' | 'status' | 'scheduled_at'>>;

// ─── Brand Types ─────────────────────────────────────────────────────

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

export interface BrandContext {
  brand_name: string;
  tagline?: string;
  mission?: string;
  brand_description?: string;
  tone_attributes?: Array<{ attribute: string; description: string }>;
  messaging_dos?: string;
  messaging_donts?: string;
  preferred_vocabulary?: string[];
  banned_phrases?: string[];
  usps?: string[];
  brand_values?: string[];
  audiences?: string[];
  industries?: string[];
  primary_color?: string;
  secondary_color?: string;
}

// ─── AI Types ────────────────────────────────────────────────────────

export interface GenerateEventPostRequest {
  image_base64?: string;
  transcript?: string;
  platform: Channel;
  event_context: {
    name: string;
    description: string;
    hashtags: string[];
    location: string;
  };
  capture_note: string;
  capture_tags: string[];
  brand_context?: BrandContext;
}

export interface GenerateEventPostResponse {
  text: string;
  hashtags: string[];
  image_description: string;
  optimal_post_time: string;
}

export interface TranscribeResponse {
  transcript: string;
  duration: number;
}

// ─── Navigation Types ────────────────────────────────────────────────

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Main: undefined;
  // Events
  EventSetup: { eventId?: string };
  LiveCapture: { eventId: string };
  PostReview: { captureId: string; eventId: string };
  EventDashboard: { eventId: string };
  StoryArc: { eventId: string };
  EventRecap: { eventId: string };
  TeamManage: { eventId: string };
  // Campaigns
  CampaignList: undefined;
  CampaignCreate: undefined;
  CampaignDetail: { campaignId: string };
  // AI & Content
  ContentCreator: undefined;
  AICommand: undefined;
  // Leads & Smart Contact
  LeadCapture: undefined;
  SmartLead: undefined;
  QRScan: undefined;
  CardScan: undefined;
  MyDigitalCard: undefined;
  NFCShare: undefined;
  // Budget
  BudgetMonitor: undefined;
  // Opportunities & Automation
  OpportunityRadar: undefined;
  MarketingAutomation: undefined;
  // Notifications
  Notifications: undefined;
  // Settings
  Settings: undefined;
  // Demo
  DemoEnvironment: undefined;
  // AMOS Hub
  AMOSHub: undefined;
  // Event Scanner (attendee QR scanning)
  EventScanner: { eventId: string };
};

// ─── Capture Tags Presets ────────────────────────────────────────────

export const CAPTURE_TAG_PRESETS = [
  'Keynote',
  'Networking',
  'Demo',
  'Stand',
  'Panel',
  'Award',
  'Behind-the-scenes',
  'Product',
  'Team',
  'Workshop',
  'Break',
  'Announcement',
] as const;
