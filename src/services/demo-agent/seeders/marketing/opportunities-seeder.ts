// src/services/demo-agent/seeders/marketing/opportunities-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { daysAgo, daysFromNow, randomBetween } from '../../templates/base-template';

export async function seedOpportunities(userId: string, template: IndustryTemplate): Promise<void> {
  // Opportunities — all numeric fields must be integers (DB schema uses INTEGER, not NUMERIC)
  const opportunities = [
    {
      user_id: userId, type: 'trend', title: `${template.industry} Digital Transformation Acceleration`,
      description: `Industry analysts report 45% increase in ${template.industry} digital transformation budgets. Companies actively seeking solutions like ${template.brand.name}.`,
      source: 'Market Intelligence', priority: 'high', status: 'new', confidence: 88,
      estimated_impact: { value: randomBetween(200000, 500000), description: 'Revenue potential from digital transformation demand' }, estimated_reach: randomBetween(5000, 15000),
      trend_velocity: 78, relevance_score: 92, discovered_at: daysAgo(5), expires_at: daysFromNow(30),
      tags: ['digital-transformation', template.industry, 'growth'],
      suggested_actions: ['Launch targeted campaign', 'Create industry report', 'Reach out to top prospects'],
      related_keywords: ['digital transformation', template.industry + ' technology', 'automation'],
      data_sources: ['Google Trends', 'Industry Reports'],
      campaign_suggestion: { title: `${template.industry} Digital Transformation`, channels: ['LinkedIn', 'Blog', 'Email'], budget: 15000, duration_days: 30 },
    },
    {
      user_id: userId, type: 'competitor_gap', title: `${template.competitors[0]?.name} Customer Dissatisfaction Spike`,
      description: `Social listening detected 3x increase in negative mentions of ${template.competitors[0]?.name}. Key complaints: poor support, outdated UI, high prices.`,
      source: 'Competitive Intelligence', priority: 'critical', status: 'new', confidence: 82,
      estimated_impact: { value: randomBetween(100000, 300000), description: 'Customer acquisition from competitor churn' }, estimated_reach: randomBetween(2000, 8000),
      trend_velocity: 65, relevance_score: 88, discovered_at: daysAgo(3), expires_at: daysFromNow(14),
      tags: ['competitive', 'acquisition', 'churn'],
      suggested_actions: ['Create migration campaign', 'Offer switch incentive', 'Target their customers with comparison ads'],
      related_keywords: [template.competitors[0]?.name || 'competitor', 'switch', 'alternative'],
      data_sources: ['G2 Reviews', 'Reddit', 'Twitter/X'],
      campaign_suggestion: { title: `Switch from ${template.competitors[0]?.name}`, channels: ['Google Ads', 'Landing Page'], budget: 8000, duration_days: 21 },
    },
    {
      user_id: userId, type: 'partnership', title: `Strategic Partnership with ${template.industry} Association`,
      description: `${template.industry} professional association with 12,000+ members seeking technology partner for member benefits program.`,
      source: 'Event Monitoring', priority: 'high', status: 'reviewing', confidence: 75,
      estimated_impact: { value: randomBetween(150000, 400000), description: 'Revenue from partnership channel' }, estimated_reach: 12000,
      trend_velocity: 0, relevance_score: 85, discovered_at: daysAgo(7), expires_at: daysFromNow(45),
      tags: ['partnership', 'channel', 'growth'],
      suggested_actions: ['Schedule exploratory meeting', 'Prepare partnership proposal', 'Create co-branded content plan'],
      related_keywords: [template.industry, 'association', 'partnership'],
      data_sources: ['LinkedIn', 'Industry Events'],
      campaign_suggestion: { title: `Co-branded webinar series`, channels: ['LinkedIn', 'Email'], budget: 5000, duration_days: 60 },
    },
    {
      user_id: userId, type: 'trend', title: `New ${template.industry} Regulation Creates Compliance Demand`,
      description: `Upcoming regulation requires all ${template.industry} organizations to adopt digital compliance by 2027. Creates urgent need for our platform.`,
      source: 'Google Trends + Industry Reports', priority: 'high', status: 'new', confidence: 92,
      estimated_impact: { value: randomBetween(300000, 800000), description: 'Compliance-driven demand growth' }, estimated_reach: randomBetween(10000, 30000),
      trend_velocity: 85, relevance_score: 95, discovered_at: daysAgo(10), expires_at: daysFromNow(180),
      tags: ['regulation', 'compliance', 'urgency'],
      suggested_actions: ['Create compliance guide', 'Launch webinar series', 'Build compliance calculator'],
      related_keywords: ['regulation', 'compliance', template.industry + ' standards'],
      data_sources: ['Government Publications', 'Industry Press'],
      campaign_suggestion: { title: `${template.industry} Compliance Readiness`, channels: ['LinkedIn', 'Blog', 'Email', 'Google Ads'], budget: 12000, duration_days: 45 },
    },
  ];
  const { error: oppError } = await marketingSupabase.from('opportunities').insert(opportunities);
  if (oppError) console.error('opportunities seed error:', oppError);

  // Feed items
  const feedItems = [
    { user_id: userId, type: 'opportunity', title: `New Enterprise Lead from ${template.leads[0]?.company}`, description: `${template.leads[0]?.name} (${template.leads[0]?.title}) requested a demo. Lead score: ${template.leads[0]?.composite_score}/100.`, urgency: 'high', confidence: 92, estimated_value: template.leads[0]?.predicted_value || 50000, source: 'lead_scoring', is_read: false, is_actioned: false, is_dismissed: false, suggested_action: template.leads[0]?.next_best_action || 'Follow up within 24h', tags: ['enterprise', 'demo-request'] },
    { user_id: userId, type: 'insight', title: `${template.content[0]?.title} is going viral`, description: `Your latest content piece has 3x normal engagement. Consider boosting it with paid promotion.`, urgency: 'medium', confidence: 85, estimated_value: 15000, source: 'content_analytics', is_read: false, is_actioned: false, is_dismissed: false, suggested_action: 'Boost top-performing content with €500 ad budget', tags: ['content', 'viral', 'opportunity'] },
    { user_id: userId, type: 'alert', title: `Competitor ${template.competitors[0]?.name} launched new feature`, description: `${template.competitors[0]?.name} announced a new AI feature. Review our competitive positioning.`, urgency: 'medium', confidence: 78, estimated_value: 0, source: 'competitive_intelligence', is_read: true, is_actioned: false, is_dismissed: false, suggested_action: 'Update comparison page and notify sales team', tags: ['competitive', 'product'] },
    { user_id: userId, type: 'recommendation', title: `Optimize LinkedIn posting schedule`, description: `AI analysis shows your LinkedIn engagement peaks at 14:00-15:00 CET. Shift posting schedule for 23% more reach.`, urgency: 'low', confidence: 91, estimated_value: 8000, source: 'analytics_agent', is_read: true, is_actioned: true, is_dismissed: false, suggested_action: 'Update Social Agent posting schedule', tags: ['optimization', 'social'] },
    { user_id: userId, type: 'opportunity', title: `${template.events[0]?.name} early bird registration open`, description: `Key industry event with ${template.events[0]?.expected_attendees || 5000}+ attendees. Estimated ${template.events[0]?.estimated_leads || 50} leads at ${template.events[0]?.estimated_roi || 300}% ROI.`, urgency: 'high', confidence: 87, estimated_value: 45000, source: 'event_intelligence', is_read: false, is_actioned: false, is_dismissed: false, suggested_action: 'Register for booth + speaking slot', tags: ['event', 'lead-generation'] },
    { user_id: userId, type: 'milestone', title: `Email open rate hit 32% — all-time high`, description: `Your email campaigns are outperforming industry benchmarks by 45%. The AI-optimized subject lines are driving results.`, urgency: 'low', confidence: 95, estimated_value: 25000, source: 'email_agent', is_read: true, is_actioned: false, is_dismissed: false, suggested_action: 'Share wins with stakeholders + increase email frequency', tags: ['email', 'milestone', 'performance'] },
    { user_id: userId, type: 'risk', title: `Website traffic down 12% from ${template.competitors[1]?.name} SEO push`, description: `Competitor is outranking us for 3 key terms. SEO content plan needed.`, urgency: 'high', confidence: 80, estimated_value: -20000, source: 'analytics_agent', is_read: false, is_actioned: false, is_dismissed: false, suggested_action: 'Launch SEO content sprint targeting lost keywords', tags: ['seo', 'competitive', 'risk'] },
    { user_id: userId, type: 'insight', title: `Q1 pipeline grew 67% — best quarter ever`, description: `AI agents contributed to 42% of qualified leads this quarter through autonomous campaigns and content optimization.`, urgency: 'low', confidence: 98, estimated_value: 340000, source: 'orchestrator', is_read: true, is_actioned: true, is_dismissed: false, suggested_action: 'Create quarterly report for stakeholders', tags: ['pipeline', 'growth', 'quarterly'] },
  ];
  const { error: feedError } = await marketingSupabase.from('feed_items').insert(feedItems);
  if (feedError) console.error('feed_items seed error:', feedError);

  // Discovered events
  const networkingLabels = ['low', 'medium', 'high', 'very_high'];
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
    estimated_roi: { percentage: e.estimated_roi, value: Math.round(e.cost * e.estimated_roi / 100) },
    estimated_leads: e.estimated_leads,
    networking_value: typeof e.networking_value === 'number'
      ? (networkingLabels[Math.min(Math.floor(e.networking_value / 25), 3)] || 'medium')
      : String(e.networking_value),
    cost: e.cost,
    topics: e.topics,
    status: e.status,
    priority_score: e.priority_score,
  }));
  const { error: eventError } = await marketingSupabase.from('discovered_events').insert(events);
  if (eventError) console.error('discovered_events seed error:', eventError);
}
