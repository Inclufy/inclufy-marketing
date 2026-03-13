// Supabase Edge Function: Team Invite
// Invites a user to an event team by email.
// Uses the service role key to look up user by email (admin operation).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Authenticate calling user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResp({ error: 'Not authenticated' }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return jsonResp({ error: 'Unauthorized' }, 401);

    const { event_id, email, role = 'contributor' } = await req.json();
    if (!event_id || !email) return jsonResp({ error: 'event_id and email are required' }, 400);

    // Admin client — needed to look up user by email
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify current user owns the event
    const { data: eventData, error: eventError } = await userClient
      .from('go_events')
      .select('id')
      .eq('id', event_id)
      .eq('user_id', user.id)
      .single();

    if (eventError || !eventData) {
      return jsonResp({ error: 'Only the event owner can invite team members' }, 403);
    }

    // Look up invited user by email using admin API
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) return jsonResp({ error: 'Failed to look up user' }, 500);

    const targetUser = usersData?.users?.find((u) => u.email === email);
    if (!targetUser) {
      return jsonResp({ error: `No account found for ${email}. Ask them to sign up first.` }, 404);
    }

    // Check if already a member
    const { data: existing } = await adminClient
      .from('go_event_members')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('user_id', targetUser.id)
      .single();

    if (existing) {
      return jsonResp({ error: 'This person is already a team member' }, 409);
    }

    // Create membership record
    const { data: member, error: insertError } = await adminClient
      .from('go_event_members')
      .insert({
        event_id,
        user_id: targetUser.id,
        invited_by: user.id,
        role,
        status: 'pending',
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return jsonResp({ error: 'Failed to create team member record' }, 500);
    }

    return jsonResp({ member, message: `Invitation sent to ${email}` });
  } catch (err) {
    console.error('team-invite error:', err);
    return jsonResp({ error: String(err) }, 500);
  }
});
