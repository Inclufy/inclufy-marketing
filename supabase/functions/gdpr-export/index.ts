// =============================================================================
// Edge Function: gdpr-export
// -----------------------------------------------------------------------------
// GDPR Art. 15 (Right of Access) — complete data export for AMOS Marketing.
//
// Scope: data the requesting user PERSONALLY owns (user_id = user.id).
// We DO NOT include other team members' content from shared organizations —
// that would be their personal data, not the requester's.
//
// Returns JSON download containing:
//   - profile data (auth.users + profiles)
//   - organization memberships (which orgs the user belongs to + role)
//   - content the user has created: events, captures, posts, brand kits,
//     automations, library, campaigns, agents, etc.
//   - integrations the user has connected
//   - notifications + AI conversation history
//
// Used by:
//   - AMOS mobile (SettingsScreen.tsx)
//   - Marketing web (inclufy-marketing-web Settings.tsx)
//   Both authenticate against this same Supabase project (InclufyMarketing).
//
// Deploy:
//   supabase functions deploy gdpr-export --project-ref mpxkugfqzmxydxnlxqoj
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// All AMOS tables that have a user_id column tied to auth.users(id).
// Order doesn't matter for export (read-only). Add new tables here as
// the schema grows — keep alphabetical.
const USER_SCOPED_TABLES: { table: string; description: string }[] = [
  { table: "ad_campaigns",          description: "Paid social campaigns you created" },
  { table: "ad_commissions",        description: "Affiliate commission records" },
  { table: "agent_goals",           description: "AI agent goals you configured" },
  { table: "agent_goal_runs",       description: "AI agent goal-run history" },
  { table: "agent_run_messages",    description: "AI agent conversation messages" },
  { table: "agent_runs",            description: "AI agent run history" },
  { table: "agents",                description: "Custom AI agents you created" },
  { table: "ai_explanation_cache",  description: "Personal AI explanation cache" },
  { table: "brand_voice_profiles",  description: "Brand voice configs" },
  { table: "campaign_costs",        description: "Campaign cost tracking" },
  { table: "campaign_creatives",    description: "Campaign creative assets" },
  { table: "campaign_metrics",      description: "Campaign performance metrics" },
  { table: "campaign_revenue",      description: "Campaign revenue tracking" },
  { table: "content_posts",         description: "Content drafts + scheduled posts" },
  { table: "followed_organizers",   description: "Event organizers you follow" },
  { table: "go_automation_logs",    description: "Automation execution logs" },
  { table: "go_automations",        description: "Automation rules you set up" },
  { table: "go_captures",           description: "Photo/video captures at events" },
  { table: "go_content_proposals",  description: "AI-generated post drafts" },
  { table: "go_event_attendees",    description: "Event attendees you registered" },
  { table: "go_events",             description: "Events you created" },
  { table: "go_marketing_strategy", description: "Marketing strategy docs" },
  { table: "go_organization",       description: "Organizations you own/admin" },
  { table: "go_posts",              description: "Published social posts" },
  { table: "go_products",           description: "Product catalog entries" },
  { table: "go_team_directory",     description: "Team directory entries" },
  { table: "library_imports",       description: "Bulk import history" },
  { table: "library_posts",         description: "Imported content library" },
  { table: "notifications",         description: "Your notifications" },
  { table: "oauth_tokens",          description: "OAuth tokens (REDACTED in export)" },
  { table: "social_accounts",       description: "Connected social media accounts" },
];

interface ExportEnvelope {
  export_metadata: {
    exported_at: string;
    user_id: string;
    user_email: string;
    gdpr_article: string;
    format_version: string;
    table_count: number;
  };
  auth_user: Record<string, unknown> | null;
  organization_memberships: unknown[];
  tables: Record<string, { count: number; rows: unknown[]; description: string }>;
  warnings: string[];
}

/**
 * Redact secret fields (access_token, refresh_token) from OAuth token rows.
 * The user is entitled to know WHICH platforms are connected and WHEN tokens
 * were created, but exposing the raw tokens in an export file would be a
 * security risk if the file leaks.
 */
function redactOauthRow(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };
  if ("access_token" in out) out.access_token = "[REDACTED]";
  if ("refresh_token" in out) out.refresh_token = "[REDACTED]";
  return out;
}

async function exportOneTable(
  admin: SupabaseClient,
  table: string,
  userId: string,
): Promise<{ count: number; rows: unknown[] }> {
  const { data, error } = await admin.from(table).select("*").eq("user_id", userId);
  if (error) throw error;

  let rows = data ?? [];
  if (table === "oauth_tokens") {
    rows = rows.map((r) => redactOauthRow(r as Record<string, unknown>));
  }
  return { count: rows.length, rows };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError(401, "Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonError(500, "Server misconfigured (missing env vars)");
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return jsonError(401, "Invalid or expired token");

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Profile data
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // 2. Organization memberships (which orgs + role)
    //    AMOS uses `organization_members` (from marketing-web table list)
    const { data: memberships } = await admin
      .from("organization_members")
      .select("organization_id, role, joined_at")
      .eq("user_id", user.id);

    const envelope: ExportEnvelope = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email ?? "",
        gdpr_article: "Art. 15 — Right of access",
        format_version: "1.0",
        table_count: USER_SCOPED_TABLES.length + 2, // +profile +memberships
      },
      auth_user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      },
      organization_memberships: memberships ?? [],
      tables: {
        profiles: {
          count: profile ? 1 : 0,
          rows: profile ? [profile] : [],
          description: "Your profile row",
        },
      },
      warnings: [],
    };

    // 3. Export each user-scoped table
    for (const spec of USER_SCOPED_TABLES) {
      try {
        const result = await exportOneTable(admin, spec.table, user.id);
        envelope.tables[spec.table] = {
          count: result.count,
          rows: result.rows,
          description: spec.description,
        };
      } catch (err) {
        envelope.warnings.push(
          `Table '${spec.table}' export failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    // 4. Audit log (best-effort)
    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        action: "gdpr_data_export",
        resource_type: "gdpr",
        details: {
          table_count: Object.keys(envelope.tables).length,
          warning_count: envelope.warnings.length,
          gdpr_article: "Art. 15",
        },
      });
    } catch {
      // audit_logs may not exist; skip.
    }

    // 5. Return JSON download
    const body = JSON.stringify(envelope, null, 2);
    const filename = `inclufy-amos-data-${user.id}-${
      new Date().toISOString().split("T")[0]
    }.json`;

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("gdpr-export fatal:", err);
    return jsonError(
      500,
      `Export failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
});

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
