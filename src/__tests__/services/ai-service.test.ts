import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase.functions.invoke (ai.service now uses Supabase Edge Functions)
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
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
    it('calls Supabase edge function and returns content', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { variants: [{ body_html: 'Generated content here' }] },
        error: null,
      });

      const result = await aiService.generateContent({
        prompt: 'Write about marketing',
        type: 'email',
        tone: 'professional',
        brandContext: { brand_name: 'TestBrand' },
      });

      expect(mockInvoke).toHaveBeenCalledWith('content-email', expect.objectContaining({
        body: expect.objectContaining({
          product: 'TestBrand',
        }),
      }));
      expect(result).toHaveProperty('content');
      expect(result.content).toBe('Generated content here');
    });

    it('falls back to mock content on API error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Backend unavailable'),
      });

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
      mockInvoke.mockRejectedValueOnce(new Error('Network error'));

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
      mockInvoke.mockResolvedValueOnce({
        data: { variants: [{ body_html: 'Claude generated content' }] },
        error: null,
      });

      const result = await aiService.generateContentClaude({
        prompt: 'Write about AI',
        type: 'blog',
        tone: 'professional',
        brandContext: { brand_name: 'TestBrand' },
      });

      expect(result.content).toBe('Claude generated content');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
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
      // All convenience methods call supabase.functions.invoke which is mocked
      mockInvoke.mockResolvedValue({
        data: { variants: [{ body_html: '{"title": "Test", "steps": []}' }] },
        error: null,
      });
    });

    it('generateTutorial calls edge function', async () => {
      const result = await aiService.generateTutorial('React hooks', 3);
      expect(mockInvoke).toHaveBeenCalled();
    });

    it('generateCommercialScript calls edge function', async () => {
      await aiService.generateCommercialScript('Product X', '30s', 'upbeat');
      expect(mockInvoke).toHaveBeenCalled();
    });

    it('generateSocialPost calls social edge function', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { text: 'Hello!', hashtags: [] },
        error: null,
      });

      const result = await aiService.generateSocialPost('AI trends', 'twitter', 'casual');
      expect(mockInvoke).toHaveBeenCalledWith('content-social', expect.objectContaining({
        body: expect.objectContaining({
          platform: 'twitter',
        }),
      }));
    });

    it('improveContent calls improve edge function', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { improved_content: 'Better content', score_after: 85 },
        error: null,
      });

      const result = await aiService.improveContent('Some content', 'clarity');
      expect(mockInvoke).toHaveBeenCalledWith('content-improve', expect.objectContaining({
        body: expect.objectContaining({
          content: 'Some content',
          goal: 'clarity',
        }),
      }));
    });

    it('generateEmailCampaign calls email edge function', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { variants: [{ subject: 'Hi' }] },
        error: null,
      });

      const result = await aiService.generateEmailCampaign({
        type: 'welcome',
        product: 'SaaS tool',
        audience: 'developers',
        goal: 'onboarding',
        variants: 2,
      });
      expect(mockInvoke).toHaveBeenCalledWith('content-email', expect.objectContaining({
        body: expect.objectContaining({
          type: 'welcome',
          product: 'SaaS tool',
        }),
      }));
    });
  });
});
