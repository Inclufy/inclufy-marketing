// src/services/demo-agent/seeders/marketing/extras-seeder.ts
// Seeds all remaining tables not covered by the main seeders:
//   recommendations, revenue_predictions, revenue_opportunities, customer_ltv,
//   social_accounts, strategic_plans, journeys, media_assets, channel_attributions
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { daysAgo, daysFromNow, randomBetween } from '../../templates/base-template';

export async function seedExtras(userId: string, template: IndustryTemplate): Promise<void> {
  // ── 1. recommendations (Dashboard AI Aanbevelingen + Aanbevelingen tab) ──
  const recommendations = [
    {
      user_id: userId, type: 'optimization', title: `Optimize ${template.brand.name} LinkedIn ad spend`,
      description: `Your LinkedIn campaigns show 34% higher ROI than Facebook. Recommend shifting €3,000 to LinkedIn for ${template.industry} targeting.`,
      rationale: 'Based on 90-day performance analysis across all paid channels',
      priority: 'high', confidence_score: 92,
      impact_estimate: { metric: 'Revenue', value: 15000, unit: 'EUR', revenue: 15000, time_saved: 0, engagement: 25 },
      implementation_effort: 'low', status: 'pending',
      action_items: ['Reallocate budget in ad platform', 'Update targeting parameters', 'Set up A/B test'],
      data_sources: ['Google Analytics', 'LinkedIn Ads', 'Attribution Model'],
    },
    {
      user_id: userId, type: 'content', title: `Create ${template.industry} thought leadership series`,
      description: `Content gap analysis shows high search volume for "${template.content[0]?.tags?.[0] || 'industry topic'}" with low competition. Publishing weekly articles could capture 15K+ organic visits.`,
      rationale: 'SEO analysis + competitor content audit reveals untapped opportunity',
      priority: 'high', confidence_score: 88,
      impact_estimate: { metric: 'Traffic', value: 15000, unit: 'visits/month', revenue: 8000, time_saved: 0, engagement: 40 },
      implementation_effort: 'medium', status: 'pending',
      action_items: ['Define content calendar', 'Brief AI writer', 'Set up SEO tracking'],
      data_sources: ['Google Search Console', 'Ahrefs', 'Competitor Analysis'],
    },
    {
      user_id: userId, type: 'campaign', title: `Launch retargeting campaign for pricing page visitors`,
      description: `${randomBetween(150, 300)} visitors viewed pricing in the last 30 days without converting. A targeted retargeting campaign could recover 15-25% of these leads.`,
      rationale: 'Behavioral analysis shows pricing page visitors have 4.2x higher intent',
      priority: 'critical', confidence_score: 95,
      impact_estimate: { metric: 'Conversions', value: 45, unit: 'leads', revenue: 22500, time_saved: 0, engagement: 0 },
      implementation_effort: 'low', status: 'pending',
      action_items: ['Create retargeting audience', 'Design ad creative', 'Set budget to €1,500', 'Launch campaign'],
      data_sources: ['Website Analytics', 'Meta Pixel', 'Google Ads'],
    },
    {
      user_id: userId, type: 'budget', title: `Reduce Google Ads CPC by optimizing keywords`,
      description: `AI detected 12 keywords with high CPC but low conversion. Pausing these and redirecting budget to top performers can save €2,400/month.`,
      rationale: 'Keyword-level ROI analysis over 60 days',
      priority: 'medium', confidence_score: 87,
      impact_estimate: { metric: 'Cost Savings', value: 2400, unit: 'EUR/month', revenue: 0, time_saved: 5, engagement: 0 },
      implementation_effort: 'low', status: 'pending',
      action_items: ['Review keyword list', 'Pause underperformers', 'Increase bids on winners'],
      data_sources: ['Google Ads', 'Conversion Tracking'],
    },
    {
      user_id: userId, type: 'strategic', title: `Partner with ${template.industry} influencers`,
      description: `Identified 5 ${template.industry} micro-influencers (10K-50K followers) with high engagement rates. Partnership could generate 200+ qualified leads.`,
      rationale: 'Influencer discovery + audience overlap analysis',
      priority: 'medium', confidence_score: 78,
      impact_estimate: { metric: 'Brand Awareness', value: 200, unit: 'leads', revenue: 30000, time_saved: 0, engagement: 65 },
      implementation_effort: 'high', status: 'pending',
      action_items: ['Shortlist influencers', 'Draft partnership proposals', 'Negotiate terms', 'Launch pilot'],
      data_sources: ['LinkedIn', 'Instagram', 'Audience Analysis'],
    },
  ];
  const { error: recError } = await marketingSupabase.from('recommendations').insert(recommendations);
  if (recError) console.error('recommendations seed error:', recError);

  // ── 2. revenue_predictions (Revenue Engine → Predictions tab) ──
  const revPredictions = [
    { user_id: userId, entity_type: 'channel', entity_id: 'linkedin', predicted_value: randomBetween(80000, 150000), confidence: 89, time_horizon: 30, factors: ['Ad spend increase', 'Content engagement growth', 'Lead quality improvement'] },
    { user_id: userId, entity_type: 'channel', entity_id: 'email', predicted_value: randomBetween(50000, 100000), confidence: 93, time_horizon: 30, factors: ['List growth', 'Open rate optimization', 'Nurture sequence performance'] },
    { user_id: userId, entity_type: 'channel', entity_id: 'organic', predicted_value: randomBetween(60000, 120000), confidence: 78, time_horizon: 30, factors: ['SEO content strategy', 'Domain authority growth', 'Seasonal trends'] },
    { user_id: userId, entity_type: 'campaign', entity_id: 'q2-launch', predicted_value: randomBetween(100000, 250000), confidence: 85, time_horizon: 60, factors: ['Product launch timing', 'Market readiness', 'Competitor gaps'] },
    { user_id: userId, entity_type: 'customer', entity_id: 'enterprise', predicted_value: randomBetween(200000, 500000), confidence: 82, time_horizon: 90, factors: ['Pipeline velocity', 'Win rate trends', 'Deal size growth'] },
  ];
  const { error: rpError } = await marketingSupabase.from('revenue_predictions').insert(revPredictions);
  if (rpError) console.error('revenue_predictions seed error:', rpError);

  // ── 3. revenue_opportunities (Revenue Engine → Opportunities tab) ──
  const revOpps = [
    { user_id: userId, title: `Upsell premium package to ${template.leads[0]?.company}`, description: `${template.leads[0]?.company} has been using basic plan for 6 months. Usage patterns suggest they would benefit from premium features.`, opportunity_type: 'upsell', estimated_value: randomBetween(15000, 45000), priority: 'high', effort_required: 'low', time_to_value: 14, success_probability: 78, impact: 'high', status: 'identified' },
    { user_id: userId, title: `Cross-sell analytics add-on to existing clients`, description: `12 clients on standard plans are actively using reporting features at capacity. Analytics add-on could address their needs.`, opportunity_type: 'cross_sell', estimated_value: randomBetween(30000, 80000), priority: 'high', effort_required: 'medium', time_to_value: 30, success_probability: 65, impact: 'high', status: 'identified' },
    { user_id: userId, title: `Win-back churned ${template.industry} accounts`, description: `8 accounts churned in Q4. 5 cited "missing feature X" which was launched in January. Re-engagement campaign recommended.`, opportunity_type: 'retention', estimated_value: randomBetween(40000, 100000), priority: 'medium', effort_required: 'medium', time_to_value: 45, success_probability: 42, impact: 'high', status: 'identified' },
    { user_id: userId, title: `Expand into adjacent ${template.industry} segment`, description: `Market analysis shows €${randomBetween(5, 20)}M addressable market in adjacent segment with low competition.`, opportunity_type: 'expansion', estimated_value: randomBetween(100000, 300000), priority: 'medium', effort_required: 'high', time_to_value: 90, success_probability: 55, impact: 'high', status: 'identified' },
  ];
  const { error: roError } = await marketingSupabase.from('revenue_opportunities').insert(revOpps);
  if (roError) console.error('revenue_opportunities seed error:', roError);

  // ── 4. customer_ltv (Revenue Engine → Customer LTV tab) ──
  const ltv = [
    { user_id: userId, segment_name: 'Enterprise', avg_ltv: randomBetween(50000, 150000), predicted_ltv: randomBetween(80000, 200000), churn_probability: +(Math.random() * 0.1 + 0.02).toFixed(3), expansion_potential: 0.35, customer_count: randomBetween(15, 40), key_characteristics: ['500+ employees', 'Multi-department usage', 'Annual contracts'] },
    { user_id: userId, segment_name: 'Mid-Market', avg_ltv: randomBetween(15000, 45000), predicted_ltv: randomBetween(25000, 60000), churn_probability: +(Math.random() * 0.15 + 0.05).toFixed(3), expansion_potential: 0.55, customer_count: randomBetween(30, 80), key_characteristics: ['100-500 employees', 'Growing teams', 'Quarterly billing'] },
    { user_id: userId, segment_name: 'SMB', avg_ltv: randomBetween(3000, 12000), predicted_ltv: randomBetween(5000, 18000), churn_probability: +(Math.random() * 0.2 + 0.1).toFixed(3), expansion_potential: 0.25, customer_count: randomBetween(80, 200), key_characteristics: ['<100 employees', 'Single user', 'Monthly billing'] },
    { user_id: userId, segment_name: 'Startup', avg_ltv: randomBetween(1500, 6000), predicted_ltv: randomBetween(8000, 25000), churn_probability: +(Math.random() * 0.25 + 0.15).toFixed(3), expansion_potential: 0.75, customer_count: randomBetween(20, 50), key_characteristics: ['<50 employees', 'High growth', 'Usage-based'] },
  ];
  const { error: ltvError } = await marketingSupabase.from('customer_ltv').insert(ltv);
  if (ltvError) console.error('customer_ltv seed error:', ltvError);

  // ── 5. social_accounts (Campaign Readiness → Social Media check) ──
  const socialAccounts = [
    { user_id: userId, platform: 'linkedin', account_name: `${template.brand.name} LinkedIn`, status: 'connected', connected_at: daysAgo(90), followers: randomBetween(5000, 25000), profile_url: `https://linkedin.com/company/${template.brand.name.toLowerCase().replace(/\s/g, '-')}` },
    { user_id: userId, platform: 'twitter', account_name: `@${template.brand.name.replace(/\s/g, '')}`, status: 'connected', connected_at: daysAgo(120), followers: randomBetween(3000, 15000), profile_url: `https://twitter.com/${template.brand.name.replace(/\s/g, '')}` },
    { user_id: userId, platform: 'instagram', account_name: `${template.brand.name.toLowerCase().replace(/\s/g, '')}`, status: 'connected', connected_at: daysAgo(60), followers: randomBetween(2000, 12000), profile_url: `https://instagram.com/${template.brand.name.toLowerCase().replace(/\s/g, '')}` },
    { user_id: userId, platform: 'facebook', account_name: `${template.brand.name}`, status: 'connected', connected_at: daysAgo(150), followers: randomBetween(4000, 20000), profile_url: `https://facebook.com/${template.brand.name.toLowerCase().replace(/\s/g, '')}` },
  ];
  const { error: saError } = await marketingSupabase.from('social_accounts').insert(socialAccounts);
  if (saError) console.error('social_accounts seed error:', saError);

  // ── 6. strategic_plans (Campaign Readiness → Groei Blauwdruk check) ──
  // Pre-existing table may lack DEFAULT on id — provide explicit UUID
  const strategicPlans = [
    {
      id: crypto.randomUUID(),
      user_id: userId, plan_name: `${template.brand.name} Q2 2026 Growth Blueprint`,
      plan_type: 'quarterly',
      description: `Comprehensive marketing growth strategy for ${template.industry} market expansion`,
      status: 'active',
      goals: [
        { name: 'Increase MQLs by 40%', target: 400, current: 280, unit: 'leads/month' },
        { name: 'Reduce CAC by 20%', target: 150, current: 188, unit: 'EUR' },
        { name: 'Grow organic traffic 50%', target: 75000, current: 52000, unit: 'visits/month' },
      ],
      strategies: [
        { name: 'Content-Led Growth', description: 'Publish 4 thought leadership articles/month', type: 'growth', status: 'in_progress' },
        { name: 'Paid Media Optimization', description: 'Shift budget to highest-performing channels', type: 'acquisition', status: 'planned' },
      ],
      total_budget: randomBetween(50000, 150000),
      timeline: { start_date: daysAgo(30), end_date: daysFromNow(60) },
    },
  ];
  const { error: spError } = await marketingSupabase.from('strategic_plans').insert(strategicPlans);
  if (spError) console.error('strategic_plans seed error:', spError);

  // ── 7. journeys (Klantreis / Journey Builder) ──
  // Live DB columns: name, description, status, nodes, edges, entry_rules, exit_rules, settings, enrollment_count
  // Does NOT have: trigger_type, trigger_config, steps, conversion_rate, metrics
  const journeys = [
    {
      user_id: userId, name: `${template.industry} Lead Nurture Journey`,
      description: `Automated nurture sequence for new ${template.industry} leads`,
      status: 'active',
      nodes: [
        { id: '1', type: 'trigger', data: { label: 'Form Submission', trigger: 'demo_request' }, position: { x: 250, y: 0 } },
        { id: '2', type: 'email', data: { label: 'Welcome Email', subject: `Welcome to ${template.brand.name}` }, position: { x: 250, y: 100 } },
        { id: '3', type: 'delay', data: { label: 'Wait 3 days', days: 3 }, position: { x: 250, y: 200 } },
        { id: '4', type: 'email', data: { label: 'Case Study', subject: `How ${template.leads[0]?.company} achieved 3x ROI` }, position: { x: 250, y: 300 } },
        { id: '5', type: 'condition', data: { label: 'Opened email?' }, position: { x: 250, y: 400 } },
        { id: '6', type: 'email', data: { label: 'Book Demo CTA' }, position: { x: 100, y: 500 } },
        { id: '7', type: 'email', data: { label: 'Value Reminder' }, position: { x: 400, y: 500 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e5-6', source: '5', target: '6', label: 'Yes' },
        { id: 'e5-7', source: '5', target: '7', label: 'No' },
      ],
      entry_rules: { trigger: 'form_submission', source: 'website' },
      exit_rules: { max_duration_days: 30 },
      settings: { send_time: 'optimal', timezone: 'Europe/Amsterdam' },
      enrollment_count: randomBetween(150, 400),
    },
    {
      user_id: userId, name: `Event Follow-Up Journey`,
      description: `Post-event engagement sequence for captured contacts`,
      status: 'active',
      nodes: [
        { id: '1', type: 'trigger', data: { label: 'Event Capture' }, position: { x: 250, y: 0 } },
        { id: '2', type: 'email', data: { label: 'Thank You + Recap' }, position: { x: 250, y: 100 } },
        { id: '3', type: 'delay', data: { label: 'Wait 2 days', days: 2 }, position: { x: 250, y: 200 } },
        { id: '4', type: 'email', data: { label: 'Exclusive Content' }, position: { x: 250, y: 300 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' },
      ],
      entry_rules: { trigger: 'event_capture', event_type: 'conference' },
      exit_rules: { max_duration_days: 14 },
      settings: { send_time: 'morning' },
      enrollment_count: randomBetween(50, 120),
    },
    {
      user_id: userId, name: `Re-Engagement Journey`,
      description: `Win back inactive leads who haven't engaged in 30+ days`,
      status: 'paused',
      nodes: [
        { id: '1', type: 'trigger', data: { label: 'Inactivity 30d' }, position: { x: 250, y: 0 } },
        { id: '2', type: 'email', data: { label: 'We Miss You' }, position: { x: 250, y: 100 } },
        { id: '3', type: 'delay', data: { label: 'Wait 7 days', days: 7 }, position: { x: 250, y: 200 } },
        { id: '4', type: 'email', data: { label: 'Special Offer' }, position: { x: 250, y: 300 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' },
      ],
      entry_rules: { trigger: 'inactivity', days_inactive: 30 },
      exit_rules: { max_duration_days: 21 },
      settings: { send_time: 'afternoon' },
      enrollment_count: randomBetween(80, 200),
    },
  ];
  const { error: jError } = await marketingSupabase.from('journeys').insert(journeys);
  if (jError) console.error('journeys seed error:', jError);

  // ── 8. channel_attributions (Attributie page data) ──
  // Live DB columns: channel, display_name, model_type, attributed_conversions,
  //   attributed_revenue, cost, roi, percentage_share, total_touchpoints, confidence, color
  const CHANNEL_COLORS: Record<string, string> = {
    LinkedIn: '#0A66C2', 'Google Ads': '#34A853', Email: '#EA4335',
    Organic: '#FBBC04', Referral: '#FF6D01', Events: '#8B5CF6', Facebook: '#1877F2',
  };
  const channelNames = ['LinkedIn', 'Google Ads', 'Email', 'Organic', 'Referral', 'Events', 'Facebook'];
  const channelAttributions = channelNames.map((ch) => {
    const rev = randomBetween(5000, 80000);
    const cst = randomBetween(1000, 15000);
    return {
      user_id: userId,
      channel: ch,
      display_name: ch,
      color: CHANNEL_COLORS[ch] || '#6b7280',
      model_type: 'data_driven_shapley',
      attributed_conversions: randomBetween(15, 120),
      attributed_revenue: rev,
      cost: cst,
      roi: cst > 0 ? Math.round(((rev - cst) / cst) * 100) : 0,
      percentage_share: +(Math.random() * 25 + 5).toFixed(1),
      avg_position_in_journey: +(Math.random() * 3 + 1).toFixed(1),
      total_touchpoints: randomBetween(200, 2000),
      confidence: +(Math.random() * 15 + 80).toFixed(1),
    };
  });
  const { error: caError } = await marketingSupabase.from('channel_attributions').insert(channelAttributions);
  if (caError) console.error('channel_attributions seed error:', caError);

  // ── 9. media_assets (Media Bibliotheek) ──
  // Live DB has team_id NOT NULL — must provide a placeholder value
  const mediaAssets = [
    { user_id: userId, team_id: userId, file_name: `${template.brand.name}-logo.png`, file_path: `media/${userId}/logo.png`, file_size: 245000, mime_type: 'image/png', width: 1200, height: 400 },
    { user_id: userId, team_id: userId, file_name: `${template.brand.name}-hero-banner.jpg`, file_path: `media/${userId}/hero.jpg`, file_size: 890000, mime_type: 'image/jpeg', width: 1920, height: 1080 },
    { user_id: userId, team_id: userId, file_name: `product-screenshot-dashboard.png`, file_path: `media/${userId}/dashboard.png`, file_size: 567000, mime_type: 'image/png', width: 1440, height: 900 },
    { user_id: userId, team_id: userId, file_name: `${template.industry}-case-study-cover.jpg`, file_path: `media/${userId}/case-study.jpg`, file_size: 420000, mime_type: 'image/jpeg', width: 1200, height: 628 },
    { user_id: userId, team_id: userId, file_name: `social-post-template.png`, file_path: `media/${userId}/social-template.png`, file_size: 380000, mime_type: 'image/png', width: 1080, height: 1080 },
    { user_id: userId, team_id: userId, file_name: `email-header-graphic.png`, file_path: `media/${userId}/email-header.png`, file_size: 195000, mime_type: 'image/png', width: 600, height: 200 },
    { user_id: userId, team_id: userId, file_name: `product-demo-video.mp4`, file_path: `media/${userId}/demo.mp4`, file_size: 15400000, mime_type: 'video/mp4', width: 1920, height: 1080, duration: 120 },
    { user_id: userId, team_id: userId, file_name: `${template.brand.name}-brand-guidelines.pdf`, file_path: `media/${userId}/brand-guide.pdf`, file_size: 4500000, mime_type: 'application/pdf' },
  ];
  const { error: maError } = await marketingSupabase.from('media_assets').insert(mediaAssets);
  if (maError) console.error('media_assets seed error:', maError);
}
