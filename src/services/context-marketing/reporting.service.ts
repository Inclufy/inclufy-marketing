// src/services/context-marketing/reporting.service.ts
import { supabase } from '@/integrations/supabase/client';
import { analyticsService } from './analytics.service';
import { businessContextService } from './business-context.service';
import { productContextService } from './product-context.service';
import { competitiveContextService } from './competitive-context.service';
import { insightsService } from './insights.service';
import { automationService } from './automation.service';
import { patternRecognitionService } from './pattern-recognition.service';

export interface ReportTemplate {
  id: string;
  user_id: string;
  template_name: string;
  template_type: 'executive_summary' | 'performance_report' | 'competitive_analysis' | 
                'campaign_review' | 'roi_analysis' | 'team_productivity' | 
                'quarterly_review' | 'custom';
  description?: string;
  sections: any[];
  data_sources: any[];
  branding_config?: any;
  is_public: boolean;
  category?: string;
  tags?: string[];
  times_used: number;
  created_at: string;
  updated_at: string;
}

export interface GeneratedReport {
  id: string;
  report_template_id?: string;
  user_id: string;
  report_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  comparison_period_start?: string;
  comparison_period_end?: string;
  report_data: any;
  executive_summary?: string;
  key_findings?: any[];
  recommendations?: any[];
  recipients?: string[];
  external_recipients?: string[];
  file_url?: string;
  file_format?: 'pdf' | 'excel' | 'pptx' | 'html';
  file_size_bytes?: number;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  generated_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface DataQualityRule {
  id: string;
  user_id: string;
  rule_name: string;
  rule_type: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 
             'uniqueness' | 'validity' | 'custom';
  target_table: string;
  target_column?: string;
  rule_expression: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  auto_fix: boolean;
  fix_action?: any;
  alert_on_violation: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataQualityScore {
  id: string;
  user_id: string;
  domain: string;
  entity_type?: string;
  entity_id?: string;
  completeness_score: number;
  accuracy_score: number;
  consistency_score: number;
  timeliness_score: number;
  overall_score: number;
  issues_found: number;
  issues_resolved: number;
  critical_issues: number;
  evaluated_at: string;
  next_evaluation_at?: string;
}

export interface ScheduledReport {
  id: string;
  user_id: string;
  report_template_id: string;
  report_name: string;
  schedule_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  schedule_day?: number;
  schedule_time: string;
  recipients?: string[];
  external_emails?: string[];
  output_format: 'pdf' | 'excel' | 'email' | 'dashboard';
  is_active: boolean;
  last_generated_at?: string;
  next_scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export class ReportingService {
  // Report Template Management
  async createReportTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('report_templates')
      .insert({
        ...template,
        user_id: user.user.id,
        sections: template.sections || [],
        data_sources: template.data_sources || [],
        is_public: false,
        times_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getReportTemplates(): Promise<ReportTemplate[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .or(`user_id.eq.${user.user.id},is_public.eq.true`)
      .order('template_name');

    if (error) throw error;
    return data || [];
  }

  async getTemplateById(templateId: string): Promise<ReportTemplate | null> {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;
    return data;
  }

  // Report Generation
  async generateReport(
    templateId: string,
    options: {
      periodStart: Date;
      periodEnd: Date;
      comparisonPeriod?: { start: Date; end: Date };
      recipients?: string[];
      externalRecipients?: string[];
      format?: 'pdf' | 'excel' | 'pptx' | 'html';
    }
  ): Promise<GeneratedReport> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const template = await this.getTemplateById(templateId);
    if (!template) throw new Error('Report template not found');

    // Create report record
    const { data: report, error } = await supabase
      .from('generated_reports')
      .insert({
        report_template_id: templateId,
        user_id: user.user.id,
        report_name: `${template.template_name} - ${this.formatDate(options.periodEnd, 'MMM yyyy')}`,
        report_type: template.template_type,
        period_start: options.periodStart.toISOString().split('T')[0],
        period_end: options.periodEnd.toISOString().split('T')[0],
        comparison_period_start: options.comparisonPeriod?.start.toISOString().split('T')[0],
        comparison_period_end: options.comparisonPeriod?.end.toISOString().split('T')[0],
        recipients: options.recipients || [],
        external_recipients: options.externalRecipients || [],
        file_format: options.format || 'pdf',
        generation_status: 'generating',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update template usage
    await supabase
      .from('report_templates')
      .update({ times_used: template.times_used + 1 })
      .eq('id', templateId);

    // Generate report asynchronously
    this.processReportGeneration(report.id, template, options);

    return report;
  }

  private async processReportGeneration(
    reportId: string,
    template: ReportTemplate,
    options: any
  ): Promise<void> {
    try {
      const reportData: any = {};

      // Process each section
      for (const section of template.sections) {
        const sectionData = await this.generateSectionData(
          section,
          options.periodStart,
          options.periodEnd,
          options.comparisonPeriod
        );
        reportData[section.id] = sectionData;
      }

      // Generate executive summary
      const executiveSummary = await this.generateExecutiveSummary(
        reportData,
        options.periodStart,
        options.periodEnd
      );

      // Extract key findings
      const keyFindings = this.extractKeyFindings(reportData);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(reportData, keyFindings);

      // Update report with generated data
      await supabase
        .from('generated_reports')
        .update({
          report_data: reportData,
          executive_summary: executiveSummary,
          key_findings: keyFindings,
          recommendations: recommendations,
          generation_status: 'completed',
          generated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      // Generate file if needed
      const { data: report } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (report && report.file_format) {
        await this.generateReportFile(report);
      }

      // Send to recipients
      if (report && (report.recipients?.length || report.external_recipients?.length)) {
        await this.sendReport(report);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      await supabase
        .from('generated_reports')
        .update({
          generation_status: 'failed',
          report_data: { error: error.message }
        })
        .eq('id', reportId);
    }
  }

  private async generateSectionData(
    section: any,
    periodStart: Date,
    periodEnd: Date,
    comparisonPeriod?: { start: Date; end: Date }
  ): Promise<any> {
    const sectionData: any = {
      title: section.title,
      type: section.type,
      data: {}
    };

    switch (section.type) {
      case 'overview':
        sectionData.data = await this.generateOverviewData(periodStart, periodEnd);
        break;

      case 'kpi_summary':
        sectionData.data = await this.generateKPISummary(periodStart, periodEnd, comparisonPeriod);
        break;

      case 'pattern_insights':
        sectionData.data = await this.generatePatternInsights(periodStart, periodEnd);
        break;

      case 'competitive_landscape':
        sectionData.data = await this.generateCompetitiveLandscape(periodStart, periodEnd);
        break;

      case 'content_performance':
        sectionData.data = await this.generateContentPerformance(periodStart, periodEnd);
        break;

      case 'campaign_analysis':
        sectionData.data = await this.generateCampaignAnalysis(periodStart, periodEnd);
        break;

      case 'team_productivity':
        sectionData.data = await this.generateTeamProductivity(periodStart, periodEnd);
        break;

      case 'roi_analysis':
        sectionData.data = await this.generateROIAnalysis(periodStart, periodEnd);
        break;

      default:
        sectionData.data = { message: 'Section type not implemented' };
    }

    return sectionData;
  }

  private async generateOverviewData(periodStart: Date, periodEnd: Date): Promise<any> {
    const [businessHealth, insights, patterns, automations] = await Promise.all([
      businessContextService.calculateContextHealth(),
      insightsService.getInsights({ 
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString()
      }),
      patternRecognitionService.getDetectedPatterns(),
      automationService.getExecutionHistory()
    ]);

    return {
      period: {
        start: periodStart.toISOString().split('T')[0],
        end: periodEnd.toISOString().split('T')[0],
        days: Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
      },
      health_score: businessHealth.score,
      total_insights: insights.length,
      high_impact_insights: insights.filter(i => i.impact_score > 80).length,
      patterns_detected: patterns.length,
      automations_executed: automations.filter(
        a => new Date(a.started_at) >= periodStart && new Date(a.started_at) <= periodEnd
      ).length
    };
  }

  private async generateKPISummary(
    periodStart: Date,
    periodEnd: Date,
    comparisonPeriod?: { start: Date; end: Date }
  ): Promise<any> {
    const metrics = await analyticsService.getMetricDefinitions();
    const kpiData: any[] = [];

    for (const metric of metrics.slice(0, 10)) { // Top 10 KPIs
      const currentData = await analyticsService.getMetricData(
        metric.id,
        this.calculateTimeRange(periodStart, periodEnd)
      );

      let comparisonData = null;
      if (comparisonPeriod) {
        comparisonData = await analyticsService.getMetricData(
          metric.id,
          this.calculateTimeRange(comparisonPeriod.start, comparisonPeriod.end)
        );
      }

      const currentValue = this.calculateAggregateValue(currentData, metric.calculation_type);
      const comparisonValue = comparisonData 
        ? this.calculateAggregateValue(comparisonData, metric.calculation_type)
        : null;

      kpiData.push({
        metric_name: metric.metric_name,
        metric_type: metric.metric_type,
        current_value: currentValue,
        comparison_value: comparisonValue,
        change: comparisonValue 
          ? ((currentValue - comparisonValue) / comparisonValue) * 100 
          : null,
        target_value: metric.target_value,
        target_achievement: metric.target_value 
          ? (currentValue / metric.target_value) * 100 
          : null,
        status: this.getMetricStatus(currentValue, metric)
      });
    }

    return {
      kpis: kpiData,
      summary: {
        improving: kpiData.filter(k => k.change && k.change > 0).length,
        declining: kpiData.filter(k => k.change && k.change < 0).length,
        on_target: kpiData.filter(k => k.status === 'on_target').length,
        at_risk: kpiData.filter(k => k.status === 'at_risk').length
      }
    };
  }

  private async generatePatternInsights(periodStart: Date, periodEnd: Date): Promise<any> {
    const [patterns, insights] = await Promise.all([
      patternRecognitionService.getDetectedPatterns(),
      insightsService.getInsights({
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString()
      })
    ]);

    const periodPatterns = patterns.filter(
      p => new Date(p.created_at) >= periodStart && new Date(p.created_at) <= periodEnd
    );

    return {
      total_patterns: periodPatterns.length,
      patterns_by_type: this.groupBy(periodPatterns, 'pattern_type'),
      patterns_by_category: this.groupBy(periodPatterns, 'pattern_category'),
      insights_generated: insights.length,
      insights_by_type: this.groupBy(insights, 'insight_type'),
      implemented_insights: insights.filter(i => i.status === 'implemented').length,
      average_impact_score: insights.length > 0
        ? insights.reduce((sum, i) => sum + i.impact_score, 0) / insights.length
        : 0,
      top_insights: insights
        .sort((a, b) => b.impact_score - a.impact_score)
        .slice(0, 5)
        .map(i => ({
          title: i.title,
          impact_score: i.impact_score,
          category: i.insight_category,
          status: i.status
        }))
    };
  }

  private async generateCompetitiveLandscape(periodStart: Date, periodEnd: Date): Promise<any> {
    const [competitors, features, swot] = await Promise.all([
      competitiveContextService.getCompetitors(),
      competitiveContextService.getFeatureComparisons(),
      competitiveContextService.getSWOTAnalysis()
    ]);

    const newCompetitors = competitors.filter(
      c => new Date(c.created_at) >= periodStart && new Date(c.created_at) <= periodEnd
    );

    return {
      total_competitors: competitors.length,
      new_competitors: newCompetitors.length,
      feature_comparisons: features.length,
      competitive_advantages: features.filter(
        f => f.our_status === 'available' && f.comparison_notes?.includes('advantage')
      ).length,
      competitive_gaps: features.filter(
        f => f.our_status === 'not_available' && 
        competitors.some(c => f[`competitor_${c.id}_status`] === 'available')
      ).length,
      swot_summary: {
        strengths: swot.filter(s => s.category === 'strengths').length,
        weaknesses: swot.filter(s => s.category === 'weaknesses').length,
        opportunities: swot.filter(s => s.category === 'opportunities').length,
        threats: swot.filter(s => s.category === 'threats').length
      }
    };
  }

  private async generateContentPerformance(periodStart: Date, periodEnd: Date): Promise<any> {
    const contentMetrics = await analyticsService.getMetricDefinitions('engagement');
    const performanceData: any[] = [];

    for (const metric of contentMetrics) {
      const data = await analyticsService.getMetricData(
        metric.id,
        this.calculateTimeRange(periodStart, periodEnd)
      );

      if (data.length > 0) {
        performanceData.push({
          metric: metric.metric_name,
          average_value: this.calculateAggregateValue(data, 'average'),
          peak_value: Math.max(...data.map(d => d.value)),
          trend: this.calculateTrend(data)
        });
      }
    }

    return {
      metrics: performanceData,
      best_performing_content: [], // This would come from content-specific tracking
      content_recommendations: [
        'Focus on topics that generated highest engagement',
        'Optimize posting times based on engagement patterns',
        'Test new content formats based on competitor analysis'
      ]
    };
  }

  private async generateCampaignAnalysis(periodStart: Date, periodEnd: Date): Promise<any> {
    // Placeholder - would integrate with campaign tracking
    return {
      total_campaigns: 8,
      active_campaigns: 3,
      completed_campaigns: 5,
      average_roi: 2.8,
      total_spend: 50000,
      total_revenue: 140000,
      top_campaigns: [
        { name: 'Q4 Launch', roi: 4.2, status: 'completed' },
        { name: 'Holiday Promo', roi: 3.5, status: 'active' },
        { name: 'Partner Campaign', roi: 2.1, status: 'completed' }
      ]
    };
  }

  private async generateTeamProductivity(periodStart: Date, periodEnd: Date): Promise<any> {
    const [teamMembers, workflows, automations] = await Promise.all([
      supabase.from('team_members').select('*').eq('is_active', true),
      automationService.getActiveWorkflows(),
      automationService.getExecutionHistory()
    ]);

    const periodAutomations = automations.filter(
      a => new Date(a.started_at) >= periodStart && new Date(a.started_at) <= periodEnd
    );

    return {
      team_size: teamMembers.data?.length || 0,
      workflows_completed: workflows.filter(w => w.status === 'completed').length,
      automations_run: periodAutomations.length,
      time_saved_hours: Math.round(periodAutomations.length * 2.5), // Estimate
      tasks_automated: periodAutomations.filter(a => a.status === 'success').length
    };
  }

  private async generateROIAnalysis(periodStart: Date, periodEnd: Date): Promise<any> {
    const roiMetrics = await analyticsService.getMetricDefinitions('revenue');
    const investmentMetrics = await analyticsService.getMetricDefinitions('operational');
    
    let totalRevenue = 0;
    let totalInvestment = 0;

    for (const metric of roiMetrics) {
      const data = await analyticsService.getMetricData(
        metric.id,
        this.calculateTimeRange(periodStart, periodEnd)
      );
      totalRevenue += this.calculateAggregateValue(data, 'sum');
    }

    for (const metric of investmentMetrics) {
      const data = await analyticsService.getMetricData(
        metric.id,
        this.calculateTimeRange(periodStart, periodEnd)
      );
      totalInvestment += this.calculateAggregateValue(data, 'sum');
    }

    const roi = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0;

    return {
      total_revenue: totalRevenue,
      total_investment: totalInvestment,
      roi_percentage: roi,
      revenue_by_channel: {}, // Would be populated with actual channel data
      cost_breakdown: {}, // Would be populated with actual cost data
      efficiency_metrics: {
        cost_per_lead: totalInvestment / 100, // Placeholder
        customer_acquisition_cost: totalInvestment / 50, // Placeholder
        lifetime_value: totalRevenue / 50 // Placeholder
      }
    };
  }

  private async generateExecutiveSummary(
    reportData: any,
    periodStart: Date,
    periodEnd: Date
  ): Promise<string> {
    const overview = reportData.overview?.data;
    const kpis = reportData.kpi_summary?.data;
    const insights = reportData.pattern_insights?.data;

    const period = `${this.formatDate(periodStart, 'MMM d, yyyy')} to ${this.formatDate(periodEnd, 'MMM d, yyyy')}`;
    
    return `
During the reporting period from ${period}, the marketing organization achieved significant progress across key initiatives.

Platform Health & Performance:
The Context Marketing platform maintained a health score of ${overview?.health_score || 0}%, with ${overview?.total_insights || 0} insights generated, including ${overview?.high_impact_insights || 0} high-impact recommendations. Pattern recognition identified ${overview?.patterns_detected || 0} significant patterns, and ${overview?.automations_executed || 0} automated workflows were successfully executed.

Key Performance Indicators:
${kpis?.summary?.improving || 0} KPIs showed improvement, while ${kpis?.summary?.declining || 0} declined compared to the previous period. ${kpis?.summary?.on_target || 0} metrics are on target, with ${kpis?.summary?.at_risk || 0} requiring attention.

AI-Driven Insights:
The AI system generated ${insights?.insights_generated || 0} actionable insights with an average impact score of ${Math.round(insights?.average_impact_score || 0)}%. ${insights?.implemented_insights || 0} insights have been successfully implemented, contributing to improved marketing performance.

Strategic Recommendations:
Based on the analysis, the key recommendations for the next period include:
1. Focus on implementing high-impact insights to maximize ROI
2. Address declining KPIs through targeted optimization efforts
3. Leverage competitive intelligence to maintain market position
4. Continue automation expansion to improve operational efficiency
    `.trim();
  }

  private extractKeyFindings(reportData: any): any[] {
    const findings: any[] = [];

    // Extract findings from each section
    if (reportData.overview?.data) {
      if (reportData.overview.data.high_impact_insights > 10) {
        findings.push({
          category: 'insights',
          finding: `Generated ${reportData.overview.data.high_impact_insights} high-impact insights`,
          impact: 'high',
          recommendation: 'Prioritize implementation of top insights'
        });
      }
    }

    if (reportData.kpi_summary?.data) {
      const declining = reportData.kpi_summary.data.summary.declining;
      if (declining > 3) {
        findings.push({
          category: 'performance',
          finding: `${declining} KPIs showing decline`,
          impact: 'high',
          recommendation: 'Investigate root causes and implement corrective actions'
        });
      }
    }

    if (reportData.competitive_landscape?.data) {
      if (reportData.competitive_landscape.data.competitive_gaps > 5) {
        findings.push({
          category: 'competitive',
          finding: `${reportData.competitive_landscape.data.competitive_gaps} competitive feature gaps identified`,
          impact: 'medium',
          recommendation: 'Prioritize roadmap to address critical gaps'
        });
      }
    }

    return findings;
  }

  private async generateRecommendations(reportData: any, keyFindings: any[]): Promise<any[]> {
    const recommendations: any[] = [];

    // Generate recommendations based on findings
    for (const finding of keyFindings) {
      recommendations.push({
        priority: finding.impact === 'high' ? 'urgent' : 'normal',
        category: finding.category,
        recommendation: finding.recommendation,
        expected_impact: this.estimateImpact(finding),
        timeline: finding.impact === 'high' ? '1-2 weeks' : '1 month',
        resources_required: this.estimateResources(finding)
      });
    }

    // Add standard recommendations
    if (reportData.pattern_insights?.data?.implemented_insights < reportData.pattern_insights?.data?.insights_generated * 0.5) {
      recommendations.push({
        priority: 'normal',
        category: 'insights',
        recommendation: 'Increase insight implementation rate',
        expected_impact: '15-20% performance improvement',
        timeline: '2-4 weeks',
        resources_required: 'Marketing team bandwidth'
      });
    }

    return recommendations.sort((a, b) => 
      a.priority === 'urgent' ? -1 : b.priority === 'urgent' ? 1 : 0
    );
  }

  private estimateImpact(finding: any): string {
    switch (finding.category) {
      case 'insights':
        return '10-25% improvement in marketing efficiency';
      case 'performance':
        return '15-30% recovery in declining metrics';
      case 'competitive':
        return 'Maintain or improve market position';
      default:
        return 'Moderate positive impact';
    }
  }

  private estimateResources(finding: any): string {
    switch (finding.impact) {
      case 'high':
        return 'Full team focus for 1-2 weeks';
      case 'medium':
        return 'Part-time resources for 2-4 weeks';
      default:
        return 'Standard team allocation';
    }
  }

  private async generateReportFile(report: GeneratedReport): Promise<void> {
    // In a real implementation, this would use a library like jsPDF, xlsx, or pptx
    // For now, we'll simulate file generation
    const fileSize = Math.round(500000 + Math.random() * 1000000); // 500KB - 1.5MB
    const fileUrl = `/reports/${report.id}.${report.file_format}`;

    await supabase
      .from('generated_reports')
      .update({
        file_url: fileUrl,
        file_size_bytes: fileSize
      })
      .eq('id', report.id);
  }

  private async sendReport(report: GeneratedReport): Promise<void> {
    // In a real implementation, this would send emails or notifications
    await supabase
      .from('generated_reports')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', report.id);

    // Send notifications to recipients
    for (const recipientId of report.recipients || []) {
      await supabase.from('notifications').insert({
        user_id: report.user_id,
        recipient_id: recipientId,
        notification_type: 'system',
        title: 'New Report Available',
        message: `${report.report_name} is ready to view`,
        entity_type: 'report',
        entity_id: report.id,
        created_at: new Date().toISOString()
      });
    }
  }

  // Scheduled Reports
  async createScheduledReport(scheduledReport: Partial<ScheduledReport>): Promise<ScheduledReport> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const nextScheduled = this.calculateNextScheduledTime(
      scheduledReport.schedule_frequency!,
      scheduledReport.schedule_day,
      scheduledReport.schedule_time!
    );

    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert({
        ...scheduledReport,
        user_id: user.user.id,
        is_active: true,
        next_scheduled_at: nextScheduled.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getScheduledReports(): Promise<ScheduledReport[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('user_id', user.user.id)
      .order('report_name');

    if (error) throw error;
    return data || [];
  }

  async runScheduledReport(scheduledReportId: string): Promise<void> {
    const { data: scheduledReport } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', scheduledReportId)
      .single();

    if (!scheduledReport || !scheduledReport.is_active) return;

    // Calculate period based on frequency
    const { periodStart, periodEnd } = this.calculateReportPeriod(scheduledReport.schedule_frequency);

    // Generate report
    await this.generateReport(scheduledReport.report_template_id, {
      periodStart,
      periodEnd,
      recipients: scheduledReport.recipients,
      externalRecipients: scheduledReport.external_emails,
      format: scheduledReport.output_format as any
    });

    // Update last generated and next scheduled
    const nextScheduled = this.calculateNextScheduledTime(
      scheduledReport.schedule_frequency,
      scheduledReport.schedule_day,
      scheduledReport.schedule_time
    );

    await supabase
      .from('scheduled_reports')
      .update({
        last_generated_at: new Date().toISOString(),
        next_scheduled_at: nextScheduled.toISOString()
      })
      .eq('id', scheduledReportId);
  }

  // Data Quality
  async createDataQualityRule(rule: Partial<DataQualityRule>): Promise<DataQualityRule> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('data_quality_rules')
      .insert({
        ...rule,
        user_id: user.user.id,
        auto_fix: false,
        alert_on_violation: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async runDataQualityCheck(domain?: string): Promise<DataQualityScore[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const domains = domain ? [domain] : ['business', 'product', 'competitive', 'insights'];
    const scores: DataQualityScore[] = [];

    for (const d of domains) {
      const score = await analyticsService.checkDataQuality(d);
      scores.push(score);
    }

    return scores;
  }

  // Utility Methods
  private calculateTimeRange(start: Date, end: Date): string {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days}d`;
  }

  private calculateAggregateValue(data: any[], type: string): number {
    if (data.length === 0) return 0;

    switch (type) {
      case 'sum':
        return data.reduce((sum, d) => sum + d.value, 0);
      case 'average':
        return data.reduce((sum, d) => sum + d.value, 0) / data.length;
      case 'count':
        return data.length;
      case 'percentage':
        return (data.filter(d => d.value).length / data.length) * 100;
      default:
        return data[0]?.value || 0;
    }
  }

  private calculateTrend(data: any[]): string {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = this.calculateAggregateValue(firstHalf, 'average');
    const secondAvg = this.calculateAggregateValue(secondHalf, 'average');

    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  private getMetricStatus(value: number, metric: any): string {
    if (metric.target_value) {
      const achievement = (value / metric.target_value) * 100;
      if (achievement >= 100) return 'exceeded';
      if (achievement >= 90) return 'on_target';
      if (achievement >= 70) return 'below_target';
      return 'at_risk';
    }

    if (metric.threshold_critical && value <= metric.threshold_critical) return 'critical';
    if (metric.threshold_warning && value <= metric.threshold_warning) return 'warning';
    return 'normal';
  }

  private groupBy(array: any[], key: string): any {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  }

  private calculateNextScheduledTime(
    frequency: string,
    scheduleDay?: number,
    scheduleTime: string = '09:00'
  ): Date {
    const now = new Date();
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const next = new Date();
    
    next.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;
        
      case 'weekly':
        const targetDay = scheduleDay || 1; // Monday by default
        next.setDate(next.getDate() + ((targetDay + 7 - next.getDay()) % 7));
        if (next <= now) {
          next.setDate(next.getDate() + 7);
        }
        break;
        
      case 'monthly':
        const targetDate = scheduleDay || 1;
        next.setDate(targetDate);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        break;
        
      case 'quarterly':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const nextQuarter = currentQuarter + 1;
        next.setMonth(nextQuarter * 3);
        next.setDate(1);
        break;
    }

    return next;
  }

  private calculateReportPeriod(frequency: string): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = new Date();

    switch (frequency) {
      case 'daily':
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 1);
        break;
        
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 7);
        break;
        
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
        
      case 'quarterly':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        periodEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
        break;
        
      default:
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 30);
    }

    return { periodStart, periodEnd };
  }

  private formatDate(date: Date, format: string): string {
    return analyticsService.format(date, format);
  }

  // Create default report templates
  async createDefaultTemplates(): Promise<void> {
    const templates = [
      {
        name: 'Executive Summary Report',
        type: 'executive_summary' as const,
        description: 'High-level overview for leadership',
        sections: [
          { id: 'overview', type: 'overview', title: 'Executive Overview' },
          { id: 'kpi_summary', type: 'kpi_summary', title: 'Key Performance Indicators' },
          { id: 'pattern_insights', type: 'pattern_insights', title: 'AI Insights & Patterns' },
          { id: 'competitive_landscape', type: 'competitive_landscape', title: 'Competitive Position' },
          { id: 'roi_analysis', type: 'roi_analysis', title: 'ROI Analysis' }
        ],
        data_sources: ['internal', 'ai_insights', 'competitive']
      },
      {
        name: 'Marketing Performance Report',
        type: 'performance_report' as const,
        description: 'Detailed marketing metrics and analysis',
        sections: [
          { id: 'kpi_summary', type: 'kpi_summary', title: 'Performance Metrics' },
          { id: 'content_performance', type: 'content_performance', title: 'Content Analytics' },
          { id: 'campaign_analysis', type: 'campaign_analysis', title: 'Campaign Performance' },
          { id: 'team_productivity', type: 'team_productivity', title: 'Team Productivity' }
        ],
        data_sources: ['internal', 'analytics', 'automation']
      },
      {
        name: 'Competitive Intelligence Report',
        type: 'competitive_analysis' as const,
        description: 'Market position and competitor insights',
        sections: [
          { id: 'competitive_landscape', type: 'competitive_landscape', title: 'Market Landscape' },
          { id: 'pattern_insights', type: 'pattern_insights', title: 'Competitive Patterns' }
        ],
        data_sources: ['competitive', 'ai_insights']
      }
    ];

    for (const template of templates) {
      await this.createReportTemplate(template);
    }
  }
}

export const reportingService = new ReportingService();