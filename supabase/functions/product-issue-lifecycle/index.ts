// =============================================================================
// Edge Function: product-issue-lifecycle
// -----------------------------------------------------------------------------
// Mirrors the ProjeXtPal Django signal-based notification system for the
// Supabase-backed apps (AMOS Marketing, Inclufy Finance). One function,
// deployed to both projects, triggered by a Database Webhook on
// `product_issues` (INSERT + UPDATE events).
//
// Six routing rules (same as Django version in product_issues/signals.py):
//
//   1. NEW issue (INSERT)              → admin watchlist
//   2. NEW issue + P0/security         → admin watchlist + superadmin escalation
//   3. Status changes (UPDATE)         → reporter "we're on it" + admins
//   4. Status = 'resolved'             → reporter "your ticket is closed" + admins
//   5. reproduction_result = cannot-reproduce/needs-data → superadmin escalation
//   6. status = 'needs-info'           → superadmin escalation
//   + priority = P0 (blocker)           → superadmin escalation
//   + classification/category = security → superadmin escalation
//
// Email goes via Resend REST API (cleaner from Deno than SMTP). DKIM is
// already configured for `inclufy.com` so deliverability is high.
//
// Required env vars (Supabase secrets):
//   RESEND_API_KEY                  — Resend API key, starts with 're_'
//   APP_NAME                         — e.g. 'AMOS' or 'Inclufy Finance'
//                                       (used in subject + from display name)
//   APP_BASE_URL                     — e.g. 'https://amos.inclufy.com' or
//                                       'https://finance.inclufy.com'
//   ADMIN_EMAILS                     — comma-separated admin email list
//                                       (default: sami@inclufy.com)
//   SUPERADMIN_EMAILS                — comma-separated; gets escalations only
//                                       (default: sami@inclufy.com)
//   SUPABASE_SERVICE_ROLE_KEY        — auto-injected; needed to look up
//                                       reporter email from auth.users
//
// Webhook setup (Supabase Dashboard → Database → Webhooks):
//   Name: product-issue-lifecycle
//   Table: public.product_issues
//   Events: ☑ INSERT  ☑ UPDATE
//   Type: HTTP Request
//   URL: https://<project-ref>.supabase.co/functions/v1/product-issue-lifecycle
//   Headers: Authorization: Bearer <SUPABASE_ANON_KEY>
//
// Deploy:
//   supabase functions deploy product-issue-lifecycle --project-ref <ref>
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
// Defaults assume Marketing app (covers both AMOS mobile + marketing-web).
// Override per environment via Supabase secrets — Finance sets:
//   APP_NAME=Inclufy Finance, APP_BASE_URL=https://finance.inclufy.com
const APP_NAME = Deno.env.get("APP_NAME") ?? "Inclufy Marketing";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") ?? "https://www.inclufy.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const ADMIN_EMAILS = parseEmails(Deno.env.get("ADMIN_EMAILS") ?? "sami@inclufy.com");
const SUPERADMIN_EMAILS = parseEmails(
  Deno.env.get("SUPERADMIN_EMAILS") ?? "sami@inclufy.com",
);

const FROM_EMAIL = `${APP_NAME} <noreply@inclufy.com>`;
const REPLY_TO = "support@inclufy.com";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductIssueRow {
  id: string;
  organization_id: string | null;
  reporter_user_id: string | null;
  module_context: string | null;
  source: string | null;
  capture_method: string | null;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  classification: string | null;
  category: string | null;
  severity: string | null;
  reproduction_result: string | null;
  resolution_summary: string | null;
  // JSONB column — frontend bundles drop user_agent + page_url + app_version
  // + build_sha here when reporting issues. We use it to detect web vs mobile.
  environment: Record<string, unknown> | null;
  created_at?: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: ProductIssueRow | null;
  old_record: ProductIssueRow | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

function issueUrl(id: string): string {
  // Use a public dashboard route with the issue ID as query param. Avoids
  // /admin/... paths because some reverse-proxy setups (e.g. ProjeXtPal's
  // nginx) route /admin/ to the backend, breaking the SPA. /dashboard
  // always lands in the React app and the AI Copilot Issues panel can
  // open the deep-linked issue.
  return `${APP_BASE_URL.replace(/\/$/, "")}/dashboard?issue=${id}`;
}

/**
 * Detect whether the issue was reported from a web client or a mobile client
 * based on the `environment` JSONB the frontend bundles set when calling
 * the reporter API. React Native sets a distinctive UA + adds a `platform`
 * field (`ios` | `android`) plus `app_version`. Web clients set a Chrome /
 * Safari / Firefox UA + a `browser` field.
 *
 * Falls back to empty string when origin can't be determined — caller
 * skips the suffix in that case so the subject stays clean.
 */
function detectClient(env: Record<string, unknown> | null): "Web" | "Mobile" | "" {
  if (!env || typeof env !== "object") return "";
  const ua = String(env.user_agent ?? env.userAgent ?? "");
  const platform = String(env.platform ?? "").toLowerCase();
  const client = String(env.client ?? env.client_type ?? "").toLowerCase();

  // Explicit signals win — frontend bundles can declare `client: "mobile"`
  if (client === "mobile" || client === "ios" || client === "android") return "Mobile";
  if (client === "web" || client === "browser") return "Web";
  if (platform === "ios" || platform === "android") return "Mobile";

  // UA-based heuristics. Expo / React Native dev bundles include
  // "Expo" or "ReactNative" in UA; native iOS WebViews include "AMOS" or
  // "Inclufy" bundle IDs depending on app.
  if (/Expo|ReactNative|React Native|InclufyGO|com\.inclufy/i.test(ua)) return "Mobile";
  if (ua) return "Web";
  return "";
}

function clientSuffix(env: Record<string, unknown> | null): string {
  const c = detectClient(env);
  return c ? ` · ${c}` : "";
}

async function reporterEmail(userId: string | null): Promise<string | null> {
  if (!userId || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) return null;
    return data.user.email;
  } catch (_e) {
    return null;
  }
}

async function reporterDisplayName(userId: string | null): Promise<string> {
  if (!userId || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return "daar";
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data } = await admin.auth.admin.getUserById(userId);
    const meta = data?.user?.user_metadata as Record<string, unknown> | undefined;
    const first = meta?.first_name ?? meta?.full_name ?? data?.user?.email;
    return typeof first === "string" ? first.split(" ")[0] : "daar";
  } catch (_e) {
    return "daar";
  }
}

async function sendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  if (opts.to.length === 0) return false;
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing — skipping email send");
    return false;
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: REPLY_TO,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.warn(`Resend send failed (${resp.status}): ${body}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`Resend send threw: ${e}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Email templates (mirrors Django signals.py)
// ---------------------------------------------------------------------------

function wrapStandardHtml(headerTitle: string, bodyHtml: string, ctaUrl: string, ctaLabel: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 28px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">${headerTitle}</h1>
  </div>
  <div style="background: #fafafa; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    ${bodyHtml}
    <div style="text-align: center; margin: 28px 0;">
      <a href="${ctaUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 14px;">${ctaLabel}</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
      Reageren? Beantwoord deze mail — komt aan bij support@inclufy.com.<br>
      ${APP_NAME} · Inclufy
    </p>
  </div>
</body></html>`;
}

function wrapEscalationHtml(reason: string, bodyHtml: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #b91c1c, #ef4444); color: white; padding: 28px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">AI Escalatie — Superadmin actie nodig</h1>
    <p style="margin: 8px 0 0; opacity: 0.95; font-size: 14px;">Auto-triage kon dit issue niet afhandelen</p>
  </div>
  <div style="background: #fafafa; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 15px; color: #b91c1c; font-weight: 600;">
      ⚠️ AI-triage agent kan dit issue niet zelfstandig oplossen — menselijke beoordeling nodig
    </p>
    <p style="font-size: 14px; background: #fef2f2; border-left: 3px solid #ef4444; padding: 12px 16px; margin: 16px 0;">
      <strong>Reden:</strong> ${reason}
    </p>
    ${bodyHtml}
    <div style="text-align: center; margin: 28px 0;">
      <a href="${ctaUrl}" style="background: #b91c1c; color: white; padding: 13px 26px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 14px;">Open issue voor beoordeling →</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
      Deze mail gaat ALLEEN naar actieve superadmins.<br>
      ${APP_NAME} · Inclufy
    </p>
  </div>
</body></html>`;
}

function issueDetailsTable(issue: ProductIssueRow, reporterAddr: string): string {
  const company = issue.organization_id ?? "(no org)";
  return `
    <table style="width:100%; font-size:14px; border-collapse:collapse; margin: 16px 0;">
      <tr><td style="padding:6px 0; color:#6b7280; width:140px;">Titel</td><td><strong>${escapeHtml(issue.title)}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Status</td><td>${escapeHtml(issue.status ?? "?")}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Priority</td><td>${escapeHtml(issue.priority ?? "(not set)")}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Classification</td><td>${escapeHtml(issue.classification ?? "(not set)")}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Reproduction</td><td>${escapeHtml(issue.reproduction_result ?? "(not attempted)")}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Reporter</td><td>${escapeHtml(reporterAddr)}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Organization</td><td>${escapeHtml(company)}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Source</td><td>${escapeHtml(issue.source ?? "(unknown)")}</td></tr>
    </table>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Escalation decision (mirrors Django _needs_human_escalation)
// ---------------------------------------------------------------------------

function needsEscalation(
  row: ProductIssueRow,
  old: ProductIssueRow | null,
): { should: boolean; reason: string } {
  const changed = !old || old.status !== row.status;

  if (
    (row.reproduction_result === "cannot-reproduce" ||
      row.reproduction_result === "needs-data") &&
    changed
  ) {
    return {
      should: true,
      reason: `AI triage kon issue niet reproduceren (resultaat: ${row.reproduction_result})`,
    };
  }
  if (row.status === "needs-info" && (!old || old.status !== "needs-info")) {
    return {
      should: true,
      reason: "AI triage heeft extra informatie nodig van de reporter",
    };
  }
  if (row.priority === "P0" && changed) {
    return { should: true, reason: "Priority = P0 (blocker) — automatische escalatie" };
  }
  if (
    (row.classification === "security" || row.category === "security") &&
    changed
  ) {
    return {
      should: true,
      reason: "Security-classificatie — escalatie naar superadmin verplicht",
    };
  }
  return { should: false, reason: "" };
}

// ---------------------------------------------------------------------------
// Email senders (mirror Django dispatch)
// ---------------------------------------------------------------------------

async function notifyAdminsNewIssue(issue: ProductIssueRow, reporterAddr: string) {
  const url = issueUrl(issue.id);
  const subject = `[${APP_NAME}${clientSuffix(issue.environment)}] Nieuwe issue: ${issue.title.slice(0, 80)}`;
  const text = [
    `Nieuwe ProductIssue gemeld op ${APP_NAME}.`,
    "",
    `Titel: ${issue.title}`,
    `Reporter: ${reporterAddr}`,
    `Source: ${issue.source ?? "?"}`,
    `Category: ${issue.category ?? "?"}`,
    `Module: ${issue.module_context ?? "?"}`,
    "",
    `Bekijk: ${url}`,
  ].join("\n");
  const bodyHtml = `
    <p style="font-size: 15px;">Een nieuwe ProductIssue is gemeld op ${APP_NAME}:</p>
    ${issueDetailsTable(issue, reporterAddr)}
  `;
  const html = wrapStandardHtml("Nieuwe ProductIssue", bodyHtml, url, "Bekijk issue →");
  await sendEmail({ to: ADMIN_EMAILS, subject, html, text });
}

async function notifyReporterProgress(
  issue: ProductIssueRow,
  reporterAddr: string,
  reporterFirst: string,
  oldStatus: string | null,
) {
  if (!reporterAddr) return;
  const url = issueUrl(issue.id);
  const subject = `[${APP_NAME}${clientSuffix(issue.environment)}] Update over jouw issue: ${issue.title.slice(0, 60)}`;
  const text = [
    `Hallo ${reporterFirst},`,
    "",
    `Je gemelde issue '${issue.title}' is nu in status: ${issue.status}.`,
    `(was: ${oldStatus ?? "(unknown)"})`,
    "",
    `Volg de voortgang: ${url}`,
    "",
    `Met vriendelijke groet,\n${APP_NAME} support`,
  ].join("\n");
  const bodyHtml = `
    <p style="font-size: 15px;">Hallo ${escapeHtml(reporterFirst)},</p>
    <p style="font-size: 15px; line-height: 1.6;">
      Je gemelde issue <strong>"${escapeHtml(issue.title)}"</strong> is nu in status:
      <span style="background:#ede9fe; color:#6d28d9; padding:2px 8px; border-radius:4px; font-weight:600;">${escapeHtml(issue.status ?? "?")}</span>
    </p>
    <p style="font-size: 14px; color: #6b7280;">
      Eerdere status: <em>${escapeHtml(oldStatus ?? "?")}</em>
    </p>
  `;
  const html = wrapStandardHtml("Update over jouw issue", bodyHtml, url, "Volg voortgang →");
  await sendEmail({ to: [reporterAddr], subject, html, text });
}

async function notifyReporterResolved(
  issue: ProductIssueRow,
  reporterAddr: string,
  reporterFirst: string,
) {
  if (!reporterAddr) return;
  const url = issueUrl(issue.id);
  const subject = `[${APP_NAME}${clientSuffix(issue.environment)}] Opgelost: ${issue.title.slice(0, 70)}`;
  const resolution = issue.resolution_summary || "(geen samenvatting beschikbaar)";
  const text = [
    `Hallo ${reporterFirst},`,
    "",
    `Goed nieuws — jouw issue '${issue.title}' is opgelost.`,
    "",
    `Resolutie:\n${resolution}`,
    "",
    `Bekijk het ticket: ${url}`,
    "",
    `Werkt het niet zoals verwacht? Beantwoord deze mail of meld een nieuwe issue.`,
    "",
    `Met vriendelijke groet,\n${APP_NAME} support`,
  ].join("\n");
  const bodyHtml = `
    <p style="font-size: 15px;">Hallo ${escapeHtml(reporterFirst)},</p>
    <p style="font-size: 15px; line-height: 1.6;">
      Goed nieuws — jouw gemelde issue is <strong style="color:#059669;">opgelost</strong>:
    </p>
    <p style="font-size: 15px; background: #f0fdf4; border-left: 3px solid #10b981; padding: 12px 16px; margin: 16px 0;">
      <strong>"${escapeHtml(issue.title)}"</strong>
    </p>
    <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
      <strong>Resolutie:</strong><br>${escapeHtml(resolution).replace(/\n/g, "<br>")}
    </p>
    <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">
      Werkt het niet zoals verwacht? Beantwoord deze mail of meld een nieuwe issue.
    </p>
  `;
  const html = wrapStandardHtml("Issue opgelost", bodyHtml, url, "Bekijk ticket →");
  await sendEmail({ to: [reporterAddr], subject, html, text });
}

async function notifyAdminsProgress(issue: ProductIssueRow, reporterAddr: string) {
  const url = issueUrl(issue.id);
  const subject = `[${APP_NAME}${clientSuffix(issue.environment)}] Issue → ${issue.status}: ${issue.title.slice(0, 60)}`;
  const text = [
    "Issue status gewijzigd.",
    "",
    `Titel: ${issue.title}`,
    `Status: ${issue.status}`,
    `Reporter: ${reporterAddr}`,
    "",
    `Bekijk: ${url}`,
  ].join("\n");
  const bodyHtml = `
    <p style="font-size: 15px;">Issue voortgang:</p>
    ${issueDetailsTable(issue, reporterAddr)}
  `;
  const html = wrapStandardHtml("Issue voortgang", bodyHtml, url, "Bekijk issue →");
  await sendEmail({ to: ADMIN_EMAILS, subject, html, text });
}

async function notifySuperadminEscalation(
  issue: ProductIssueRow,
  reporterAddr: string,
  reason: string,
) {
  const url = issueUrl(issue.id);
  const subject = `[${APP_NAME}${clientSuffix(issue.environment)} — AI ESCALATIE] ${issue.title.slice(0, 70)}`;
  const text = [
    `AI-triage escalatie naar superadmin op ${APP_NAME}.`,
    "",
    `Reden: ${reason}`,
    "",
    "--- Issue details ---",
    `Titel:           ${issue.title}`,
    `Status:          ${issue.status ?? "?"}`,
    `Priority:        ${issue.priority ?? "(not set)"}`,
    `Classification:  ${issue.classification ?? "(not set)"}`,
    `Reproduction:    ${issue.reproduction_result ?? "(not attempted)"}`,
    `Reporter:        ${reporterAddr}`,
    `Source:          ${issue.source ?? "?"}`,
    "",
    "--- Beschrijving ---",
    issue.description || "(geen beschrijving)",
    "",
    `Open issue: ${url}`,
  ].join("\n");
  const descHtml = escapeHtml(issue.description || "(geen beschrijving)").replace(
    /\n/g,
    "<br>",
  );
  const bodyHtml = `
    ${issueDetailsTable(issue, reporterAddr)}
    <p style="font-size: 13px; color: #6b7280; margin-top: 12px;"><strong>Beschrijving</strong></p>
    <p style="font-size: 13px; color: #374151; background: #f9fafb; padding: 12px; border-radius: 6px; line-height: 1.6;">
      ${descHtml}
    </p>
  `;
  const html = wrapEscalationHtml(reason, bodyHtml, url);
  await sendEmail({ to: SUPERADMIN_EMAILS, subject, html, text });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const issue = payload.record;
  if (!issue) {
    return new Response(JSON.stringify({ ok: true, skipped: "no record" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const reporterAddr = (await reporterEmail(issue.reporter_user_id)) ?? "(anonymous)";
  const reporterFirst = await reporterDisplayName(issue.reporter_user_id);
  const old = payload.old_record;

  // ── 1. INSERT
  if (payload.type === "INSERT") {
    await notifyAdminsNewIssue(issue, reporterAddr);
    const esc = needsEscalation(issue, null);
    if (esc.should) {
      await notifySuperadminEscalation(issue, reporterAddr, esc.reason);
    }
    return new Response(
      JSON.stringify({ ok: true, type: "INSERT", escalated: esc.should }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 2. UPDATE
  if (payload.type === "UPDATE" && old) {
    // Escalation always fires first if criteria met
    const esc = needsEscalation(issue, old);
    if (esc.should) {
      await notifySuperadminEscalation(issue, reporterAddr, esc.reason);
    }

    // Status didn't change → done
    if (old.status === issue.status) {
      return new Response(
        JSON.stringify({ ok: true, type: "UPDATE", escalated: esc.should, status_unchanged: true }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (issue.status === "resolved") {
      await notifyReporterResolved(issue, reporterAddr, reporterFirst);
      await notifyAdminsProgress(issue, reporterAddr);
    } else {
      await notifyReporterProgress(issue, reporterAddr, reporterFirst, old.status);
      await notifyAdminsProgress(issue, reporterAddr);
    }

    return new Response(
      JSON.stringify({ ok: true, type: "UPDATE", escalated: esc.should }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true, skipped: payload.type }), {
    headers: { "Content-Type": "application/json" },
  });
});
