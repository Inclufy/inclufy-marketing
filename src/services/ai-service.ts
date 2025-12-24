// AI Service for Content Generation
// Supports OpenAI and Anthropic APIs

interface AIProvider {
  generateContent(prompt: string, options?: any): Promise<string>;
}

class OpenAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, options?: any): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful marketing content creator. Create engaging, professional content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

class AnthropicProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, options?: any): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: options?.model || 'claude-3-opus-20240229',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options?.maxTokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }
}

// Main AI Service
export class AIService {
  private provider: AIProvider;

  constructor(providerType: 'openai' | 'anthropic' = 'openai') {
    const apiKey = providerType === 'openai' 
      ? import.meta.env.VITE_OPENAI_API_KEY 
      : import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(`${providerType} API key not found in environment variables`);
    }

    this.provider = providerType === 'openai' 
      ? new OpenAIProvider(apiKey)
      : new AnthropicProvider(apiKey);
  }

  // Generate tutorial content
  async generateTutorial(topic: string, steps: number = 5): Promise<{
    title: string;
    description: string;
    steps: Array<{ title: string; content: string }>;
  }> {
    const prompt = `Create a tutorial about "${topic}" with ${steps} clear steps.
    
    Format the response as JSON with this structure:
    {
      "title": "Tutorial title",
      "description": "Brief description (2-3 sentences)",
      "steps": [
        {"title": "Step 1 title", "content": "Step 1 detailed content"},
        ...
      ]
    }`;

    const response = await this.provider.generateContent(prompt);
    return JSON.parse(response);
  }

  // Generate commercial script
  async generateCommercialScript(product: string, duration: '30s' | '60s' | '90s', tone: string): Promise<{
    title: string;
    hook: string;
    script: string;
    callToAction: string;
  }> {
    const prompt = `Create a ${duration} commercial script for "${product}" with a ${tone} tone.
    
    Format as JSON:
    {
      "title": "Commercial title",
      "hook": "Opening hook (5-10 words)",
      "script": "Main script content",
      "callToAction": "Strong CTA"
    }`;

    const response = await this.provider.generateContent(prompt);
    return JSON.parse(response);
  }

  // Generate social media posts
  async generateSocialPost(topic: string, platform: 'twitter' | 'linkedin' | 'instagram', style: string): Promise<{
    content: string;
    hashtags: string[];
    imagePrompt?: string;
  }> {
    const platformLimits = {
      twitter: 280,
      linkedin: 3000,
      instagram: 2200
    };

    const prompt = `Create a ${platform} post about "${topic}" in a ${style} style.
    Character limit: ${platformLimits[platform]}.
    
    Format as JSON:
    {
      "content": "Post content",
      "hashtags": ["tag1", "tag2"],
      "imagePrompt": "Description for image generation (if needed)"
    }`;

    const response = await this.provider.generateContent(prompt);
    return JSON.parse(response);
  }

  // Improve existing content
  async improveContent(content: string, goal: 'clarity' | 'engagement' | 'seo' | 'conversion'): Promise<string> {
    const prompts = {
      clarity: 'Make this content clearer and easier to understand:',
      engagement: 'Make this content more engaging and compelling:',
      seo: 'Optimize this content for search engines while maintaining readability:',
      conversion: 'Optimize this content to drive more conversions:'
    };

    const fullPrompt = `${prompts[goal]}

${content}

Return only the improved content.`;

    return await this.provider.generateContent(fullPrompt);
  }

  // Generate content ideas
  async generateContentIdeas(brandInfo: string, count: number = 5): Promise<string[]> {
    const prompt = `Based on this brand: "${brandInfo}", generate ${count} creative content ideas for marketing.
    
    Return as JSON array of strings: ["idea1", "idea2", ...]`;

    const response = await this.provider.generateContent(prompt);
    return JSON.parse(response);
  }

  // Analyze competitor content
  async analyzeContent(content: string): Promise<{
    strengths: string[];
    improvements: string[];
    score: number;
  }> {
    const prompt = `Analyze this marketing content and provide feedback:

${content}

Format as JSON:
{
  "strengths": ["strength1", "strength2"],
  "improvements": ["suggestion1", "suggestion2"],
  "score": 85
}`;

    const response = await this.provider.generateContent(prompt);
    return JSON.parse(response);
  }

  // Analyze website and generate presentation
  async analyzeWebsiteAndGeneratePresentation(
    websiteContent: string,
    prospectContext: {
      companyName: string;
      industry: string;
      painPoints?: string[];
      goals?: string[];
      contactPerson?: string;
      budget?: string;
    }
  ): Promise<{
    analysis: {
      productFeatures: string[];
      uniqueSellingPoints: string[];
      targetAudience: string;
      competitors: string[];
      pricing?: string;
    };
    presentation: {
      title: string;
      slides: Array<{
        title: string;
        content: string[];
        speakerNotes: string;
        visualSuggestion?: string;
      }>;
      executiveSummary: string;
    };
    personalizedRecommendations: string[];
  }> {
    const prompt = `Analyze this website content and create a personalized sales presentation.

WEBSITE CONTENT:
${websiteContent}

PROSPECT CONTEXT:
Company: ${prospectContext.companyName}
Industry: ${prospectContext.industry}
Pain Points: ${prospectContext.painPoints?.join(', ') || 'Not specified'}
Goals: ${prospectContext.goals?.join(', ') || 'Not specified'}
Contact: ${prospectContext.contactPerson || 'Not specified'}
Budget: ${prospectContext.budget || 'Not specified'}

Create a comprehensive response in JSON format with:
1. Website analysis extracting key product features and USPs
2. A presentation with 8-10 slides tailored to this prospect
3. Personalized recommendations based on their pain points

Format as JSON:
{
  "analysis": {
    "productFeatures": ["feature1", "feature2"],
    "uniqueSellingPoints": ["USP1", "USP2"],
    "targetAudience": "Description of target audience",
    "competitors": ["competitor1", "competitor2"],
    "pricing": "Pricing information if available"
  },
  "presentation": {
    "title": "Presentation title customized for prospect",
    "slides": [
      {
        "title": "Slide title",
        "content": ["Bullet point 1", "Bullet point 2"],
        "speakerNotes": "What to say during this slide",
        "visualSuggestion": "Suggested visual or diagram"
      }
    ],
    "executiveSummary": "One paragraph executive summary"
  },
  "personalizedRecommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const response = await this.provider.generateContent(prompt, { maxTokens: 2000 });
    return JSON.parse(response);
  }

  // Extract website content (simplified - in production you'd use a web scraping service)
  async fetchWebsiteContent(url: string): Promise<string> {
    try {
      // In a real implementation, you would:
      // 1. Use a web scraping service like Puppeteer or Playwright
      // 2. Or use an API service like ScrapingBee or Bright Data
      // 3. Extract and clean the content properly
      
      // For now, return a placeholder that explains what should be done
      return `[Website content from ${url} would be extracted here. In production, implement web scraping to get:
        - Homepage content
        - Product/service descriptions
        - About page
        - Pricing information
        - Key features and benefits
        - Customer testimonials
        - Contact information]`;
    } catch (error) {
      throw new Error(`Failed to fetch website content: ${error}`);
    }
  }

  // Generate prospect research
  async researchProspect(companyName: string, additionalInfo?: string): Promise<{
    industry: string;
    estimatedSize: string;
    likelyPainPoints: string[];
    opportunities: string[];
  }> {
    const prompt = `Research this company and provide insights for a sales presentation:

Company: ${companyName}
Additional Info: ${additionalInfo || 'None provided'}

Provide insights that would help create a tailored presentation.

Format as JSON:
{
  "industry": "Industry classification",
  "estimatedSize": "Company size estimate",
  "likelyPainPoints": ["Pain point 1", "Pain point 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"]
}`;

    const response = await this.provider.generateContent(prompt);
    return JSON.parse(response);
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export const getAIService = (provider?: 'openai' | 'anthropic'): AIService => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService(provider);
  }
  return aiServiceInstance;
};
