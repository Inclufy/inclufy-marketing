import { supabase } from './supabase';
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

  /** Call the event-studio-ai Supabase Edge Function */
  private async invoke<T>(action: string, payload: Record<string, unknown>, fallback: T): Promise<T> {
    const { data, error } = await supabase.functions.invoke('event-studio-ai', {
      body: { action, ...payload, brand_context: this.brandContext || undefined },
    });

    if (error) {
      console.error(`[AI] ${action} error:`, error);
      throw error;
    }

    const result = data?.result;
    if (result == null) return fallback;

    if (typeof result === 'string') {
      try { return JSON.parse(result) as T; } catch { return fallback; }
    }
    return result as T;
  }

  /**
   * Generate an event post using GPT-4o Vision.
   * Calls the event-studio-ai Edge Function (works on all platforms).
   */
  async generateEventPost(request: GenerateEventPostRequest): Promise<GenerateEventPostResponse> {
    return this.invoke('event-post', {
      image_base64: request.image_base64,
      transcript: request.transcript,
      platform: request.platform,
      event_context: request.event_context,
      capture_note: request.capture_note,
      capture_tags: request.capture_tags,
      brand_context: request.brand_context || this.brandContext || undefined,
    }, {
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
   * Transcribe audio using Whisper via Edge Function.
   */
  async transcribeAudio(audioBase64: string): Promise<TranscribeResponse> {
    return this.invoke('transcribe', { audio_base64: audioBase64 }, { transcript: '', duration: 0 });
  }

  /**
   * Generate a Story Arc — AI-planned posting schedule for the event day.
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
    return this.invoke('story-arc', params, {
      arc: [],
      total_planned: 0,
      narrative_summary: '',
    });
  }

  /**
   * Translate content to multiple languages.
   */
  async translateContent(params: {
    text: string;
    source_language?: string;
    target_languages?: string[];
    platform?: string;
  }): Promise<TranslateResponse> {
    return this.invoke('translate', params, { translations: {} });
  }

  /**
   * Generate an event recap (blog, newsletter, or LinkedIn article).
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
    return this.invoke('event-recap', params, {
      title: '',
      content: '',
      key_highlights: [],
      suggested_cta: '',
      social_teaser: '',
    });
  }

  /**
   * Auto-tag an image using GPT-4o Vision.
   */
  async autoTagImage(params: {
    image_base64: string;
    existing_tags?: string[];
  }): Promise<AutoTagResponse> {
    return this.invoke('auto-tag', params, {
      tags: [],
      scene_description: '',
      suggested_tags: [],
      people_count: 0,
    });
  }

  /**
   * Suggest the best target audience for a post.
   */
  async suggestAudience(params: {
    text_content: string;
    channel: string;
    event_context?: { name?: string; description?: string };
    hashtags?: string[];
  }): Promise<AudienceTargetResponse> {
    return this.invoke('audience-target', params, {
      primary: '',
      secondary: '',
      reasoning: '',
      demographics: '',
      interests: [],
      optimal_time: '',
      engagement_tips: [],
    });
  }

  /**
   * Generate a branded image overlay (returns source image as fallback).
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
    return { branded_image_url: params.source_image_url, format: params.image_format || 'square' };
  }
}

export const aiService = new AIService();
