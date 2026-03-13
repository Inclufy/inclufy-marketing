// src/services/demo-agent/seeders/marketing/agents-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { getBaseAgents } from '../../templates/base-template';

export async function seedAgents(userId: string, template: IndustryTemplate): Promise<void> {
  const agents = getBaseAgents(userId, template.agentTasks);
  const { error } = await marketingSupabase.from('ai_agents').insert(agents);
  if (error) console.error('ai_agents seed error:', error);
}
