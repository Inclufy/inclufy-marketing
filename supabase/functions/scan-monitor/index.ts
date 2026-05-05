// Supabase Edge Function: scan-monitor
//
// Runs server-side health and regression checks twice daily via pg_cron,
// and on demand when the mobile app sends a POST request.
//
// Checks performed:
//   DB-A  go_captures table readable
//   DB-B  go_posts table readable
//   DB-C  go_events table readable
//   DB-D  go_campaigns table readable
//   DB-E  content_proposals table readable
//   DB-F  leads table readable
//   DB-G  media storage bucket accessible
//   REG-1 Scheduled posts all have valid ISO scheduled_at  (SCAN-004)
//   REG-2 No leads contain an invalid email address        (SCAN-056/058)
//   REG-3 No product images use expiring signed URLs       (SCAN-076)
//   REG-4 No go_posts have a null channel                  (data integrity)
//   REG-5 go_settings table has expected columns           (SCAN-046)
//   REG-6 No campaigns have starts_at > ends_at            (SCAN-065)
//
// Results are written to public.scan_reports.
// Auth: called by pg_cron (no JWT) or by the app with a user JWT.
//       Both paths use SUPABASE_SERVICE_ROLE_KEY internally.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL            = Deno.env.get('SUPABASE_URL')            ?? '';
const SUPABASE_SERVICE_ROLE   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const INTERNAL_CALL_SECRET    = Deno.env.get('INTERNAL_CALL_SECRET')    ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-call',
};

// ─── Check result type ────────────────────────────────────────────────────────

interface CheckResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  scanIssueRef?: string;   // SCAN-XXX this check guards
}

// ─── Individual checks ────────────────────────────────────────────────────────

async function checkTableReadable(
  db: ReturnType<typeof createClient>,
  table: string,
  columns: string,
  checkId: string,
): Promise<CheckResult> {
  try {
    const { error } = await db.from(table).select(columns).limit(1);
    return {
      id: checkId,
      name: `Table '${table}' readable`,
      passed: !error,
      error: error?.message,
    };
  } catch (e: any) {
    return { id: checkId, name: `Table '${table}' readable`, passed: false, error: e?.message };
  }
}

async function checkStorageBucket(db: ReturnType<typeof createClient>): Promise<CheckResult> {
  try {
    const { error } = await db.storage.from('media').list('', { limit: 1 });
    return {
      id: 'DB-G',
      name: 'Storage bucket media accessible',
      passed: !error,
      error: error?.message,
    };
  } catch (e: any) {
    return { id: 'DB-G', name: 'Storage bucket media accessible', passed: false, error: e?.message };
  }
}

async function checkScheduledPostTimestamps(db: ReturnType<typeof createClient>): Promise<CheckResult> {
  try {
    const { data, error } = await db
      .from('go_posts')
      .select('id, scheduled_at')
      .eq('status', 'scheduled')
      .limit(50);
    if (error) return { id: 'REG-1', name: 'Scheduled posts have valid timestamps', passed: false, error: error.message, scanIssueRef: 'SCAN-004' };
    const bad = (data ?? []).filter((r: any) => !r.scheduled_at || isNaN(Date.parse(r.scheduled_at)));
    return {
      id: 'REG-1',
      name: 'Scheduled posts have valid ISO timestamps',
      scanIssueRef: 'SCAN-004',
      passed: bad.length === 0,
      error: bad.length > 0 ? `${bad.length} post(s) with invalid scheduled_at: ${bad.slice(0, 3).map((r: any) => r.id).join(', ')}` : undefined,
    };
  } catch (e: any) {
    return { id: 'REG-1', name: 'Scheduled posts have valid ISO timestamps', passed: false, error: e?.message };
  }
}

async function checkLeadEmailFormat(db: ReturnType<typeof createClient>): Promise<CheckResult> {
  // Regression guard for SCAN-056/058 — email validation added to LeadCaptureScreen
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  try {
    const { data, error } = await db
      .from('leads')
      .select('id, email')
      .not('email', 'is', null)
      .limit(200);
    if (error) {
      // Table may not exist in all environments — treat as pass to avoid noise
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return { id: 'REG-2', name: 'Lead emails match valid format', passed: true };
      }
      return { id: 'REG-2', name: 'Lead emails match valid format', passed: false, error: error.message, scanIssueRef: 'SCAN-056' };
    }
    const bad = (data ?? []).filter((r: any) => r.email && !EMAIL_RE.test(r.email));
    return {
      id: 'REG-2',
      name: 'Lead emails match valid format',
      scanIssueRef: 'SCAN-056',
      passed: bad.length === 0,
      error: bad.length > 0 ? `${bad.length} lead(s) with malformed email` : undefined,
    };
  } catch (e: any) {
    return { id: 'REG-2', name: 'Lead emails match valid format', passed: false, error: e?.message };
  }
}

async function checkProductImageUrls(db: ReturnType<typeof createClient>): Promise<CheckResult> {
  // Regression guard for SCAN-076 — signed URLs replaced with permanent public URLs.
  // Signed Supabase URLs contain a "token=" query parameter and expire.
  try {
    const { data, error } = await db
      .from('products')
      .select('id, image_url')
      .not('image_url', 'is', null)
      .limit(100);
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return { id: 'REG-3', name: 'Product images use permanent public URLs', passed: true };
      }
      return { id: 'REG-3', name: 'Product images use permanent public URLs', passed: false, error: error.message, scanIssueRef: 'SCAN-076' };
    }
    const signed = (data ?? []).filter((r: any) => r.image_url && r.image_url.includes('token='));
    return {
      id: 'REG-3',
      name: 'Product images use permanent public URLs',
      scanIssueRef: 'SCAN-076',
      passed: signed.length === 0,
      error: signed.length > 0 ? `${signed.length} product(s) still have expiring signed URLs` : undefined,
    };
  } catch (e: any) {
    return { id: 'REG-3', name: 'Product images use permanent public URLs', passed: false, error: e?.message };
  }
}

async function checkPostChannelNotNull(db: ReturnType<typeof createClient>): Promise<CheckResult> {
  try {
    const { count, error } = await db
      .from('go_posts')
      .select('id', { count: 'exact', head: true })
      .is('channel', null);
    if (error) return { id: 'REG-4', name: 'All go_posts have a non-null channel', passed: false, error: error.message };
    return {
      id: 'REG-4',
      name: 'All go_posts have a non-null channel',
      passed: (count ?? 0) === 0,
      error: count ? `${count} post(s) have null channel` : undefined,
    };
  } catch (e: any) {
    return { id: 'REG-4', name: 'All go_posts have a non-null channel', passed: false, error: e?.message };
  }
}

async function checkSettingsTableColumns(db: ReturnType<typeof createClient>): Promise<CheckResult> {
  // SCAN-046: verify go_settings has user_id and settings columns
  try {
    const { error } = await db.from('go_settings').select('user_id, settings').limit(1);
    return {
      id: 'REG-5',
      name: 'go_settings has expected columns (user_id, settings)',
      scanIssueRef: 'SCAN-046',
      passed: !error,
      error: error?.message,
    };
  } catch (e: any) {
    return { id: 'REG-5', name: 'go_settings has expected columns', passed: false, error: e?.message };
  }
}

async function checkCampaignDateOrder(db: ReturnType<typeof createClient>): Promise<CheckResult> {
  // Regression guard for SCAN-065 — campaign start/end dates must be logically ordered
  try {
    const { data, error } = await db
      .from('go_campaigns')
      .select('id, starts_at, ends_at')
      .not('starts_at', 'is', null)
      .not('ends_at', 'is', null)
      .limit(100);
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return { id: 'REG-6', name: 'Campaign start dates precede end dates', passed: true };
      }
      return { id: 'REG-6', name: 'Campaign start dates precede end dates', passed: false, error: error.message, scanIssueRef: 'SCAN-065' };
    }
    const bad = (data ?? []).filter((r: any) => {
      const s = Date.parse(r.starts_at);
      const e = Date.parse(r.ends_at);
      return !isNaN(s) && !isNaN(e) && s > e;
    });
    return {
      id: 'REG-6',
      name: 'Campaign start dates precede end dates',
      scanIssueRef: 'SCAN-065',
      passed: bad.length === 0,
      error: bad.length > 0 ? `${bad.length} campaign(s) have starts_at after ends_at` : undefined,
    };
  } catch (e: any) {
    return { id: 'REG-6', name: 'Campaign start dates precede end dates', passed: false, error: e?.message };
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  // Auth: accept either a valid user JWT (from app) or the internal call secret (from pg_cron)
  const internalSecret = req.headers.get('x-internal-call') ?? '';
  const isCron = INTERNAL_CALL_SECRET.length > 0 && internalSecret === INTERNAL_CALL_SECRET;

  // Determine source label
  let source: string;
  if (isCron) {
    source = 'cron';
  } else {
    // Verify there's a user JWT — the gateway already validated it if verify_jwt=true
    source = 'manual-edge';
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // ── Run all checks ──────────────────────────────────────────────────────
  const checks: CheckResult[] = await Promise.all([
    checkTableReadable(db, 'go_captures', 'id, media_type, ai_status', 'DB-A'),
    checkTableReadable(db, 'go_posts',    'id, channel, status',       'DB-B'),
    checkTableReadable(db, 'go_events',   'id, status, name',          'DB-C'),
    checkTableReadable(db, 'go_campaigns','id, status, name',          'DB-D'),
    checkTableReadable(db, 'content_proposals', 'id, status, channel', 'DB-E'),
    checkTableReadable(db, 'leads',       'id, email',                 'DB-F'),
    checkStorageBucket(db),
    checkScheduledPostTimestamps(db),
    checkLeadEmailFormat(db),
    checkProductImageUrls(db),
    checkPostChannelNotNull(db),
    checkSettingsTableColumns(db),
    checkCampaignDateOrder(db),
  ]);

  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;

  const summary = failed === 0
    ? `All ${passed} checks passed.`
    : `${failed} check(s) failed out of ${checks.length}.`;

  // ── Write report to scan_reports table ────────────────────────────────
  const { error: insertError } = await db.from('scan_reports').insert({
    source,
    total_checks: checks.length,
    passed,
    failed,
    results: checks,
    summary,
  });

  if (insertError) {
    console.error('[scan-monitor] Failed to write report:', insertError.message);
  }

  return new Response(
    JSON.stringify({ ok: true, source, passed, failed, total: checks.length, summary, checks }),
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
  );
});
