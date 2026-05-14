// =============================================================================
// notify-issue-reported — Supabase Database Webhook → send-email bridge.
//
// Triggered by a Database Webhook on `public.product_issues` (INSERT events).
//
// Webhook payload shape (Supabase v2):
//   {
//     "type": "INSERT",
//     "table": "product_issues",
//     "schema": "public",
//     "record": { ...new row... },
//     "old_record": null
//   }
//
// We translate that into the send-email function's expected shape:
//   { to: "support@inclufy.com", template: "issue_reported", data: {...} }
//
// To avoid re-firing for trivial sources (e.g. CI noise) we only forward when
// status === "new" (the default at insert time) and source ≠ "auto-test-ci"
// unless severity is "critical".
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") ?? "support@inclufy.com";
// Optional: shared secret to verify the webhook origin. Configure the same
// value in the Supabase webhook UI under "HTTP Headers" as `x-webhook-secret`.
const WEBHOOK_SECRET = Deno.env.get("ISSUE_WEBHOOK_SECRET") ?? "";

interface ProductIssueRow {
  id: string;
  organization_id: string | null;
  reporter_user_id: string | null;
  source: string | null;
  title: string;
  description: string | null;
  status: string | null;
  severity: string | null;
  reporter_email?: string | null;
  created_at?: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: ProductIssueRow | null;
  old_record: ProductIssueRow | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function lookupReporterEmail(userId: string | null): Promise<string> {
  if (!userId) return "onbekend";
  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    if (!res.ok) return userId;
    const u = await res.json();
    return u?.email ?? userId;
  } catch {
    return userId;
  }
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  // Optional webhook signature check
  if (WEBHOOK_SECRET) {
    const provided = req.headers.get("x-webhook-secret") ?? "";
    if (provided !== WEBHOOK_SECRET) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid json" }, 400);
  }

  if (payload.type !== "INSERT" || payload.table !== "product_issues" || !payload.record) {
    return jsonResponse({ skipped: true, reason: "not a product_issues INSERT" }, 200);
  }

  const r = payload.record;

  // Filter: skip auto-test-ci unless severity is critical
  if (r.source === "auto-test-ci" && r.severity !== "critical") {
    return jsonResponse({ skipped: true, reason: "ci non-critical" }, 200);
  }

  const reporterEmail = r.reporter_email ?? await lookupReporterEmail(r.reporter_user_id);

  const sendEmailUrl = `${SUPABASE_URL}/functions/v1/send-email`;
  const emailBody = {
    to: SUPPORT_EMAIL,
    type: "issue_reported",
    data: {
      title: r.title,
      description: r.description ?? "",
      source: r.source ?? "user",
      userEmail: reporterEmail,
      issueId: r.id,
      severity: r.severity ?? "minor",
    },
  };

  // Use anon key for the gateway (guaranteed JWT format).
  // send-email now requires an X-Internal-Secret header for body auth.
  const internalAuth = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY;
  const internalEmailSecret = Deno.env.get("INTERNAL_EMAIL_SECRET") ?? "";

  try {
    const res = await fetch(sendEmailUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internalAuth}`,
        apikey: internalAuth,
        "x-internal-secret": internalEmailSecret,
      },
      body: JSON.stringify(emailBody),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("send-email failed", res.status, text);
      return jsonResponse({ ok: false, status: res.status, body: text }, 502);
    }
    return jsonResponse({ ok: true, issue_id: r.id });
  } catch (err) {
    console.error("send-email error", err);
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
});
