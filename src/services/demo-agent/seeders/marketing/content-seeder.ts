// src/services/demo-agent/seeders/marketing/content-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { daysAgo, generateContentPerformance, randomBetween } from '../../templates/base-template';

export async function seedContent(userId: string, template: IndustryTemplate): Promise<void> {
  // Publishable content
  const publishableContent = template.content.map((c, i) => ({
    user_id: userId,
    title: c.title,
    body: c.body,
    content_type: c.content_type,
    channels: c.channels,
    status: c.status,
    scheduled_at: c.status === 'scheduled' ? new Date(Date.now() + randomBetween(1, 14) * 86400000).toISOString() : null,
    published_at: c.status === 'published' ? daysAgo(randomBetween(1, 30)) : null,
    auto_scheduled: i % 3 === 0,
    optimal_time_reason: i % 3 === 0 ? 'AI detected peak engagement at this time for your audience' : null,
    tags: c.tags,
    performance: c.performance || generateContentPerformance(c.status === 'published'),
  }));
  const { error: contentError } = await marketingSupabase.from('publishable_content').insert(publishableContent);
  if (contentError) console.error('publishable_content seed error:', contentError);

  // Content templates
  const templates = [
    {
      user_id: userId, name: `${template.brand.name} Blog Post`, description: `Standard blog post template for ${template.industry} thought leadership`,
      content_type: 'blog_post', category: 'thought_leadership',
      prompt_template: `Write a compelling blog post for ${template.brand.name} about {topic}. Use a ${template.brand.tone_attributes.join(', ')} tone.`,
      variables: ['topic', 'target_audience', 'key_message'], use_count: randomBetween(10, 50), rating: 4.5,
    },
    {
      user_id: userId, name: `${template.brand.name} LinkedIn Post`, description: `LinkedIn post template optimized for ${template.industry} professionals`,
      content_type: 'social_post', category: 'social_media',
      prompt_template: `Create an engaging LinkedIn post for ${template.brand.name} about {topic}. Include a call-to-action and relevant hashtags.`,
      variables: ['topic', 'cta', 'hashtags'], use_count: randomBetween(20, 80), rating: 4.7,
    },
    {
      user_id: userId, name: `${template.brand.name} Case Study`, description: `Customer success story template`,
      content_type: 'case_study', category: 'customer_stories',
      prompt_template: `Write a case study about how {customer} used ${template.brand.name} to achieve {outcome}. Include metrics and quotes.`,
      variables: ['customer', 'outcome', 'metrics'], use_count: randomBetween(5, 20), rating: 4.8,
    },
    {
      user_id: userId, name: `${template.brand.name} Email Nurture`, description: `Nurture email sequence template for ${template.industry} leads`,
      content_type: 'email', category: 'nurture',
      prompt_template: `Write a nurture email for ${template.brand.name} targeting {persona}. Focus on {pain_point} and how we solve it.`,
      variables: ['persona', 'pain_point', 'solution'], use_count: randomBetween(15, 40), rating: 4.3,
    },
  ];
  const { error: templateError } = await marketingSupabase.from('content_templates_ai').insert(templates);
  if (templateError) console.error('content_templates_ai seed error:', templateError);
}
