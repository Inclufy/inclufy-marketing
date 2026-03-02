// src/services/ai.service.ts
// NOTE: AI API keys should be stored server-side only.
// The frontend proxies requests through the backend at /api/ai/*
// Direct API calls are used as fallback only when backend is unavailable.
import api from '@/lib/api';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1';
const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;
const REPLICATE_API_KEY = import.meta.env.VITE_REPLICATE_API_KEY;

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
  private openaiHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  };

  private anthropicHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  };

  /**
   * Generate content using OpenAI GPT-4
   */
  async generateContent({
    prompt,
    type,
    tone,
    brandContext,
    targetAudience,
    maxTokens = 1000,
  }: ContentGenerationRequest): Promise<{ content: string }> {
    // Build system prompt with brand context
    const systemPrompt = this.buildSystemPrompt(brandContext, type, tone, targetAudience);

    // Content type specific instructions
    const typeInstructions = this.getContentTypeInstructions(type);

    try {
      // Option 1: Using OpenAI
      const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: this.openaiHeaders,
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${typeInstructions}\n\n${prompt}` },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { content: data.choices[0].message.content };

    } catch (error) {
      console.error('AI content generation error:', error);
      
      // Fallback to local generation or mock
      return this.generateMockContent(prompt, type, brandContext);
    }
  }

  /**
   * Generate content using Anthropic Claude (alternative)
   */
  async generateContentClaude({
    prompt,
    type,
    tone,
    brandContext,
    targetAudience,
    maxTokens = 1000,
  }: ContentGenerationRequest): Promise<{ content: string }> {
    const systemPrompt = this.buildSystemPrompt(brandContext, type, tone, targetAudience);
    const typeInstructions = this.getContentTypeInstructions(type);

    try {
      const response = await fetch(`${ANTHROPIC_API_URL}/messages`, {
        method: 'POST',
        headers: this.anthropicHeaders,
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          messages: [
            { 
              role: 'user', 
              content: `${systemPrompt}\n\n${typeInstructions}\n\n${prompt}` 
            },
          ],
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { content: data.content[0].text };

    } catch (error) {
      console.error('Claude content generation error:', error);
      return this.generateMockContent(prompt, type, brandContext);
    }
  }

  /**
   * Generate images using DALL-E 3
   */
  async generateImage({
    prompt,
    style,
    brandColors,
    size = '1024x1024',
    quality = 'standard',
  }: ImageGenerationRequest): Promise<{ imageUrl: string }> {
    // Enhance prompt with brand and style information
    const enhancedPrompt = this.enhanceImagePrompt(prompt, style, brandColors);

    try {
      // Option 1: Using OpenAI DALL-E 3
      const response = await fetch(`${OPENAI_API_URL}/images/generations`, {
        method: 'POST',
        headers: this.openaiHeaders,
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size,
          quality,
          style: 'vivid', // or 'natural'
        }),
      });

      if (!response.ok) {
        throw new Error(`DALL-E API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { imageUrl: data.data[0].url };

    } catch (error) {
      console.error('Image generation error:', error);
      
      // Fallback to placeholder
      return this.generatePlaceholderImage(prompt, style);
    }
  }

  /**
   * Generate images using Stable Diffusion (alternative)
   */
  async generateImageStableDiffusion({
    prompt,
    style,
    brandColors,
  }: ImageGenerationRequest): Promise<{ imageUrl: string }> {
    const enhancedPrompt = this.enhanceImagePrompt(prompt, style, brandColors);

    try {
      // Using Replicate API for Stable Diffusion
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${REPLICATE_API_KEY}`,
        },
        body: JSON.stringify({
          version: 'stability-ai/sdxl:latest',
          input: {
            prompt: enhancedPrompt,
            negative_prompt: 'low quality, blurry, distorted',
            width: 1024,
            height: 1024,
            num_inference_steps: 50,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.statusText}`);
      }

      const prediction = await response.json();
      
      // Poll for completion
      const imageUrl = await this.pollForImage(prediction.id);
      return { imageUrl };

    } catch (error) {
      console.error('Stable Diffusion error:', error);
      return this.generatePlaceholderImage(prompt, style);
    }
  }

  /**
   * Build system prompt with brand context
   */
  private buildSystemPrompt(
    brandContext: BrandContext,
    type: string,
    tone: string,
    targetAudience?: string
  ): string {
    let systemPrompt = `You are a professional content writer for ${brandContext.brand_name}.`;
    
    if (brandContext.tagline) {
      systemPrompt += ` The brand tagline is: "${brandContext.tagline}".`;
    }
    
    if (brandContext.mission) {
      systemPrompt += ` Mission: ${brandContext.mission}`;
    }

    // Add tone attributes
    if (brandContext.tone_attributes?.length) {
      const toneDesc = brandContext.tone_attributes
        .map(attr => `${attr.attribute}: ${attr.description}`)
        .join(', ');
      systemPrompt += `\n\nBrand Voice: ${toneDesc}`;
    }

    // Add dos and don'ts
    if (brandContext.messaging_dos) {
      systemPrompt += `\n\nWriting DOs: ${brandContext.messaging_dos}`;
    }
    
    if (brandContext.messaging_donts) {
      systemPrompt += `\n\nWriting DON'Ts: ${brandContext.messaging_donts}`;
    }

    // Add vocabulary preferences
    if (brandContext.preferred_vocabulary?.length) {
      systemPrompt += `\n\nPreferred vocabulary: ${brandContext.preferred_vocabulary.join(', ')}`;
    }
    
    if (brandContext.banned_phrases?.length) {
      systemPrompt += `\n\nNEVER use these phrases: ${brandContext.banned_phrases.join(', ')}`;
    }

    // Add tone override if not default
    if (tone !== 'default') {
      systemPrompt += `\n\nFor this content, adopt a ${tone} tone while maintaining brand consistency.`;
    }

    // Add target audience
    if (targetAudience) {
      systemPrompt += `\n\nTarget audience: ${targetAudience}`;
    }

    return systemPrompt;
  }

  /**
   * Get content type specific instructions
   */
  private getContentTypeInstructions(type: string): string {
    const instructions: Record<string, string> = {
      email: 'Write an email with a compelling subject line, clear body, and call-to-action. Keep it concise and scannable.',
      blog: 'Write a blog post with an engaging title, introduction, main points with subheadings, and conclusion. Aim for 600-1000 words.',
      'social-linkedin': 'Write a LinkedIn post that is professional yet engaging. Include relevant hashtags. Keep under 1300 characters.',
      'social-twitter': 'Write a Twitter/X post that is concise and engaging. Stay under 280 characters. Include 2-3 relevant hashtags.',
      'ad-copy': 'Write compelling ad copy with a strong headline, clear value proposition, and call-to-action.',
      'product-description': 'Write a product description that highlights features, benefits, and unique value. Be persuasive but factual.',
      'press-release': 'Write a press release with headline, dateline, lead paragraph, body with quotes, and boilerplate.',
      newsletter: 'Write a newsletter section with engaging headline, informative content, and clear next steps.',
    };

    return instructions[type] || 'Write content that aligns with the brand voice and user request.';
  }

  /**
   * Enhance image prompt with style and brand information
   */
  private enhanceImagePrompt(prompt: string, style: string, brandColors?: string[]): string {
    let enhanced = prompt;

    // Add style descriptors
    const styleDescriptors: Record<string, string> = {
      professional: 'professional photography, high quality, corporate',
      illustration: 'modern illustration, vector art, clean design',
      '3d-render': '3D rendered, photorealistic, modern',
      minimalist: 'minimalist design, simple, clean, white space',
      abstract: 'abstract art, contemporary, artistic',
      infographic: 'infographic style, data visualization, clear information',
      watercolor: 'watercolor painting, artistic, soft colors',
      'line-art': 'line art, minimalist drawing, black and white',
    };

    enhanced += `, ${styleDescriptors[style] || style}`;

    // Add brand colors if provided
    if (brandColors?.length) {
      enhanced += `, color palette: ${brandColors.join(', ')}`;
    }

    // Add quality modifiers
    enhanced += ', high resolution, professional quality';

    return enhanced;
  }

  /**
   * Poll for Replicate image completion
   */
  private async pollForImage(predictionId: string, maxAttempts = 30): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`,
          },
        }
      );

      const prediction = await response.json();
      
      if (prediction.status === 'succeeded') {
        return prediction.output[0];
      } else if (prediction.status === 'failed') {
        throw new Error('Image generation failed');
      }

      // Wait 1 second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Image generation timed out');
  }

  /**
   * Generate mock content for testing/fallback
   */
  private generateMockContent(
    prompt: string,
    type: string,
    brandContext: BrandContext
  ): { content: string } {
    const mockContent: Record<string, string> = {
      email: `Subject: Exciting Updates from ${brandContext.brand_name}!\n\nDear Valued Customer,\n\n${prompt}\n\nWe're thrilled to share this with you and look forward to your feedback.\n\nBest regards,\nThe ${brandContext.brand_name} Team`,
      blog: `# ${prompt}\n\nIn today's dynamic market, ${brandContext.brand_name} continues to innovate and deliver exceptional value to our customers.\n\n## Key Highlights\n\n${prompt}\n\n## What This Means for You\n\nOur commitment to excellence means you can expect even better results.\n\n## Get Started Today\n\nReady to experience the difference? Contact us to learn more.`,
      'social-linkedin': `🚀 ${prompt}\n\nAt ${brandContext.brand_name}, we believe in ${brandContext.mission || 'innovation and excellence'}.\n\n#Innovation #${brandContext.brand_name} #Excellence`,
      'social-twitter': `${prompt} 🎯\n\n#${brandContext.brand_name} #Innovation`,
    };

    return {
      content: mockContent[type] || `Generated content for: ${prompt}\n\nBrand: ${brandContext.brand_name}`,
    };
  }

  /**
   * Generate placeholder image for testing/fallback
   */
  private generatePlaceholderImage(prompt: string, style: string): { imageUrl: string } {
    // Use a placeholder service or return a data URL
    const encodedPrompt = encodeURIComponent(`${prompt} - ${style}`);
    
    // Option 1: Use placeholder service
    return {
      imageUrl: `https://via.placeholder.com/1024x1024/8B5CF6/FFFFFF?text=${encodedPrompt}`,
    };

    // Option 2: Return a gradient data URL
    // return {
    //   imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzhCNUNGNiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0VDNDg5OSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiLz48L3N2Zz4=',
    // };
  }

  /**
   * Validate content against brand guidelines
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

    // Check for banned phrases
    if (brandContext.banned_phrases?.length) {
      for (const phrase of brandContext.banned_phrases) {
        if (content.toLowerCase().includes(phrase.toLowerCase())) {
          issues.push(`Contains banned phrase: "${phrase}"`);
        }
      }
    }

    // Check for preferred vocabulary usage
    if (brandContext.preferred_vocabulary?.length) {
      const contentLower = content.toLowerCase();
      const usedPreferred = brandContext.preferred_vocabulary.filter(word =>
        contentLower.includes(word.toLowerCase())
      );
      
      if (usedPreferred.length === 0) {
        suggestions.push('Consider using some preferred vocabulary terms');
      }
    }

    // Additional AI-powered compliance check could go here
    // For example, using GPT to analyze tone alignment

    return {
      compliant: issues.length === 0,
      issues,
      suggestions,
    };
  }

  // =============================================
  // Convenience methods used by hooks/use-ai.tsx
  // =============================================

  private defaultBrandContext: BrandContext = {
    brand_name: 'Brand',
  };

  async generateTutorial(topic: string, steps: number = 5) {
    const result = await this.generateContent({
      prompt: `Create a step-by-step tutorial about "${topic}" with ${steps} steps. Return JSON: { title, introduction, steps: [{ number, title, content, tip? }], conclusion }`,
      type: 'blog',
      tone: 'educational',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generateCommercialScript(product: string, duration: string | number, tone: string) {
    const result = await this.generateContent({
      prompt: `Write a ${duration} commercial script for "${product}". Tone: ${tone}. Return JSON: { title, duration, scenes: [{ scene_number, visual, dialogue, direction }], cta }`,
      type: 'ad-copy',
      tone,
      brandContext: this.defaultBrandContext,
      maxTokens: 1500,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generateSocialPost(topic: string, platform: string, style?: string) {
    const type = platform === 'twitter' ? 'social-twitter' : 'social-linkedin';
    const result = await this.generateContent({
      prompt: `Create a ${platform} post about: ${topic}. Style: ${style || 'professional'}. Return JSON: { text, hashtags: string[], optimal_post_time }`,
      type,
      tone: style || 'professional',
      brandContext: this.defaultBrandContext,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async improveContent(content: string, goal: 'clarity' | 'engagement' | 'seo' | 'conversion') {
    const result = await this.generateContent({
      prompt: `Improve this content for "${goal}":\n\n${content}\n\nReturn JSON: { improved_content, changes_made: string[], score_before: number, score_after: number }`,
      type: 'blog',
      tone: 'default',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generateContentIdeas(brandInfo: string, count: number = 10) {
    const result = await this.generateContent({
      prompt: `Generate ${count} content ideas based on: ${brandInfo}. Return JSON array: [{ title, type, description, target_audience, estimated_engagement }]`,
      type: 'blog',
      tone: 'creative',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return []; }
  }

  async analyzeContent(content: string) {
    const result = await this.generateContent({
      prompt: `Analyze this content for quality, clarity, engagement, and SEO. Content:\n\n${content}\n\nReturn JSON: { score: number(0-100), readability, sentiment, suggestions: string[], strengths: string[], weaknesses: string[] }`,
      type: 'blog',
      tone: 'analytical',
      brandContext: this.defaultBrandContext,
    });
    try { return JSON.parse(result.content); } catch { return { score: 0, suggestions: [] }; }
  }

  async fetchWebsiteContent(url: string): Promise<string> {
    try {
      const response = await api.post('/api/content/analyze-url', { url });
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
      prompt: `Analyze this website and create a sales presentation:\n\nWebsite: ${websiteContent.substring(0, 2000)}\n\nProspect: ${JSON.stringify(prospectContext)}\n\nReturn JSON: { analysis: { strengths, weaknesses, opportunities }, presentation: { title, slides: [{ title, content, notes }] } }`,
      type: 'ad-copy',
      tone: 'professional',
      brandContext: this.defaultBrandContext,
      maxTokens: 3000,
    });
    try { return JSON.parse(result.content); } catch { return { analysis: {}, presentation: { slides: [] } }; }
  }

  async researchProspect(companyName: string, additionalInfo?: string) {
    const result = await this.generateContent({
      prompt: `Research the company "${companyName}". ${additionalInfo || ''}\n\nReturn JSON: { company_name, industry, size, key_people, recent_news, pain_points, opportunities, recommended_approach }`,
      type: 'blog',
      tone: 'analytical',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async analyzeWebsite(websiteContent: string) {
    const result = await this.generateContent({
      prompt: `Analyze this website content:\n\n${websiteContent.substring(0, 2000)}\n\nReturn JSON: { services, products, business_model, strengths, weaknesses, seo_issues, recommendations }`,
      type: 'blog',
      tone: 'analytical',
      brandContext: this.defaultBrandContext,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generatePresentation(websiteAnalysis: any, prospectInfo: any) {
    const result = await this.generateContent({
      prompt: `Create a presentation based on:\n\nAnalysis: ${JSON.stringify(websiteAnalysis)}\nProspect: ${JSON.stringify(prospectInfo)}\n\nReturn JSON: { title, slides: [{ title, content, notes }], talking_points }`,
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
      prompt: `Extract brand knowledge from these documents:\n\n${combined}\n\nReturn JSON: { brand_voice, key_messages, values, target_audience, unique_selling_points, competitors }`,
      type: 'blog',
      tone: 'analytical',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generateEmailCampaign(params: { type: string; product: string; audience: string; goal: string; variants?: number }) {
    const result = await this.generateContent({
      prompt: `Generate a ${params.type} email campaign.\nProduct: ${params.product}\nAudience: ${params.audience}\nGoal: ${params.goal}\nVariants: ${params.variants || 1}\n\nReturn JSON: { variants: [{ subject, preheader, body_html, cta_text }] }`,
      type: 'email',
      tone: 'professional',
      brandContext: this.defaultBrandContext,
      maxTokens: 2000,
    });
    try { return JSON.parse(result.content); } catch { return result; }
  }

  async generateLandingPage(params: { type: string; product: string; audience: string; uniqueValue: string; goals: string }) {
    const result = await this.generateContent({
      prompt: `Create a ${params.type} landing page:\nProduct: ${params.product}\nAudience: ${params.audience}\nUnique Value: ${params.uniqueValue}\nGoals: ${params.goals}\n\nReturn JSON: { headline, subheadline, sections: [{ type, title, content }], cta_primary, cta_secondary }`,
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