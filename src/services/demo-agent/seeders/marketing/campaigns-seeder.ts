// src/services/demo-agent/seeders/marketing/campaigns-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { daysAgo, daysFromNow, randomBetween } from '../../templates/base-template';

export async function seedCampaigns(userId: string, template: IndustryTemplate): Promise<void> {
  // ── 1. campaigns table (used by CampaignOrchestrator, Analytics, Dashboard) ──
  const campaignTypes = ['email', 'social', 'content', 'paid', 'event'];
  const campaignStatuses = ['active', 'active', 'completed', 'draft', 'paused'];
  const campaigns = template.campaigns.map((c, i) => ({
    user_id: userId,
    name: c.name,
    type: campaignTypes[i % campaignTypes.length],
    description: c.description,
    status: campaignStatuses[i % campaignStatuses.length],
    budget_amount: c.budget_total || randomBetween(5000, 25000),
    starts_at: daysAgo(randomBetween(5, 30)),
    ends_at: daysFromNow(randomBetween(10, 60)),
    content: { objective: c.objective, channels: ['email', 'linkedin', 'blog'] },
    settings: { ai_managed: c.ai_managed, performance_score: c.performance_score },
  }));
  const { error: mainCampError } = await marketingSupabase.from('campaigns').insert(campaigns);
  if (mainCampError) console.error('campaigns seed error:', mainCampError);

  // ── 2. autonomous_campaign_status (used by AutonomousMarketing) ──
  const autonomousCampaigns = template.campaigns.map((c) => ({
    user_id: userId,
    name: c.name,
    description: c.description,
    status: c.status,
    objective: c.objective,
    budget_total: c.budget_total,
    budget_spent: c.budget_spent,
    days_remaining: c.days_remaining,
    roi: c.roi,
    conversions: c.conversions,
    ai_managed: c.ai_managed,
    performance_score: c.performance_score,
  }));
  const { error: campError } = await marketingSupabase.from('autonomous_campaign_status').insert(autonomousCampaigns);
  if (campError) console.error('autonomous_campaign_status seed error:', campError);

  // ── 3. Campaign triggers ──
  const triggers = [
    {
      user_id: userId, name: 'High-Intent Lead Detected', type: 'behavioral',
      description: `Automatically launch nurture sequence when a lead visits pricing page 3+ times`,
      condition: { event: 'pricing_page_view', threshold: 3, timeframe: '7d' },
      status: 'active', actions: ['send_email_sequence', 'notify_sales', 'update_lead_score'],
      channels: ['email', 'slack'], budget_limit: 500, confidence_threshold: 0.85,
      requires_approval: false, times_triggered: randomBetween(15, 45), last_triggered: daysAgo(1),
      performance: { success_rate: 0.89, avg_conversion_time: '4.2 days', revenue_generated: randomBetween(15000, 45000) },
      enabled: true,
    },
    {
      user_id: userId, name: 'Competitor Mention Alert', type: 'competitive',
      description: `Trigger competitive content campaign when a lead engages with competitor content`,
      condition: { event: 'competitor_engagement', competitors: template.competitors.map(c => c.name) },
      status: 'active', actions: ['send_comparison_content', 'assign_to_sales', 'log_competitive_intel'],
      channels: ['email', 'linkedin'], budget_limit: 300, confidence_threshold: 0.75,
      requires_approval: false, times_triggered: randomBetween(8, 25), last_triggered: daysAgo(3),
      performance: { success_rate: 0.76, avg_conversion_time: '6.5 days', revenue_generated: randomBetween(8000, 20000) },
      enabled: true,
    },
    {
      user_id: userId, name: 'Event Follow-Up Automation', type: 'event',
      description: `Auto-send personalized follow-up within 24h of event contact capture`,
      condition: { event: 'contact_captured', source: 'event' },
      status: 'active', actions: ['send_personalized_email', 'create_deal', 'schedule_followup'],
      channels: ['email'], budget_limit: 200, confidence_threshold: 0.90,
      requires_approval: false, times_triggered: randomBetween(20, 60), last_triggered: daysAgo(5),
      performance: { success_rate: 0.92, avg_conversion_time: '3.1 days', revenue_generated: randomBetween(20000, 55000) },
      enabled: true,
    },
  ];
  const { error: triggerError } = await marketingSupabase.from('campaign_triggers').insert(triggers);
  if (triggerError) console.error('campaign_triggers seed error:', triggerError);

  // ── 4. Triggered campaigns ──
  const triggeredCampaigns = [
    {
      user_id: userId, trigger_name: 'High-Intent Lead Detected',
      campaign_name: `${template.brand.name} — Hot Lead Nurture`,
      signal: `${template.leads[0]?.name} visited pricing page 4 times in 3 days`,
      channels: ['email', 'linkedin'], budget_allocated: 450, status: 'active',
      launched_at: daysAgo(2),
      performance: { emails_sent: 3, open_rate: 67, click_rate: 34, meetings_booked: 1 },
      ai_reasoning: `Lead shows strong purchase intent based on repeated pricing page visits and content downloads. Recommended immediate nurture activation.`,
      content_generated: ['Personalized ROI calculation email', 'Case study matching their company profile'],
    },
    {
      user_id: userId, trigger_name: 'Competitor Mention Alert',
      campaign_name: `${template.brand.name} vs ${template.competitors[0]?.name} — Comparison Campaign`,
      signal: `${template.leads[2]?.name} downloaded ${template.competitors[0]?.name} comparison guide`,
      channels: ['email'], budget_allocated: 280, status: 'active',
      launched_at: daysAgo(4),
      performance: { emails_sent: 2, open_rate: 72, click_rate: 41, meetings_booked: 0 },
      ai_reasoning: `Competitive intelligence detected. Lead evaluating alternatives. Sending differentiation content to highlight our advantages.`,
      content_generated: ['Feature comparison matrix', 'Migration cost calculator'],
    },
    {
      user_id: userId, trigger_name: 'Event Follow-Up Automation',
      campaign_name: `${template.events[0]?.name || 'Industry Event'} — Post-Event Nurture`,
      signal: `5 new contacts captured at ${template.events[0]?.name || 'industry event'}`,
      channels: ['email', 'linkedin'], budget_allocated: 180, status: 'completed',
      launched_at: daysAgo(10),
      performance: { emails_sent: 15, open_rate: 58, click_rate: 28, meetings_booked: 3 },
      ai_reasoning: `Event contacts showing engagement signals. Deploying multi-touch follow-up sequence with personalized content based on event interactions.`,
      content_generated: ['Post-event thank you email', 'Exclusive demo invitation', 'Event highlights + product overview'],
    },
  ];
  const { error: triggeredError } = await marketingSupabase.from('triggered_campaigns').insert(triggeredCampaigns);
  if (triggeredError) console.error('triggered_campaigns seed error:', triggeredError);
}
