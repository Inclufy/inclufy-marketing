// src/services/demo-agent/seeders/marketing/context-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { randomBetween } from '../../templates/base-template';

export async function seedContext(userId: string, template: IndustryTemplate): Promise<void> {
  // Organization entities
  const entities = template.organizationEntities.map((e) => ({
    user_id: userId,
    name: e.name,
    type: e.type,
    description: e.description,
  }));
  const { error: entityError } = await marketingSupabase.from('organization_entities').insert(entities);
  if (entityError) console.error('organization_entities seed error:', entityError);

  // Products
  const products = template.products.map((p) => ({
    user_id: userId,
    name: p.name,
    description: p.description,
    category: p.category,
    status: p.status,
  }));
  const { error: productError } = await marketingSupabase.from('products').insert(products);
  if (productError) console.error('products seed error:', productError);

  // Competitors
  const competitors = template.competitors.map((c) => ({
    user_id: userId,
    name: c.name,
    description: c.description,
    website: c.website,
  }));
  const { error: compError } = await marketingSupabase.from('competitors').insert(competitors);
  if (compError) console.error('competitors seed error:', compError);

  // Competitive features
  const featureNames = ['AI/ML Capabilities', 'User Experience', 'Integration Ecosystem', 'Pricing', 'Customer Support', 'Scalability', 'Data Security', 'Mobile App'];
  const compFeatures = template.competitors.flatMap((c) =>
    featureNames.map((feature) => ({
      user_id: userId,
      competitor_name: c.name,
      feature_name: feature,
      our_rating: randomBetween(7, 10),
      competitor_rating: randomBetween(4, 9),
      importance: randomBetween(6, 10),
    }))
  );
  const { error: featError } = await marketingSupabase.from('competitive_features').insert(compFeatures);
  if (featError) console.error('competitive_features seed error:', featError);

  // Personas
  const personas = template.personas.map((p) => ({
    user_id: userId,
    name: p.name,
    description: p.description,
    demographics: p.demographics,
    psychographics: p.psychographics,
    pain_points: p.pain_points,
    goals: p.goals,
    preferred_channels: p.preferred_channels,
  }));
  const { error: personaError } = await marketingSupabase.from('personas').insert(personas);
  if (personaError) console.error('personas seed error:', personaError);

  // Segments
  const segments = [
    { user_id: userId, name: 'Enterprise Decision Makers', description: `C-level and VP leads from companies with 500+ employees in ${template.industry}`, rules: { company_size: '500+', title_level: ['C-level', 'VP'], industry: template.industry } },
    { user_id: userId, name: 'Active Pipeline', description: 'Leads with score > 75 and activity in last 14 days', rules: { min_score: 75, last_activity_days: 14 } },
    { user_id: userId, name: 'Event Contacts', description: `Contacts captured from ${template.industry} events in the past 90 days`, rules: { source: 'event', captured_within_days: 90 } },
  ];
  const { error: segmentError } = await marketingSupabase.from('segments').insert(segments);
  if (segmentError) console.error('segments seed error:', segmentError);

  // Strategic objectives
  const objectives = template.strategicObjectives.map((o) => ({
    user_id: userId,
    name: o.name,
    description: o.description,
    category: o.category,
    target_value: o.target_value,
    current_value: o.current_value,
    unit: o.unit,
    priority: o.priority,
  }));
  const { error: objError } = await marketingSupabase.from('strategic_objectives').insert(objectives);
  if (objError) console.error('strategic_objectives seed error:', objError);
}
