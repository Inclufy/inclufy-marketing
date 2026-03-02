import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { api } from '@/lib/supabase/api'

interface CampaignStore {
  campaigns: any[]
  loading: boolean
  
  fetchCampaigns: () => Promise<void>
  createCampaign: (campaign: any) => Promise<void>
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  campaigns: [],
  loading: false,

  fetchCampaigns: async () => {
    set({ loading: true })
    try {
      const campaigns = await api.campaigns.list()
      set({ campaigns, loading: false })
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      set({ loading: false })
    }
  },

  createCampaign: async (campaignData) => {
    try {
      // First, we need to get the user's organization
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // For now, let's create a test organization if needed
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
      
      let orgId = orgs?.[0]?.id
      
      if (!orgId) {
        // Create test organization
        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({ 
            name: 'Test Organization', 
            slug: 'test-org' 
          })
          .select()
          .single()
        
        orgId = newOrg?.id
      }

      const campaign = await api.campaigns.create({
        ...campaignData,
        organization_id: orgId,
        status: 'draft',
        spent: 0,
        performance: {
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0
        }
      })
      
      set(state => ({ 
        campaigns: [...state.campaigns, campaign] 
      }))
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw error
    }
  }
}))