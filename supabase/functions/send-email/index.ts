// ═══════════════════════════════════════════════════════════════════════════
// send-email — generic transactional email sender via Resend.
//
// Usage (from any other edge function or the client):
//   POST /functions/v1/send-email
//   { to, type, data, locale? }
//
// Email types:
//   publish_success      — post gepubliceerd op een kanaal
//   publish_failed       — publish mislukt, optionele reconnect-CTA
//   oauth_token_expired  — token is verlopen, reconnect needed
//   issue_reported       — admin-only: gebruiker meldt een issue
//   welcome              — nieuwe AMOS-gebruiker
//
// Templates worden hier inline gerenderd (geen externe template-engine).
// Branding: Inclufy paars-gradient (#9333EA → #7C3AED) met witte content card.
//
// Required secrets:
//   RESEND_API_KEY        — Resend API key (re_…)
// Optional:
//   EMAIL_FROM_ADDRESS    — default 'AMOS by Inclufy <noreply@inclufy.com>'
//   EMAIL_SUPPORT_ADDRESS — default 'support@inclufy.com'
//   APP_BASE_URL          — default 'https://marketing.inclufy.com'
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
// Shared secret — REQUIRED. Internal callers (notify-issue-reported, DB
// triggers, future bridges) must send X-Internal-Secret. Without this gate
// the function is an open relay on the DKIM-signed inclufy.com domain
// (free phishing-as-a-service).
const INTERNAL_EMAIL_SECRET = Deno.env.get('INTERNAL_EMAIL_SECRET') ?? '';

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const FROM_ADDRESS = Deno.env.get('EMAIL_FROM_ADDRESS')
  ?? 'AMOS by Inclufy <noreply@inclufy.com>';
const SUPPORT_ADDRESS = Deno.env.get('EMAIL_SUPPORT_ADDRESS')
  ?? 'support@inclufy.com';
const APP_BASE_URL = Deno.env.get('APP_BASE_URL')
  ?? 'https://marketing.inclufy.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Service-role client used purely for suppression-check + send-log writes.
// Never serves user-facing reads, so a missing env var (e.g. local dev)
// degrades gracefully: we just skip the DB plumbing and still send mail.
const dbClient = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

async function isSuppressed(email: string): Promise<boolean> {
  if (!dbClient) return false;
  const { data, error } = await dbClient
    .from('email_suppressions')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) {
    console.error('[send-email] suppression check failed', error.message);
    return false;
  }
  return !!data;
}

async function logSend(row: {
  resend_id: string | null;
  recipient: string;
  email_type: string;
  locale: string;
  subject: string;
  status: string;
  status_detail?: string | null;
}): Promise<void> {
  if (!dbClient) return;
  const { error } = await dbClient.from('email_send_log').insert(row);
  if (error) console.error('[send-email] log insert failed', error.message);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type EmailType =
  | 'publish_success'
  | 'publish_failed'
  | 'oauth_token_expired'
  | 'issue_reported'
  | 'welcome';

interface EmailPayload {
  to: string | string[];
  type: EmailType;
  data?: Record<string, unknown>;
  locale?: 'nl' | 'en';
  /** Optional override for the From line (rare). */
  from?: string;
}

// ─── Branded HTML wrapper ──────────────────────────────────────────────────
// Brand tokens — sourced from inclufy-marketing-web/src/index.css:
//   primary       hsl(325 85% 52%)  ≈ #ED1D96  (magenta-pink)
//   gradient hero hsl(325 85% 52%) → hsl(270 70% 60%)  ≈ #ED1D96 → #9952E0
//   accent        hsl(28 100% 55%)  ≈ #FF8019  (orange)
//   font          Roboto (Google Fonts)
//   radius        16px
function htmlWrapper(opts: {
  title: string;
  preheader?: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): string {
  const { title, preheader = '', body, ctaUrl, ctaLabel } = opts;
  const safe = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ctaBlock = ctaUrl && ctaLabel
    ? `<p style="margin:32px 0 8px 0;text-align:center;">
         <a href="${ctaUrl}" style="display:inline-block;background:#ED1D96;color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:-0.01em;box-shadow:0 4px 14px rgba(237,29,150,0.32);">${safe(ctaLabel)}</a>
       </p>`
    : '';
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${safe(title)}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:'Roboto','Helvetica Neue',Arial,sans-serif;color:#1a1a2e;">
  <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${safe(preheader)}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fafafa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(237,29,150,0.10);">
          <tr>
            <td style="background:linear-gradient(135deg,#ED1D96 0%,#9952E0 100%);padding:36px 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="color:#ffffff;font-family:'Roboto','Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Inclufy<span style="opacity:0.85;">.</span></span>
                  </td>
                  <td align="right" style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;padding-top:8px;">AMOS</td>
                </tr>
              </table>
              <h1 style="margin:24px 0 0 0;color:#ffffff;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;">${safe(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1a1a2e;font-size:15px;line-height:1.65;">
              ${body}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #f0f0f3;color:#6b7280;font-size:12px;line-height:1.6;text-align:center;">
              <strong style="color:#1a1a2e;font-weight:600;">Inclufy AMOS</strong> &mdash; AI-driven event marketing<br>
              <a href="${APP_BASE_URL}" style="color:#ED1D96;text-decoration:none;font-weight:500;">marketing.inclufy.com</a>
              <span style="color:#cbd0d8;margin:0 6px;">&middot;</span>
              <a href="mailto:${SUPPORT_ADDRESS}" style="color:#ED1D96;text-decoration:none;font-weight:500;">${SUPPORT_ADDRESS}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Per-type renderers (locale-aware) ─────────────────────────────────────
type Locale = 'nl' | 'en';

function renderTemplate(
  type: EmailType,
  data: Record<string, any>,
  locale: Locale = 'nl',
): { subject: string; html: string; text: string } {
  return locale === 'en'
    ? renderTemplateEN(type, data)
    : renderTemplateNL(type, data);
}

function renderTemplateNL(
  type: EmailType,
  data: Record<string, any>,
): { subject: string; html: string; text: string } {
  switch (type) {
    case 'publish_success': {
      const channel = data.channel ?? 'het kanaal';
      const postUrl = data.postUrl ?? '';
      const accountName = data.accountName ?? '';
      const accountClause = accountName ? ` als <strong>${accountName}</strong>` : '';
      return {
        subject: `✅ Post gepubliceerd op ${channel}`,
        html: htmlWrapper({
          title: `Je post staat live op ${channel}`,
          preheader: `Gepubliceerd${accountName ? ` als ${accountName}` : ''}.`,
          body: `
            <p style="margin:0 0 16px 0;">Hi,</p>
            <p style="margin:0 0 16px 0;">Je post is succesvol gepubliceerd op <strong>${channel}</strong>${accountClause}.</p>
            ${postUrl ? `<p style="margin:0 0 16px 0;">Je kunt 'm direct bekijken via de knop hieronder.</p>` : ''}
          `,
          ctaUrl: postUrl || undefined,
          ctaLabel: postUrl ? `Bekijk op ${channel}` : undefined,
        }),
        text: `Je post is gepubliceerd op ${channel}${accountName ? ` als ${accountName}` : ''}.${postUrl ? `\n\nBekijk: ${postUrl}` : ''}`,
      };
    }
    case 'publish_failed': {
      const channel = data.channel ?? 'een kanaal';
      const error = String(data.error ?? 'Onbekende fout');
      const action = data.action ?? '';
      const reconnectUrl = action === 'reconnect'
        ? `${APP_BASE_URL}/settings/social-media`
        : '';
      return {
        subject: `⚠️ Publish mislukt op ${channel}`,
        html: htmlWrapper({
          title: `Publish mislukt op ${channel}`,
          preheader: error.slice(0, 100),
          body: `
            <p style="margin:0 0 16px 0;">Hi,</p>
            <p style="margin:0 0 16px 0;">Je post kon niet gepubliceerd worden op <strong>${channel}</strong>:</p>
            <p style="margin:0 0 16px 0;padding:12px 16px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;color:#7f1d1d;font-size:13px;line-height:1.5;">${error}</p>
            ${action === 'reconnect' ? `<p style="margin:0 0 16px 0;">De koppeling met ${channel} moet opnieuw worden gelegd. Klik op de knop om dit nu te doen.</p>` : ''}
          `,
          ctaUrl: reconnectUrl || undefined,
          ctaLabel: reconnectUrl ? `Verbind ${channel} opnieuw` : undefined,
        }),
        text: `Publish mislukt op ${channel}: ${error}`,
      };
    }
    case 'oauth_token_expired': {
      const channel = data.channel ?? 'een kanaal';
      return {
        subject: `🔑 ${channel} verbinding verlopen`,
        html: htmlWrapper({
          title: `Je ${channel}-verbinding is verlopen`,
          preheader: `Geplande posts naar ${channel} worden niet uitgevoerd tot je opnieuw koppelt.`,
          body: `
            <p style="margin:0 0 16px 0;">Hi,</p>
            <p style="margin:0 0 16px 0;">Je OAuth-token voor <strong>${channel}</strong> is verlopen of ingetrokken. Tot je opnieuw koppelt zullen geplande posts naar dit kanaal niet worden uitgevoerd.</p>
            <p style="margin:0;">Het herverbinden kost ongeveer 30 seconden.</p>
          `,
          ctaUrl: `${APP_BASE_URL}/settings/social-media`,
          ctaLabel: `${channel} opnieuw koppelen`,
        }),
        text: `${channel} verbinding verlopen. Open Instellingen → Social Media om opnieuw te koppelen.`,
      };
    }
    case 'issue_reported': {
      const issueTitle = data.title ?? 'Nieuw issue';
      const description = String(data.description ?? '');
      const source = data.source ?? 'user';
      const userEmail = data.userEmail ?? 'onbekend';
      const issueId = data.issueId ?? '';
      return {
        subject: `🐛 [${source}] ${issueTitle}`,
        html: htmlWrapper({
          title: `Issue gemeld: ${issueTitle}`,
          preheader: description.slice(0, 100),
          body: `
            <p style="margin:0 0 16px 0;font-size:14px;color:#6b7280;">
              <strong style="color:#1a1a2e;">Source:</strong> ${source}<br>
              <strong style="color:#1a1a2e;">Reporter:</strong> ${userEmail}${issueId ? `<br><strong style="color:#1a1a2e;">Issue ID:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;">${issueId}</code>` : ''}
            </p>
            <p style="margin:24px 0 8px 0;font-weight:600;">Beschrijving</p>
            <p style="margin:0;padding:12px 16px;background:#f9fafb;border-radius:8px;color:#374151;font-size:14px;white-space:pre-wrap;">${description}</p>
          `,
          ctaUrl: issueId ? `${APP_BASE_URL}/admin/issues/${issueId}` : undefined,
          ctaLabel: issueId ? 'Open issue' : undefined,
        }),
        text: `Nieuw issue: ${issueTitle}\n\nFrom: ${userEmail}\n\n${description}`,
      };
    }
    case 'welcome': {
      const name = data.name ?? 'daar';
      return {
        subject: `Welkom bij Inclufy AMOS, ${name}!`,
        html: htmlWrapper({
          title: `Welkom, ${name}!`,
          preheader: `Aan de slag met AI-driven event marketing.`,
          body: `
            <p style="margin:0 0 16px 0;">Hi ${name},</p>
            <p style="margin:0 0 16px 0;">Welkom bij <strong>Inclufy AMOS</strong> — AI-driven event marketing. Je kunt nu meteen aan de slag:</p>
            <ul style="padding-left:20px;margin:0 0 16px 0;">
              <li style="margin-bottom:8px;">Capture momenten van je events met de mobile app</li>
              <li style="margin-bottom:8px;">Laat AI branded posts genereren in 8+ kanalen</li>
              <li style="margin-bottom:8px;">Publiceer in 1 klik via OAuth-integraties</li>
            </ul>
          `,
          ctaUrl: `${APP_BASE_URL}/dashboard`,
          ctaLabel: 'Open AMOS Dashboard',
        }),
        text: `Welkom bij Inclufy AMOS, ${name}! Open je dashboard: ${APP_BASE_URL}/dashboard`,
      };
    }
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

function renderTemplateEN(
  type: EmailType,
  data: Record<string, any>,
): { subject: string; html: string; text: string } {
  switch (type) {
    case 'publish_success': {
      const channel = data.channel ?? 'the channel';
      const postUrl = data.postUrl ?? '';
      const accountName = data.accountName ?? '';
      const accountClause = accountName ? ` as <strong>${accountName}</strong>` : '';
      return {
        subject: `✅ Post published on ${channel}`,
        html: htmlWrapper({
          title: `Your post is live on ${channel}`,
          preheader: `Published${accountName ? ` as ${accountName}` : ''}.`,
          body: `
            <p style="margin:0 0 16px 0;">Hi,</p>
            <p style="margin:0 0 16px 0;">Your post has been successfully published on <strong>${channel}</strong>${accountClause}.</p>
            ${postUrl ? `<p style="margin:0 0 16px 0;">View it directly via the button below.</p>` : ''}
          `,
          ctaUrl: postUrl || undefined,
          ctaLabel: postUrl ? `View on ${channel}` : undefined,
        }),
        text: `Your post is live on ${channel}${accountName ? ` as ${accountName}` : ''}.${postUrl ? `\n\nView: ${postUrl}` : ''}`,
      };
    }
    case 'publish_failed': {
      const channel = data.channel ?? 'a channel';
      const error = String(data.error ?? 'Unknown error');
      const action = data.action ?? '';
      const reconnectUrl = action === 'reconnect'
        ? `${APP_BASE_URL}/settings/social-media`
        : '';
      return {
        subject: `⚠️ Publish failed on ${channel}`,
        html: htmlWrapper({
          title: `Publish failed on ${channel}`,
          preheader: error.slice(0, 100),
          body: `
            <p style="margin:0 0 16px 0;">Hi,</p>
            <p style="margin:0 0 16px 0;">Your post could not be published on <strong>${channel}</strong>:</p>
            <p style="margin:0 0 16px 0;padding:12px 16px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;color:#7f1d1d;font-size:13px;line-height:1.5;">${error}</p>
            ${action === 'reconnect' ? `<p style="margin:0 0 16px 0;">The connection with ${channel} needs to be re-established. Click the button to do this now.</p>` : ''}
          `,
          ctaUrl: reconnectUrl || undefined,
          ctaLabel: reconnectUrl ? `Reconnect ${channel}` : undefined,
        }),
        text: `Publish failed on ${channel}: ${error}`,
      };
    }
    case 'oauth_token_expired': {
      const channel = data.channel ?? 'a channel';
      return {
        subject: `🔑 ${channel} connection expired`,
        html: htmlWrapper({
          title: `Your ${channel} connection has expired`,
          preheader: `Scheduled posts to ${channel} won't run until you reconnect.`,
          body: `
            <p style="margin:0 0 16px 0;">Hi,</p>
            <p style="margin:0 0 16px 0;">Your OAuth token for <strong>${channel}</strong> has expired or been revoked. Until you reconnect, scheduled posts to this channel will not be executed.</p>
            <p style="margin:0;">Reconnecting takes about 30 seconds.</p>
          `,
          ctaUrl: `${APP_BASE_URL}/settings/social-media`,
          ctaLabel: `Reconnect ${channel}`,
        }),
        text: `${channel} connection expired. Open Settings → Social Media to reconnect.`,
      };
    }
    case 'issue_reported': {
      const issueTitle = data.title ?? 'New issue';
      const description = String(data.description ?? '');
      const source = data.source ?? 'user';
      const userEmail = data.userEmail ?? 'unknown';
      const issueId = data.issueId ?? '';
      return {
        subject: `🐛 [${source}] ${issueTitle}`,
        html: htmlWrapper({
          title: `Issue reported: ${issueTitle}`,
          preheader: description.slice(0, 100),
          body: `
            <p style="margin:0 0 16px 0;font-size:14px;color:#6b7280;">
              <strong style="color:#1a1a2e;">Source:</strong> ${source}<br>
              <strong style="color:#1a1a2e;">Reporter:</strong> ${userEmail}${issueId ? `<br><strong style="color:#1a1a2e;">Issue ID:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;">${issueId}</code>` : ''}
            </p>
            <p style="margin:24px 0 8px 0;font-weight:600;">Description</p>
            <p style="margin:0;padding:12px 16px;background:#f9fafb;border-radius:8px;color:#374151;font-size:14px;white-space:pre-wrap;">${description}</p>
          `,
          ctaUrl: issueId ? `${APP_BASE_URL}/admin/issues/${issueId}` : undefined,
          ctaLabel: issueId ? 'Open issue' : undefined,
        }),
        text: `New issue: ${issueTitle}\n\nFrom: ${userEmail}\n\n${description}`,
      };
    }
    case 'welcome': {
      const name = data.name ?? 'there';
      return {
        subject: `Welcome to Inclufy AMOS, ${name}!`,
        html: htmlWrapper({
          title: `Welcome, ${name}!`,
          preheader: `Get started with AI-driven event marketing.`,
          body: `
            <p style="margin:0 0 16px 0;">Hi ${name},</p>
            <p style="margin:0 0 16px 0;">Welcome to <strong>Inclufy AMOS</strong> — AI-driven event marketing. You can get started right away:</p>
            <ul style="padding-left:20px;margin:0 0 16px 0;">
              <li style="margin-bottom:8px;">Capture event moments with the mobile app</li>
              <li style="margin-bottom:8px;">Let AI generate branded posts for 8+ channels</li>
              <li style="margin-bottom:8px;">Publish in one click via OAuth integrations</li>
            </ul>
          `,
          ctaUrl: `${APP_BASE_URL}/dashboard`,
          ctaLabel: 'Open AMOS Dashboard',
        }),
        text: `Welcome to Inclufy AMOS, ${name}! Open your dashboard: ${APP_BASE_URL}/dashboard`,
      };
    }
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

// ─── Resend HTTP client ────────────────────────────────────────────────────
async function sendViaResend(payload: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}): Promise<{ id: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error ${res.status}: ${errText}`);
  }
  return await res.json();
}

// ─── HTTP entry ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!RESEND_API_KEY) {
    console.error('[send-email] RESEND_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: 'Email service not configured (RESEND_API_KEY missing)' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Fail closed if shared secret isn't configured. Better 503 than open relay.
  if (!INTERNAL_EMAIL_SECRET) {
    console.error('[send-email] INTERNAL_EMAIL_SECRET not set — refusing all calls');
    return new Response(
      JSON.stringify({ error: 'service unavailable' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  const providedSecret = req.headers.get('x-internal-secret') ?? '';
  if (!constantTimeEquals(providedSecret, INTERNAL_EMAIL_SECRET)) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body: EmailPayload = await req.json();
    const { to, type, data = {}, locale = 'nl', from } = body;
    if (!to || !type) {
      return new Response(
        JSON.stringify({ error: '`to` and `type` are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

    // Suppression check: if any recipient is suppressed, skip the entire send
    // and record one log entry per address. Conservative — splitting partial
    // sends would surprise callers that depend on a single resend_id.
    const suppressedHits: string[] = [];
    for (const r of recipients) {
      if (await isSuppressed(r)) suppressedHits.push(r);
    }
    if (suppressedHits.length > 0) {
      const { subject } = renderTemplate(type, data as Record<string, any>, locale);
      for (const r of recipients) {
        await logSend({
          resend_id: null,
          recipient: r,
          email_type: type,
          locale,
          subject,
          status: 'suppressed',
          status_detail: suppressedHits.includes(r) ? 'in email_suppressions' : 'sibling-suppressed',
        });
      }
      console.log(`[send-email] skipped — suppressed=${suppressedHits.join(',')}`);
      return new Response(
        JSON.stringify({ success: false, suppressed: suppressedHits, type }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { subject, html, text } = renderTemplate(type, data as Record<string, any>, locale);
    let result: { id: string };
    try {
      result = await sendViaResend({
        from: from ?? FROM_ADDRESS,
        to,
        subject,
        html,
        text,
      });
    } catch (sendErr: any) {
      // Log the failure so the dashboard can show it; rethrow for the outer
      // handler to return 500.
      for (const r of recipients) {
        await logSend({
          resend_id: null,
          recipient: r,
          email_type: type,
          locale,
          subject,
          status: 'failed',
          status_detail: sendErr?.message ?? String(sendErr),
        });
      }
      throw sendErr;
    }

    for (const r of recipients) {
      await logSend({
        resend_id: result.id,
        recipient: r,
        email_type: type,
        locale,
        subject,
        status: 'sent',
      });
    }

    console.log(`[send-email] sent type=${type} to=${recipients.join(',')} resend_id=${result.id}`);
    return new Response(JSON.stringify({ success: true, id: result.id, type }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[send-email] exception:', err?.message);
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
