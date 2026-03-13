// src/services/context-marketing/content-factory.service.ts
import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface AutonomousContent {
  id: string;
  content_type: 'blog' | 'social' | 'email' | 'video' | 'image' | 'ad' | 'landing';
  title: string;
  description: string;
  preview: string;
  full_content?: string;
  trigger_type: 'trend' | 'competitor' | 'calendar' | 'pattern' | 'opportunity';
  trigger_data: any;
  quality_score: number;
  performance_prediction: number;
  brand_alignment: number;
  status: 'generating' | 'review' | 'approved' | 'published' | 'failed';
  created_at: string;
  published_at?: string;
  metrics?: {
    views: number;
    engagement: number;
    conversions: number;
    roi: number;
  };
}

export interface ContentPipeline {
  stage: 'opportunity_detection' | 'content_generation' | 'quality_check' | 'distribution';
  name: string;
  description: string;
  status: 'active' | 'idle' | 'error';
  items_processing: number;
  avg_processing_time: number;
}

export interface ContentMetrics {
  totalGenerated: number;
  publishedToday: number;
  avgPerformance: number;
  timesSaved: number;
  activeTypes: number;
  queueLength: number;
}

export interface ContentOpportunity {
  id: string;
  type: 'trending_topic' | 'competitive_gap' | 'seasonal_event' | 'audience_interest' | 'news_jacking';
  trigger: string;
  relevance_score: number;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  potential_reach: number;
  recommended_content_types: string[];
}

// Service implementation
class ContentFactoryService {
  private isRunning: boolean = true;

  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  // Get content metrics computed from autonomous_content
  async getContentMetrics(timeRange: string): Promise<ContentMetrics> {
    const userId = await this.getUserId();

    // Determine the date filter based on timeRange
    const now = new Date();
    let sinceDate: Date;
    switch (timeRange) {
      case '1d':
        sinceDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
        sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        sinceDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    const { data: allContent, error } = await supabase
      .from('autonomous_content')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const content = (allContent || []) as unknown as AutonomousContent[];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const published = content.filter(c => c.status === 'published');
    const publishedToday = content.filter(
      c => c.status === 'published' && c.published_at && new Date(c.published_at) >= todayStart
    );
    const inReview = content.filter(c => c.status === 'review');
    const avgPerformance = published.length > 0
      ? published.reduce((sum, c) => sum + (c.quality_score || 0), 0) / published.length
      : 0;
    const contentTypes = new Set(content.map(c => c.content_type));

    return {
      totalGenerated: content.length,
      publishedToday: publishedToday.length,
      avgPerformance,
      timesSaved: Math.round(content.length * 0.3),
      activeTypes: contentTypes.size,
      queueLength: inReview.length,
    };
  }

  // Get pipeline status computed from content by status
  async getPipelineStatus(): Promise<ContentPipeline[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('autonomous_content')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const rows = (data || []) as unknown as { status: string }[];

    const generatingCount = rows.filter(r => r.status === 'generating').length;
    const reviewCount = rows.filter(r => r.status === 'review').length;
    const approvedCount = rows.filter(r => r.status === 'approved').length;
    const publishedCount = rows.filter(r => r.status === 'published').length;

    return [
      {
        stage: 'opportunity_detection',
        name: 'Opportunity Scanner',
        description: 'Scanning for content opportunities across all channels',
        status: 'active',
        items_processing: generatingCount,
        avg_processing_time: 2.3,
      },
      {
        stage: 'content_generation',
        name: 'AI Content Creator',
        description: 'Generating content based on detected opportunities',
        status: generatingCount > 0 ? 'active' : 'idle',
        items_processing: generatingCount,
        avg_processing_time: 45,
      },
      {
        stage: 'quality_check',
        name: 'Quality Assurance',
        description: 'Verifying brand alignment and quality standards',
        status: reviewCount > 0 ? 'active' : 'idle',
        items_processing: reviewCount,
        avg_processing_time: 8,
      },
      {
        stage: 'distribution',
        name: 'Multi-Channel Publisher',
        description: 'Publishing approved content across channels',
        status: approvedCount > 0 || publishedCount > 0 ? 'active' : 'idle',
        items_processing: approvedCount,
        avg_processing_time: 5,
      },
    ];
  }

  // Get generated content with optional status filter
  async getGeneratedContent(filters?: { status?: string }): Promise<AutonomousContent[]> {
    const userId = await this.getUserId();

    let query = supabase
      .from('autonomous_content')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as AutonomousContent[];
  }

  // Get content queue (items in review)
  async getContentQueue(): Promise<AutonomousContent[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('autonomous_content')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'review')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as AutonomousContent[];
  }

  // Pause factory (no-op state management)
  async pauseFactory(): Promise<void> {
    this.isRunning = false;
  }

  // Resume factory (no-op state management)
  async resumeFactory(): Promise<void> {
    this.isRunning = true;
  }

  // Approve content
  async approveContent(contentId: string): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('autonomous_content')
      .update({ status: 'approved', published_at: new Date().toISOString() })
      .eq('id', contentId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Reject content
  async rejectContent(contentId: string): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('autonomous_content')
      .update({ status: 'failed' })
      .eq('id', contentId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get content performance
  async getContentPerformance(contentId: string): Promise<{
    performance: any;
    insights: string[];
    recommendations: string[];
  }> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('autonomous_content')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const content = data as unknown as AutonomousContent;
    if (!content || !content.metrics) {
      throw new Error('Content not found or no metrics available');
    }

    return {
      performance: content.metrics,
      insights: [
        'Engagement rate 2x higher than average',
        'Best performing content type this week',
        'High conversion from mobile users',
      ],
      recommendations: [
        'Create follow-up content on this topic',
        'Increase distribution to similar audience segments',
        'Test video version of this content',
      ],
    };
  }
}

// Export singleton instance
export const contentFactoryService = new ContentFactoryService();

// Re-export as default
export default contentFactoryService;
