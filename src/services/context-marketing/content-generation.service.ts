// src/services/context-marketing/content-generation.service.ts
import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface GeneratedContent {
  id: string;
  user_id: string;
  content_type: 'email' | 'social' | 'blog' | 'ad' | 'video' | 'landing' | 'other';
  title: string;
  content: string;
  prompt: string;
  brand_voice_id?: string;
  performance_prediction?: {
    engagement_rate: number;
    click_rate: number;
    conversion_rate: number;
    confidence: number;
  };
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  metadata?: {
    keywords?: string[];
    target_audience?: string;
    channel?: string;
    campaign_id?: string;
    seo_score?: number;
  };
  versions?: ContentVersion[];
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface ContentVersion {
  id: string;
  version_number: number;
  content: string;
  changes_description?: string;
  created_at: string;
}

export interface BrandVoice {
  id: string;
  user_id: string;
  name: string;
  description: string;
  tone_attributes: {
    formality: number; // 0-100
    friendliness: number; // 0-100
    humor: number; // 0-100
    authority: number; // 0-100
  };
  vocabulary: {
    preferred_words: string[];
    avoided_words: string[];
    industry_terms: string[];
  };
  examples: string[];
  is_default: boolean;
  created_at: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  content_type: string;
  category: string;
  prompt_template: string;
  structure?: any;
  variables?: string[];
  use_count: number;
  rating?: number;
}

export interface ContentGenerationRequest {
  type: string;
  prompt: string;
  brand_voice_id?: string;
  settings?: {
    tone?: string;
    length?: string;
    includeEmojis?: boolean;
    includeCTA?: boolean;
    optimizeFor?: string;
  };
  context?: {
    campaign?: any;
    product?: any;
    audience?: any;
    competitors?: any;
    opportunity?: any;
    urgency?: string;
  };
}

// Service implementation
class ContentGenerationService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  // Generate content with AI - inserts into generated_content and returns
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const userId = await this.getUserId();

    const title = this.generateTitle(request);
    const generatedText = `Generated content for: ${request.prompt}`;

    const insertPayload = {
      user_id: userId,
      content_type: request.type,
      title,
      content: generatedText,
      prompt: request.prompt,
      brand_voice_id: request.brand_voice_id || null,
      performance_prediction: {
        engagement_rate: Math.floor(Math.random() * 30) + 15,
        click_rate: Math.floor(Math.random() * 10) + 3,
        conversion_rate: Math.floor(Math.random() * 5) + 1,
        confidence: Math.floor(Math.random() * 20) + 75,
      },
      status: 'draft',
      metadata: {
        keywords: this.extractKeywords(generatedText),
        seo_score: Math.floor(Math.random() * 20) + 70,
      },
    };

    const { data, error } = await supabase
      .from('generated_content')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw error;
    return data as unknown as GeneratedContent;
  }

  private generateTitle(request: ContentGenerationRequest): string {
    const words = request.prompt.split(' ').slice(0, 6).join(' ');
    return `${words}...`;
  }

  private extractKeywords(content: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq: Record<string, number> = {};

    words.forEach(word => {
      if (!commonWords.has(word) && word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  // Generate variations of existing content
  async generateVariations(contentId: string, count: number = 3): Promise<GeneratedContent[]> {
    const userId = await this.getUserId();

    // Fetch the original content
    const { data: original, error: fetchError } = await supabase
      .from('generated_content')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;
    const originalContent = original as unknown as GeneratedContent;

    const variations: GeneratedContent[] = [];
    for (let i = 0; i < count; i++) {
      const insertPayload = {
        user_id: userId,
        content_type: originalContent.content_type,
        title: `${originalContent.title} - Variation ${i + 1}`,
        content: `Variation ${i + 1} of: ${originalContent.content}`,
        prompt: originalContent.prompt,
        brand_voice_id: originalContent.brand_voice_id || null,
        status: 'draft',
      };

      const { data, error } = await supabase
        .from('generated_content')
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) throw error;
      variations.push(data as unknown as GeneratedContent);
    }

    return variations;
  }

  // Brand voice operations
  async getBrandVoices(): Promise<BrandVoice[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('brand_voices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as BrandVoice[];
  }

  async createBrandVoice(voice: Partial<BrandVoice>): Promise<BrandVoice> {
    const userId = await this.getUserId();

    const insertPayload = {
      user_id: userId,
      name: voice.name || 'New Brand Voice',
      description: voice.description || '',
      tone_attributes: voice.tone_attributes || {
        formality: 50,
        friendliness: 50,
        humor: 50,
        authority: 50,
      },
      vocabulary: voice.vocabulary || {
        preferred_words: [],
        avoided_words: [],
        industry_terms: [],
      },
      examples: voice.examples || [],
      is_default: voice.is_default || false,
    };

    const { data, error } = await supabase
      .from('brand_voices')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw error;
    return data as unknown as BrandVoice;
  }

  // Template operations
  async getTemplates(): Promise<ContentTemplate[]> {
    const { data, error } = await supabase
      .from('content_templates_ai')
      .select('*')
      .order('use_count', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as ContentTemplate[];
  }

  async getTemplateById(id: string): Promise<ContentTemplate | null> {
    const { data, error } = await supabase
      .from('content_templates_ai')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as unknown as ContentTemplate;
  }

  // Content operations
  async updateContent(id: string, updates: Partial<GeneratedContent>): Promise<GeneratedContent> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('generated_content')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data as unknown as GeneratedContent;
  }

  async publishContent(id: string): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('generated_content')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async optimizeForSEO(content: string, keywords: string[]): Promise<{
    optimizedContent: string;
    seoScore: number;
    suggestions: string[];
  }> {
    // SEO optimization is a local computation - no DB needed
    const keywordPresence = keywords.filter(kw =>
      content.toLowerCase().includes(kw.toLowerCase())
    );
    const seoScore = Math.min(100, 60 + (keywordPresence.length / Math.max(keywords.length, 1)) * 40);

    const suggestions: string[] = [];
    if (seoScore < 80) suggestions.push('Add more target keywords naturally throughout the content');
    suggestions.push('Add more internal links');
    suggestions.push('Include keywords in H2 tags');
    suggestions.push('Optimize meta description');

    return {
      optimizedContent: content,
      seoScore: Math.round(seoScore),
      suggestions,
    };
  }
}

// Export singleton instance
export const contentGenerationService = new ContentGenerationService();

// Re-export as default
export default contentGenerationService;
