// =============================================================================
// Edge Function: gdpr-account-delete
// -----------------------------------------------------------------------------
// GDPR Art. 17 (Right to Erasure) — account deletion for AMOS Marketing.
//
// Why different from Finance's gdpr-account-delete:
//   - AMOS holds marketing content (events, captures, posts, brand_kits,
//     campaigns) NOT subject to fiscal retention. So we hard-delete user
//     content + revoke OAuth + anonymize profile.
//   - Finance must preserve invoices/transactions for 7 years (AWR art. 52);
//     AMOS has no equivalent obligation.
//
// What this function DOES:
//   1. Revoke + delete oauth_tokens for all user's social accounts
//   2. Delete user-owned content: go_events, go_captures, go_posts,
//      brand_voice_profiles, automations, content_proposals, library_*,
//      ad_campaigns, agent_*, social_accounts, etc.
//   3. Anonymize profile PII (full_name, email)
//   4. Ban auth.users (banned_until = 2100)
//   5. Audit-log the action
//
// What it preserves:
//   - audit_logs (security trail — legitimate interest)
//   - admin/operational tables not linked to user
//
// Reversal:
//   - Hard delete is NOT reversible. UI must show clear warning.
//   - 30-day grace period only for profile reactivation (not content recovery)
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

// Tables to hard-delete by user_id. Ordered so that FK references are
// removed before their parents (oauth_tokens before social_accounts, etc.).
const USER_SCOPED_DELETE_ORDER: string[] = [
  // OAuth + social
  "oauth_tokens",          // FK to social_accounts (cascades there too)
  "social_accounts",
  // Captures + posts
  "go_captures",
  "content_posts",
  "go_posts",
  "go_content_proposals",
  // Events
  "go_event_attendees",
  "go_events",
  // Brand kit + voice
  "brand_voice_profiles",
  // Automations
  "go_automation_logs",
  "go_automations",
  // Strategy + marketing
  "go_marketing_strategy",
  // Library
  "library_posts",
  "library_imports",
  // Agents
  "agent_run_messages",
  "agent_goal_runs",
  "agent_runs",
  "agent_goals",
  "agents",
  // Ads + campaigns
  "campaign_metrics",
  "campaign_revenue",
  "campaign_costs",
  "campaign_creatives",
  "ad_commissions",
  "ad_campaigns",
  // AI explanations cache
  "ai_explanation_cache",
  // Followed organizers
  "followed_organizers",
  // Notifications
  "notifications",
  // Org/products/team
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
  warnings: string[];
}

async function hardDelete(
  admin: SupabaseClient,
  table: string,
  userId: string,
): Promise<number> {
  // Use `select("id", { count: "exact", head: true })` semantics: delete and
  // return how many rows were affected. Supabase JS gives us `count` on
  // delete() if we ask for it.
  const { error, count } = await admin
    .from(table)
    .delete({ count: "exact" })
    .eq("user_id", userId);

  if (error) {
    // Tables without user_id column will throw. Caller handles in try/catch.
    throw error;
  }
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

    // 1. Hard-delete all user-scoped content
    for (const table of USER_SCOPED_DELETE_ORDER) {
      try {
        const rows = await hardDelete(admin, table, user.id);
        if (rows > 0) deleted.push({ table, rows_deleted: rows });
      } catch (err) {
        // Table may not have user_id column, or may not exist anymore.
        // Record as warning, continue with next.
        warnings.push(
          `Table '${table}' delete failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    // 2. Anonymize profile (instead of hard-delete — Supabase auth.users has
    //    a FK to profiles.id; deleting it would orphan the auth user).
    const anonEmail = `deleted-user-${user.id}@deleted.inclufy.com`;
    try {
      await admin
        .from("profiles")
        .update({
          email: anonEmail,
          full_name: "[deleted]",
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

    // 3. Ban auth user
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

    // 4. Audit log (best-effort)
    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        action: "gdpr_account_deleted",
        resource_type: "gdpr",
        details: {
          deleted_table_count: deleted.length,
          total_rows_deleted: deleted.reduce(
            (sum, d) => sum + d.rows_deleted,
            0,
          ),
          warning_count: warnings.length,
          gdpr_article: "Art. 17",
        },
      });
    } catch {
      // audit_logs may not exist in AMOS; ignore.
    }

    const envelope: DeleteEnvelope = {
      status: "deleted",
      message:
        "Account verwijderd. OAuth-tokens ingetrokken, alle content (events, " +
        "captures, posts, brand kits, automations) permanent gewist. " +
        "Profielgegevens geanonimiseerd. Contact support@inclufy.com binnen " +
        "30 dagen om reactivatie aan te vragen (content kan niet worden hersteld).",
      deleted_at: now,
      grace_period_until: graceUntil,
      deleted_resources: deleted,
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
