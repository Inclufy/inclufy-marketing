// =============================================================================
// agent-counterfactual — Tier-1 Suggestion #6: "Left on the table" nudge.
//
// Computes an estimated euro value the org "left on the table" by skipping or
// failing to approve agent runs in the last N days (default 7).
//
//   POST /agent-counterfactual
//     body: { organization_id: string, window_days?: number }
//
// Auth model:
//   - JWT required. Caller's membership of the org is verified using the
//     `organization_members` table (mirrors the `assertOrgMember` pattern from
//     `supabase/functions/orchestrator/index.ts`).
//   - All read queries use the service-role client so RLS doesn't hide rows
//     once membership has been confirmed.
//
// Methodology:
//   1. Look up cancelled / awaiting_approval runs within the window.
//   2. Group those runs by their agent's `kind`.
//   3. For runs whose agent.kind = 'ads', compute a per-run euro estimate
//      using the org's historical completed ad-runs:
//          avg(output.draft.recommended_pacing.daily_cap_eur * days)
//      Falls back to a flat 50 EUR per missed ad-run when there is no
//      usable history.
//   4. Returns a friendly summary suitable for a banner / nudge UI.
//
// CORS-enabled, JSON in/out.
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FALLBACK_EUR_PER_MISSED_AD_RUN = 50;
const DEFAULT_WINDOW_DAYS = 7;
const MAX_WINDOW_DAYS = 90;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResp(message: string, status: number, extra: Record<string, unknown> = {}): Response {
  return jsonResp({ error: message, ...extra }, status);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Verifies that `userId` is a member of `organizationId` via the
 * `organization_members` table. Returns true on hit, false otherwise.
 *
 * This mirrors the `assertOrgMember` helper in
 * `supabase/functions/orchestrator/index.ts`.
 */
async function assertOrgMember(
  serviceClient: SupabaseClient,
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await serviceClient
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    // If the table simply doesn't exist on this project (e.g. AMOS uses
    // `go_organization` keyed by user_id), fall back to that ownership check.
    // TODO: confirm canonical multi-tenant table once orchestrator function
    // ships.
    const { data: orgRow } = await serviceClient
      .from("go_organization")
      .select("id")
      .eq("id", organizationId)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    return !!orgRow;
  }
  return !!data;
}

interface AgentRunRow {
  id: string;
  organization_id: string;
  agent_id: string | null;
  status: string;
  output: Record<string, unknown> | null;
  created_at: string;
}

interface AgentRow {
  id: string;
  kind: string | null;
}

function safeNum(v: unknown): number | null {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && isFinite(Number(v))) return Number(v);
  return null;
}

/**
 * Walk an `agent_runs.output` blob looking for a usable ad-spend estimate.
 * Expected shape:
 *   output.draft.recommended_pacing.daily_cap_eur (number)
 *   output.draft.recommended_pacing.days          (number)
 */
function estimateRunEur(output: Record<string, unknown> | null | undefined): number | null {
  if (!output || typeof output !== "object") return null;
  const draft = (output as any).draft;
  if (!draft || typeof draft !== "object") return null;
  const pacing = draft.recommended_pacing;
  if (!pacing || typeof pacing !== "object") return null;

  const dailyCap = safeNum(pacing.daily_cap_eur);
  const days = safeNum(pacing.days) ?? 1;
  if (dailyCap === null) return null;
  if (dailyCap <= 0 || days <= 0) return null;
  return dailyCap * days;
}

// ─── Main handler ───────────────────────────────────────────────────────────

async function handleCounterfactual(
  req: Request,
  serviceClient: SupabaseClient,
  callerUserId: string,
): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResp("Invalid JSON body", 400);
  }

  const organizationId =
    typeof (body as any).organization_id === "string"
      ? (body as any).organization_id
      : "";
  if (!organizationId) {
    return errorResp("Missing required field: organization_id", 400);
  }

  let windowDays = DEFAULT_WINDOW_DAYS;
  const rawWindow = (body as any).window_days;
  if (rawWindow !== undefined && rawWindow !== null) {
    const n = safeNum(rawWindow);
    if (n === null || n <= 0) {
      return errorResp("window_days must be a positive number", 400);
    }
    windowDays = Math.min(Math.floor(n), MAX_WINDOW_DAYS);
  }

  // Membership check
  const ok = await assertOrgMember(serviceClient, organizationId, callerUserId);
  if (!ok) {
    return errorResp("Caller is not a member of this organization", 403);
  }

  // ── 1. Pull recent missed runs ──────────────────────────────────────────
  const sinceIso = new Date(
    Date.now() - windowDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: missedRuns, error: missedErr } = await serviceClient
    .from("agent_runs")
    .select("id, organization_id, agent_id, status, output, created_at")
    .eq("organization_id", organizationId)
    .in("status", ["cancelled", "awaiting_approval"])
    .gte("created_at", sinceIso);

  if (missedErr) {
    return errorResp("Failed to load agent_runs", 500, {
      detail: missedErr.message,
    });
  }
  const runs: AgentRunRow[] = (missedRuns ?? []) as AgentRunRow[];

  // Short-circuit when there's nothing to nudge about.
  if (runs.length === 0) {
    return jsonResp({
      window_days: windowDays,
      missed_runs: 0,
      missed_kinds: {},
      est_eur_left_on_table: 0,
      methodology: "no_missed_runs",
    });
  }

  // ── 2. Resolve agent.kind for the involved agent_ids ────────────────────
  const agentIds = Array.from(
    new Set(runs.map((r) => r.agent_id).filter((x): x is string => !!x)),
  );

  const kindByAgent = new Map<string, string | null>();
  if (agentIds.length > 0) {
    const { data: agents, error: agentErr } = await serviceClient
      .from("agents")
      .select("id, kind")
      .in("id", agentIds);
    if (agentErr) {
      return errorResp("Failed to load agents", 500, {
        detail: agentErr.message,
      });
    }
    for (const a of (agents ?? []) as AgentRow[]) {
      kindByAgent.set(a.id, a.kind);
    }
  }

  // ── 3. Tally missed runs by kind ────────────────────────────────────────
  const missedKinds: Record<string, number> = {};
  let missedAdRuns = 0;
  for (const r of runs) {
    const kind =
      (r.agent_id ? kindByAgent.get(r.agent_id) : null) ?? "unknown";
    missedKinds[kind] = (missedKinds[kind] ?? 0) + 1;
    if (kind === "ads") missedAdRuns += 1;
  }

  // ── 4. Compute baseline from historical completed ad-runs ───────────────
  let estEur = 0;
  let methodology = "insufficient_history";

  if (missedAdRuns > 0) {
    // Find ad-agent ids first so the agent_runs query can filter on them.
    const { data: adAgents, error: adAgentErr } = await serviceClient
      .from("agents")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("kind", "ads");

    if (adAgentErr) {
      return errorResp("Failed to load ad agents", 500, {
        detail: adAgentErr.message,
      });
    }

    const adAgentIds = (adAgents ?? []).map((a: { id: string }) => a.id);

    let perRunEstimates: number[] = [];
    if (adAgentIds.length > 0) {
      const { data: completed, error: completedErr } = await serviceClient
        .from("agent_runs")
        .select("output")
        .eq("organization_id", organizationId)
        .eq("status", "completed")
        .in("agent_id", adAgentIds)
        .limit(200);

      if (completedErr) {
        return errorResp("Failed to load historical agent_runs", 500, {
          detail: completedErr.message,
        });
      }

      for (const row of (completed ?? []) as Array<{ output: Record<string, unknown> | null }>) {
        const eur = estimateRunEur(row.output);
        if (eur !== null) perRunEstimates.push(eur);
      }
    }

    if (perRunEstimates.length > 0) {
      const avg =
        perRunEstimates.reduce((a, b) => a + b, 0) / perRunEstimates.length;
      estEur = Math.round(avg * missedAdRuns);
      methodology = "historical_avg_daily_cap";
    } else {
      estEur = FALLBACK_EUR_PER_MISSED_AD_RUN * missedAdRuns;
      methodology = "fallback_flat_eur_per_run";
    }
  } else {
    methodology = "no_missed_ad_runs";
  }

  return jsonResp({
    window_days: windowDays,
    missed_runs: runs.length,
    missed_kinds: missedKinds,
    est_eur_left_on_table: estEur,
    methodology,
  });
}

// ─── Router ─────────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResp("Method not allowed", 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return errorResp("Missing Authorization header", 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let callerUserId: string | null = null;
  try {
    const token = authHeader.replace("Bearer ", "");
    const { data } = await userClient.auth.getUser(token);
    callerUserId = data.user?.id ?? null;
  } catch {
    callerUserId = null;
  }
  if (!callerUserId) {
    return errorResp("Invalid or expired token", 401);
  }

  try {
    return await handleCounterfactual(req, serviceClient, callerUserId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return errorResp("Unhandled error", 500, { detail: msg });
  }
});
