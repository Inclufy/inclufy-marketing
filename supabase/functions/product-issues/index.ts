// =============================================================================
// product-issues — user-feedback + auto-CI intake + triage updates for Finance.
//
// Mirrors the Django product_issues endpoints shipped to ProjeXtPal:
//   POST /product-issues                           user-create from AI Copilot
//   POST /product-issues/{id}/triage               agent posts triage result
//   POST /product-issues/{id}/comment              add a comment to thread
//   POST /product-issues/auto/ci                   CI auto-POST (test failure)
//
// Auth model:
//   - Reads/writes by org-members go through RLS using the caller's JWT.
//     The function forwards the Authorization header to a per-request client.
//   - The triage-agent and CI runner use the service-role key, bypassing RLS;
//     additionally protected by the X-Inclufy-CI-Token header for /auto/ci.
//
// CORS-enabled, JSON in/out.
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CI_TOKEN = Deno.env.get("PRODUCT_ISSUES_CI_TOKEN") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-inclufy-ci-token",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number, extra: Record<string, unknown> = {}): Response {
  return jsonResponse({ error: message, ...extra }, status);
}

interface RouteCtx {
  req: Request;
  url: URL;
  pathParts: string[];           // path AFTER /functions/v1/product-issues
  authHeader: string;            // raw "Bearer ..."
  userClient: SupabaseClient;    // RLS-respecting client (caller JWT)
  serviceClient: SupabaseClient; // RLS-bypassing client (service role)
  callerUserId: string | null;
}

// ─── Handlers ───────────────────────────────────────────────────────────────

async function handleCreate(ctx: RouteCtx): Promise<Response> {
  const body = await ctx.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse("Invalid JSON body", 400);
  }

  const required = ["organization_id", "title"];
  for (const f of required) {
    if (!body[f]) return errorResponse(`Missing required field: ${f}`, 400);
  }

  const insertRow = {
    organization_id: body.organization_id,
    reporter_user_id: ctx.callerUserId,
    module_context: body.module_context ?? null,
    related_entity_type: body.related_entity_type ?? null,
    related_entity_id: body.related_entity_id ?? null,
    source: body.source ?? "user",
    capture_method: body.capture_method ?? "manual_form",
    title: String(body.title).slice(0, 255),
    description: body.description ?? "",
    reproduction_steps: body.reproduction_steps ?? "",
    expected_behavior: body.expected_behavior ?? "",
    actual_behavior: body.actual_behavior ?? "",
    error_trace: body.error_trace ?? "",
    environment: body.environment ?? {},
    attachments: body.attachments ?? [],
    category: body.category ?? "other",
    status: "new",
  };

  // Use the user's JWT so RLS + reporter_user_id stay aligned.
  const { data, error } = await ctx.userClient
    .from("product_issues")
    .insert(insertRow)
    .select("id, organization_id, title, status, created_at")
    .single();

  if (error) {
    return errorResponse("Failed to create product issue", 400, {
      detail: error.message,
    });
  }

  return jsonResponse(data, 201);
}

async function handleTriage(ctx: RouteCtx, issueId: string): Promise<Response> {
  // Triage is done by the agent (service role) or by an org admin.
  const body = await ctx.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse("Invalid JSON body", 400);
  }

  const allowed: string[] = [
    "classification",
    "severity",
    "priority",
    "agent_triage_result",
    "triaged_at",
    "triaged_by",
    "duplicate_of_id",
    "reproduction_attempted_at",
    "reproduction_result",
    "reproduction_log",
    "reproduction_evidence",
    "status",
    "assigned_to_user_id",
    "linked_pr_url",
    "resolved_at",
    "resolution_summary",
  ];

  const src = body as Record<string, unknown>;
  const updateRow: Record<string, unknown> = {};
  for (const f of allowed) {
    if (f in src) updateRow[f] = src[f];
  }

  if (Object.keys(updateRow).length === 0) {
    return errorResponse("No triage fields supplied", 400);
  }

  // Default triaged_at if classification is changing and no timestamp given.
  if (
    ("classification" in updateRow || "priority" in updateRow) &&
    !("triaged_at" in updateRow)
  ) {
    updateRow.triaged_at = new Date().toISOString();
  }

  // Use whichever client the caller authenticated as (service-role allowed).
  const { data, error } = await ctx.userClient
    .from("product_issues")
    .update(updateRow)
    .eq("id", issueId)
    .select("id, status, classification, priority, triaged_at, updated_at")
    .single();

  if (error) {
    return errorResponse("Failed to update triage", 400, {
      detail: error.message,
    });
  }
  if (!data) {
    return errorResponse("Issue not found or not visible to caller", 404);
  }

  return jsonResponse(data, 200);
}

async function handleComment(ctx: RouteCtx, issueId: string): Promise<Response> {
  const body = await ctx.req.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.body) {
    return errorResponse("Missing required field: body", 400);
  }

  const author =
    body.author ??
    (ctx.callerUserId ? `user:${ctx.callerUserId}` : "anonymous");

  const insertRow = {
    issue_id: issueId,
    author: String(author).slice(0, 128),
    body: String(body.body),
    is_triage_step: !!body.is_triage_step,
  };

  const { data, error } = await ctx.userClient
    .from("product_issue_comments")
    .insert(insertRow)
    .select("id, issue_id, author, body, is_triage_step, created_at")
    .single();

  if (error) {
    return errorResponse("Failed to create comment", 400, {
      detail: error.message,
    });
  }

  return jsonResponse(data, 201);
}

async function handleAutoCI(ctx: RouteCtx): Promise<Response> {
  // CI runner authenticates via X-Inclufy-CI-Token (shared secret).
  const ciToken = ctx.req.headers.get("x-inclufy-ci-token") ?? "";
  if (!CI_TOKEN || ciToken !== CI_TOKEN) {
    return errorResponse("Unauthorized CI runner", 401);
  }

  const body = await ctx.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse("Invalid JSON body", 400);
  }

  const required = ["organization_id", "title", "error_trace"];
  for (const f of required) {
    if (!body[f]) return errorResponse(`Missing required field: ${f}`, 400);
  }

  // CI auto-issues are categorically test failures.
  const insertRow = {
    organization_id: body.organization_id,
    reporter_user_id: null,
    module_context: body.module_context ?? "ci",
    source: "auto-test-ci",
    capture_method: "auto_ci",
    title: String(body.title).slice(0, 255),
    description: body.description ?? "",
    error_trace: String(body.error_trace),
    environment: body.environment ?? {},
    category: body.category ?? "api",
    severity: body.severity ?? "major",
    status: "new",
  };

  const { data, error } = await ctx.serviceClient
    .from("product_issues")
    .insert(insertRow)
    .select("id, organization_id, title, status, created_at")
    .single();

  if (error) {
    return errorResponse("Failed to create CI issue", 500, {
      detail: error.message,
    });
  }

  return jsonResponse(data, 201);
}

// ─── Router ─────────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return errorResponse("Missing Authorization header", 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Resolve caller user (may be null when service-role calls).
  let callerUserId: string | null = null;
  try {
    const token = authHeader.replace("Bearer ", "");
    const { data } = await userClient.auth.getUser(token);
    callerUserId = data.user?.id ?? null;
  } catch {
    callerUserId = null;
  }

  const url = new URL(req.url);
  // Strip the /functions/v1/product-issues prefix; what remains is our route.
  const fullPath = url.pathname;
  const idx = fullPath.indexOf("/product-issues");
  const tail = idx >= 0 ? fullPath.slice(idx + "/product-issues".length) : "";
  const pathParts = tail.split("/").filter(Boolean);

  const ctx: RouteCtx = {
    req,
    url,
    pathParts,
    authHeader,
    userClient,
    serviceClient,
    callerUserId,
  };

  // Routing
  try {
    // POST /product-issues/auto/ci
    if (
      req.method === "POST" &&
      pathParts.length === 2 &&
      pathParts[0] === "auto" &&
      pathParts[1] === "ci"
    ) {
      return await handleAutoCI(ctx);
    }

    // POST /product-issues/{id}/triage
    if (
      req.method === "POST" &&
      pathParts.length === 2 &&
      pathParts[1] === "triage"
    ) {
      return await handleTriage(ctx, pathParts[0]);
    }

    // POST /product-issues/{id}/comment
    if (
      req.method === "POST" &&
      pathParts.length === 2 &&
      pathParts[1] === "comment"
    ) {
      return await handleComment(ctx, pathParts[0]);
    }

    // POST /product-issues
    if (req.method === "POST" && pathParts.length === 0) {
      return await handleCreate(ctx);
    }

    return errorResponse("Route not found", 404, {
      method: req.method,
      path: tail,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return errorResponse("Unhandled error", 500, { detail: msg });
  }
});
