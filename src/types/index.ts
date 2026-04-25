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
export type Channel = 'linkedin' | 'instagram' | 'x' | 'facebook' | 'tiktok' | 'whatsapp';
export type MediaType = 'photo' | 'video' | 'audio' | 'quote';
export type AIStatus = 'pending' | 'processing' | 'completed' | 'error';
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'failed' | 'in_review';

export type EventInsert = Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type EventUpdate = Partial<EventInsert>;

// ─── Capture Types ───────────────────────────────────────────────────

export interface EventCapture {
  id: string;
  event_id: string | null;
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
  event_id: string | null;
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
  engagement: { likes: number; comments: number; shares: number; extra_images?: string[] };
  whatsapp_cta_enabled?: boolean;
  whatsapp_cta_phone?: string | null;
  whatsapp_cta_message?: string | null;
  created_at: string;
  updated_at: string;
}

export type PostUpdate = Partial<Pick<EventPost, 'text_content' | 'hashtags' | 'status' | 'scheduled_at' | 'branded_image_url' | 'engagement' | 'whatsapp_cta_enabled' | 'whatsapp_cta_phone' | 'whatsapp_cta_message'>>;

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
  language?: string;
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
  PostReview: { captureId: string; eventId?: string; localMediaUri?: string; extraImageUrls?: string[] };
  EventDashboard: { eventId: string };
  StoryArc: { eventId: string };
  EventRecap: { eventId: string };
  TeamManage: { eventId: string };
  // Campaigns
  CampaignList: undefined;
  CampaignCreate: undefined;
  CampaignDetail: { campaignId: string };
  // AI & Content
  ContentCreator: { imageUri?: string; imageUrls?: string[] } | undefined;
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
  BrandKit: undefined;
  // Event Attendees & Share
  EventAttendees: { eventId: string };
  EventShare: { eventId: string };
  // Demo
  DemoEnvironment: undefined;
  // AMOS Hub
  AMOSHub: undefined;
  MultiAgent: undefined;
  Integrations: undefined;
  // Event Scanner (attendee QR scanning)
  EventScanner: { eventId: string };
  // AMOS Intelligence Screens
  EventIntelligence: undefined;
  OpportunityFeed: undefined;
  AutonomousHub: undefined;
  NetworkingEngine: undefined;
  FollowedOrganizers: undefined;
  // Content Hubs
  Products: undefined;
  TeamDirectory: undefined;
  Organization: undefined;
  // Marketing Strategy
  MarketingStrategy: undefined;
  // Content Proposals
  ContentProposals: undefined;
  // New screens
  ContentCalendar: undefined;
  Analytics: undefined;
  Onboarding: undefined;
  // All Posts management
  AllPosts: undefined;
  // WhatsApp Business settings
  WhatsAppSettings: undefined;
  // Content Library (imported product posts)
  Library: { productId?: string } | undefined;
  LibraryImport: { productId?: string } | undefined;
  LibraryPostDetail: { postId: string };
};

// ─── Library Posts (imported pre-designed product posts) ────────────

export type LibraryPostType = 'single' | 'carousel' | 'video';
export type LibraryPostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived';
export type LibraryLanguage = 'nl' | 'en' | 'fr';

export interface LibraryPostTranslation {
  image_url: string | null;
  caption: string;
  hashtags: string[];
  cta: string;
}

export interface LibraryOverlayConfig {
  logo?: boolean;
  watermark?: 'none' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  brand_color?: string;
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
  overlay_config: LibraryOverlayConfig;
  scheduled_for: string | null;
  status: LibraryPostStatus;
  published_at: string | null;
  publish_results: Record<string, { post_id?: string; url?: string; error?: string }>;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryImport {
  id: string;
  user_id: string;
  product_id: string | null;
  zip_path: string;
  campaign: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  posts_created: number;
  error: string | null;
  manifest: Record<string, unknown> | null;
  started_at: string;
  finished_at: string | null;
}

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
