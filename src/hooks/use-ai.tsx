import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAIService } from '@/services/ai-service';

interface UseAIOptions {
  provider?: 'openai' | 'anthropic';
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export const useAI = (options?: UseAIOptions) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const aiService = getAIService(options?.provider);

  const generateTutorial = useCallback(async (topic: string, steps?: number) => {
    setLoading(true);
    try {
      const result = await aiService.generateTutorial(topic, steps);
      options?.onSuccess?.(result);
      toast({
        title: "Tutorial Generated!",
        description: "AI has created your tutorial content.",
      });
      return result;
    } catch (error) {
      const err = error as Error;
      options?.onError?.(err);
      toast({
        title: "Generation Failed",
        description: err.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [aiService, options, toast]);

  const generateCommercial = useCallback(async (
    product: string, 
    duration: '30s' | '60s' | '90s', 
    tone: string
  ) => {
    setLoading(true);
    try {
      const result = await aiService.generateCommercialScript(product, duration, tone);
      options?.onSuccess?.(result);
      toast({
        title: "Commercial Script Generated!",
        description: "Your script is ready to use.",
      });
      return result;
    } catch (error) {
      const err = error as Error;
      options?.onError?.(err);
      toast({
        title: "Generation Failed",
        description: err.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [aiService, options, toast]);

  const generateSocialPost = useCallback(async (
    topic: string,
    platform: 'twitter' | 'linkedin' | 'instagram',
    style: string
  ) => {
    setLoading(true);
    try {
      const result = await aiService.generateSocialPost(topic, platform, style);
      options?.onSuccess?.(result);
      toast({
        title: "Social Post Generated!",
        description: `Your ${platform} post is ready.`,
      });
      return result;
    } catch (error) {
      const err = error as Error;
      options?.onError?.(err);
      toast({
        title: "Generation Failed",
        description: err.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [aiService, options, toast]);

  const improveContent = useCallback(async (
    content: string,
    goal: 'clarity' | 'engagement' | 'seo' | 'conversion'
  ) => {
    setLoading(true);
    try {
      const result = await aiService.improveContent(content, goal);
      options?.onSuccess?.(result);
      toast({
        title: "Content Improved!",
        description: `Optimized for ${goal}.`,
      });
      return result;
    } catch (error) {
      const err = error as Error;
      options?.onError?.(err);
      toast({
        title: "Improvement Failed",
        description: err.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [aiService, options, toast]);

  const generateIdeas = useCallback(async (brandInfo: string, count?: number) => {
    setLoading(true);
    try {
      const result = await aiService.generateContentIdeas(brandInfo, count);
      options?.onSuccess?.(result);
      toast({
        title: "Ideas Generated!",
        description: `${result.length} content ideas created.`,
      });
      return result;
    } catch (error) {
      const err = error as Error;
      options?.onError?.(err);
      toast({
        title: "Generation Failed",
        description: err.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [aiService, options, toast]);

  const analyzeContent = useCallback(async (content: string) => {
    setLoading(true);
    try {
      const result = await aiService.analyzeContent(content);
      options?.onSuccess?.(result);
      toast({
        title: "Analysis Complete!",
        description: `Score: ${result.score}/100`,
      });
      return result;
    } catch (error) {
      const err = error as Error;
      options?.onError?.(err);
      toast({
        title: "Analysis Failed",
        description: err.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [aiService, options, toast]);

  const analyzeWebsiteAndGeneratePresentation = useCallback(async (
    websiteUrl: string,
    prospectContext: {
      companyName: string;
      industry: string;
      painPoints?: string[];
      goals?: string[];
      contactPerson?: string;
      budget?: string;
    }
  ) => {
    setLoading(true);
    try {
      // First fetch website content
      const websiteContent = await aiService.fetchWebsiteContent(websiteUrl);
      
      // Then analyze and generate presentation
      const result = await aiService.analyzeWebsiteAndGeneratePresentation(
        websiteContent,
        prospectContext
      );
      
      options?.onSuccess?.(result);
      toast({
        title: "Presentation Generated!",
        description: `Created ${result.presentation.slides.length} slides for ${prospectContext.companyName}`,
      });
      return result;
    } catch (error) {
      const err = error as Error;
      options?.onError?.(err);
      toast({
        title: "Generation Failed",
        description: err.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [aiService, options, toast]);

  const researchProspect = useCallback(async (
    companyName: string,
    additionalInfo?: string
  ) => {
    setLoading(true);
    try {
      const result = await aiService.researchProspect(companyName, additionalInfo);
      options?.onSuccess?.(result);
      toast({
        title: "Research Complete!",
        description: `Found insights for ${companyName}`,
      });
      return result;
    } catch (error) {
      const err = error as Error;
      options?.onError?.(err);
      toast({
        title: "Research Failed",
        description: err.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [aiService, options, toast]);

  return {
    loading,
    generateTutorial,
    generateCommercial,
    generateSocialPost,
    improveContent,
    generateIdeas,
    analyzeContent,
    analyzeWebsiteAndGeneratePresentation,
    researchProspect,
  };
};
