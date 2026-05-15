// ─────────────────────────────────────────────────────────────────────
// Shared AI rate-limit middleware (Sprint-3 #17).
//
// Every AI edge function (event-studio-ai, agent-ads, sales-chat, etc.)
// imports this module to enforce per-user call quotas before invoking
// the upstream provider (OpenAI / Anthropic / Gemini) and to log every
// call afterwards.
//
// Usage pattern in an edge function:
//
//   import { checkAiQuota, logAiCall } from '../_shared/ai-rate-limit.ts';
//
//   // After auth: get user_id from JWT
//   const quota = await checkAiQuota(supa, {
//     userId,
//     functionName: 'event-studio-ai',
//   });
//   if (!quota.ok) {
//     return new Response(
//       JSON.stringify({ error: 'rate_limited', ...quota }),
//       {
//         status: 429,
//         headers: { 'Content-Type': 'application/json', 'Retry-After': String(quota.retryAfter) }
//       }
//     );
//   }
//
//   // ... do the AI call ...
//
//   await logAiCall(supa, {
//     userId,
//     functionName: 'event-studio-ai',
//     provider: 'openai',
//     model: 'gpt-4o-mini',
//     inputTokens: 1234,
//     outputTokens: 567,
//     status: 'sent',
//   });
//
// Env vars (override per edge function via Supabase dashboard):
//   MAX_AI_CALLS_PER_HOUR_PER_USER  = 100  (set to 0 to disable hourly cap)
//   MAX_AI_CALLS_PER_DAY_PER_USER   = 1000 (set to 0 to disable daily cap)
//
// Failure mode: if the rate-limit check itself errors (DB down, etc.)
// we FAIL OPEN — log a warning and let the call through. Rationale:
// AI calls are revenue-critical; if Postgres is down, blocking AI calls
// makes things worse, not better.
// ─────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const MAX_PER_HOUR = Number(Deno.env.get('MAX_AI_CALLS_PER_HOUR_PER_USER') ?? '100');
export const MAX_PER_DAY  = Number(Deno.env.get('MAX_AI_CALLS_PER_DAY_PER_USER')  ?? '1000');

export type AiCallStatus = 'sent' | 'failed' | 'rate_limited' | 'no_credits';

export interface QuotaCheckResult {
  ok: boolean;
  reason?: 'hourly_cap_reached' | 'daily_cap_reached';
  limit?: number;
  windowSeconds?: number;
  retryAfter?: number;
  /** Current count in the window that triggered the block. */
  currentCount?: number;
}

export interface AiCallLogRow {
  userId: string;
  organizationId?: string | null;
  functionName: string;
  provider?: string | null;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  status: AiCallStatus;
  statusDetail?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Check the per-user AI call quota. Returns { ok: true } when the user
 * is within both the hourly and daily caps. Returns { ok: false, ... }
 * with retryAfter when capped. Fails open on DB errors.
 */
export async function checkAiQuota(
  supa: SupabaseClient,
  args: { userId: string; functionName: string },
): Promise<QuotaCheckResult> {
  // Disabled caps shortcut
  if (MAX_PER_HOUR <= 0 && MAX_PER_DAY <= 0) return { ok: true };

  try {
    const now = Date.now();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const oneDayAgo  = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    // Hourly check
    if (MAX_PER_HOUR > 0) {
      const { count: countH, error: eH } = await supa
        .from('ai_call_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', args.userId)
        .eq('status', 'sent')
        .gte('created_at', oneHourAgo);

      if (eH) {
        console.warn(`[ai-rate-limit] hourly check failed for user ${args.userId}: ${eH.message} — failing open`);
        return { ok: true };
      }

      if ((countH ?? 0) >= MAX_PER_HOUR) {
        return {
          ok: false,
          reason: 'hourly_cap_reached',
          limit: MAX_PER_HOUR,
          windowSeconds: 3600,
          retryAfter: 3600,
          currentCount: countH ?? 0,
        };
      }
    }

    // Daily check
    if (MAX_PER_DAY > 0) {
      const { count: countD, error: eD } = await supa
        .from('ai_call_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', args.userId)
        .eq('status', 'sent')
        .gte('created_at', oneDayAgo);

      if (eD) {
        console.warn(`[ai-rate-limit] daily check failed for user ${args.userId}: ${eD.message} — failing open`);
        return { ok: true };
      }

      if ((countD ?? 0) >= MAX_PER_DAY) {
        return {
          ok: false,
          reason: 'daily_cap_reached',
          limit: MAX_PER_DAY,
          windowSeconds: 86400,
          retryAfter: 86400,
          currentCount: countD ?? 0,
        };
      }
    }

    return { ok: true };
  } catch (err) {
    console.warn(`[ai-rate-limit] quota check threw: ${(err as Error).message} — failing open`);
    return { ok: true };
  }
}

/**
 * Insert one row into ai_call_log. Best-effort: errors are logged but
 * don't surface to the caller, so a logging failure never breaks the
 * primary AI response path. Pair every successful (or failed) AI
 * provider call with one of these.
 */
export async function logAiCall(
  supa: SupabaseClient,
  row: AiCallLogRow,
): Promise<void> {
  try {
    const { error } = await supa.from('ai_call_log').insert({
      user_id:         row.userId,
      organization_id: row.organizationId ?? null,
      function_name:   row.functionName,
      provider:        row.provider ?? null,
      model:           row.model ?? null,
      input_tokens:    row.inputTokens ?? null,
      output_tokens:   row.outputTokens ?? null,
      status:          row.status,
      status_detail:   row.statusDetail ?? null,
      metadata:        row.metadata ?? {},
    });
    if (error) {
      console.warn(`[ai-rate-limit] log insert failed: ${error.message}`);
    }
  } catch (err) {
    console.warn(`[ai-rate-limit] log insert threw: ${(err as Error).message}`);
  }
}

/**
 * Build a 429 Response object from a failed quota check. Convenience
 * wrapper so each edge function doesn't have to handcraft the headers.
 */
export function rateLimitResponse(check: QuotaCheckResult): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'rate_limited',
      reason: check.reason,
      limit: check.limit,
      window_seconds: check.windowSeconds,
      retry_after: check.retryAfter,
      current_count: check.currentCount,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(check.retryAfter ?? 3600),
      },
    },
  );
}
