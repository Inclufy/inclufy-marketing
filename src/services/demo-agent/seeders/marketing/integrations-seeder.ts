// src/services/demo-agent/seeders/marketing/integrations-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { getBaseIntegrations, daysAgo, randomBetween } from '../../templates/base-template';

export async function seedIntegrations(userId: string, template: IndustryTemplate): Promise<void> {
  // Integration configs
  const integrations = getBaseIntegrations(userId);
  // Customize account names with brand
  integrations.forEach((int) => {
    if (int.platform === 'meta') int.account_name = `${template.brand.name} Business`;
    if (int.platform === 'linkedin') int.account_name = template.brand.name;
    if (int.platform === 'google_ads') int.account_name = `${template.brand.name} Ads`;
    if (int.platform === 'slack') int.account_name = `${template.brand.name} Workspace`;
  });
  const { error: intError } = await marketingSupabase.from('integration_configs').insert(integrations);
  if (intError) console.error('integration_configs seed error:', intError);

  // Data flow events
  const platforms = ['meta', 'linkedin', 'google_ads', 'sendgrid', 'hubspot', 'slack'];
  const dataTypes = ['contacts', 'campaigns', 'analytics', 'leads', 'content', 'notifications'];
  const events = Array.from({ length: 12 }, (_, i) => ({
    user_id: userId,
    platform: platforms[i % platforms.length],
    direction: i % 3 === 0 ? 'outbound' : 'inbound',
    data_type: dataTypes[i % dataTypes.length],
    record_count: randomBetween(10, 5000),
    status: i === 8 ? 'failed' : 'success',
    duration_ms: randomBetween(120, 4500),
    error_message: i === 8 ? 'Rate limit exceeded — retrying in 60s' : null,
  }));
  const { error: flowError } = await marketingSupabase.from('data_flow_events').insert(events);
  if (flowError) console.error('data_flow_events seed error:', flowError);
}
