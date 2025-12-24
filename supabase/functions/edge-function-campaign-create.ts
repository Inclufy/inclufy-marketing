// supabase/functions/campaigns-create/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CampaignRequest {
  name: string
  description?: string
  type: 'email' | 'sms' | 'multi-channel'
  content: {
    subject?: string
    body?: string
  }
  audience_filters?: {
    segments?: string[]
    tags?: string[]
  }
  settings?: {
    ai_optimization?: boolean
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with user's auth
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return new Response(
        JSON.stringify({ error: 'No organization found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Parse request body
    const campaignData: CampaignRequest = await req.json()

    // Validate data
    if (!campaignData.name || !campaignData.type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        organization_id: member.organization_id,
        name: campaignData.name,
        description: campaignData.description,
        type: campaignData.type,
        content: campaignData.content || {},
        audience_filters: campaignData.audience_filters || {},
        settings: campaignData.settings || {},
        created_by: user.id,
        updated_by: user.id,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create campaign' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Track event
    await supabase
      .from('events')
      .insert({
        organization_id: member.organization_id,
        event_type: 'campaign_created',
        event_name: 'Campaign Created',
        properties: { 
          campaign_id: campaign.id, 
          campaign_name: campaign.name 
        }
      })

    return new Response(
      JSON.stringify(campaign),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}