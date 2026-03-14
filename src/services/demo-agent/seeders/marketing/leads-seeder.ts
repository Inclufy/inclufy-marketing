// src/services/demo-agent/seeders/marketing/leads-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { generateScoreBreakdown, generateScoreHistory, daysAgo, randomBetween } from '../../templates/base-template';

export async function seedLeads(userId: string, template: IndustryTemplate): Promise<void> {
  // Scored leads
  const scoredLeads = template.leads.map((lead) => ({
    user_id: userId,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    title: lead.title,
    composite_score: lead.composite_score,
    score_breakdown: generateScoreBreakdown(lead.composite_score),
    stage: lead.stage,
    conversion_probability: lead.conversion_probability,
    predicted_value: lead.predicted_value,
    predicted_close_date: new Date(Date.now() + randomBetween(14, 90) * 86400000).toISOString().split('T')[0],
    hot_signals: lead.hot_signals,
    cold_signals: lead.cold_signals,
    last_activity: daysAgo(randomBetween(0, 5)),
    activity_count_30d: randomBetween(10, 55),
    source: lead.source,
    tags: lead.tags,
    score_history: generateScoreHistory(lead.composite_score),
    next_best_action: { action: lead.next_best_action, priority: lead.composite_score > 85 ? 'high' : 'medium', channel: 'sales' },
  }));
  const { error: leadsError } = await marketingSupabase.from('scored_leads').insert(scoredLeads);
  if (leadsError) console.error('scored_leads seed error:', leadsError);

  // Lead profiles (top 6 leads)
  const profiles = template.leads.slice(0, 6).map((lead) => ({
    user_id: userId,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    title: lead.title,
    intent_level: lead.intent_level || 'medium',
    intent_score: lead.composite_score,
    buying_stage: lead.buying_stage || 'consideration',
    signals: lead.hot_signals.map((s: string) => ({ signal: s, strength: randomBetween(60, 95), detected_at: daysAgo(randomBetween(1, 14)) })),
    website_behavior: { pages_viewed: randomBetween(8, 35), avg_time: randomBetween(120, 420), last_visit: daysAgo(randomBetween(0, 3)) },
    social_activity: { linkedin_engaged: true, twitter_followed: false, content_shared: randomBetween(0, 5) },
    engagement_timeline: [
      { date: daysAgo(30), action: 'First website visit', channel: 'organic' },
      { date: daysAgo(20), action: 'Downloaded whitepaper', channel: 'content' },
      { date: daysAgo(10), action: 'Attended webinar', channel: 'event' },
      { date: daysAgo(3), action: 'Visited pricing page', channel: 'website' },
    ],
    predicted_actions: ['Will request demo within 7 days', 'Likely to engage with case study content'],
    company_intel: { size: randomBetween(50, 5000) + ' employees', revenue: '€' + randomBetween(5, 500) + 'M', growth: '+' + randomBetween(5, 25) + '% YoY' },
  }));
  const { error: profilesError } = await marketingSupabase.from('lead_profiles').insert(profiles);
  if (profilesError) console.error('lead_profiles seed error:', profilesError);

  // Intent signals
  const signalTypes = ['pricing_view', 'api_docs', 'form_submission', 'content_download', 'competitor_comparison', 'webinar_attendance', 'email_reply', 'social_engagement'];
  const signals = template.leads.slice(0, 8).map((lead, i) => ({
    user_id: userId,
    lead_name: lead.name,
    company: lead.company,
    type: signalTypes[i % signalTypes.length],
    description: `${lead.name} from ${lead.company}: ${lead.hot_signals[0] || 'Engaged with content'}`,
    strength: lead.composite_score > 85 ? 95 : lead.composite_score > 70 ? 75 : 40,
    page_url: '/product/' + template.industry,
    duration_seconds: randomBetween(30, 600),
    metadata: { source: lead.source, tags: lead.tags },
  }));
  const { error: signalsError } = await marketingSupabase.from('intent_signals').insert(signals);
  if (signalsError) console.error('intent_signals seed error:', signalsError);

  // Captured contacts (5)
  const captured = template.leads.slice(0, 5).map((lead) => ({
    user_id: userId,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    title: lead.title,
    capture_method: ['qr_scan', 'business_card', 'event_registration', 'linkedin', 'web_form'][randomBetween(0, 4)],
    captured_at: daysAgo(randomBetween(1, 30)),
    event_name: template.events[0]?.name || 'Industry Event',
    status: 'enriched',
    enrichment: { linkedin_url: `https://linkedin.com/in/${lead.name.toLowerCase().replace(/\s/g, '-')}`, verified_email: true, company_size: randomBetween(50, 5000) },
    ai_insights: { fit_score: lead.composite_score, recommended_action: lead.next_best_action, urgency: lead.composite_score > 85 ? 'high' : 'medium' },
    follow_up: { status: lead.composite_score > 80 ? 'scheduled' : 'pending', date: new Date(Date.now() + randomBetween(1, 14) * 86400000).toISOString() },
    tags: lead.tags,
  }));
  const { error: capturedError } = await marketingSupabase.from('captured_contacts').insert(captured);
  if (capturedError) console.error('captured_contacts seed error:', capturedError);

  // ── contacts table (used by Dashboard Analytics, ContactManager) ──
  // Note: contacts table has organization_id schema but user_id was added via migration.
  // Only insert columns that definitely exist in the live DB.
  const contacts = template.leads.map((lead) => {
    const nameParts = lead.name.split(' ');
    return {
      user_id: userId,
      email: lead.email,
      first_name: nameParts[0] || lead.name,
      last_name: nameParts.slice(1).join(' ') || '',
      phone: '+31 6 ' + String(randomBetween(10000000, 99999999)),
    };
  });
  const { error: contactsError } = await marketingSupabase.from('contacts').insert(contacts);
  if (contactsError) console.error('contacts seed error:', contactsError);
}
