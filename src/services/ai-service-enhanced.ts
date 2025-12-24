// Enhanced AI Service for Inclufy Marketing
// Supports Phase 1 (Foundation) and Phase 2 (Core Monetization)

type AIProvider = 'openai' | 'anthropic';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export class AIService {
  private config: AIConfig;

  constructor() {
    // Determine which provider to use based on available API keys
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (openaiKey) {
      this.config = {
        provider: 'openai',
        apiKey: openaiKey,
        model: 'gpt-4-turbo-preview'
      };
    } else if (anthropicKey) {
      this.config = {
        provider: 'anthropic',
        apiKey: anthropicKey,
        model: 'claude-3-opus-20240229'
      };
    } else {
      throw new Error('No AI API key found. Please set VITE_OPENAI_API_KEY or VITE_ANTHROPIC_API_KEY');
    }
  }

  // ==========================================
  // PHASE 1 - Foundation & Differentiation
  // ==========================================

  // Brand Memory & RAG (Priority 1)
  async processBrandKnowledge(documents: Array<{ type: string; content: string }>) {
    const prompt = `Analyze and extract brand knowledge from the following documents:
    
    ${documents.map(doc => `[${doc.type}]\n${doc.content}`).join('\n\n')}
    
    Extract and structure:
    1. Brand voice and tone characteristics
    2. Unique selling propositions
    3. Target audience insights
    4. Key messaging themes
    5. Brand values and mission
    
    Return as structured JSON.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  // Website Analyzer (Priority 2)
  async analyzeWebsite(websiteContent: string) {
    const prompt = `Analyze this website content and extract strategic insights:
    
    ${websiteContent}
    
    Provide:
    1. Product features (list all key capabilities)
    2. Unique selling points (what makes them different)
    3. Target audience (who they serve)
    4. Competitors (identify from content/context)
    5. Pricing signals (if any)
    6. Messaging (headline, subheadline, value props)
    7. Opportunities (gaps or improvements)
    
    Return as structured JSON.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  // Sales Presentation Generator (Priority 3)
  async generatePresentation(websiteAnalysis: any, prospectInfo: any) {
    const prompt = `Create a sales presentation based on:
    
    Website Analysis: ${JSON.stringify(websiteAnalysis)}
    Prospect: ${JSON.stringify(prospectInfo)}
    
    Generate 8-10 slides:
    1. Title slide
    2. Executive summary
    3. Problem identification
    4. Our solution
    5. Key features & benefits
    6. ROI/Value proposition
    7. Social proof/Case studies
    8. Pricing options
    9. Next steps
    10. Contact
    
    For each slide include:
    - Title
    - Main content points
    - Speaker notes
    - Visual suggestions
    
    Personalize for the prospect's industry and pain points.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  // ==========================================
  // PHASE 2 - Core Monetization
  // ==========================================

  // Email Campaign Generator (Priority 4)
  async generateEmailCampaign(params: {
    type: string;
    product: string;
    audience: string;
    goal: string;
    variants?: number;
  }) {
    const prompt = `Create an email campaign:
    Type: ${params.type}
    Product: ${params.product}
    Audience: ${params.audience}
    Goal: ${params.goal}
    
    Generate ${params.variants || 1} variant(s) with:
    - Subject line (max 50 chars, compelling)
    - Preheader text (complements subject)
    - Email body (conversational, benefit-focused)
    - CTA button text (action-oriented)
    - Tone (professional/casual/urgent)
    
    ${params.variants > 1 ? 'Create distinctly different approaches for A/B testing.' : ''}
    
    Focus on conversion and maintain brand voice.`;

    const response = await this.callAI(prompt);
    const result = this.parseJSONResponse(response);
    
    // Format for A/B testing
    if (params.variants > 1 && Array.isArray(result)) {
      return {
        variants: result.map((variant, index) => ({
          id: `variant-${index}`,
          name: `Variant ${String.fromCharCode(65 + index)}`,
          ...variant
        }))
      };
    }
    
    return result;
  }

  // Landing Page Copy Generator (Priority 4)
  async generateLandingPage(params: {
    type: string;
    product: string;
    audience: string;
    uniqueValue: string;
    goals: string;
  }) {
    const prompt = `Create landing page copy:
    Type: ${params.type}
    Product: ${params.product}
    Audience: ${params.audience}
    Unique Value: ${params.uniqueValue}
    Goals: ${params.goals}
    
    Generate all sections:
    
    1. HERO:
       - Headline (clear value prop)
       - Subheadline (expand on benefit)
       - CTA button text
    
    2. BENEFITS (3-4):
       - Title
       - Description (outcome-focused)
    
    3. FEATURES (4-6):
       - Name
       - Description (how it helps)
    
    4. SOCIAL PROOF:
       - 2 testimonials (quote + author)
       - 3 impressive stats
    
    5. FINAL CTA:
       - Headline
       - Description
       - Button text
    
    Optimize for conversion. Be specific and compelling.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  // Content Analyzer & Improver (Priority 5)
  async analyzeContent(content: string) {
    const prompt = `Analyze this marketing content:
    
    ${content}
    
    Provide:
    1. Overall score (1-10)
    2. Strengths (top 3)
    3. Weaknesses (top 3)
    4. Improvement suggestions (specific)
    5. Sentiment analysis
    6. Readability score
    7. Conversion elements present
    8. Missing elements
    
    Be specific and actionable.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  async improveContent(content: string, goal: 'clarity' | 'engagement' | 'conversion' | 'seo') {
    const improvements = {
      clarity: 'simpler language, clearer structure, better flow',
      engagement: 'more compelling hooks, storytelling, emotional appeal',
      conversion: 'stronger CTAs, urgency, value propositions, trust signals',
      seo: 'keyword optimization, meta descriptions, headers, internal linking'
    };

    const prompt = `Improve this content for ${goal}:
    
    Original: ${content}
    
    Focus on: ${improvements[goal]}
    
    Provide:
    1. Improved version (same format/structure)
    2. Key changes made
    3. Expected impact
    
    Maintain brand voice while optimizing for ${goal}.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  // ==========================================
  // Existing Methods (Phase 1 implemented)
  // ==========================================

  async generateTutorial(topic: string, steps?: number) {
    const prompt = `Create a tutorial about "${topic}" with ${steps || 5} detailed steps.
    
    For each step provide:
    - Title (clear and actionable)
    - Content (detailed explanation, 2-3 paragraphs)
    
    Make it practical and easy to follow.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  async generateCommercialScript(product: string, duration: number, tone: string) {
    const prompt = `Create a ${duration}-second commercial script for "${product}".
    Tone: ${tone}
    
    Include:
    - Hook (attention grabber)
    - Problem/Solution
    - Benefits
    - Call to action
    
    Format for voice-over with timing notes.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  async generateSocialPost(topic: string, platform: string, style?: string) {
    const platformLimits = {
      twitter: 280,
      linkedin: 3000,
      instagram: 2200,
      facebook: 63206
    };

    const prompt = `Create a ${platform} post about "${topic}".
    ${style ? `Style: ${style}` : ''}
    Character limit: ${platformLimits[platform] || 'standard'}
    
    Include:
    - Engaging opener
    - Value-driven content
    - Relevant hashtags (3-5)
    - Clear CTA
    
    Optimize for ${platform} best practices.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  async generateContentIdeas(brandInfo: string, count: number = 5) {
    const prompt = `Generate ${count} content ideas based on:
    ${brandInfo}
    
    For each idea provide:
    - Title
    - Format (blog, video, infographic, etc.)
    - Target audience
    - Key message
    - Expected outcome
    
    Mix educational, promotional, and engaging content.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  async researchProspect(companyName: string, additionalInfo?: string) {
    const prompt = `Research and provide insights about ${companyName}:
    ${additionalInfo || ''}
    
    Provide:
    - Industry and market position
    - Likely pain points
    - Growth opportunities
    - Decision makers
    - Budget indicators
    - Best approach strategy
    
    Base on typical patterns for similar companies.`;

    const response = await this.callAI(prompt);
    return this.parseJSONResponse(response);
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  private async callAI(prompt: string): Promise<string> {
    if (this.config.provider === 'openai') {
      return this.callOpenAI(prompt);
    } else {
      return this.callAnthropic(prompt);
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert marketing AI assistant. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: `You are an expert marketing AI assistant. Always return valid JSON.\n\n${prompt}`
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private parseJSONResponse(response: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, try to parse the entire response
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      
      // Return structured fallback
      return {
        error: 'Failed to parse response',
        rawResponse: response
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();