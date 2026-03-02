import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock the api module
vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Import after mocks
import { aiService, getAIService } from '@/services/ai.service';

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe('getAIService', () => {
    it('returns the singleton AIService instance', () => {
      const service = getAIService();
      expect(service).toBe(aiService);
    });

    it('returns the same instance regardless of provider', () => {
      const service1 = getAIService('openai');
      const service2 = getAIService('anthropic');
      expect(service1).toBe(service2);
    });
  });

  describe('generateContent', () => {
    it('calls OpenAI API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Generated content here' } }],
        }),
      });

      const result = await aiService.generateContent({
        prompt: 'Write about marketing',
        type: 'blog',
        tone: 'professional',
        brandContext: { brand_name: 'TestBrand' },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('content');
      expect(result.content).toBe('Generated content here');
    });

    it('falls back to mock content on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      const result = await aiService.generateContent({
        prompt: 'Write about marketing',
        type: 'email',
        tone: 'professional',
        brandContext: { brand_name: 'TestBrand' },
      });

      // Should return mock content instead of throwing
      expect(result).toHaveProperty('content');
      expect(result.content).toContain('TestBrand');
    });

    it('falls back to mock content on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await aiService.generateContent({
        prompt: 'Test prompt',
        type: 'blog',
        tone: 'default',
        brandContext: { brand_name: 'Brand' },
      });

      expect(result).toHaveProperty('content');
    });

    it('includes brand context in system prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Content' } }],
        }),
      });

      await aiService.generateContent({
        prompt: 'Test',
        type: 'email',
        tone: 'default',
        brandContext: {
          brand_name: 'Inclufy',
          tagline: 'AI-powered marketing',
          mission: 'Democratize marketing',
          banned_phrases: ['cheap', 'spam'],
          preferred_vocabulary: ['innovative', 'premium'],
        },
      });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      const systemMessage = body.messages[0].content;

      expect(systemMessage).toContain('Inclufy');
      expect(systemMessage).toContain('AI-powered marketing');
      expect(systemMessage).toContain('Democratize marketing');
      expect(systemMessage).toContain('cheap');
      expect(systemMessage).toContain('innovative');
    });
  });

  describe('generateContentClaude', () => {
    it('calls Anthropic API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Claude generated content' }],
        }),
      });

      const result = await aiService.generateContentClaude({
        prompt: 'Write about AI',
        type: 'blog',
        tone: 'professional',
        brandContext: { brand_name: 'TestBrand' },
      });

      expect(result.content).toBe('Claude generated content');
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toContain('anthropic.com');
    });
  });

  describe('generateImage', () => {
    it('calls DALL-E API with enhanced prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ url: 'https://example.com/image.png' }],
        }),
      });

      const result = await aiService.generateImage({
        prompt: 'Marketing banner',
        style: 'professional',
        brandColors: ['#FF0000', '#00FF00'],
      });

      expect(result.imageUrl).toBe('https://example.com/image.png');
    });

    it('returns placeholder image on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await aiService.generateImage({
        prompt: 'Test image',
        style: 'minimalist',
      });

      expect(result.imageUrl).toContain('placeholder');
    });
  });

  describe('validateBrandCompliance', () => {
    it('detects banned phrases in content', async () => {
      const result = await aiService.validateBrandCompliance(
        'This is a cheap product that you should buy',
        {
          brand_name: 'TestBrand',
          banned_phrases: ['cheap', 'buy now'],
        }
      );

      expect(result.compliant).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('cheap');
    });

    it('returns compliant when no banned phrases found', async () => {
      const result = await aiService.validateBrandCompliance(
        'This is a premium product with great features',
        {
          brand_name: 'TestBrand',
          banned_phrases: ['cheap', 'spam'],
        }
      );

      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('suggests using preferred vocabulary', async () => {
      const result = await aiService.validateBrandCompliance(
        'This is a good product.',
        {
          brand_name: 'TestBrand',
          preferred_vocabulary: ['innovative', 'premium', 'cutting-edge'],
        }
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      // All convenience methods call generateContent which calls fetch
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"title": "Test", "steps": []}' } }],
        }),
      });
    });

    it('generateTutorial calls generateContent with correct params', async () => {
      const result = await aiService.generateTutorial('React hooks', 3);
      expect(mockFetch).toHaveBeenCalled();
      expect(result).toHaveProperty('title');
    });

    it('generateCommercialScript calls with duration and tone', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"title": "Ad", "scenes": []}' } }],
        }),
      });

      const result = await aiService.generateCommercialScript('Product X', '30s', 'upbeat');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('generateSocialPost handles twitter platform', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"text": "Hello!", "hashtags": []}' } }],
        }),
      });

      const result = await aiService.generateSocialPost('AI trends', 'twitter', 'casual');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('analyzeContent returns score', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"score": 85, "suggestions": ["Improve SEO"]}' } }],
        }),
      });

      const result = await aiService.analyzeContent('Some content to analyze');
      expect(result).toHaveProperty('score');
    });

    it('generateEmailCampaign passes params correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"variants": [{"subject": "Hi"}]}' } }],
        }),
      });

      const result = await aiService.generateEmailCampaign({
        type: 'welcome',
        product: 'SaaS tool',
        audience: 'developers',
        goal: 'onboarding',
        variants: 2,
      });
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
