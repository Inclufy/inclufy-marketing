// src/services/demo-agent/seeders/marketing/context-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';
import { randomBetween } from '../../templates/base-template';

export async function seedContext(userId: string, template: IndustryTemplate): Promise<void> {
  // Organization entities — DB columns: entity_name, entity_type, description
  const entities = template.organizationEntities.map((e) => ({
    user_id: userId,
    entity_name: e.name,
    entity_type: e.type,
    description: e.description,
  }));
  const { error: entityError } = await marketingSupabase.from('organization_entities').insert(entities);
  if (entityError) console.error('organization_entities seed error:', entityError);

  // Products — DB columns: product_name, product_type, description, status (NO category column)
  const products = template.products.map((p) => ({
    user_id: userId,
    product_name: p.name,
    description: p.description,
    product_type: p.category || 'software',
    status: p.status,
  }));
  const { error: productError } = await marketingSupabase.from('products').insert(products);
  if (productError) console.error('products seed error:', productError);

  // Competitors — DB columns: competitor_name, website_url, company_type, metadata (NO description column)
  const competitors = template.competitors.map((c) => ({
    user_id: userId,
    competitor_name: c.name,
    website_url: c.website,
    company_type: 'direct',
    metadata: { description: c.description },
  }));
  const { error: compError } = await marketingSupabase.from('competitors').insert(competitors);
  if (compError) console.error('competitors seed error:', compError);

  // Competitive features — DB columns: feature_name, feature_category, our_score, our_capability,
  //   competitor_capabilities (JSONB), importance_weight (NO competitor_name, our_rating, competitor_rating, importance)
  const featureNames = ['AI/ML Capabilities', 'User Experience', 'Integration Ecosystem', 'Pricing', 'Customer Support', 'Scalability', 'Data Security', 'Mobile App'];
  const compFeatures = template.competitors.flatMap((c) =>
    featureNames.map((feature) => ({
      user_id: userId,
      feature_name: feature,
      feature_category: 'core',
      our_score: randomBetween(7, 10),
      our_capability: 'Available',
      our_status: 'available',
      competitor_capabilities: { [c.name]: { score: randomBetween(4, 9), status: 'available' } },
      importance_weight: randomBetween(6, 10),
    }))
  );
  const { error: featError } = await marketingSupabase.from('competitive_features').insert(compFeatures);
  if (featError) console.error('competitive_features seed error:', featError);

  // Personas — DB columns: name, demographics (JSONB), psychographics (JSONB), behavioral (JSONB),
  //   journey_stages (JSONB), metadata (JSONB) — NO description, pain_points, goals, preferred_channels
  const personas = template.personas.map((p) => ({
    user_id: userId,
    name: p.name,
    demographics: p.demographics,
    psychographics: p.psychographics,
    behavioral: {
      pain_points: p.pain_points,
      goals: p.goals,
      preferred_channels: p.preferred_channels,
    },
    metadata: {
      description: p.description,
    },
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

  // Strategic objectives — DB columns: title, description, objective_type, priority, target_value,
  //   current_value, time_horizon, target_date, status, success_metrics (NO name, category, unit)
  const objectives = template.strategicObjectives.map((o) => ({
    user_id: userId,
    title: o.name,
    description: o.description,
    objective_type: o.category || 'operational',
    target_value: o.target_value,
    current_value: o.current_value,
    priority: o.priority,
    status: 'active',
    success_metrics: [{ metric: o.unit || 'units', target: o.target_value }],
  }));
  const { error: objError } = await marketingSupabase.from('strategic_objectives').insert(objectives);
  if (objError) console.error('strategic_objectives seed error:', objError);
}
