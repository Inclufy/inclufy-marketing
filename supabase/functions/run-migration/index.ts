// Temporary edge function to apply database migrations via service role
// Uses raw postgres queries through the supabase-js client
// DELETE THIS FUNCTION AFTER USE

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_DB_URL = Deno.env.get('SUPABASE_DB_URL') ?? '';

serve(async (req) => {
  // Use direct postgres connection via Deno's postgres
  const results: string[] = [];

  try {
    // Dynamic import of postgres
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.4/mod.js');

    const sql = postgres(SUPABASE_DB_URL, { max: 1 });

    // 1. Add attributes column to go_contacts
    try {
      await sql`ALTER TABLE go_contacts ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb`;
      results.push('go_contacts.attributes: ADDED');
    } catch (e: any) {
      results.push(`go_contacts.attributes: ${e.message}`);
    }

    // 2. Create followed_organizers table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS followed_organizers (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          organizer_name text NOT NULL,
          organizer_website text,
          category text DEFAULT 'general',
          is_favorite boolean DEFAULT false,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        )
      `;
      results.push('followed_organizers table: CREATED');
    } catch (e: any) {
      results.push(`followed_organizers table: ${e.message}`);
    }

    // 3. Enable RLS on followed_organizers
    try {
      await sql`ALTER TABLE followed_organizers ENABLE ROW LEVEL SECURITY`;
      results.push('followed_organizers RLS: ENABLED');
    } catch (e: any) {
      results.push(`followed_organizers RLS: ${e.message}`);
    }

    // 4. Create RLS policies for followed_organizers
    const policies = [
      { name: 'fo_select_own', op: 'SELECT', check: 'USING (auth.uid() = user_id)' },
      { name: 'fo_insert_own', op: 'INSERT', check: 'WITH CHECK (auth.uid() = user_id)' },
      { name: 'fo_update_own', op: 'UPDATE', check: 'USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)' },
      { name: 'fo_delete_own', op: 'DELETE', check: 'USING (auth.uid() = user_id)' },
    ];

    for (const p of policies) {
      try {
        await sql.unsafe(`CREATE POLICY "${p.name}" ON followed_organizers FOR ${p.op} ${p.check}`);
        results.push(`Policy ${p.name}: CREATED`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          results.push(`Policy ${p.name}: EXISTS`);
        } else {
          results.push(`Policy ${p.name}: ${e.message}`);
        }
      }
    }

    // 5. Create RLS policies for profiles (if missing)
    try {
      await sql`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`;
      results.push('profiles RLS: ENABLED');
    } catch (e: any) {
      results.push(`profiles RLS: ${e.message}`);
    }

    const profilePolicies = [
      { name: 'profiles_select_own', op: 'SELECT', check: 'USING (auth.uid() = id)' },
      { name: 'profiles_insert_own', op: 'INSERT', check: 'WITH CHECK (auth.uid() = id)' },
      { name: 'profiles_update_own', op: 'UPDATE', check: 'USING (auth.uid() = id) WITH CHECK (auth.uid() = id)' },
    ];

    for (const p of profilePolicies) {
      try {
        await sql.unsafe(`CREATE POLICY "${p.name}" ON profiles FOR ${p.op} ${p.check}`);
        results.push(`Policy ${p.name}: CREATED`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          results.push(`Policy ${p.name}: EXISTS`);
        } else {
          results.push(`Policy ${p.name}: ${e.message}`);
        }
      }
    }

    // 6. Create campaign_costs table if not exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS campaign_costs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          campaign_id uuid NOT NULL,
          category text NOT NULL CHECK (category IN ('ads', 'events', 'tools', 'personnel', 'travel', 'content', 'other')),
          description text,
          amount numeric(12,2) NOT NULL DEFAULT 0,
          created_at timestamptz DEFAULT now()
        )
      `;
      results.push('campaign_costs table: CREATED');
    } catch (e: any) {
      results.push(`campaign_costs table: ${e.message}`);
    }

    // 7. Create campaign_revenue table if not exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS campaign_revenue (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          campaign_id uuid NOT NULL,
          source text NOT NULL CHECK (source IN ('lead_conversion', 'direct_sale', 'event_ticket', 'subscription', 'referral', 'other')),
          description text,
          amount numeric(12,2) NOT NULL DEFAULT 0,
          created_at timestamptz DEFAULT now()
        )
      `;
      results.push('campaign_revenue table: CREATED');
    } catch (e: any) {
      results.push(`campaign_revenue table: ${e.message}`);
    }

    // 8. RLS for campaign_costs and campaign_revenue
    for (const table of ['campaign_costs', 'campaign_revenue']) {
      try {
        await sql.unsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
        results.push(`${table} RLS: ENABLED`);
      } catch (e: any) {
        results.push(`${table} RLS: ${e.message}`);
      }
      for (const op of ['SELECT', 'INSERT', 'DELETE']) {
        const pName = `${table}_${op.toLowerCase()}_own`;
        const check = op === 'INSERT' ? 'WITH CHECK (auth.uid() = user_id)' : 'USING (auth.uid() = user_id)';
        try {
          await sql.unsafe(`CREATE POLICY "${pName}" ON ${table} FOR ${op} ${check}`);
          results.push(`Policy ${pName}: CREATED`);
        } catch (e: any) {
          results.push(`Policy ${pName}: ${e.message?.includes('already exists') ? 'EXISTS' : e.message}`);
        }
      }
    }

    // 9. Enable RLS on go_contacts and add policies
    try {
      await sql`ALTER TABLE go_contacts ENABLE ROW LEVEL SECURITY`;
      results.push('go_contacts RLS: ENABLED');
    } catch (e: any) {
      results.push(`go_contacts RLS: ${e.message}`);
    }

    for (const op of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
      const pName = `go_contacts_${op.toLowerCase()}_own`;
      const check = op === 'INSERT'
        ? 'WITH CHECK (auth.uid() = user_id)'
        : op === 'UPDATE'
          ? 'USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)'
          : 'USING (auth.uid() = user_id)';
      try {
        await sql.unsafe(`CREATE POLICY "${pName}" ON go_contacts FOR ${op} ${check}`);
        results.push(`Policy ${pName}: CREATED`);
      } catch (e: any) {
        results.push(`Policy ${pName}: ${e.message?.includes('already exists') ? 'EXISTS' : e.message}`);
      }
    }

    await sql.end();

    return new Response(JSON.stringify({ success: true, results }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message, results }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
