// src/services/context-marketing/audience-context.service.ts
import { supabase } from '@/integrations/supabase/client';

export interface Persona {
  id?: string;
  user_id?: string;
  name?: string;
  demographics?: {
    ageRange?: string;
    gender?: string;
    location?: string;
    incomeLevel?: string;
    education?: string;
    occupation?: string;
  };
  psychographics?: {
    values?: string;
    interests?: string;
    lifestyle?: string;
    painPoints?: string;
    motivations?: string;
  };
  behavioral?: {
    purchaseFrequency?: string;
    preferredChannels?: string;
    brandLoyalty?: string;
    decisionFactors?: string;
    contentPreferences?: string;
  };
  journeyStages?: Array<{
    name: string;
    touchpoints: string;
    emotions: string;
    actions: string;
  }>;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface AudienceSegment {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  estimated_size: number;
  is_dynamic: boolean;
  created_at: string;
  updated_at: string;
}

export interface SegmentRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logic?: 'and' | 'or';
}

class AudienceContextService {
  async createPersona(persona: Partial<Persona>): Promise<Persona> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('personas')
      .insert({
        user_id: user.user.id,
        name: persona.name || 'Untitled Persona',
        demographics: persona.demographics || {},
        psychographics: persona.psychographics || {},
        behavioral: persona.behavioral || {},
        journey_stages: persona.journeyStages || [],
        metadata: persona.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPersonas(): Promise<Persona[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updatePersona(personaId: string, updates: Partial<Persona>): Promise<Persona> {
    const { data, error } = await supabase
      .from('personas')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', personaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePersona(personaId: string): Promise<void> {
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', personaId);

    if (error) throw error;
  }

  async createSegment(segment: Partial<AudienceSegment>): Promise<AudienceSegment> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('segments')
      .insert({
        user_id: user.user.id,
        name: segment.name || 'Untitled Segment',
        description: segment.description,
        rules: segment.rules || [],
        estimated_size: segment.estimated_size || 0,
        is_dynamic: segment.is_dynamic ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSegments(): Promise<AudienceSegment[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('segments')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const audienceContextService = new AudienceContextService();
export default audienceContextService;
