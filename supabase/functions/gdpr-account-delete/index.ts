// =============================================================================
// Edge Function: gdpr-account-delete
// -----------------------------------------------------------------------------
// GDPR Art. 17 (Right to Erasure) — account deletion for AMOS Marketing.
//
// Design choice — selective deletion (per user feedback 2026-05-11):
//
// AMOS content (events, captures, posts, brand kits, automations, campaigns)
// is *organizational property*, not personal data of a single user. When a
// user leaves the organization or deletes their account, this content stays:
//   - Other team members may continue editing or publishing it
//   - The organization paid for AI generation / Meta/LinkedIn API calls
//   - Campaign attribution + analytics history must be preserved
//
// So we apply a 3-tier rule:
//
//   TIER 1 — HARD DELETE: tokens, AI conversations, notifications, personal
//            cache. These are strictly personal and have privacy + security
//            implications if kept (revoked OAuth tokens MUST go).
//
//   TIER 2 — PRESERVE WITH ANONYMIZATION: org content tables. The user_id
//            column stays (it references the now-anonymized profile row), so
//            display layers automatically render "[verwijderde gebruiker]"
//            wherever the author is shown. Content + analytics intact.
//
//   TIER 3 — ANONYMIZE: profiles row PII (email, name).
//
//   PLUS:  auth.users banned_until = 2100, audit-log entry, 30-day support
//          reversal window for profile-only restore.
//
// Deploy:
//   supabase functions deploy gdpr-account-delete --project-ref mpxkugfqzmxydxnlxqoj
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GRACE_DAYS = 30;

// ---------------------------------------------------------------------------
// TIER 1 — HARD DELETE (strictly personal data)
//
// Order matters for FK integrity: tokens before social_accounts,
// agent_run_messages before agent_runs, etc.
// ---------------------------------------------------------------------------
const TIER1_HARD_DELETE_ORDER: string[] = [
  // OAuth + connected accounts — revoke for security
  "oauth_tokens",
  "social_accounts",
  // AI conversation history — strictly personal
  "agent_run_messages",
  "agent_goal_runs",
  "agent_runs",
  "agent_goals",
  // Cached AI explanations + rate-limit data
  "ai_explanation_cache",
  "demo_request_rate_limit",
  // Personal preferences
  "followed_organizers",
  "notifications",
];

// ---------------------------------------------------------------------------
// TIER 2 — PRESERVE
//
// These tables hold organization content. We DO NOT delete or modify them.
// The user_id column on each row continues to reference the anonymized
// profile row (handled in TIER 3), so any UI that shows "author: <name>"
// will automatically render the anonymized name.
//
// Listed here for documentation transparency — the function never touches them.
// ---------------------------------------------------------------------------
const TIER2_PRESERVED_TABLES: string[] = [
  "go_captures",
  "content_posts",
  "go_posts",
  "go_content_proposals",
  "go_event_attendees",
  "go_events",
  "brand_voice_profiles",
  "go_automation_logs",
  "go_automations",
  "go_marketing_strategy",
  "library_posts",
  "library_imports",
  "agents",
  "campaign_metrics",
  "campaign_revenue",
  "campaign_costs",
  "campaign_creatives",
  "ad_commissions",
  "ad_campaigns",
  "go_products",
  "go_team_directory",
  "go_organization",
];

interface DeleteEnvelope {
  status: "deleted";
  message: string;
  deleted_at: string;
  grace_period_until: string;
  deleted_resources: {
    table: string;
    rows_deleted: number;
  }[];
  preserved_tables: string[];
  preservation_notice: string;
  warnings: string[];
}

async function hardDelete(
  admin: SupabaseClient,
  table: string,
  userId: string,
): Promise<number> {
  const { error, count } = await admin
    .from(table)
    .delete({ count: "exact" })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    return jsonError(405, "Method not allowed; use POST or DELETE");
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

    const now = new Date().toISOString();
    const graceUntil = new Date(
      Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const deleted: DeleteEnvelope["deleted_resources"] = [];
    const warnings: string[] = [];

    // TIER 1 — hard delete strictly personal tables
    for (const table of TIER1_HARD_DELETE_ORDER) {
      try {
        const rows = await hardDelete(admin, table, user.id);
        if (rows > 0) deleted.push({ table, rows_deleted: rows });
      } catch (err) {
        warnings.push(
          `Tier-1 delete failed for '${table}': ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    // TIER 3 — anonymize profile (TIER 2 is "do nothing", by design)
    const anonEmail = `deleted-user-${user.id}@deleted.inclufy.com`;
    try {
      await admin
        .from("profiles")
        .update({
          email: anonEmail,
          full_name: "[verwijderde gebruiker]",
          updated_at: now,
        })
        .eq("id", user.id);
    } catch (err) {
      warnings.push(
        `Profile anonymize failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    // Ban auth user (effectively permanent)
    try {
      await admin.auth.admin.updateUserById(user.id, {
        ban_duration: "876000h", // ~100 years
        email: anonEmail,
        user_metadata: {
          ...user.user_metadata,
          gdpr_deleted_at: now,
          gdpr_grace_period_until: graceUntil,
        },
      });
    } catch (err) {
      warnings.push(
        `Auth ban failed (DB-level deletion still succeeded): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    // Audit log (best-effort)
    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        action: "gdpr_account_deleted",
        resource_type: "gdpr",
        details: {
          tier1_deleted_table_count: deleted.length,
          tier1_total_rows_deleted: deleted.reduce(
            (sum, d) => sum + d.rows_deleted,
            0,
          ),
          tier2_preserved_table_count: TIER2_PRESERVED_TABLES.length,
          warning_count: warnings.length,
          gdpr_article: "Art. 17 (with org-content preservation derogation)",
        },
      });
    } catch {
      // audit_logs may not exist in AMOS; ignore.
    }

    const envelope: DeleteEnvelope = {
      status: "deleted",
      message:
        "Account verwijderd. Persoonlijke data (OAuth-tokens, AI-gesprekken, " +
        "notificaties, voorkeuren) zijn permanent gewist. Profielgegevens " +
        "geanonimiseerd. Content die je voor de organisatie hebt gemaakt " +
        "(events, captures, posts, brand kits, campagnes) blijft eigendom " +
        "van de organisatie. Contact support@inclufy.com binnen 30 dagen om " +
        "profielreactivatie aan te vragen.",
      deleted_at: now,
      grace_period_until: graceUntil,
      deleted_resources: deleted,
      preserved_tables: TIER2_PRESERVED_TABLES,
      preservation_notice:
        "Onder GDPR Art. 17(3)(e) en op grond van legitieme bedrijfsbelangen " +
        "van de organisatie waar je voor werkte, blijven de volgende content-" +
        "categorieën behouden onder de organisatie: events, captures, posts, " +
        "brand voice profiles, automations, marketing strategy, library, " +
        "campaigns, ads, products, team directory.",
      warnings,
    };

    return new Response(JSON.stringify(envelope, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("gdpr-account-delete fatal:", err);
    return jsonError(
      500,
      `Delete failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
});

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
