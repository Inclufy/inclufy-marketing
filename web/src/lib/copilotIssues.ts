// =============================================================================
// copilotIssues — frontend helpers for the AI Copilot "Issues" tab.
//
// Talks to the `product-issues` Supabase edge function (see
// supabase/functions/product-issues/index.ts) and the `product_issues`
// tables (Marketing migration 20260504170000_product_issues.sql).
//
// Module-aware: every issue submission is automatically tagged with the
// current Marketing module the user is in (campaigns / library / studio /
// whatsapp / analytics / events / personas / ...) plus environment metadata
// so the issue-triage-validator agent can drill straight to the right code.
// =============================================================================

import { createClient } from "@/lib/supabase";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type IssueCategory =
  | "ui"
  | "api"
  | "mobile"
  | "performance"
  | "security"
  | "auth"
  | "data"
  | "integration"
  | "documentation"
  | "other";

export type IssueClassification =
  | "bug"
  | "error"
  | "functionality"
  | "best-practice"
  | "missing-feature"
  | "duplicate"
  | "user-error"
  | "not-applicable";

export type IssueSeverity = "blocker" | "critical" | "major" | "minor" | "trivial";
export type IssuePriority = "P0" | "P1" | "P2" | "P3";
export type IssueStatus =
  | "new"
  | "triaging"
  | "needs-info"
  | "accepted"
  | "in-progress"
  | "resolved"
  | "wont-fix"
  | "duplicate"
  | "closed";

export interface IssueAttachment {
  name: string;
  data_url?: string;
  mime: string;
  size_bytes: number;
}

export interface ProductIssueRecord {
  id: string;
  organization_id: string;
  reporter_user_id: string | null;
  module_context: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  source: string;
  capture_method: string;
  title: string;
  description: string;
  category: IssueCategory;
  classification: IssueClassification | null;
  severity: IssueSeverity | null;
  priority: IssuePriority | null;
  status: IssueStatus;
  triaged_at: string | null;
  triaged_by: string | null;
  reproduction_result: string;
  resolution_summary: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIssueInput {
  organization_id: string;
  title: string;
  description?: string;
  category?: IssueCategory;
  module_context?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  reproduction_steps?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  error_trace?: string;
  environment?: Record<string, unknown>;
  attachments?: IssueAttachment[];
  capture_method?: string;
}

/* ─── Module detection (Marketing-specific) ─────────────────────────────── */

export function detectMarketingModuleFromPath(pathname: string): string | null {
  const first = pathname.split("/").filter(Boolean)[0];
  const seg = first ? `/${first}` : "/";
  const map: Record<string, string> = {
    "/": "dashboard",
    "/dashboard": "dashboard",
    "/campaigns": "campaigns",
    "/library": "library",
    "/posts": "posts",
    "/calendar": "calendar",
    "/automations": "automations",
    "/contacts": "contacts",
    "/events": "events",
    "/integrations": "integrations",
    "/analytics": "analytics",
    "/proposals": "proposals",
    "/strategy": "strategy",
    "/personas": "personas",
    "/products": "products",
    "/budget": "budget",
    "/brand-kit": "brand-kit",
    "/team": "team",
    "/notifications": "notifications",
    "/organization": "organization",
    "/settings": "settings",
    "/copilot": "copilot",
  };
  if (map[seg]) return map[seg];
  const stripped = seg.replace("/", "");
  return stripped || null;
}

export function defaultCategoryForModule(module: string | null): IssueCategory {
  if (!module) return "other";
  const map: Record<string, IssueCategory> = {
    integrations: "integration",
    automations: "integration",
    library: "data",
    contacts: "data",
    personas: "data",
    analytics: "performance",
    settings: "auth",
    organization: "auth",
    team: "auth",
  };
  return map[module] ?? "ui";
}

/* ─── Environment capture ───────────────────────────────────────────────── */

export function captureEnvironment(
  pathname: string,
  organizationId: string | null
): Record<string, unknown> {
  const buildSha =
    process.env.NEXT_PUBLIC_BUILD_SHA ?? "unknown";
  const appVersion =
    process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";

  return {
    page_url: typeof window !== "undefined" ? window.location.href : pathname,
    pathname,
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent : "server",
    language:
      typeof navigator !== "undefined" ? navigator.language : "unknown",
    viewport:
      typeof window !== "undefined"
        ? { w: window.innerWidth, h: window.innerHeight }
        : null,
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "unknown",
    captured_at: new Date().toISOString(),
    organization_id: organizationId,
    app_build_sha: buildSha,
    app_version: appVersion,
  };
}

/* ─── Org lookup ────────────────────────────────────────────────────────── */

/**
 * Fetch the primary organization the current user belongs to. AMOS uses
 * `go_organization` as the canonical user→organization mapping (one row per
 * user, see useOrganization hook). We fall back to `organization_members`
 * for users who only exist in the team-invite table.
 */
export async function fetchPrimaryOrgId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. AMOS-canonical: go_organization (per-user company profile).
  //    Schema reality: go_organization has no organization_id column —
  //    each user's go_organization.id IS their tenant identifier.
  const { data: goRow } = await supabase
    .from("go_organization")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const goOrgId = (goRow as { id?: string } | null)?.id;
  if (goOrgId) return goOrgId;

  // 2. Fallback: organization_members (users invited via team UI)
  const { data: omRow } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (omRow as { organization_id?: string } | null)?.organization_id ?? null;
}

/* ─── API ────────────────────────────────────────────────────────────────── */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

async function authedFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Niet ingelogd");

  const url = `${SUPABASE_URL}/functions/v1/product-issues${path}`;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
}

export async function createIssue(
  input: CreateIssueInput
): Promise<ProductIssueRecord> {
  const res = await authedFetch("", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create issue failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as ProductIssueRecord;
}

export async function listRecentIssues(
  organizationId: string,
  limit = 20
): Promise<ProductIssueRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_issues")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProductIssueRecord[];
}

export async function addComment(
  issueId: string,
  body: string
): Promise<void> {
  const res = await authedFetch(`/${issueId}/comment`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Comment failed: ${res.status} ${txt}`);
  }
}

/* ─── File / clipboard helpers ──────────────────────────────────────────── */

export async function fileToAttachment(file: File): Promise<IssueAttachment> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return {
    name: file.name,
    data_url: dataUrl,
    mime: file.type || "application/octet-stream",
    size_bytes: file.size,
  };
}

/* ─── Visual helpers ─────────────────────────────────────────────────────── */

export function statusBadgeClass(status: IssueStatus | string): string {
  const map: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    triaging: "bg-purple-100 text-purple-800",
    "needs-info": "bg-amber-100 text-amber-800",
    accepted: "bg-cyan-100 text-cyan-800",
    "in-progress": "bg-indigo-100 text-indigo-800",
    resolved: "bg-green-100 text-green-800",
    "wont-fix": "bg-gray-100 text-gray-700",
    duplicate: "bg-gray-100 text-gray-700",
    closed: "bg-gray-100 text-gray-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function priorityBadgeClass(priority: string | null): string {
  if (!priority) return "bg-gray-100 text-gray-600";
  const map: Record<string, string> = {
    P0: "bg-red-600 text-white",
    P1: "bg-orange-500 text-white",
    P2: "bg-yellow-500 text-white",
    P3: "bg-slate-400 text-white",
  };
  return map[priority] ?? "bg-gray-100 text-gray-600";
}
