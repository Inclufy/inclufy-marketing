import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// ─── Mocks ──────────────────────────────────────────────────────────

const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockAIService = {
  generateTutorial: vi.fn(),
  generateCommercialScript: vi.fn(),
  generateSocialPost: vi.fn(),
  improveContent: vi.fn(),
  generateContentIdeas: vi.fn(),
  analyzeContent: vi.fn(),
  analyzeWebsiteAndGeneratePresentation: vi.fn(),
  researchProspect: vi.fn(),
  processBrandKnowledge: vi.fn(),
  analyzeWebsite: vi.fn(),
  generatePresentation: vi.fn(),
  generateEmailCampaign: vi.fn(),
  generateLandingPage: vi.fn(),
};

vi.mock('@/services/ai.service', () => ({
  getAIService: () => mockAIService,
}));

// Import AFTER mocks
import { useAI } from '@/hooks/use-ai';

// ─── Tests ──────────────────────────────────────────────────────────

describe('useAI hook — content generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading = false', () => {
    const { result } = renderHook(() => useAI());
    expect(result.current.loading).toBe(false);
  });

  describe('generateTutorial', () => {
    it('calls AI service and shows success toast', async () => {
      mockAIService.generateTutorial.mockResolvedValueOnce({ content: 'Tutorial content' });

      const { result } = renderHook(() => useAI());

      let output: any;
      await act(async () => {
        output = await result.current.generateTutorial('React Hooks', 5);
      });

      expect(mockAIService.generateTutorial).toHaveBeenCalledWith('React Hooks', 5);
      expect(output).toEqual({ content: 'Tutorial content' });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Tutorial Generated!' })
      );
    });

    it('shows error toast on failure', async () => {
      mockAIService.generateTutorial.mockRejectedValueOnce(new Error('API down'));

      const { result } = renderHook(() => useAI());

      await expect(
        act(async () => {
          await result.current.generateTutorial('topic');
        })
      ).rejects.toThrow('API down');

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Generation Failed',
          variant: 'destructive',
        })
      );
    });
  });

  describe('generateCommercial', () => {
    it('calls AI service with product, duration, tone', async () => {
      mockAIService.generateCommercialScript.mockResolvedValueOnce({ script: 'Ad script' });

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.generateCommercial('Widget X', '30s', 'professional');
      });

      expect(mockAIService.generateCommercialScript).toHaveBeenCalledWith('Widget X', '30s', 'professional');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Commercial Script Generated!' })
      );
    });
  });

  describe('generateSocialPost', () => {
    it('calls AI service with topic, platform, style', async () => {
      mockAIService.generateSocialPost.mockResolvedValueOnce({ post: 'Social post' });

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.generateSocialPost('AI Marketing', 'linkedin', 'professional');
      });

      expect(mockAIService.generateSocialPost).toHaveBeenCalledWith('AI Marketing', 'linkedin', 'professional');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Social Post Generated!' })
      );
    });
  });

  describe('improveContent', () => {
    it('calls AI service with content and goal', async () => {
      mockAIService.improveContent.mockResolvedValueOnce({ improved: 'Better text' });

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.improveContent('Draft text', 'seo');
      });

      expect(mockAIService.improveContent).toHaveBeenCalledWith('Draft text', 'seo');
    });
  });

  describe('analyzeContent', () => {
    it('calls AI service with content', async () => {
      mockAIService.analyzeContent.mockResolvedValueOnce({ score: 85 });

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.analyzeContent('Some content to analyze');
      });

      expect(mockAIService.analyzeContent).toHaveBeenCalledWith('Some content to analyze');
    });
  });

  describe('generateEmailCampaign', () => {
    it('calls AI service with campaign params', async () => {
      const params = {
        type: 'promotional',
        product: 'SaaS tool',
        audience: 'B2B marketers',
        goal: 'conversions',
        variants: 2,
      };
      mockAIService.generateEmailCampaign.mockResolvedValueOnce({ emails: [] });

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.generateEmailCampaign(params);
      });

      expect(mockAIService.generateEmailCampaign).toHaveBeenCalledWith(params);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Email Campaign Generated!' })
      );
    });
  });

  describe('generateLandingPage', () => {
    it('calls AI service with landing page params', async () => {
      const params = {
        type: 'product',
        product: 'AI platform',
        audience: 'developers',
        uniqueValue: 'fastest deployment',
        goals: ['signups'],
      };
      mockAIService.generateLandingPage.mockResolvedValueOnce({ sections: [] });

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.generateLandingPage(params);
      });

      expect(mockAIService.generateLandingPage).toHaveBeenCalledWith(params);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Landing Page Generated!' })
      );
    });
  });

  describe('callbacks', () => {
    it('calls onSuccess callback on successful generation', async () => {
      const onSuccess = vi.fn();
      mockAIService.generateTutorial.mockResolvedValueOnce({ content: 'ok' });

      const { result } = renderHook(() => useAI({ onSuccess }));

      await act(async () => {
        await result.current.generateTutorial('test');
      });

      expect(onSuccess).toHaveBeenCalledWith({ content: 'ok' });
    });

    it('calls onError callback on failure', async () => {
      const onError = vi.fn();
      mockAIService.generateTutorial.mockRejectedValueOnce(new Error('fail'));

      const { result } = renderHook(() => useAI({ onError }));

      await expect(
        act(async () => {
          await result.current.generateTutorial('test');
        })
      ).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
