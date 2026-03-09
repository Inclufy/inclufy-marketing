import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAI } from '@/hooks/use-ai';

// Mock the AI service
const mockGenerateTutorial = vi.fn();
const mockGenerateCommercialScript = vi.fn();
const mockGenerateSocialPost = vi.fn();
const mockImproveContent = vi.fn();
const mockGenerateContentIdeas = vi.fn();
const mockAnalyzeContent = vi.fn();
const mockProcessBrandKnowledge = vi.fn();
const mockAnalyzeWebsite = vi.fn();
const mockGeneratePresentation = vi.fn();
const mockGenerateEmailCampaign = vi.fn();
const mockGenerateLandingPage = vi.fn();
const mockFetchWebsiteContent = vi.fn();
const mockAnalyzeWebsiteAndGeneratePresentation = vi.fn();
const mockResearchProspect = vi.fn();

vi.mock('@/hooks/queries/useBrandMemory', () => ({
  useBrandMemory: () => ({ data: null, isLoading: false }),
  toBrandContext: () => undefined,
}));

vi.mock('@/services/ai.service', () => ({
  getAIService: () => ({
    generateTutorial: mockGenerateTutorial,
    generateCommercialScript: mockGenerateCommercialScript,
    generateSocialPost: mockGenerateSocialPost,
    improveContent: mockImproveContent,
    generateContentIdeas: mockGenerateContentIdeas,
    analyzeContent: mockAnalyzeContent,
    processBrandKnowledge: mockProcessBrandKnowledge,
    analyzeWebsite: mockAnalyzeWebsite,
    generatePresentation: mockGeneratePresentation,
    generateEmailCampaign: mockGenerateEmailCampaign,
    generateLandingPage: mockGenerateLandingPage,
    fetchWebsiteContent: mockFetchWebsiteContent,
    analyzeWebsiteAndGeneratePresentation: mockAnalyzeWebsiteAndGeneratePresentation,
    researchProspect: mockResearchProspect,
    setBrandContext: vi.fn(),
  }),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('useAI hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading = false', () => {
    const { result } = renderHook(() => useAI());
    expect(result.current.loading).toBe(false);
  });

  it('exposes all expected methods', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current).toHaveProperty('generateTutorial');
    expect(result.current).toHaveProperty('generateCommercial');
    expect(result.current).toHaveProperty('generateSocialPost');
    expect(result.current).toHaveProperty('improveContent');
    expect(result.current).toHaveProperty('generateIdeas');
    expect(result.current).toHaveProperty('analyzeContent');
    expect(result.current).toHaveProperty('processBrandKnowledge');
    expect(result.current).toHaveProperty('analyzeWebsite');
    expect(result.current).toHaveProperty('generatePresentation');
    expect(result.current).toHaveProperty('generateEmailCampaign');
    expect(result.current).toHaveProperty('generateLandingPage');
  });

  describe('generateTutorial', () => {
    it('calls the AI service and shows success toast', async () => {
      mockGenerateTutorial.mockResolvedValueOnce({ title: 'Test Tutorial', steps: [] });

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.generateTutorial('React hooks');
      });

      expect(mockGenerateTutorial).toHaveBeenCalledWith('React hooks', undefined);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Tutorial Generated!' })
      );
    });

    it('shows error toast on failure', async () => {
      mockGenerateTutorial.mockRejectedValueOnce(new Error('API failure'));

      const { result } = renderHook(() => useAI());

      await expect(
        act(async () => {
          await result.current.generateTutorial('React');
        })
      ).rejects.toThrow('API failure');

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Generation Failed',
          variant: 'destructive',
        })
      );
    });
  });

  describe('analyzeContent', () => {
    it('returns analysis result and shows toast with score', async () => {
      mockAnalyzeContent.mockResolvedValueOnce({ score: 85, suggestions: [] });

      const { result } = renderHook(() => useAI());

      let analysisResult: any;
      await act(async () => {
        analysisResult = await result.current.analyzeContent('Test content');
      });

      expect(analysisResult).toEqual({ score: 85, suggestions: [] });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Analysis Complete!' })
      );
    });
  });

  describe('generateEmailCampaign', () => {
    it('passes params to service correctly', async () => {
      const params = { type: 'welcome', product: 'SaaS', audience: 'devs', goal: 'onboard' };
      mockGenerateEmailCampaign.mockResolvedValueOnce({ variants: [] });

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.generateEmailCampaign(params);
      });

      expect(mockGenerateEmailCampaign).toHaveBeenCalledWith(params);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Email Campaign Generated!' })
      );
    });
  });

  describe('callbacks', () => {
    it('calls onSuccess callback when provided', async () => {
      const onSuccess = vi.fn();
      mockGenerateTutorial.mockResolvedValueOnce({ title: 'Tutorial' });

      const { result } = renderHook(() => useAI({ onSuccess }));

      await act(async () => {
        await result.current.generateTutorial('Test');
      });

      expect(onSuccess).toHaveBeenCalledWith({ title: 'Tutorial' });
    });

    it('calls onError callback when provided', async () => {
      const onError = vi.fn();
      const error = new Error('Failed');
      mockGenerateTutorial.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAI({ onError }));

      await expect(
        act(async () => {
          await result.current.generateTutorial('Test');
        })
      ).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
