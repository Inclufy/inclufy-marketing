// src/services/demo-agent/seeders/marketing/brand-seeder.ts
import { marketingSupabase } from '../../config/supabase-clients';
import type { IndustryTemplate } from '../../types';

export async function seedBrand(userId: string, template: IndustryTemplate): Promise<void> {
  const { brand } = template;

  // Seed brand_memory
  const { error: brandError } = await marketingSupabase
    .from('brand_memory')
    .insert({
      user_id: userId,
      brand_name: brand.name,
      tagline: brand.tagline,
      mission: brand.mission,
      brand_description: brand.description,
      tone_attributes: brand.tone_attributes,
      primary_color: brand.primary_color,
      secondary_color: brand.secondary_color,
      usps: brand.usps,
      brand_values: brand.brand_values,
      audiences: brand.audiences,
      industries: brand.industries,
      messaging_dos: brand.messaging_dos,
      messaging_donts: brand.messaging_donts,
      preferred_vocabulary: brand.preferred_vocabulary,
      banned_phrases: brand.banned_phrases,
      is_active: true,
    });
  if (brandError) console.error('brand_memory seed error:', brandError);

  // Seed brand_voices
  const { error: voiceError } = await marketingSupabase
    .from('brand_voices')
    .insert({
      user_id: userId,
      name: brand.voice_name,
      description: brand.voice_description,
      tone_attributes: brand.tone_attributes,
      vocabulary: brand.preferred_vocabulary,
      examples: [
        `Our ${brand.name} commitment to ${brand.brand_values[0]} drives everything we do.`,
        `${brand.tagline} — that's not just our promise, it's our proven track record.`,
      ],
      is_default: true,
    });
  if (voiceError) console.error('brand_voices seed error:', voiceError);
}
