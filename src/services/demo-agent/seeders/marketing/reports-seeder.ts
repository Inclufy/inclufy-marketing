// src/services/demo-agent/seeders/marketing/reports-seeder.ts
// Seeds report_templates, generated_reports, scheduled_reports for Rapportencentrum
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { daysAgo, daysFromNow, randomBetween } from '../../templates/base-template';

export async function seedReports(userId: string, template: IndustryTemplate): Promise<void> {
  // ── 1. Report Templates ──
  const reportTemplates = [
    {
      user_id: userId,
      template_name: 'Executive Summary Report',
      template_type: 'executive_summary',
      description: `High-level overview of ${template.brand.name} marketing performance for leadership`,
      sections: [
        { id: 'overview', type: 'overview', title: 'Executive Overview' },
        { id: 'kpi_summary', type: 'kpi_summary', title: 'Key Performance Indicators' },
        { id: 'pattern_insights', type: 'pattern_insights', title: 'AI Insights & Patterns' },
        { id: 'competitive_landscape', type: 'competitive_landscape', title: 'Competitive Position' },
        { id: 'roi_analysis', type: 'roi_analysis', title: 'ROI Analysis' },
      ],
      data_sources: ['internal', 'ai_insights', 'competitive'],
      is_public: false,
      category: 'leadership',
      tags: ['executive', 'monthly', 'overview'],
      times_used: randomBetween(5, 15),
    },
    {
      user_id: userId,
      template_name: 'Marketing Performance Report',
      template_type: 'performance_report',
      description: `Detailed ${template.industry} marketing metrics and campaign analysis`,
      sections: [
        { id: 'kpi_summary', type: 'kpi_summary', title: 'Performance Metrics' },
        { id: 'content_performance', type: 'content_performance', title: 'Content Analytics' },
        { id: 'campaign_analysis', type: 'campaign_analysis', title: 'Campaign Performance' },
        { id: 'team_productivity', type: 'team_productivity', title: 'Team Productivity' },
      ],
      data_sources: ['internal', 'analytics', 'automation'],
      is_public: false,
      category: 'marketing',
      tags: ['performance', 'weekly', 'campaigns'],
      times_used: randomBetween(10, 30),
    },
    {
      user_id: userId,
      template_name: 'Competitive Intelligence Report',
      template_type: 'competitive_analysis',
      description: `${template.industry} market position and competitor insights`,
      sections: [
        { id: 'competitive_landscape', type: 'competitive_landscape', title: 'Market Landscape' },
        { id: 'pattern_insights', type: 'pattern_insights', title: 'Competitive Patterns' },
      ],
      data_sources: ['competitive', 'ai_insights'],
      is_public: false,
      category: 'competitive',
      tags: ['competitive', 'quarterly', 'strategy'],
      times_used: randomBetween(3, 10),
    },
    {
      user_id: userId,
      template_name: 'ROI & Attribution Report',
      template_type: 'roi_analysis',
      description: `Marketing ROI analysis with multi-touch attribution for ${template.brand.name}`,
      sections: [
        { id: 'roi_analysis', type: 'roi_analysis', title: 'ROI Overview' },
        { id: 'campaign_analysis', type: 'campaign_analysis', title: 'Campaign ROI' },
        { id: 'kpi_summary', type: 'kpi_summary', title: 'Revenue KPIs' },
      ],
      data_sources: ['internal', 'analytics', 'attribution'],
      is_public: false,
      category: 'finance',
      tags: ['roi', 'attribution', 'monthly'],
      times_used: randomBetween(4, 12),
    },
  ];
  const { data: templateData, error: tError } = await marketingSupabase
    .from('report_templates')
    .insert(reportTemplates)
    .select('id, template_name, template_type');
  if (tError) console.error('report_templates seed error:', tError);

  // ── 2. Generated Reports (historical reports already produced) ──
  const templateIds = templateData || [];
  const generatedReports = [
    {
      user_id: userId,
      report_template_id: templateIds[0]?.id || null,
      report_name: `Executive Summary - ${new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}`,
      report_type: 'executive_summary',
      period_start: daysAgo(30).split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      report_data: {
        overview: { health_score: 87, total_insights: 23, high_impact_insights: 8 },
        kpis: { improving: 7, declining: 2, on_target: 6, at_risk: 1 },
      },
      executive_summary: `During this reporting period, ${template.brand.name} achieved significant marketing momentum in the ${template.industry} sector. Key highlights include a 34% increase in qualified leads, 28% improvement in engagement rates, and 2.8x marketing ROI. The AI-driven optimization resulted in €${randomBetween(50, 150)}K in marketing-attributed revenue.`,
      key_findings: [
        { category: 'performance', finding: 'LinkedIn campaigns outperform all other channels by 34%', impact: 'high' },
        { category: 'competitive', finding: `${template.competitors[0]?.name} losing market share due to pricing`, impact: 'medium' },
        { category: 'insights', finding: 'AI content optimization increased engagement by 28%', impact: 'high' },
      ],
      recommendations: [
        { priority: 'urgent', category: 'budget', recommendation: 'Shift 25% of Facebook budget to LinkedIn', timeline: '1 week' },
        { priority: 'normal', category: 'content', recommendation: 'Launch thought leadership series for Q2', timeline: '2 weeks' },
      ],
      file_format: 'pdf',
      file_size_bytes: randomBetween(500000, 1500000),
      generation_status: 'completed',
      generated_at: daysAgo(2),
    },
    {
      user_id: userId,
      report_template_id: templateIds[1]?.id || null,
      report_name: `Marketing Performance - Week ${Math.ceil(new Date().getDate() / 7)}`,
      report_type: 'performance_report',
      period_start: daysAgo(7).split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      report_data: {
        campaigns: { active: 5, completed: 3, total_spend: randomBetween(8000, 25000) },
        content: { published: 12, engagement_rate: 8.4, top_type: 'LinkedIn carousel' },
      },
      executive_summary: `This week's marketing performance shows strong momentum across all channels. Content engagement hit an all-time high of 8.4%, driven by LinkedIn carousel posts and AI-optimized email subject lines.`,
      key_findings: [
        { category: 'content', finding: 'Carousel posts generate 3.2x more engagement than single images', impact: 'high' },
        { category: 'email', finding: 'AI-optimized subject lines improved open rate by 12%', impact: 'medium' },
      ],
      file_format: 'pdf',
      file_size_bytes: randomBetween(400000, 1200000),
      generation_status: 'completed',
      generated_at: daysAgo(1),
    },
    {
      user_id: userId,
      report_template_id: templateIds[2]?.id || null,
      report_name: `Competitive Intelligence - Q1 2026`,
      report_type: 'competitive_analysis',
      period_start: '2026-01-01',
      period_end: '2026-03-14',
      report_data: {
        competitors_tracked: template.competitors.length,
        feature_gaps: 3,
        market_position: 'challenger',
      },
      executive_summary: `Q1 competitive analysis reveals ${template.brand.name} strengthening its position in the ${template.industry} market. Key competitor ${template.competitors[0]?.name} faces customer churn, creating acquisition opportunities. Three feature gaps identified and added to product roadmap.`,
      key_findings: [
        { category: 'competitive', finding: `${template.competitors[0]?.name} customer satisfaction declined 15%`, impact: 'high' },
        { category: 'market', finding: 'New regulation creating demand for compliant solutions', impact: 'high' },
      ],
      file_format: 'pdf',
      file_size_bytes: randomBetween(600000, 1800000),
      generation_status: 'completed',
      generated_at: daysAgo(5),
    },
  ];
  const { error: grError } = await marketingSupabase.from('generated_reports').insert(generatedReports);
  if (grError) console.error('generated_reports seed error:', grError);

  // ── 3. Scheduled Reports ──
  const scheduledReports = [
    {
      user_id: userId,
      report_template_id: templateIds[0]?.id || null,
      report_name: 'Monthly Executive Summary',
      schedule_frequency: 'monthly',
      schedule_day: 1,
      schedule_time: '09:00',
      recipients: [userId],
      output_format: 'pdf',
      is_active: true,
      last_generated_at: daysAgo(28),
      next_scheduled_at: daysFromNow(2),
    },
    {
      user_id: userId,
      report_template_id: templateIds[1]?.id || null,
      report_name: 'Weekly Performance Report',
      schedule_frequency: 'weekly',
      schedule_day: 1,
      schedule_time: '08:00',
      recipients: [userId],
      output_format: 'pdf',
      is_active: true,
      last_generated_at: daysAgo(5),
      next_scheduled_at: daysFromNow(2),
    },
  ];
  const { error: srError } = await marketingSupabase.from('scheduled_reports').insert(scheduledReports);
  if (srError) console.error('scheduled_reports seed error:', srError);
}
