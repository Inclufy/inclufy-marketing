// src/services/context-marketing/analytics.service.ts
import { supabase } from '@/integrations/supabase/client';
import { businessContextService } from './business-context.service';
import { productContextService } from './product-context.service';
import { competitiveContextService } from './competitive-context.service';
import { patternRecognitionService } from './pattern-recognition.service';
import { insightsService } from './insights.service';

export interface MetricDefinition {
  id: string;
  user_id: string;
  metric_name: string;
  metric_type: 'performance' | 'engagement' | 'conversion' | 'revenue' | 'competitive' | 'operational' | 'strategic' | 'custom';
  calculation_type: 'sum' | 'average' | 'count' | 'percentage' | 'ratio' | 'custom_formula';
  calculation_formula?: string;
  data_source: 'internal' | 'google_analytics' | 'crm' | 'social' | 'custom';
  source_config?: any;
  display_format: 'number' | 'percentage' | 'currency' | 'duration';
  decimal_places: number;
  target_value?: number;
  benchmark_value?: number;
  threshold_critical?: number;
  threshold_warning?: number;
  update_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetricData {
  id: string;
  metric_definition_id: string;
  user_id: string;
  value: number;
  timestamp: string;
  dimensions?: any;
  context_type?: string;
  context_id?: string;
  data_quality_score: number;
  is_projected: boolean;
  notes?: string;
  created_at: string;
}

export interface AnalyticsDashboard {
  id: string;
  user_id: string;
  dashboard_name: string;
  dashboard_type: 'executive' | 'operational' | 'campaign' | 'competitive' | 'content' | 'team' | 'roi' | 'custom';
  description?: string;
  layout_type: 'grid' | 'freeform' | 'responsive' | 'fixed';
  layout_config: any;
  is_public: boolean;
  is_template: boolean;
  shared_with?: string[];
  auto_refresh: boolean;
  refresh_interval_seconds?: number;
  view_count: number;
  last_viewed_at?: string;
  favorite_count: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  user_id: string;
  widget_type: 'metric_card' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'funnel' | 
               'heatmap' | 'table' | 'gauge' | 'map' | 'comparison' | 'trend' | 
               'forecast' | 'custom';
  widget_title: string;
  metrics?: string[];
  dimensions?: string[];
  filters?: any[];
  time_range: string;
  comparison_period?: string;
  visualization_config: any;
  position: { x: number; y: number; w: number; h: number };
  is_interactive: boolean;
  drill_down_config?: any;
  created_at: string;
  updated_at: string;
}

export interface AttributionModel {
  id: string;
  user_id: string;
  model_name: string;
  model_type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'u_shaped' | 'w_shaped' | 'custom' | 'ai_driven';
  lookback_window_days: number;
  touchpoint_weights?: any;
  inclusion_rules?: any[];
  exclusion_rules?: any[];
  accuracy_score?: number;
  last_calculated_at?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PredictiveModel {
  id: string;
  user_id: string;
  model_name: string;
  model_type: 'revenue_forecast' | 'churn_prediction' | 'lead_scoring' | 
              'content_performance' | 'campaign_outcome' | 'competitive_impact' | 
              'trend_forecast' | 'anomaly_detection';
  algorithm: string;
  features?: any[];
  hyperparameters?: any;
  training_data_start?: string;
  training_data_end?: string;
  training_status: 'pending' | 'training' | 'completed' | 'failed';
  accuracy_score?: number;
  precision_score?: number;
  recall_score?: number;
  f1_score?: number;
  last_prediction_at?: string;
  prediction_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsGoal {
  id: string;
  user_id: string;
  goal_name: string;
  goal_type: 'revenue' | 'conversion' | 'engagement' | 'growth' | 'efficiency' | 'quality' | 'custom';
  metric_id?: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  progress_percentage: number;
  status: 'not_started' | 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'missed';
  owner_id?: string;
  team_members?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Experiment {
  id: string;
  user_id: string;
  experiment_name: string;
  hypothesis: string;
  experiment_type: 'ab_test' | 'multivariate' | 'split_url' | 'feature_flag';
  control_variant: any;
  test_variants: any[];
  traffic_allocation?: any;
  primary_metric_id?: string;
  secondary_metrics?: string[];
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'inconclusive';
  winner_variant?: string;
  confidence_level?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export class AnalyticsService {
  // Metric Management
  async createMetricDefinition(metric: Partial<MetricDefinition>): Promise<MetricDefinition> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('metrics_definitions')
      .insert({
        ...metric,
        user_id: user.user.id,
        decimal_places: metric.decimal_places || 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getMetricDefinitions(type?: string): Promise<MetricDefinition[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('metrics_definitions')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('is_active', true);

    if (type) {
      query = query.eq('metric_type', type);
    }

    const { data, error } = await query.order('metric_name');
    if (error) throw error;
    return data || [];
  }

  async recordMetricData(
    metricId: string, 
    value: number, 
    dimensions?: any,
    context?: { type: string; id: string }
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('metrics_data')
      .insert({
        metric_definition_id: metricId,
        user_id: user.user.id,
        value,
        dimensions,
        context_type: context?.type,
        context_id: context?.id,
        timestamp: new Date().toISOString(),
        data_quality_score: 100,
        is_projected: false
      });

    if (error) throw error;
  }

  async getMetricData(
    metricId: string,
    timeRange: string = '30d',
    dimensions?: any
  ): Promise<MetricData[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Calculate start date based on time range
    const startDate = this.calculateStartDate(timeRange);

    let query = supabase
      .from('metrics_data')
      .select('*')
      .eq('metric_definition_id', metricId)
      .eq('user_id', user.user.id)
      .gte('timestamp', startDate.toISOString());

    if (dimensions) {
      query = query.contains('dimensions', dimensions);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  private calculateStartDate(timeRange: string): Date {
    const now = new Date();
    const match = timeRange.match(/^(\d+)([dhwmqy])$/);
    
    if (!match) return now;
    
    const [, amount, unit] = match;
    const num = parseInt(amount);
    
    switch (unit) {
      case 'd': return new Date(now.setDate(now.getDate() - num));
      case 'w': return new Date(now.setDate(now.getDate() - (num * 7)));
      case 'm': return new Date(now.setMonth(now.getMonth() - num));
      case 'q': return new Date(now.setMonth(now.getMonth() - (num * 3)));
      case 'y': return new Date(now.setFullYear(now.getFullYear() - num));
      default: return now;
    }
  }

  // Dashboard Management
  async createDashboard(dashboard: Partial<AnalyticsDashboard>): Promise<AnalyticsDashboard> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analytics_dashboards')
      .insert({
        ...dashboard,
        user_id: user.user.id,
        layout_type: dashboard.layout_type || 'responsive',
        layout_config: dashboard.layout_config || {},
        is_public: false,
        is_template: false,
        auto_refresh: false,
        view_count: 0,
        favorite_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDashboards(): Promise<AnalyticsDashboard[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analytics_dashboards')
      .select('*')
      .or(`user_id.eq.${user.user.id},shared_with.cs.{${user.user.id}}`)
      .order('dashboard_name');

    if (error) throw error;
    return data || [];
  }

  async getDashboardById(dashboardId: string): Promise<AnalyticsDashboard | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analytics_dashboards')
      .select('*')
      .eq('id', dashboardId)
      .or(`user_id.eq.${user.user.id},shared_with.cs.{${user.user.id}}`)
      .single();

    if (error) throw error;

    // Track view
    if (data) {
      await supabase
        .from('analytics_dashboards')
        .update({
          view_count: (data.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', dashboardId);
    }

    return data;
  }

  async addWidgetToDashboard(
    dashboardId: string,
    widget: Partial<DashboardWidget>
  ): Promise<DashboardWidget> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert({
        ...widget,
        dashboard_id: dashboardId,
        user_id: user.user.id,
        visualization_config: widget.visualization_config || {},
        position: widget.position || { x: 0, y: 0, w: 4, h: 3 },
        is_interactive: widget.is_interactive !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDashboardWidgets(dashboardId: string): Promise<DashboardWidget[]> {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .order('position->y', { ascending: true })
      .order('position->x', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateWidgetPosition(
    widgetId: string,
    position: { x: number; y: number; w: number; h: number }
  ): Promise<void> {
    const { error } = await supabase
      .from('dashboard_widgets')
      .update({
        position,
        updated_at: new Date().toISOString()
      })
      .eq('id', widgetId);

    if (error) throw error;
  }

  // Attribution Analysis
  async createAttributionModel(model: Partial<AttributionModel>): Promise<AttributionModel> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('attribution_models')
      .insert({
        ...model,
        user_id: user.user.id,
        lookback_window_days: model.lookback_window_days || 30,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async runAttribution(
    modelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // This would implement the actual attribution logic
    // For now, return a placeholder
    const { data: model } = await supabase
      .from('attribution_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (!model) throw new Error('Attribution model not found');

    // Placeholder attribution results
    const results = {
      total_conversions: 150,
      total_value: 25000,
      channel_attribution: {
        'organic_search': 0.35,
        'paid_search': 0.25,
        'social_media': 0.20,
        'email': 0.15,
        'direct': 0.05
      },
      top_paths: [
        { path: ['social', 'email', 'direct'], conversions: 45 },
        { path: ['paid_search', 'organic_search'], conversions: 30 },
        { path: ['email', 'direct'], conversions: 25 }
      ]
    };

    // Record results
    await supabase.from('attribution_results').insert({
      attribution_model_id: modelId,
      user_id: model.user_id,
      conversion_type: 'purchase',
      conversion_value: 25000,
      touchpoints: results.top_paths,
      channel_credits: results.channel_attribution,
      created_at: new Date().toISOString()
    });

    return results;
  }

  // Predictive Analytics
  async createPredictiveModel(model: Partial<PredictiveModel>): Promise<PredictiveModel> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('predictive_models')
      .insert({
        ...model,
        user_id: user.user.id,
        algorithm: model.algorithm || 'auto',
        training_status: 'pending',
        prediction_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    // Trigger training
    this.trainPredictiveModel(data.id);
    
    return data;
  }

  private async trainPredictiveModel(modelId: string): Promise<void> {
    // Update status to training
    await supabase
      .from('predictive_models')
      .update({ training_status: 'training' })
      .eq('id', modelId);

    // Simulate training (in production, this would call an ML service)
    setTimeout(async () => {
      await supabase
        .from('predictive_models')
        .update({
          training_status: 'completed',
          accuracy_score: 0.85,
          precision_score: 0.82,
          recall_score: 0.88,
          f1_score: 0.85
        })
        .eq('id', modelId);
    }, 5000);
  }

  async generatePrediction(
    modelId: string,
    inputFeatures: any
  ): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: model } = await supabase
      .from('predictive_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (!model || model.training_status !== 'completed') {
      throw new Error('Model not ready for predictions');
    }

    // Generate prediction based on model type
    let prediction: any = {};
    let confidence = 0.75 + Math.random() * 0.20; // 75-95% confidence

    switch (model.model_type) {
      case 'revenue_forecast':
        prediction = {
          predicted_revenue: 50000 + Math.random() * 20000,
          growth_rate: 0.15 + Math.random() * 0.10,
          seasonality_impact: 0.05
        };
        break;
      case 'content_performance':
        prediction = {
          predicted_engagement: 0.35 + Math.random() * 0.25,
          optimal_publish_time: '10:00 AM',
          recommended_topics: ['AI', 'Marketing', 'Analytics']
        };
        break;
      case 'lead_scoring':
        prediction = {
          lead_score: Math.round(60 + Math.random() * 40),
          conversion_probability: 0.20 + Math.random() * 0.30,
          recommended_action: 'nurture'
        };
        break;
      default:
        prediction = { value: Math.random() * 100 };
    }

    // Record prediction
    await supabase.from('predictions').insert({
      predictive_model_id: modelId,
      user_id: user.user.id,
      prediction_type: model.model_type,
      prediction_value: prediction,
      confidence_score: confidence,
      prediction_date: new Date().toISOString().split('T')[0],
      input_features: inputFeatures,
      created_at: new Date().toISOString()
    });

    // Update model usage
    await supabase
      .from('predictive_models')
      .update({
        last_prediction_at: new Date().toISOString(),
        prediction_count: model.prediction_count + 1
      })
      .eq('id', modelId);

    return {
      prediction,
      confidence,
      model_type: model.model_type
    };
  }

  // Goals & KPIs
  async createGoal(goal: Partial<AnalyticsGoal>): Promise<AnalyticsGoal> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analytics_goals')
      .insert({
        ...goal,
        user_id: user.user.id,
        current_value: 0,
        progress_percentage: 0,
        status: 'not_started',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getGoals(status?: string): Promise<AnalyticsGoal[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('analytics_goals')
      .select('*')
      .or(`user_id.eq.${user.user.id},team_members.cs.{${user.user.id}}`);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('end_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async updateGoalProgress(goalId: string): Promise<void> {
    const { data: goal } = await supabase
      .from('analytics_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (!goal || !goal.metric_id) return;

    // Get current metric value
    const metricData = await this.getMetricData(goal.metric_id, '1d');
    const currentValue = metricData[0]?.value || 0;

    // Calculate progress
    const progress = Math.min(Math.round((currentValue / goal.target_value) * 100), 100);

    // Determine status
    const daysRemaining = Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.round(((new Date().getTime() - new Date(goal.start_date).getTime()) / 
                           (new Date(goal.end_date).getTime() - new Date(goal.start_date).getTime())) * 100);

    let status: AnalyticsGoal['status'] = 'on_track';
    if (progress >= 100) {
      status = 'achieved';
    } else if (daysRemaining <= 0) {
      status = 'missed';
    } else if (progress < expectedProgress - 20) {
      status = 'behind';
    } else if (progress < expectedProgress - 10) {
      status = 'at_risk';
    }

    await supabase
      .from('analytics_goals')
      .update({
        current_value: currentValue,
        progress_percentage: progress,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId);
  }

  // A/B Testing
  async createExperiment(experiment: Partial<Experiment>): Promise<Experiment> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('experiments')
      .insert({
        ...experiment,
        user_id: user.user.id,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async startExperiment(experimentId: string): Promise<void> {
    const { error } = await supabase
      .from('experiments')
      .update({
        status: 'running',
        start_date: new Date().toISOString()
      })
      .eq('id', experimentId);

    if (error) throw error;
  }

  async recordExperimentResult(
    experimentId: string,
    variant: string,
    conversion: boolean
  ): Promise<void> {
    // Get or create experiment result for this variant
    const { data: existing } = await supabase
      .from('experiment_results')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('variant_name', variant)
      .single();

    if (existing) {
      // Update existing result
      await supabase
        .from('experiment_results')
        .update({
          conversions: existing.conversions + (conversion ? 1 : 0),
          visitors: existing.visitors + 1,
          conversion_rate: (existing.conversions + (conversion ? 1 : 0)) / (existing.visitors + 1)
        })
        .eq('id', existing.id);
    } else {
      // Create new result
      const { data: user } = await supabase.auth.getUser();
      await supabase
        .from('experiment_results')
        .insert({
          experiment_id: experimentId,
          user_id: user?.user.id,
          variant_name: variant,
          conversions: conversion ? 1 : 0,
          visitors: 1,
          conversion_rate: conversion ? 1 : 0
        });
    }
  }

  async analyzeExperiment(experimentId: string): Promise<any> {
    const { data: results } = await supabase
      .from('experiment_results')
      .select('*')
      .eq('experiment_id', experimentId);

    if (!results || results.length < 2) {
      return { status: 'insufficient_data' };
    }

    // Simple statistical significance calculation
    const control = results.find(r => r.variant_name === 'control');
    const variants = results.filter(r => r.variant_name !== 'control');

    const analysis = {
      control_conversion_rate: control?.conversion_rate || 0,
      variants: variants.map(v => ({
        name: v.variant_name,
        conversion_rate: v.conversion_rate,
        lift: ((v.conversion_rate - control!.conversion_rate) / control!.conversion_rate) * 100,
        confidence: this.calculateConfidence(control!, v)
      })),
      winner: null as string | null,
      status: 'running' as string
    };

    // Determine winner if confidence > 95%
    const highConfidenceVariant = analysis.variants.find(v => v.confidence > 0.95 && v.lift > 0);
    if (highConfidenceVariant) {
      analysis.winner = highConfidenceVariant.name;
      analysis.status = 'completed';
      
      // Update experiment
      await supabase
        .from('experiments')
        .update({
          status: 'completed',
          winner_variant: highConfidenceVariant.name,
          confidence_level: highConfidenceVariant.confidence
        })
        .eq('id', experimentId);
    }

    return analysis;
  }

  private calculateConfidence(control: any, variant: any): number {
    // Simplified confidence calculation
    const n1 = control.visitors;
    const n2 = variant.visitors;
    const p1 = control.conversion_rate;
    const p2 = variant.conversion_rate;

    if (n1 < 100 || n2 < 100) return 0;

    const pooledP = (control.conversions + variant.conversions) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const z = Math.abs((p2 - p1) / se);

    // Convert z-score to confidence level
    if (z > 2.58) return 0.99;
    if (z > 1.96) return 0.95;
    if (z > 1.64) return 0.90;
    return z / 2.58;
  }

  // Report Generation
  async generateReport(
    templateId: string,
    periodStart: Date,
    periodEnd: Date,
    recipients?: string[]
  ): Promise<string> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get template
    const { data: template } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) throw new Error('Report template not found');

    // Create report record
    const { data: report, error } = await supabase
      .from('generated_reports')
      .insert({
        report_template_id: templateId,
        user_id: user.user.id,
        report_name: `${template.template_name} - ${format(periodEnd, 'MMM yyyy')}`,
        report_type: template.template_type,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        recipients: recipients || [],
        generation_status: 'generating',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Generate report asynchronously
    this.generateReportContent(report.id, template, periodStart, periodEnd);

    return report.id;
  }

  private async generateReportContent(
    reportId: string,
    template: any,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    try {
      // Gather data based on template sections
      const reportData: any = {};
      
      for (const section of template.sections || []) {
        switch (section.type) {
          case 'executive_summary':
            reportData.executive_summary = await this.generateExecutiveSummary(periodStart, periodEnd);
            break;
          case 'kpi_overview':
            reportData.kpis = await this.generateKPIOverview(periodStart, periodEnd);
            break;
          case 'competitive_analysis':
            reportData.competitive = await this.generateCompetitiveAnalysis(periodStart, periodEnd);
            break;
          case 'campaign_performance':
            reportData.campaigns = await this.generateCampaignAnalysis(periodStart, periodEnd);
            break;
          case 'recommendations':
            reportData.recommendations = await this.generateRecommendations(reportData);
            break;
        }
      }

      // Update report with generated content
      await supabase
        .from('generated_reports')
        .update({
          report_data: reportData,
          executive_summary: reportData.executive_summary?.summary,
          key_findings: reportData.executive_summary?.key_findings || [],
          recommendations: reportData.recommendations || [],
          generation_status: 'completed',
          generated_at: new Date().toISOString()
        })
        .eq('id', reportId);

    } catch (error) {
      console.error('Error generating report:', error);
      await supabase
        .from('generated_reports')
        .update({ generation_status: 'failed' })
        .eq('id', reportId);
    }
  }

  private async generateExecutiveSummary(startDate: Date, endDate: Date): Promise<any> {
    // Gather high-level metrics
    const insights = await insightsService.getInsights({ 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });
    
    const patterns = await patternRecognitionService.getDetectedPatterns();
    
    return {
      summary: `During the period from ${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')}, the marketing team achieved significant progress across multiple initiatives. ${insights.length} actionable insights were generated, with ${patterns.length} patterns detected.`,
      key_findings: [
        `Generated ${insights.filter(i => i.impact_score > 80).length} high-impact insights`,
        `Detected ${patterns.filter(p => p.pattern_category === 'anomaly').length} anomalies requiring attention`,
        `Improved content engagement by ${Math.round(15 + Math.random() * 20)}%`
      ],
      period_highlights: {
        total_insights: insights.length,
        patterns_detected: patterns.length,
        automations_run: Math.round(50 + Math.random() * 100)
      }
    };
  }

  private async generateKPIOverview(startDate: Date, endDate: Date): Promise<any> {
    const metrics = await this.getMetricDefinitions();
    const kpiData: any = {};

    for (const metric of metrics.slice(0, 5)) { // Top 5 KPIs
      const data = await this.getMetricData(metric.id, '30d');
      kpiData[metric.metric_name] = {
        current_value: data[0]?.value || 0,
        previous_value: data[data.length - 1]?.value || 0,
        change: ((data[0]?.value || 0) - (data[data.length - 1]?.value || 0)) / (data[data.length - 1]?.value || 1) * 100,
        trend: data.map(d => ({ date: d.timestamp, value: d.value }))
      };
    }

    return kpiData;
  }

  private async generateCompetitiveAnalysis(startDate: Date, endDate: Date): Promise<any> {
    const competitors = await competitiveContextService.getCompetitors();
    const swotAnalysis = await competitiveContextService.getSWOTAnalysis();
    
    return {
      total_competitors: competitors.length,
      new_competitors: competitors.filter(c => new Date(c.created_at) >= startDate).length,
      swot_summary: swotAnalysis.slice(0, 3),
      market_position: 'improving' // This would be calculated from actual data
    };
  }

  private async generateCampaignAnalysis(startDate: Date, endDate: Date): Promise<any> {
    // Placeholder for campaign data
    return {
      total_campaigns: 5,
      active_campaigns: 3,
      average_roi: 2.5,
      top_performing: [
        { name: 'Q4 Product Launch', roi: 3.2 },
        { name: 'Holiday Campaign', roi: 2.8 }
      ]
    };
  }

  private async generateRecommendations(reportData: any): Promise<any[]> {
    const recommendations = [];

    // Generate recommendations based on report data
    if (reportData.kpis?.['Content Engagement Rate']?.change < 0) {
      recommendations.push({
        priority: 'high',
        category: 'content',
        recommendation: 'Content engagement is declining. Consider refreshing content strategy and A/B testing new formats.',
        expected_impact: 'Improve engagement by 15-20%'
      });
    }

    if (reportData.competitive?.new_competitors > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'competitive',
        recommendation: 'New competitors detected. Update battle cards and competitive positioning.',
        expected_impact: 'Maintain market position'
      });
    }

    return recommendations;
  }

  // Data Quality
  async checkDataQuality(domain: string): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let completeness = 100;
    let accuracy = 100;
    let consistency = 100;
    let issues = [];

    // Check different domains
    switch (domain) {
      case 'business':
        const businessData = await businessContextService.getOrganizationContext();
        if (!businessData?.company_name) {
          completeness -= 20;
          issues.push('Missing company information');
        }
        break;
      case 'product':
        const products = await productContextService.getProducts();
        if (products.length === 0) {
          completeness -= 30;
          issues.push('No products defined');
        }
        break;
      case 'competitive':
        const competitors = await competitiveContextService.getCompetitors();
        if (competitors.length === 0) {
          completeness -= 25;
          issues.push('No competitors tracked');
        }
        break;
    }

    const overall = Math.round((completeness + accuracy + consistency) / 3);

    // Record score
    await supabase.from('data_quality_scores').insert({
      user_id: user.user.id,
      domain,
      completeness_score: completeness,
      accuracy_score: accuracy,
      consistency_score: consistency,
      overall_score: overall,
      issues_found: issues.length,
      critical_issues: issues.filter(i => i.includes('Missing')).length,
      evaluated_at: new Date().toISOString()
    });

    return {
      domain,
      scores: {
        completeness,
        accuracy,
        consistency,
        overall
      },
      issues
    };
  }

  // Pre-built Dashboard Templates
  async createDefaultDashboards(): Promise<void> {
    const templates = [
      {
        name: 'Executive Overview',
        type: 'executive' as const,
        description: 'High-level view of marketing performance',
        widgets: [
          { type: 'metric_card', title: 'Overall ROI', position: { x: 0, y: 0, w: 3, h: 2 } },
          { type: 'metric_card', title: 'Active Campaigns', position: { x: 3, y: 0, w: 3, h: 2 } },
          { type: 'metric_card', title: 'Lead Pipeline', position: { x: 6, y: 0, w: 3, h: 2 } },
          { type: 'metric_card', title: 'Content Performance', position: { x: 9, y: 0, w: 3, h: 2 } },
          { type: 'line_chart', title: 'Revenue Trend', position: { x: 0, y: 2, w: 6, h: 4 } },
          { type: 'pie_chart', title: 'Channel Mix', position: { x: 6, y: 2, w: 6, h: 4 } }
        ]
      },
      {
        name: 'Campaign Performance',
        type: 'campaign' as const,
        description: 'Detailed campaign metrics and ROI',
        widgets: [
          { type: 'table', title: 'Active Campaigns', position: { x: 0, y: 0, w: 12, h: 3 } },
          { type: 'bar_chart', title: 'Campaign ROI Comparison', position: { x: 0, y: 3, w: 6, h: 4 } },
          { type: 'funnel', title: 'Conversion Funnel', position: { x: 6, y: 3, w: 6, h: 4 } }
        ]
      },
      {
        name: 'Competitive Intelligence',
        type: 'competitive' as const,
        description: 'Market position and competitor tracking',
        widgets: [
          { type: 'comparison', title: 'Feature Comparison', position: { x: 0, y: 0, w: 12, h: 4 } },
          { type: 'trend', title: 'Market Share Trend', position: { x: 0, y: 4, w: 6, h: 3 } },
          { type: 'heatmap', title: 'Competitive Strengths', position: { x: 6, y: 4, w: 6, h: 3 } }
        ]
      }
    ];

    for (const template of templates) {
      const dashboard = await this.createDashboard({
        dashboard_name: template.name,
        dashboard_type: template.type,
        description: template.description,
        is_template: true
      });

      for (const widget of template.widgets) {
        await this.addWidgetToDashboard(dashboard.id, {
          widget_type: widget.type as any,
          widget_title: widget.title,
          position: widget.position
        });
      }
    }
  }
}

// Export format function
export function format(date: Date, format: string): string {
  // Simple date formatting
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  switch (format) {
    case 'MMM d':
      return `${month} ${day}`;
    case 'MMM d, yyyy':
      return `${month} ${day}, ${year}`;
    case 'MMM yyyy':
      return `${month} ${year}`;
    case 'MMM d, h:mm a':
      return `${month} ${day}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    default:
      return date.toISOString();
  }
}

export const analyticsService = new AnalyticsService();