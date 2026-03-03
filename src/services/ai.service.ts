// src/services/ai.service.ts
// All AI requests are proxied through the backend at /api/content/*
// No API keys are stored or used in the frontend.
import api from '@/lib/api';

interface BrandContext {
  brand_name: string;
  tagline?: string;
  mission?: string;
  tone_attributes?: Array<{ attribute: string; description: string }>;
  messaging_dos?: string;
  messaging_donts?: string;
  preferred_vocabulary?: string[];
  banned_phrases?: string[];
}

interface ContentGenerationRequest {
  prompt: string;
  type: string;
  tone: string;
  brandContext: BrandContext;
  targetAudience?: string;
  maxTokens?: number;
}

interface ImageGenerationRequest {
  prompt: string;
  style: string;
  brandColors?: string[];
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
}

class AIService {
  /**
   * Generate content via backend proxy (OpenAI/Anthropic)
   */
  async generateContent({
    prompt,
    type,
    tone,
    brandContext,
    targetAudience,
    maxTokens = 1000,
  }: ContentGenerationRequest): Promise<{ content: string }> {
    try {
      const response = await api.post('/content/email', {
        type: type === 'email' ? 'promotional' : type,
        product: brandContext.brand_name,
        audience: targetAudience || 'general',
        goal: tone || 'engagement',
        variants: 1,
      });

      // Backend returns { variants: [...] }
      const variants = response.data?.variants;
      if (variants && variants.length > 0) {
        const v = variants[0];
        return { content: v.body_html || v.body || JSON.stringify(v) };
      }

      return { content: response.data?.content || JSON.stringify(response.data) };
    } catch (error) {
      console.error('AI content generation error:', error);
      return this.generateMockContent(prompt, type, brandContext);
    }
  }

  /**
   * Generate content using Anthropic Claude via backend
   */
  async generateContentClaude(request: ContentGenerationRequest): Promise<{ content: string }> {
    // Routes through the same backend endpoint
    return this.generateContent(request);
  }

  /**
   * Generate images - placeholder until backend image endpoint is added
   */
  async generateImage({
    prompt,
    style,
    brandColors,
    size = '1024x1024',
    quality = 'standard',
  }: ImageGenerationRequest): Promise<{ imageUrl: string }> {
    // TODO: Add /api/content/image endpoint to backend
    return this.generatePlaceholderImage(prompt, style);
  }

  /**
   * Generate images using Stable Diffusion - placeholder
   */
  async generateImageStableDiffusion(request: ImageGenerationRequest): Promise<{ imageUrl: string }> {
    return this.generatePlaceholderImage(request.prompt, request.style);
  }

  /**
   * Generate mock content for fallback
   */
  private generateMockContent(
    prompt: string,
    type: string,
    brandContext: BrandContext
  ): { content: string } {
    const mockContent: Record<string, string> = {
      email: `Subject: Exciting Updates from ${brandContext.brand_name}!\n\nDear Valued Customer,\n\n${prompt}\n\nWe're thrilled to share this with you and look forward to your feedback.\n\nBest regards,\nThe ${brandContext.brand_name} Team`,
      blog: `# ${prompt}\n\nIn today's dynamic market, ${brandContext.brand_name} continues to innovate.\n\n## Key Highlights\n\n${prompt}\n\n## Get Started Today\n\nReady to experience the difference? Contact us to learn more.`,
      'social-linkedin': `${prompt}\n\nAt ${brandContext.brand_name}, we believe in ${brandContext.mission || 'innovation and excellence'}.\n\n#Innovation #${brandContext.brand_name}`,
      'social-twitter': `${prompt}\n\n#${brandContext.brand_name} #Innovation`,
    };

    return {
      content: mockContent[type] || `Generated content for: ${prompt}\n\nBrand: ${brandContext.brand_name}`,
    };
  }

  /**
   * Generate placeholder image
   */
  private generatePlaceholderImage(prompt: string, style: string): { imageUrl: string } {
    const encodedPrompt = encodeURIComponent(`${prompt} - ${style}`);
    return {
      imageUrl: `https://via.placeholder.com/1024x1024/8B5CF6/FFFFFF?text=${encodedPrompt}`,
    };
  }

  /**
   * Validate content against brand guidelines (local check)
   */
  async validateBrandCompliance(
    content: string,
    brandContext: BrandContext
  ): Promise<{
    compliant: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (brandContext.banned_phrases?.length) {
      for (const phrase of brandContext.banned_phrases) {
        if (content.toLowerCase().includes(phrase.toLowerCase())) {
          issues.push(`Contains banned phrase: "${phrase}"`);
        }
      }
    }

    if (brandContext.preferred_vocabulary?.length) {
      const contentLower = content.toLowerCase();
      const usedPreferred = brandContext.preferred_vocabulary.filter(word =>
        contentLower.includes(word.toLowerCase())
      );
      if (usedPreferred.length === 0) {
        suggestions.push('Consider using some preferred vocabulary terms');
      }
    }

    return { compliant: issues.length === 0, issues, suggestions };
  }

  // =============================================
  // Convenience methods used by hooks/use-ai.tsx
  // =============================================

  private defaultBrandContext: BrandContext = {
    brand_name: 'Brand',
  };

  async generateTutorial(topic: string, steps: number = 5) {
    const result = await this.generateContent({
      prompt: `Create a step-by-step tutorial about "${topic}" with ${steps} steps.`,
      type: 'blog',
      tone: 'educational',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generateCommercialScript(product: string, duration: string | number, tone: string) {
    const result = await this.generateContent({
      prompt: `Write a ${duration} commercial script for "${product}". Tone: ${tone}.`,
      type: 'ad-copy',
      tone,
      brandContext: this.defaultBrandContext,
      maxTokens: 1500,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generateSocialPost(topic: string, platform: string, style?: string) {
    try {
      const response = await api.post('/content/social', {
        platform,
        topic,
        tone: style || 'professional',
        count: 1,
      });
      return response.data;
    } catch {
      const type = platform === 'twitter' ? 'social-twitter' : 'social-linkedin';
      const result = await this.generateContent({
        prompt: `Create a ${platform} post about: ${topic}`,
        type,
        tone: style || 'professional',
        brandContext: this.defaultBrandContext,
      });
      try { return JSON.parse(result.content); } catch { return result; }
    }
  }

  async improveContent(content: string, goal: 'clarity' | 'engagement' | 'seo' | 'conversion') {
    try {
      const response = await api.post('/content/improve', {
        content,
        goal,
      });
      return response.data;
    } catch {
      return { improved_content: content, changes_made: [], score_before: 50, score_after: 50 };
    }
  }

  async generateContentIdeas(brandInfo: string, count: number = 10) {
    const result = await this.generateContent({
      prompt: `Generate ${count} content ideas based on: ${brandInfo}`,
      type: 'blog',
      tone: 'creative',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return []; }
  }

  async analyzeContent(content: string) {
    const result = await this.generateContent({
      prompt: `Analyze this content for quality: ${content}`,
      type: 'blog',
      tone: 'analytical',
      brandContext: this.defaultBrandContext,
    });
    try { return JSON.parse(result.content); } catch { return { score: 0, suggestions: [] }; }
  }

  async fetchWebsiteContent(url: string): Promise<string> {
    try {
      const response = await api.post('/content/analyze-url', { url });
      return response.data?.content || '';
    } catch {
      return `Website content for ${url} (fetch unavailable)`;
    }
  }

  async analyzeWebsiteAndGeneratePresentation(
    websiteContent: string,
    prospectContext: { companyName: string; industry: string; painPoints?: string[]; goals?: string[]; contactPerson?: string; budget?: string }
  ) {
    const result = await this.generateContent({
      prompt: `Analyze this website and create a sales presentation:\n\nWebsite: ${websiteContent.substring(0, 2000)}\n\nProspect: ${JSON.stringify(prospectContext)}`,
      type: 'ad-copy',
      tone: 'professional',
      brandContext: this.defaultBrandContext,
      maxTokens: 3000,
    });
    try { return JSON.parse(result.content); } catch { return { analysis: {}, presentation: { slides: [] } }; }
  }

  async researchProspect(companyName: string, additionalInfo?: string) {
    const result = await this.generateContent({
      prompt: `Research the company "${companyName}". ${additionalInfo || ''}`,
      type: 'blog',
      tone: 'analytical',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async analyzeWebsite(websiteContent: string) {
    const result = await this.generateContent({
      prompt: `Analyze this website content:\n\n${websiteContent.substring(0, 2000)}`,
      type: 'blog',
      tone: 'analytical',
      brandContext: this.defaultBrandContext,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generatePresentation(websiteAnalysis: any, prospectInfo: any) {
    const result = await this.generateContent({
      prompt: `Create a presentation based on:\n\nAnalysis: ${JSON.stringify(websiteAnalysis)}\nProspect: ${JSON.stringify(prospectInfo)}`,
      type: 'ad-copy',
      tone: 'professional',
      brandContext: this.defaultBrandContext,
      maxTokens: 3000,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async processBrandKnowledge(documents: Array<{ type: string; content: string }>) {
    const combined = documents.map(d => `[${d.type}]: ${d.content.substring(0, 500)}`).join('\n\n');
    const result = await this.generateContent({
      prompt: `Extract brand knowledge from these documents:\n\n${combined}`,
      type: 'blog',
      tone: 'analytical',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generateEmailCampaign(params: { type: string; product: string; audience: string; goal: string; variants?: number }) {
    try {
      const response = await api.post('/content/email', {
        type: params.type,
        product: params.product,
        audience: params.audience,
        goal: params.goal,
        variants: params.variants || 1,
      });
      return response.data;
    } catch {
      return this.generateMockContent(
        `${params.type} email for ${params.product}`,
        'email',
        this.defaultBrandContext
      );
    }
  }

  async generateLandingPage(params: { type: string; product: string; audience: string; uniqueValue: string; goals: string }) {
    const result = await this.generateContent({
      prompt: `Create a ${params.type} landing page:\nProduct: ${params.product}\nAudience: ${params.audience}\nUnique Value: ${params.uniqueValue}\nGoals: ${params.goals}`,
      type: 'ad-copy',
      tone: 'persuasive',
      brandContext: this.defaultBrandContext,
      maxTokens: 2500,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }
}

export function getAIService(_provider?: string) {
  return aiService;
}
export const aiService = new AIService();
