// src/services/demo-agent/seeders/marketing/analytics-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { getBaseAttributionModels, randomBetween } from '../../templates/base-template';

export async function seedAnalytics(userId: string, template: IndustryTemplate): Promise<void> {
  // Channel health
  const channels = [
    { user_id: userId, channel: 'linkedin', connected: true, account_name: template.brand.name, followers: randomBetween(8000, 25000), avg_engagement: +(Math.random() * 8 + 4).toFixed(1), posts_this_month: randomBetween(12, 24), best_time: '14:00 CET', health_score: randomBetween(88, 96) },
    { user_id: userId, channel: 'facebook', connected: true, account_name: `${template.brand.name} Page`, followers: randomBetween(5000, 15000), avg_engagement: +(Math.random() * 5 + 3).toFixed(1), posts_this_month: randomBetween(10, 18), best_time: '12:00 CET', health_score: randomBetween(82, 92) },
    { user_id: userId, channel: 'instagram', connected: true, account_name: `@${template.brand.name.toLowerCase().replace(/\s/g, '')}`, followers: randomBetween(4000, 12000), avg_engagement: +(Math.random() * 10 + 5).toFixed(1), posts_this_month: randomBetween(15, 28), best_time: '18:00 CET', health_score: randomBetween(85, 94) },
    { user_id: userId, channel: 'twitter', connected: true, account_name: `@${template.brand.name.toLowerCase().replace(/\s/g, '_')}`, followers: randomBetween(2000, 8000), avg_engagement: +(Math.random() * 4 + 2).toFixed(1), posts_this_month: randomBetween(20, 35), best_time: '09:00 CET', health_score: randomBetween(78, 88) },
    { user_id: userId, channel: 'email', connected: true, account_name: `${template.brand.name.toLowerCase().replace(/\s/g, '')}.com`, followers: randomBetween(20000, 60000), avg_engagement: +(Math.random() * 15 + 18).toFixed(1), posts_this_month: randomBetween(6, 12), best_time: '09:00 CET', health_score: randomBetween(90, 98) },
    { user_id: userId, channel: 'blog', connected: true, account_name: `blog.${template.brand.name.toLowerCase().replace(/\s/g, '')}.com`, followers: randomBetween(1500, 6000), avg_engagement: +(Math.random() * 4 + 3).toFixed(1), posts_this_month: randomBetween(4, 8), best_time: '10:00 CET', health_score: randomBetween(84, 92) },
    { user_id: userId, channel: 'tiktok', connected: false, followers: 0, avg_engagement: 0, posts_this_month: 0, best_time: '-', health_score: 0 },
  ];
  const { error: channelError } = await marketingSupabase.from('channel_health').insert(channels);
  if (channelError) console.error('channel_health seed error:', channelError);

  // Attribution models
  const models = getBaseAttributionModels(userId);
  const { error: attrError } = await marketingSupabase.from('attribution_models').insert(models);
  if (attrError) console.error('attribution_models seed error:', attrError);

  // Scoring rules
  const scoringRules = [
    { user_id: userId, name: 'Pricing Page Visit', category: 'behavioral', description: 'Lead visits pricing page', condition: { page: '/pricing', action: 'view' }, points: 15, is_active: true, triggers_count: randomBetween(100, 500) },
    { user_id: userId, name: 'Content Download', category: 'behavioral', description: 'Lead downloads gated content', condition: { action: 'download', type: 'gated' }, points: 10, is_active: true, triggers_count: randomBetween(200, 800) },
    { user_id: userId, name: 'Demo Request', category: 'behavioral', description: 'Lead submits demo request form', condition: { form: 'demo_request', action: 'submit' }, points: 25, is_active: true, triggers_count: randomBetween(50, 200) },
    { user_id: userId, name: 'Email Engagement', category: 'engagement', description: 'Lead opens and clicks marketing emails', condition: { action: 'email_click', min_count: 3 }, points: 8, is_active: true, triggers_count: randomBetween(300, 1000) },
    { user_id: userId, name: 'Enterprise Company', category: 'firmographic', description: `Company with 500+ employees in ${template.industry}`, condition: { company_size: '500+', industry: template.industry }, points: 20, is_active: true, triggers_count: randomBetween(30, 120) },
    { user_id: userId, name: 'Decision Maker Title', category: 'demographic', description: 'C-level or VP title', condition: { title_level: ['C-level', 'VP', 'Director'] }, points: 15, is_active: true, triggers_count: randomBetween(80, 300) },
  ];
  const { error: rulesError } = await marketingSupabase.from('scoring_rules').insert(scoringRules);
  if (rulesError) console.error('scoring_rules seed error:', rulesError);

  // Scoring model
  const scoringModel = {
    user_id: userId,
    name: `${template.brand.name} Lead Scoring v2.0`,
    description: `AI-powered lead scoring model trained on ${template.industry} conversion data`,
    is_active: true,
    accuracy: 94.2,
    total_leads_scored: randomBetween(500, 3000),
    last_trained: new Date().toISOString(),
    category_weights: { behavioral: 35, demographic: 20, firmographic: 25, engagement: 20 },
    threshold_mql: 50,
    threshold_sql: 75,
  };
  const { error: modelError } = await marketingSupabase.from('scoring_models').insert(scoringModel);
  if (modelError) console.error('scoring_models seed error:', modelError);
}
