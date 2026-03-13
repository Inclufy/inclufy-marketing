import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface OrgMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface OrgIntegration {
  name: string;
  category: string;
  status: string;
  configured: boolean;
  details?: Record<string, any>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  member_count?: number;
}

export interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  user_email?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// Hooks

export function useOrgMembers() {
  return useQuery<OrgMember[]>({
    queryKey: ['governance', 'members'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as OrgMember[];
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useIntegrations() {
  return useQuery<OrgIntegration[]>({
    queryKey: ['governance', 'integrations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;

      return (data || []).map((i: any) => ({
        name: i.display_name || i.platform,
        category: i.category || 'general',
        status: i.status || 'disconnected',
        configured: i.status === 'connected',
        details: i,
      })) as OrgIntegration[];
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useOrganizations() {
  return useQuery<Organization[]>({
    queryKey: ['governance', 'organizations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('organization_entities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      return (data || []).map((o: any) => ({
        id: o.id,
        name: o.name || '',
        slug: (o.name || '').toLowerCase().replace(/\s+/g, '-'),
        plan: 'enterprise',
        created_at: o.created_at,
        member_count: 0,
      })) as Organization[];
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useRecentActivity() {
  return useQuery<ActivityEntry[]>({
    queryKey: ['governance', 'activity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      return (data || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'info',
        description: n.message || n.title || '',
        user_email: user.email,
        created_at: n.created_at,
        metadata: n.metadata,
      })) as ActivityEntry[];
    },
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useSystemConfig() {
  return useQuery<Record<string, any>>({
    queryKey: ['admin', 'config'],
    queryFn: async () => {
      // System config is stored in profiles/settings — return defaults
      return {
        ai_enabled: true,
        analytics_enabled: true,
        max_campaigns: 100,
        max_contacts: 50000,
      };
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
