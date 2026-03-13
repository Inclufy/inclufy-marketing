// Supabase Edge Function: Team Invite
// Invites a user to an event team by email.
// Sends a beautiful HTML email via Resend (if RESEND_API_KEY is set).
// Always returns HTTP 200 — errors are in { error: '...' } response body.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Always HTTP 200 — client checks data.error field
function jsonResp(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Beautiful HTML Email Template ─────────────────────────────────
function buildInviteEmail(params: {
  inviteeEmail: string;
  inviterEmail: string;
  eventName: string;
  role: string;
}): string {
  const { inviterEmail, eventName, role } = params;

  const roleLabels: Record<string, { label: string; desc: string }> = {
    editor:      { label: 'Editor',    desc: 'Je kunt content bewerken en posten' },
    contributor: { label: 'Bijdrager', desc: 'Je kunt content vastleggen en toevoegen' },
    viewer:      { label: 'Kijker',    desc: 'Je kunt content bekijken' },
    owner:       { label: 'Eigenaar',  desc: 'Volledige toegang tot het event' },
  };

  const roleInfo = roleLabels[role] || roleLabels.contributor;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Je bent uitgenodigd - Inclufy GO</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

          <!-- Header gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9 0%,#9333ea 100%);padding:44px 40px 40px;text-align:center;">
              <!-- Brand -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.18);border-radius:14px;padding:10px 18px;text-align:center;">
                    <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1;">&#9889; Inclufy GO</span>
                  </td>
                </tr>
              </table>

              <!-- Icon circle -->
              <div style="width:80px;height:80px;background:rgba(255,255,255,0.18);border-radius:24px;margin:0 auto 20px;display:table-cell;vertical-align:middle;text-align:center;font-size:38px;line-height:80px;">🎉</div>

              <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;letter-spacing:-0.5px;">Je bent uitgenodigd!</h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.80);line-height:1.5;">
                <strong style="color:#fff;">${inviterEmail}</strong><br>heeft je uitgenodigd voor een event
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px;">

              <!-- Event card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border-radius:14px;margin-bottom:24px;overflow:hidden;">
                <tr>
                  <td style="border-left:4px solid #7c3aed;padding:18px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.8px;">EVENT</p>
                    <p style="margin:0;font-size:22px;font-weight:800;color:#1a1a2e;line-height:1.2;">${eventName}</p>
                  </td>
                </tr>
              </table>

              <!-- Role section -->
              <p style="margin:0 0 12px;font-size:14px;color:#6b7280;font-weight:500;">Je rol in dit event:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#6d28d9,#9333ea);border-radius:100px;padding:10px 22px;">
                    <span style="font-size:14px;font-weight:700;color:#ffffff;">${roleInfo.label}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:-16px 0 28px;font-size:13px;color:#9ca3af;">${roleInfo.desc}</p>

              <!-- Body text -->
              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
                Open de <strong>Inclufy GO app</strong> op je telefoon om de uitnodiging te accepteren. Je wordt direct toegevoegd aan het event team.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="inclufy-go://accept-invite" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:14px;letter-spacing:0.2px;box-shadow:0 4px 16px rgba(109,40,217,0.35);">
                      Open Inclufy GO &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">

              <!-- Steps -->
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Hoe te accepteren:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#f3e8ff;border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#7c3aed;">1</td>
                        <td style="padding-left:12px;font-size:13px;color:#6b7280;line-height:1.5;">Open de Inclufy GO app</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#f3e8ff;border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#7c3aed;">2</td>
                        <td style="padding-left:12px;font-size:13px;color:#6b7280;line-height:1.5;">Ga naar <strong>Meldingen</strong></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#f3e8ff;border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#7c3aed;">3</td>
                        <td style="padding-left:12px;font-size:13px;color:#6b7280;line-height:1.5;">Accepteer de uitnodiging voor <strong>${eventName}</strong></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;line-height:1.6;">
                Dit is een automatische uitnodiging van <strong>Inclufy GO</strong>.<br>
                Als je deze uitnodiging niet verwachtte, kun je deze e-mail negeren.
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">
                &copy; 2026 Inclufy &mdash; AI Event Marketing &bull;
                <a href="https://inclufy.com" style="color:#7c3aed;text-decoration:none;">inclufy.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send email via Resend ──────────────────────────────────────────
async function sendInviteEmail(params: {
  to: string;
  inviterEmail: string;
  eventName: string;
  role: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log('[team-invite] No RESEND_API_KEY set — skipping email');
    return;
  }

  const html = buildInviteEmail({
    inviteeEmail: params.to,
    inviterEmail: params.inviterEmail,
    eventName: params.eventName,
    role: params.role,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Inclufy GO <noreply@inclufy.com>',
      to: [params.to],
      subject: `Je bent uitgenodigd voor ${params.eventName} — Inclufy GO`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[team-invite] Resend error:', errText);
    // Non-fatal: don't throw — invite was still created
  } else {
    console.log('[team-invite] Invitation email sent to', params.to);
  }
}

// ─── Main handler ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Authenticate calling user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResp({ error: 'Niet geauthenticeerd' });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return jsonResp({ error: 'Niet geautoriseerd' });

    const { event_id, email, role = 'contributor' } = await req.json();
    if (!event_id || !email) {
      return jsonResp({ error: 'event_id en email zijn verplicht' });
    }

    // Admin client — needed to look up user by email
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify current user owns the event
    const { data: eventData, error: eventError } = await userClient
      .from('go_events')
      .select('id, name')
      .eq('id', event_id)
      .eq('user_id', user.id)
      .single();

    if (eventError || !eventData) {
      return jsonResp({ error: 'Alleen de event eigenaar kan teamleden uitnodigen' });
    }

    const eventName = eventData.name || 'Event';

    // Look up invited user by email using admin API
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) {
      console.error('[team-invite] listUsers error:', usersError);
      return jsonResp({ error: 'Fout bij het opzoeken van de gebruiker' });
    }

    const targetUser = usersData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!targetUser) {
      return jsonResp({
        error: `Geen account gevonden voor ${email}. Vraag hen om zich eerst aan te melden bij Inclufy GO.`,
      });
    }

    // Check if already a member
    const { data: existing } = await adminClient
      .from('go_event_members')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('user_id', targetUser.id)
      .single();

    if (existing) {
      const statusMsg = existing.status === 'pending'
        ? 'heeft al een openstaande uitnodiging'
        : 'is al lid van dit team';
      return jsonResp({ error: `${email} ${statusMsg}` });
    }

    // Create membership record
    const { data: member, error: insertError } = await adminClient
      .from('go_event_members')
      .insert({
        event_id,
        user_id: targetUser.id,
        invited_by: user.id,
        role,
        status: 'pending',
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('[team-invite] Insert error:', insertError);
      return jsonResp({ error: 'Fout bij het aanmaken van de uitnodiging' });
    }

    // Send invitation email (non-blocking — don't fail if email fails)
    await sendInviteEmail({
      to: email,
      inviterEmail: user.email || 'een teamlid',
      eventName,
      role,
    }).catch((err) => console.error('[team-invite] Email error (non-fatal):', err));

    return jsonResp({
      member,
      message: `Uitnodiging verstuurd naar ${email}`,
      email_sent: !!RESEND_API_KEY,
    });

  } catch (err) {
    console.error('[team-invite] Unexpected error:', err);
    return jsonResp({ error: String(err) });
  }
});
