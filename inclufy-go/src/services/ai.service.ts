import api from './api';
import type { GenerateEventPostRequest, GenerateEventPostResponse, TranscribeResponse, BrandContext } from '../types';

// ─── Response Types ──────────────────────────────────────────────────

export interface StoryArcPost {
  time: string;
  phase: string;
  theme: string;
  channel: string;
  content_type: string;
  tip: string;
  caption_template: string;
}

export interface StoryArcResponse {
  arc: StoryArcPost[];
  total_planned: number;
  narrative_summary: string;
}

export interface TranslationResult {
  text: string;
  hashtags: string[];
  notes: string;
}

export interface TranslateResponse {
  translations: Record<string, TranslationResult>;
}

export interface EventRecapResponse {
  title: string;
  content: string;
  key_highlights: string[];
  suggested_cta: string;
  social_teaser: string;
}

export interface BrandOverlayResponse {
  branded_image_url: string;
  format: string;
}

export interface AutoTagItem {
  type: 'person' | 'product' | 'location' | 'activity' | 'mood' | 'branding' | 'setup';
  label: string;
  confidence: number;
}

export interface AutoTagResponse {
  tags: AutoTagItem[];
  scene_description: string;
  suggested_tags: string[];
  people_count: number;
}

export interface AudienceTargetResponse {
  primary: string;
  secondary: string;
  reasoning: string;
  demographics: string;
  interests: string[];
  optimal_time: string;
  engagement_tips: string[];
}

// ─── AI Service ──────────────────────────────────────────────────────

class AIService {
  private brandContext: BrandContext | null = null;

  setBrandContext(ctx: BrandContext) {
    this.brandContext = ctx;
  }

  /** Parse a JSON result that might be a string or object */
  private parseResult<T>(result: unknown, fallback: T): T {
    if (typeof result === 'string') {
      try {
        return JSON.parse(result);
      } catch {
        return fallback;
      }
    }
    return result as T;
  }

  /**
   * Generate an event post using GPT-4o Vision.
   * Backend analyzes the image + event context and generates channel-specific text.
   */
  async generateEventPost(request: GenerateEventPostRequest): Promise<GenerateEventPostResponse> {
    const payload = {
      ...request,
      brand_context: request.brand_context || this.brandContext || undefined,
    };

    const response = await api.post('/content/event-post', payload);
    return this.parseResult(response.data?.result, {
      text: '',
      hashtags: [],
      image_description: '',
      optimal_post_time: '',
    });
  }

  /**
   * Generate posts for ALL channels at once after a capture.
   */
  async generateAllChannelPosts(
    channels: string[],
    imageBase64: string | undefined,
    transcript: string | undefined,
    eventContext: GenerateEventPostRequest['event_context'],
    captureNote: string,
    captureTags: string[],
  ): Promise<Record<string, GenerateEventPostResponse>> {
    const results: Record<string, GenerateEventPostResponse> = {};

    // Generate in parallel for all channels
    const promises = channels.map(async (channel) => {
      try {
        const result = await this.generateEventPost({
          image_base64: imageBase64,
          transcript,
          platform: channel as GenerateEventPostRequest['platform'],
          event_context: eventContext,
          capture_note: captureNote,
          capture_tags: captureTags,
        });
        results[channel] = result;
      } catch (error) {
        console.error(`Failed to generate post for ${channel}:`, error);
        results[channel] = {
          text: `[Generatie mislukt voor ${channel}]`,
          hashtags: eventContext.hashtags,
          image_description: '',
          optimal_post_time: '',
        };
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Transcribe audio using Whisper via backend.
   */
  async transcribeAudio(audioBase64: string): Promise<TranscribeResponse> {
    const response = await api.post('/content/transcribe', { audio_base64: audioBase64 });
    return this.parseResult(response.data?.result, { transcript: '', duration: 0 });
  }

  /**
   * Generate a Story Arc — AI-planned posting schedule for the event day.
   * Plans posts as a narrative (arrival → keynote → networking → wrap-up).
   */
  async generateStoryArc(params: {
    event_name: string;
    event_date: string;
    event_start_time?: string;
    event_end_time?: string;
    channels: string[];
    hashtags: string[];
    goals: string[];
    captures_so_far: number;
  }): Promise<StoryArcResponse> {
    const response = await api.post('/content/story-arc', {
      ...params,
      brand_context: this.brandContext || undefined,
    });
    return this.parseResult(response.data?.result, {
      arc: [],
      total_planned: 0,
      narrative_summary: '',
    });
  }

  /**
   * Translate content to multiple languages.
   * Not just translation — culturally adapts tone, idioms, and hashtags.
   */
  async translateContent(params: {
    text: string;
    source_language?: string;
    target_languages?: string[];
    platform?: string;
  }): Promise<TranslateResponse> {
    const response = await api.post('/content/translate', {
      ...params,
      brand_context: this.brandContext || undefined,
    });
    return this.parseResult(response.data?.result, { translations: {} });
  }

  /**
   * Generate an event recap (blog, newsletter, or LinkedIn article).
   * Aggregates all posts from the day into a cohesive narrative.
   */
  async generateEventRecap(params: {
    event_name: string;
    event_date: string;
    location: string;
    posts: Array<{ channel: string; text_content: string; hashtags: string[]; status: string }>;
    captures_count: number;
    published_count: number;
    output_format: 'blog' | 'newsletter' | 'linkedin_article';
  }): Promise<EventRecapResponse> {
    const response = await api.post('/content/event-recap', {
      ...params,
      brand_context: this.brandContext || undefined,
    });
    return this.parseResult(response.data?.result, {
      title: '',
      content: '',
      key_highlights: [],
      suggested_cta: '',
      social_teaser: '',
    });
  }

  /**
   * Generate a branded image with logo overlay, gradient, and text.
   * Uploads to Supabase Storage and returns the URL.
   */
  async createBrandOverlay(params: {
    source_image_url: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    image_format?: 'square' | 'story' | 'landscape' | 'portrait';
    event_name?: string;
    hashtags?: string[];
  }): Promise<BrandOverlayResponse> {
    const response = await api.post('/content/brand-overlay', params);
    return response.data;
  }

  /**
   * Auto-tag an image using GPT-4o Vision.
   * Detects people, products, locations, activities, moods in captured photos.
   */
  async autoTagImage(params: {
    image_base64: string;
    existing_tags?: string[];
  }): Promise<AutoTagResponse> {
    const response = await api.post('/content/auto-tag', params);
    return this.parseResult(response.data?.result, {
      tags: [],
      scene_description: '',
      suggested_tags: [],
      people_count: 0,
    });
  }

  /**
   * Suggest the best target audience for a post.
   * Analyzes content, channel, and event context.
   */
  async suggestAudience(params: {
    text_content: string;
    channel: string;
    event_context?: { name?: string; description?: string };
    hashtags?: string[];
  }): Promise<AudienceTargetResponse> {
    const response = await api.post('/content/audience-target', {
      ...params,
      brand_context: this.brandContext || undefined,
    });
    return this.parseResult(response.data?.result, {
      primary: '',
      secondary: '',
      reasoning: '',
      demographics: '',
      interests: [],
      optimal_time: '',
      engagement_tips: [],
    });
  }
}

export const aiService = new AIService();
