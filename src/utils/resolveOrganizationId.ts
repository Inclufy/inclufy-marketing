import { supabase } from '../services/supabase';

/**
 * Lazily ensures the current user has a linked organization across both
 * go_organization and organizations tables. Returns the organization_id.
 *
 * This enables cross-app data sharing between AMOS mobile and the web dashboard.
 * Never throws — returns null on failure so login is never blocked.
 */
export async function resolveOrganizationId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Check if go_organization already has organization_id
    const { data: goOrg } = await supabase
      .from('go_organization')
      .select('id, organization_id, company_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (goOrg?.organization_id) return goOrg.organization_id;

    // 2. Check if user has an existing organization membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let orgId = member?.organization_id;

    // 3. If no membership, create organization + membership
    if (!orgId) {
      const orgName = goOrg?.company_name ||
        user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Organization` : 'My Organization';

      const { data: newOrg } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: `org-${Date.now()}-${user.id.substring(0, 8)}`,
        })
        .select('id')
        .single();

      if (!newOrg) return null;
      orgId = newOrg.id;

      await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          role: 'owner',
        });
    }

    // 4. Link go_organization if it exists but isn't linked
    if (goOrg && !goOrg.organization_id) {
      await supabase
        .from('go_organization')
        .update({ organization_id: orgId })
        .eq('id', goOrg.id);
    }

    // 5. Create go_organization if it doesn't exist (web-only user)
    if (!goOrg) {
      await supabase
        .from('go_organization')
        .insert({
          user_id: user.id,
          organization_id: orgId,
          company_name: user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Company` : 'My Company',
        });
    }

    return orgId;
  } catch (err) {
    console.warn('[resolveOrganizationId] Failed:', err);
    return null;
  }
}
