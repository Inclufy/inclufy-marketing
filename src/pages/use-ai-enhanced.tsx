import { useState } from 'react';
import { aiService } from '@/services/ai-service-enhanced';
import { toast } from 'sonner';

export function useAI() {
  const [loading, setLoading] = useState(false);

  // ==========================================
  // PHASE 1 - Foundation Methods
  // ==========================================

  const processBrandKnowledge = async (documents: Array<{ type: string; content: string }>) => {
    setLoading(true);
    try {
      const result = await aiService.processBrandKnowledge(documents);
      return result;
    } catch (error) {
      console.error('Brand knowledge processing failed:', error);
      toast.error('Failed to process brand knowledge');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeWebsite = async (websiteContent: string) => {
    setLoading(true);
    try {
      const result = await aiService.analyzeWebsite(websiteContent);
      return result;
    } catch (error) {
      console.error('Website analysis failed:', error);
      toast.error('Failed to analyze website');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generatePresentation = async (websiteAnalysis: any, prospectInfo: any) => {
    setLoading(true);
    try {
      const result = await aiService.generatePresentation(websiteAnalysis, prospectInfo);
      toast.success('Presentation generated successfully!');
      return result;
    } catch (error) {
      console.error('Presentation generation failed:', error);
      toast.error('Failed to generate presentation');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PHASE 2 - Core Monetization Methods
  // ==========================================

  const generateEmailCampaign = async (params: {
    type: string;
    product: string;
    audience: string;
    goal: string;
    variants?: number;
  }) => {
    setLoading(true);
    try {
      const result = await aiService.generateEmailCampaign(params);
      return result;
    } catch (error) {
      console.error('Email campaign generation failed:', error);
      toast.error('Failed to generate email campaign');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateLandingPage = async (params: {
    type: string;
    product: string;
    audience: string;
    uniqueValue: string;
    goals: string;
  }) => {
    setLoading(true);
    try {
      const result = await aiService.generateLandingPage(params);
      return result;
    } catch (error) {
      console.error('Landing page generation failed:', error);
      toast.error('Failed to generate landing page');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeContent = async (content: string) => {
    setLoading(true);
    try {
      const result = await aiService.analyzeContent(content);
      return result;
    } catch (error) {
      console.error('Content analysis failed:', error);
      toast.error('Failed to analyze content');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const improveContent = async (content: string, goal: 'clarity' | 'engagement' | 'conversion' | 'seo') => {
    setLoading(true);
    try {
      const result = await aiService.improveContent(content, goal);
      toast.success(`Content improved for ${goal}!`);
      return result;
    } catch (error) {
      console.error('Content improvement failed:', error);
      toast.error('Failed to improve content');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Existing Methods (Already Implemented)
  // ==========================================

  const generateTutorial = async (topic: string, steps?: number) => {
    setLoading(true);
    try {
      const result = await aiService.generateTutorial(topic, steps);
      toast.success('Tutorial generated successfully!');
      return result;
    } catch (error) {
      console.error('Tutorial generation failed:', error);
      toast.error('Failed to generate tutorial');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateCommercial = async (product: string, duration: number, tone: string) => {
    setLoading(true);
    try {
      const result = await aiService.generateCommercialScript(product, duration, tone);
      toast.success('Commercial script generated!');
      return result;
    } catch (error) {
      console.error('Commercial generation failed:', error);
      toast.error('Failed to generate commercial');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateSocialPost = async (topic: string, platform: string, style?: string) => {
    setLoading(true);
    try {
      const result = await aiService.generateSocialPost(topic, platform, style);
      toast.success('Social post generated!');
      return result;
    } catch (error) {
      console.error('Social post generation failed:', error);
      toast.error('Failed to generate social post');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateIdeas = async (brandInfo: string, count?: number) => {
    setLoading(true);
    try {
      const result = await aiService.generateContentIdeas(brandInfo, count);
      toast.success('Content ideas generated!');
      return result;
    } catch (error) {
      console.error('Content ideas generation failed:', error);
      toast.error('Failed to generate content ideas');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const researchProspect = async (companyName: string, additionalInfo?: string) => {
    setLoading(true);
    try {
      const result = await aiService.researchProspect(companyName, additionalInfo);
      toast.success('Prospect research completed!');
      return result;
    } catch (error) {
      console.error('Prospect research failed:', error);
      toast.error('Failed to research prospect');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    // Phase 1 - Foundation
    processBrandKnowledge,
    analyzeWebsite,
    generatePresentation,
    // Phase 2 - Core Monetization
    generateEmailCampaign,
    generateLandingPage,
    analyzeContent,
    improveContent,
    // Existing
    generateTutorial,
    generateCommercial,
    generateSocialPost,
    generateIdeas,
    researchProspect,
  };
}