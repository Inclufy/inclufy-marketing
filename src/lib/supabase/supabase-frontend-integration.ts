// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// src/lib/supabase/functions.ts
import { supabase } from './client'

const FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

async function invokeFunction(functionName: string, body?: any) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No authenticated session')
  }

  const response = await fetch(`${FUNCTION_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Function call failed')
  }

  return response.json()
}

export const api = {
  // Auth
  auth: {
    register: async (data: {
      email: string
      password: string
      full_name: string
      organization_name: string
      organization_slug: string
    }) => {
      return invokeFunction('auth-register', data)
    },
    
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    },
    
    logout: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  },

  // Campaigns
  campaigns: {
    list: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    create: async (campaign: any) => {
      return invokeFunction('campaigns-create', campaign)
    },
    
    update: async (id: string, updates: any) => {
      return invokeFunction('campaigns-update', { id, ...updates })
    },
    
    delete: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    
    activate: async (id: string) => {
      return invokeFunction('campaigns-activate', { id })
    },
  },

  // Journeys
  journeys: {
    list: async () => {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    create: async (journey: any) => {
      return invokeFunction('journeys-create', journey)
    },
    
    update: async (id: string, nodes: any[], edges: any[]) => {
      const { data, error } = await supabase
        .from('journeys')
        .update({ nodes, edges, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
  },

  // Contacts
  contacts: {
    list: async (filters?: { search?: string; tags?: string[] }) => {
      let query = supabase.from('contacts').select('*')
      
      if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`)
      }
      
      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data
    },
    
    import: async (contacts: any[]) => {
      return invokeFunction('contacts-import', { contacts })
    },
  },

  // Analytics
  analytics: {
    getRevenue: async (days = 30) => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await supabase
        .from('revenue_events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
      
      if (error) throw error
      return data
    },
    
    getCampaignAnalytics: async (campaignId: string) => {
      return invokeFunction('analytics-campaign', { campaignId })
    },
  },
}

// src/lib/supabase/realtime.ts
import { supabase } from './client'
import { RealtimeChannel } from '@supabase/supabase-js'

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  
  subscribeToCampaigns(orgId: string, callback: (payload: any) => void) {
    const channelName = `campaigns:${orgId}`
    
    if (this.channels.has(channelName)) return
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `organization_id=eq.${orgId}`
        },
        callback
      )
      .subscribe()
    
    this.channels.set(channelName, channel)
  }
  
  subscribeToJourneyEnrollments(journeyId: string, callback: (payload: any) => void) {
    const channelName = `journey:${journeyId}`
    
    if (this.channels.has(channelName)) return
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journey_enrollments',
          filter: `journey_id=eq.${journeyId}`
        },
        callback
      )
      .subscribe()
    
    this.channels.set(channelName, channel)
  }
  
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }
  
  unsubscribeAll() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
  }
}

export const realtimeManager = new RealtimeManager()

// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchOrganization(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchOrganization(session.user.id)
        } else {
          setOrganization(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchOrganization = async (userId: string) => {
    const { data } = await supabase
      .from('organization_members')
      .select(`
        role,
        organization:organizations(*)
      `)
      .eq('user_id', userId)
      .single()

    if (data) {
      setOrganization({
        ...data.organization,
        role: data.role
      })
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setOrganization(null)
  }

  return { user, organization, loading, signOut }
}

// src/hooks/useCampaigns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/supabase/functions'
import { useAuth } from './useAuth'
import { realtimeManager } from '@/lib/supabase/realtime'
import { useEffect } from 'react'

export function useCampaigns() {
  const { organization } = useAuth()
  const queryClient = useQueryClient()

  // Subscribe to real-time updates
  useEffect(() => {
    if (!organization) return

    realtimeManager.subscribeToCampaigns(
      organization.id,
      (payload) => {
        // Invalidate and refetch campaigns when changes occur
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      }
    )

    return () => {
      realtimeManager.unsubscribe(`campaigns:${organization.id}`)
    }
  }, [organization, queryClient])

  const campaignsQuery = useQuery({
    queryKey: ['campaigns'],
    queryFn: api.campaigns.list,
    enabled: !!organization,
  })

  const createCampaign = useMutation({
    mutationFn: api.campaigns.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  const updateCampaign = useMutation({
    mutationFn: ({ id, ...updates }: any) => 
      api.campaigns.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  const deleteCampaign = useMutation({
    mutationFn: api.campaigns.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  }
}

// src/stores/campaignStore.ts - Updated to use Supabase
import { create } from 'zustand'
import { api } from '@/lib/supabase/functions'

interface CampaignStore {
  campaigns: any[]
  loading: boolean
  error: string | null
  
  fetchCampaigns: () => Promise<void>
  createCampaign: (campaign: any) => Promise<void>
  updateCampaign: (id: string, updates: any) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [],
  loading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ loading: true, error: null })
    try {
      const campaigns = await api.campaigns.list()
      set({ campaigns, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createCampaign: async (campaign) => {
    set({ loading: true, error: null })
    try {
      const newCampaign = await api.campaigns.create(campaign)
      set(state => ({ 
        campaigns: [...state.campaigns, newCampaign],
        loading: false 
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateCampaign: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const updated = await api.campaigns.update(id, updates)
      set(state => ({
        campaigns: state.campaigns.map(c => c.id === id ? updated : c),
        loading: false
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deleteCampaign: async (id) => {
    set({ loading: true, error: null })
    try {
      await api.campaigns.delete(id)
      set(state => ({
        campaigns: state.campaigns.filter(c => c.id !== id),
        loading: false
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
}))