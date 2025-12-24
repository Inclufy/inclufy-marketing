import { supabase } from './client'

export const api = {
  // Campaigns
  campaigns: {
    async list() {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    
    async create(campaign: any) {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Journeys  
  journeys: {
    async list() {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    
    async save(journey: any) {
      const { data, error } = await supabase
        .from('journeys')
        .insert(journey)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  }
}