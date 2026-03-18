import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface OrganizationProfile {
  id: string;
  user_id: string;
  company_name: string;
  tagline: string;
  description: string;
  elevator_pitch: string;
  logo_url: string | null;
  website: string;
  industry: string;
  founded_year: string;
  team_size: string;
  location: string;
  email: string;
  phone: string;
  social_links: Record<string, string>;
  media_kit_url: string | null;
  boilerplate: string;
  client_logos: string[];
  certifications: string[];
  created_at: string;
  updated_at: string;
}

export function useOrganization() {
  return useQuery<OrganizationProfile | null>({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('go_organization')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) { console.warn('[useOrganization] error:', error.message); return null; }
      return data as OrganizationProfile | null;
    },
    staleTime: 60_000,
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<OrganizationProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('go_organization')
        .upsert(
          { ...updates, user_id: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as OrganizationProfile;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization'] }),
  });
}
