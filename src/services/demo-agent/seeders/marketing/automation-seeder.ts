// src/services/demo-agent/seeders/marketing/automation-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { daysAgo, randomBetween } from '../../templates/base-template';

export async function seedAutomation(userId: string, template: IndustryTemplate): Promise<void> {
  // Autonomous decisions — estimated_impact must be JSONB (not a bare string)
  // Also include decision_type for pre-migration schema compat.
  const decisions = [
    {
      user_id: userId, type: 'budget_allocation', decision_type: 'budget_allocation',
      title: `Reallocate ad budget from Facebook to LinkedIn`,
      description: `LinkedIn campaigns show 34% higher conversion rate for ${template.industry} audience. Recommend shifting €2,000 from Facebook display to LinkedIn Sponsored Content.`,
      priority: 'high', confidence: 89,
      estimated_impact: { description: '+€15K revenue, -€2K cost', revenue: 15000, cost_savings: 2000 },
      risk_level: 'low', cost_estimate: 0, requires_approval: true, status: 'pending',
      decision_data: { from_channel: 'facebook', to_channel: 'linkedin', amount: 2000, reason: 'Higher B2B conversion rate' },
    },
    {
      user_id: userId, type: 'campaign_creation', decision_type: 'campaign_creation',
      title: `Auto-publish trending ${template.industry} content`,
      description: `AI detected surge in interest for "${template.content[0]?.tags?.[0] || 'industry topic'}". Publishing prepared content within optimal engagement window.`,
      priority: 'medium', confidence: 92,
      estimated_impact: { description: '+25K impressions, 12 leads', impressions: 25000, leads: 12 },
      risk_level: 'low', cost_estimate: 0, requires_approval: false, status: 'pending',
      decision_data: { content_id: 'auto', topic: template.content[0]?.tags?.[0], channels: ['linkedin', 'twitter'] },
    },
    {
      user_id: userId, type: 'targeting_adjustment', decision_type: 'targeting_adjustment',
      title: `Expand ${template.industry} audience targeting on Google Ads`,
      description: `Similar audience analysis found 3 new high-intent segments in ${template.industry}. Adding these segments could increase qualified traffic by 28%.`,
      priority: 'high', confidence: 85,
      estimated_impact: { description: '+28% qualified traffic', traffic_increase: 28, leads: 35 },
      risk_level: 'medium', cost_estimate: 1500, requires_approval: true, status: 'pending',
      decision_data: { platform: 'google_ads', segments: ['segment_a', 'segment_b', 'segment_c'], reason: 'Lookalike analysis' },
    },
    {
      user_id: userId, type: 'content_generation', decision_type: 'content_generation',
      title: `Generate ${template.industry} compliance checklist`,
      description: `Search trends show 340% spike in "${template.industry} compliance" queries. Auto-generating a downloadable checklist as lead magnet.`,
      priority: 'critical', confidence: 94,
      estimated_impact: { description: '+500 downloads, 85 MQLs', downloads: 500, mqls: 85 },
      risk_level: 'low', cost_estimate: 0, requires_approval: true, status: 'pending',
      decision_data: { content_type: 'lead_magnet', format: 'pdf', topic: `${template.industry} compliance` },
    },
  ];
  const { error: decisionError } = await marketingSupabase.from('autonomous_decisions').insert(decisions);
  if (decisionError) console.error('autonomous_decisions seed error:', decisionError);

  // QR codes
  const qrCodes = [
    { user_id: userId, name: `${template.events[0]?.name || 'Event'} — Booth QR`, url: `https://${template.brand.name.toLowerCase().replace(/\s/g, '')}.com/event-demo`, scans: randomBetween(45, 120), leads_captured: randomBetween(15, 45), active: true },
    { user_id: userId, name: `${template.brand.name} — Product Demo QR`, url: `https://${template.brand.name.toLowerCase().replace(/\s/g, '')}.com/demo`, scans: randomBetween(80, 200), leads_captured: randomBetween(25, 65), active: true },
    { user_id: userId, name: `${template.brand.name} — Business Card QR`, url: `https://${template.brand.name.toLowerCase().replace(/\s/g, '')}.com/connect`, scans: randomBetween(30, 80), leads_captured: randomBetween(10, 30), active: true },
  ];
  const { error: qrError } = await marketingSupabase.from('qr_codes').insert(qrCodes);
  if (qrError) console.error('qr_codes seed error:', qrError);
}
