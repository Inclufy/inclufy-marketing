// src/services/demo-agent/seeders/marketing/opportunities-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { daysAgo, daysFromNow, randomBetween } from '../../templates/base-template';

export async function seedOpportunities(userId: string, template: IndustryTemplate): Promise<void> {
  // Opportunities
  const opportunities = [
    {
      user_id: userId, type: 'market_trend', title: `${template.industry} Digital Transformation Acceleration`,
      description: `Industry analysts report 45% increase in ${template.industry} digital transformation budgets. Companies actively seeking solutions like ${template.brand.name}.`,
      source: 'market_intelligence', priority: 'high', status: 'active', confidence: 0.88,
      estimated_impact: { value: randomBetween(200000, 500000), currency: 'EUR' }, estimated_reach: randomBetween(5000, 15000),
      trend_velocity: 0.78, relevance_score: 92, discovered_at: daysAgo(5), expires_at: daysFromNow(30),
      tags: ['digital-transformation', template.industry, 'growth'],
      suggested_actions: ['Launch targeted campaign', 'Create industry report', 'Reach out to top prospects'],
      related_keywords: ['digital transformation', template.industry + ' technology', 'automation'],
      campaign_suggestion: { suggestion: `Launch "${template.industry} Digital Transformation" thought leadership campaign`, type: 'campaign' },
    },
    {
      user_id: userId, type: 'competitor_weakness', title: `${template.competitors[0]?.name} Customer Dissatisfaction Spike`,
      description: `Social listening detected 3x increase in negative mentions of ${template.competitors[0]?.name}. Key complaints: poor support, outdated UI, high prices.`,
      source: 'competitive_intelligence', priority: 'critical', status: 'active', confidence: 0.82,
      estimated_impact: randomBetween(100000, 300000), estimated_reach: randomBetween(2000, 8000),
      trend_velocity: 0.65, relevance_score: 88, discovered_at: daysAgo(3), expires_at: daysFromNow(14),
      tags: ['competitive', 'acquisition', 'churn'],
      suggested_actions: ['Create migration campaign', 'Offer switch incentive', 'Target their customers with comparison ads'],
      related_keywords: [template.competitors[0]?.name || 'competitor', 'switch', 'alternative'],
      campaign_suggestion: { suggestion: `Launch "Switch from ${template.competitors[0]?.name}" migration program`, type: 'migration' },
    },
    {
      user_id: userId, type: 'partnership', title: `Strategic Partnership with ${template.industry} Association`,
      description: `${template.industry} professional association with 12,000+ members seeking technology partner for member benefits program.`,
      source: 'networking', priority: 'high', status: 'evaluating', confidence: 0.75,
      estimated_impact: { value: randomBetween(150000, 400000), currency: 'EUR' }, estimated_reach: 12000,
      trend_velocity: 0.50, relevance_score: 85, discovered_at: daysAgo(7), expires_at: daysFromNow(45),
      tags: ['partnership', 'channel', 'growth'],
      suggested_actions: ['Schedule exploratory meeting', 'Prepare partnership proposal', 'Create co-branded content plan'],
      related_keywords: [template.industry, 'association', 'partnership'],
      campaign_suggestion: { suggestion: `Develop co-branded webinar series with the association`, type: 'partnership' },
    },
    {
      user_id: userId, type: 'regulatory', title: `New ${template.industry} Regulation Creates Compliance Demand`,
      description: `Upcoming regulation requires all ${template.industry} organizations to adopt digital compliance by 2027. Creates urgent need for our platform.`,
      source: 'regulatory_monitoring', priority: 'high', status: 'active', confidence: 0.92,
      estimated_impact: randomBetween(300000, 800000), estimated_reach: randomBetween(10000, 30000),
      trend_velocity: 0.85, relevance_score: 95, discovered_at: daysAgo(10), expires_at: daysFromNow(180),
      tags: ['regulation', 'compliance', 'urgency'],
      suggested_actions: ['Create compliance guide', 'Launch webinar series', 'Build compliance calculator'],
      related_keywords: ['regulation', 'compliance', template.industry + ' standards'],
      campaign_suggestion: { suggestion: `Launch "${template.industry} Compliance Readiness" assessment campaign`, type: 'compliance' },
    },
  ];
  const { error: oppError } = await marketingSupabase.from('opportunities').insert(opportunities);
  if (oppError) console.error('opportunities seed error:', oppError);

  // Feed items
  const feedItems = [
    { user_id: userId, type: 'opportunity', title: `New Enterprise Lead from ${template.leads[0]?.company}`, description: `${template.leads[0]?.name} (${template.leads[0]?.title}) requested a demo. Lead score: ${template.leads[0]?.composite_score}/100.`, urgency: 'high', confidence: 0.92, estimated_value: template.leads[0]?.predicted_value || 50000, source: 'lead_scoring', is_read: false, is_actioned: false, is_dismissed: false, suggested_action: template.leads[0]?.next_best_action || 'Follow up within 24h', tags: ['enterprise', 'demo-request'] },
    { user_id: userId, type: 'insight', title: `${template.content[0]?.title} is going viral`, description: `Your latest content piece has 3x normal engagement. Consider boosting it with paid promotion.`, urgency: 'medium', confidence: 0.85, estimated_value: 15000, source: 'content_analytics', is_read: false, is_actioned: false, is_dismissed: false, suggested_action: 'Boost top-performing content with €500 ad budget', tags: ['content', 'viral', 'opportunity'] },
    { user_id: userId, type: 'alert', title: `Competitor ${template.competitors[0]?.name} launched new feature`, description: `${template.competitors[0]?.name} announced a new AI feature. Review our competitive positioning.`, urgency: 'medium', confidence: 0.78, estimated_value: 0, source: 'competitive_intelligence', is_read: true, is_actioned: false, is_dismissed: false, suggested_action: 'Update comparison page and notify sales team', tags: ['competitive', 'product'] },
    { user_id: userId, type: 'recommendation', title: `Optimize LinkedIn posting schedule`, description: `AI analysis shows your LinkedIn engagement peaks at 14:00-15:00 CET. Shift posting schedule for 23% more reach.`, urgency: 'low', confidence: 0.91, estimated_value: 8000, source: 'analytics_agent', is_read: true, is_actioned: true, is_dismissed: false, suggested_action: 'Update Social Agent posting schedule', tags: ['optimization', 'social'] },
    { user_id: userId, type: 'opportunity', title: `${template.events[0]?.name} early bird registration open`, description: `Key industry event with ${template.events[0]?.expected_attendees || 5000}+ attendees. Estimated ${template.events[0]?.estimated_leads || 50} leads at ${template.events[0]?.estimated_roi || 300}% ROI.`, urgency: 'high', confidence: 0.87, estimated_value: 45000, source: 'event_intelligence', is_read: false, is_actioned: false, is_dismissed: false, suggested_action: 'Register for booth + speaking slot', tags: ['event', 'lead-generation'] },
    { user_id: userId, type: 'milestone', title: `Email open rate hit 32% — all-time high`, description: `Your email campaigns are outperforming industry benchmarks by 45%. The AI-optimized subject lines are driving results.`, urgency: 'low', confidence: 0.95, estimated_value: 25000, source: 'email_agent', is_read: true, is_actioned: false, is_dismissed: false, suggested_action: 'Share wins with stakeholders + increase email frequency', tags: ['email', 'milestone', 'performance'] },
    { user_id: userId, type: 'risk', title: `Website traffic down 12% from ${template.competitors[1]?.name} SEO push`, description: `Competitor is outranking us for 3 key terms. SEO content plan needed.`, urgency: 'high', confidence: 0.80, estimated_value: -20000, source: 'analytics_agent', is_read: false, is_actioned: false, is_dismissed: false, suggested_action: 'Launch SEO content sprint targeting lost keywords', tags: ['seo', 'competitive', 'risk'] },
    { user_id: userId, type: 'insight', title: `Q1 pipeline grew 67% — best quarter ever`, description: `AI agents contributed to 42% of qualified leads this quarter through autonomous campaigns and content optimization.`, urgency: 'low', confidence: 0.98, estimated_value: 340000, source: 'orchestrator', is_read: true, is_actioned: true, is_dismissed: false, suggested_action: 'Create quarterly report for stakeholders', tags: ['pipeline', 'growth', 'quarterly'] },
  ];
  const { error: feedError } = await marketingSupabase.from('feed_items').insert(feedItems);
  if (feedError) console.error('feed_items seed error:', feedError);

  // Discovered events
  const events = template.events.map((e) => ({
    user_id: userId,
    name: e.name,
    type: e.type,
    description: e.description,
    location: e.location,
    city: e.city,
    country: e.country,
    date_start: e.date_start,
    date_end: e.date_end,
    expected_attendees: e.expected_attendees,
    target_audience_match: e.target_audience_match,
    estimated_roi: e.estimated_roi,
    estimated_leads: e.estimated_leads,
    networking_value: e.networking_value,
    cost: e.cost,
    topics: e.topics,
    status: e.status,
    priority_score: e.priority_score,
  }));
  const { error: eventError } = await marketingSupabase.from('discovered_events').insert(events);
  if (eventError) console.error('discovered_events seed error:', eventError);
}
