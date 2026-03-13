// src/services/demo-agent/seeders/marketing/automation-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { daysAgo, randomBetween } from '../../templates/base-template';

export async function seedAutomation(userId: string, template: IndustryTemplate): Promise<void> {
  // Autonomous decisions
  const decisions = [
    {
      user_id: userId, type: 'budget_reallocation', title: `Reallocate ad budget from Facebook to LinkedIn`,
      description: `LinkedIn campaigns show 34% higher conversion rate for ${template.industry} audience. Recommend shifting €2,000 from Facebook display to LinkedIn Sponsored Content.`,
      priority: 'high', confidence: 0.89, estimated_impact: { revenue_increase: 15000, cost_savings: 2000 },
      risk_level: 'low', cost_estimate: 0, requires_approval: true, status: 'pending',
      decision_data: { from_channel: 'facebook', to_channel: 'linkedin', amount: 2000, reason: 'Higher B2B conversion rate' },
    },
    {
      user_id: userId, type: 'content_publish', title: `Auto-publish trending ${template.industry} content`,
      description: `AI detected surge in interest for "${template.content[0]?.tags?.[0] || 'industry topic'}". Publishing prepared content within optimal engagement window.`,
      priority: 'medium', confidence: 0.92, estimated_impact: { impressions: 25000, leads: 12 },
      risk_level: 'low', cost_estimate: 0, requires_approval: false, status: 'approved',
      decision_data: { content_id: 'auto', topic: template.content[0]?.tags?.[0], channels: ['linkedin', 'twitter'] },
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
