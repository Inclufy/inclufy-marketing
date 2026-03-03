import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module (ai.service now proxies through backend)
const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    post: (...args: any[]) => mockPost(...args),
    get: (...args: any[]) => mockGet(...args),
  },
}));

// Import after mocks
import { aiService, getAIService } from '@/services/ai.service';

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    it('calls backend API and returns content', async () => {
      mockPost.mockResolvedValueOnce({
        data: { variants: [{ body_html: 'Generated content here' }] },
      });

      const result = await aiService.generateContent({
        prompt: 'Write about marketing',
        type: 'email',
        tone: 'professional',
        brandContext: { brand_name: 'TestBrand' },
      });

      expect(mockPost).toHaveBeenCalledWith('/content/email', expect.objectContaining({
        product: 'TestBrand',
      }));
      expect(result).toHaveProperty('content');
      expect(result.content).toBe('Generated content here');
    });

    it('falls back to mock content on API error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Backend unavailable'));

      const result = await aiService.generateContent({
        prompt: 'Write about marketing',
        type: 'email',
        tone: 'professional',
        brandContext: { brand_name: 'TestBrand' },
      });

      expect(result).toHaveProperty('content');
      expect(result.content).toContain('TestBrand');
    });

    it('falls back to mock content on network error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));

      const result = await aiService.generateContent({
        prompt: 'Test prompt',
        type: 'blog',
        tone: 'default',
        brandContext: { brand_name: 'Brand' },
      });

      expect(result).toHaveProperty('content');
    });
  });

  describe('generateContentClaude', () => {
    it('delegates to generateContent (same backend)', async () => {
      mockPost.mockResolvedValueOnce({
        data: { variants: [{ body_html: 'Claude generated content' }] },
      });

      const result = await aiService.generateContentClaude({
        prompt: 'Write about AI',
        type: 'blog',
        tone: 'professional',
        brandContext: { brand_name: 'TestBrand' },
      });

      expect(result.content).toBe('Claude generated content');
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateImage', () => {
    it('returns placeholder image (backend image endpoint pending)', async () => {
      const result = await aiService.generateImage({
        prompt: 'Marketing banner',
        style: 'professional',
        brandColors: ['#FF0000', '#00FF00'],
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
      // All convenience methods call api.post which is mocked
      mockPost.mockResolvedValue({
        data: { variants: [{ body_html: '{"title": "Test", "steps": []}' }] },
      });
    });

    it('generateTutorial calls backend', async () => {
      const result = await aiService.generateTutorial('React hooks', 3);
      expect(mockPost).toHaveBeenCalled();
    });

    it('generateCommercialScript calls backend', async () => {
      await aiService.generateCommercialScript('Product X', '30s', 'upbeat');
      expect(mockPost).toHaveBeenCalled();
    });

    it('generateSocialPost calls social endpoint', async () => {
      mockPost.mockResolvedValueOnce({
        data: { text: 'Hello!', hashtags: [] },
      });

      const result = await aiService.generateSocialPost('AI trends', 'twitter', 'casual');
      expect(mockPost).toHaveBeenCalledWith('/content/social', expect.objectContaining({
        platform: 'twitter',
      }));
    });

    it('improveContent calls improve endpoint', async () => {
      mockPost.mockResolvedValueOnce({
        data: { improved_content: 'Better content', score_after: 85 },
      });

      const result = await aiService.improveContent('Some content', 'clarity');
      expect(mockPost).toHaveBeenCalledWith('/content/improve', expect.objectContaining({
        content: 'Some content',
        goal: 'clarity',
      }));
    });

    it('generateEmailCampaign calls email endpoint', async () => {
      mockPost.mockResolvedValueOnce({
        data: { variants: [{ subject: 'Hi' }] },
      });

      const result = await aiService.generateEmailCampaign({
        type: 'welcome',
        product: 'SaaS tool',
        audience: 'developers',
        goal: 'onboarding',
        variants: 2,
      });
      expect(mockPost).toHaveBeenCalledWith('/content/email', expect.objectContaining({
        type: 'welcome',
        product: 'SaaS tool',
      }));
    });
  });
});
