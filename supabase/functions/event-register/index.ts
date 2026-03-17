// Supabase Edge Function: Event Registration
// Serves a beautiful registration page for events and handles form submissions.
// QR codes in the app point to: {SUPABASE_URL}/functions/v1/event-register?id={eventId}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function html(body: string, title = 'Event Registratie') {
  return new Response(`<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
background:linear-gradient(135deg,#FFF5F7 0%,#F7F6FF 50%,#EDE9FE 100%);
min-height:100vh;color:#1a1a2e;padding:16px}
.container{max-width:440px;margin:0 auto;padding-top:24px}
.logo{text-align:center;margin-bottom:24px}
.logo span{font-size:28px;font-weight:800;background:linear-gradient(135deg,#E91E63,#7C3AED);
-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.card{background:#fff;border-radius:20px;padding:32px 24px;
box-shadow:0 4px 24px rgba(124,58,237,.08)}
.event-header{text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #f0f0f0}
.event-name{font-size:22px;font-weight:700;color:#1a1a2e;margin-bottom:12px}
.event-meta{display:flex;flex-direction:column;gap:6px;align-items:center}
.meta-item{display:flex;align-items:center;gap:6px;font-size:14px;color:#666}
.meta-item svg{width:16px;height:16px;fill:#999}
.badge{display:inline-block;background:#E91E63;color:#fff;font-size:11px;font-weight:600;
padding:4px 12px;border-radius:20px;margin-top:8px}
.badge.closed{background:#999}
h2{font-size:16px;font-weight:600;color:#333;margin-bottom:16px}
.form-group{margin-bottom:16px}
.form-group label{display:block;font-size:13px;font-weight:500;color:#666;margin-bottom:6px}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:12px 14px;
border:1.5px solid #e0e0e0;border-radius:12px;font-size:15px;color:#333;
background:#fafafa;transition:border-color .2s}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{
outline:none;border-color:#7C3AED;background:#fff}
.form-group textarea{resize:vertical;min-height:60px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.btn{width:100%;padding:14px;border:none;border-radius:12px;font-size:16px;
font-weight:600;cursor:pointer;transition:all .2s}
.btn-primary{background:linear-gradient(135deg,#E91E63,#7C3AED);color:#fff;margin-top:8px}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(124,58,237,.3)}
.btn-primary:disabled{opacity:.6;transform:none}
.success{text-align:center;padding:40px 20px}
.success .icon{font-size:64px;margin-bottom:16px}
.success h1{font-size:24px;color:#7C3AED;margin-bottom:8px}
.success p{color:#666;line-height:1.6}
.error{text-align:center;padding:40px 20px}
.error .icon{font-size:64px;margin-bottom:16px}
.error h1{font-size:24px;color:#DC2626;margin-bottom:8px}
.error p{color:#666;line-height:1.6}
.footer{text-align:center;margin-top:24px;font-size:12px;color:#999}
.footer a{color:#7C3AED;text-decoration:none}
.attendee-count{text-align:center;font-size:13px;color:#999;margin-top:16px}
.privacy{font-size:11px;color:#999;text-align:center;margin-top:12px;line-height:1.5}
</style>
</head>
<body>
<div class="container">
<div class="logo"><span>AMOS</span></div>
${body}
<div class="footer">Powered by <a href="https://inclufy.com">Inclufy</a></div>
</div>
</body>
</html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

serve(async (req) => {
  const url = new URL(req.url);
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Handle CORS ──
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // ── POST: Handle registration form submission ──
  if (req.method === 'POST') {
    try {
      const formData = await req.formData();
      const eventId = formData.get('event_id') as string;
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const company = formData.get('company') as string;
      const phone = formData.get('phone') as string;
      const jobTitle = formData.get('job_title') as string;
      const notes = formData.get('notes') as string;
      const ticketType = formData.get('ticket_type') as string || 'general';

      if (!eventId || !name || !email) {
        return html(`<div class="card"><div class="error">
          <div class="icon">⚠️</div>
          <h1>Velden ontbreken</h1>
          <p>Naam en e-mail zijn verplicht. <a href="javascript:history.back()">Terug</a></p>
        </div></div>`);
      }

      // Fetch event to get user_id (organizer)
      const { data: event } = await db
        .from('go_events')
        .select('id, user_id, name')
        .eq('id', eventId)
        .single();

      if (!event) {
        return html(`<div class="card"><div class="error">
          <div class="icon">❌</div>
          <h1>Event niet gevonden</h1>
          <p>Dit event bestaat niet meer.</p>
        </div></div>`);
      }

      // Check for duplicate registration
      const { data: existing } = await db
        .from('go_event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        return html(`<div class="card"><div class="success">
          <div class="icon">📧</div>
          <h1>Al ingeschreven!</h1>
          <p>Je bent al ingeschreven voor <strong>${event.name}</strong> met dit e-mailadres.</p>
          <p style="margin-top:16px;font-size:14px;color:#7C3AED">We zien je daar! 🎉</p>
        </div></div>`, `${event.name} - Al ingeschreven`);
      }

      // Insert attendee
      const { error: insertErr } = await db
        .from('go_event_attendees')
        .insert({
          event_id: eventId,
          user_id: event.user_id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          company: company?.trim() || null,
          phone: phone?.trim() || null,
          job_title: jobTitle?.trim() || null,
          notes: notes?.trim() || null,
          ticket_type: ticketType,
          status: 'registered',
          source: 'form',
          registered_at: new Date().toISOString(),
        });

      if (insertErr) {
        console.error('Insert attendee error:', insertErr);
        return html(`<div class="card"><div class="error">
          <div class="icon">❌</div>
          <h1>Registratie mislukt</h1>
          <p>${insertErr.message}</p>
          <p style="margin-top:12px"><a href="javascript:history.back()">Probeer opnieuw</a></p>
        </div></div>`);
      }

      return html(`<div class="card"><div class="success">
        <div class="icon">🎉</div>
        <h1>Ingeschreven!</h1>
        <p>Je bent succesvol ingeschreven voor <strong>${event.name}</strong>.</p>
        <p style="margin-top:12px;font-size:14px;color:#666">
          Je ontvangt een bevestiging op <strong>${email}</strong>.
        </p>
        <p style="margin-top:24px;font-size:13px;color:#999">Je kunt dit venster sluiten.</p>
      </div></div>`, `${event.name} - Ingeschreven!`);

    } catch (err: any) {
      console.error('Registration error:', err);
      return html(`<div class="card"><div class="error">
        <div class="icon">❌</div>
        <h1>Er ging iets mis</h1>
        <p>${err.message}</p>
      </div></div>`);
    }
  }

  // ── GET: Show registration form ──
  const eventId = url.searchParams.get('id') || url.pathname.split('/').pop();

  if (!eventId || eventId === 'event-register') {
    return html(`<div class="card"><div class="error">
      <div class="icon">🔍</div>
      <h1>Geen event opgegeven</h1>
      <p>Scan de QR-code opnieuw of vraag de organisator om een nieuwe link.</p>
    </div></div>`);
  }

  // Fetch event details
  const { data: event, error: eventErr } = await db
    .from('go_events')
    .select('id, name, description, location, event_date, event_start_time, event_end_time, settings, status')
    .eq('id', eventId)
    .single();

  if (eventErr || !event) {
    return html(`<div class="card"><div class="error">
      <div class="icon">❌</div>
      <h1>Event niet gevonden</h1>
      <p>Dit event bestaat niet of is verwijderd.</p>
    </div></div>`);
  }

  // Count existing attendees
  const { count: attendeeCount } = await db
    .from('go_event_attendees')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);

  // Check if registration is enabled
  const registrationEnabled = (event.settings as any)?.registration_enabled !== false;

  // Format date
  const dateStr = event.event_date || '';
  let formattedDate = dateStr;
  try {
    if (dateStr) {
      const d = new Date(dateStr);
      formattedDate = d.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  } catch {}

  const timeStr = [event.event_start_time, event.event_end_time].filter(Boolean).join(' - ');

  if (!registrationEnabled) {
    return html(`<div class="card">
      <div class="event-header">
        <div class="event-name">${event.name}</div>
        <div class="event-meta">
          ${formattedDate ? `<div class="meta-item"><svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>${formattedDate}</div>` : ''}
          ${event.location ? `<div class="meta-item"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>${event.location}</div>` : ''}
        </div>
        <span class="badge closed">Registratie gesloten</span>
      </div>
      <div style="text-align:center;padding:16px 0;color:#666">
        <p>Registratie voor dit event is momenteel gesloten.</p>
        <p style="margin-top:8px;font-size:13px">Neem contact op met de organisator voor meer informatie.</p>
      </div>
    </div>`, `${event.name} - Registratie gesloten`);
  }

  return html(`<div class="card">
    <div class="event-header">
      <div class="event-name">${event.name}</div>
      <div class="event-meta">
        ${formattedDate ? `<div class="meta-item"><svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>${formattedDate}</div>` : ''}
        ${timeStr ? `<div class="meta-item"><svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>${timeStr}</div>` : ''}
        ${event.location ? `<div class="meta-item"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>${event.location}</div>` : ''}
      </div>
      <span class="badge">Registratie open</span>
    </div>

    ${event.description ? `<p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:24px">${event.description}</p>` : ''}

    <h2>📝 Inschrijven</h2>
    <form method="POST" action="">
      <input type="hidden" name="event_id" value="${event.id}">

      <div class="form-group">
        <label>Naam *</label>
        <input type="text" name="name" required placeholder="Je volledige naam" autocomplete="name">
      </div>

      <div class="form-group">
        <label>E-mail *</label>
        <input type="email" name="email" required placeholder="naam@bedrijf.nl" autocomplete="email">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Bedrijf</label>
          <input type="text" name="company" placeholder="Bedrijfsnaam" autocomplete="organization">
        </div>
        <div class="form-group">
          <label>Functie</label>
          <input type="text" name="job_title" placeholder="Je functie" autocomplete="job-title">
        </div>
      </div>

      <div class="form-group">
        <label>Telefoon</label>
        <input type="tel" name="phone" placeholder="+31 6 12345678" autocomplete="tel">
      </div>

      <div class="form-group">
        <label>Ticket type</label>
        <select name="ticket_type">
          <option value="general">Algemeen</option>
          <option value="vip">VIP</option>
          <option value="speaker">Spreker</option>
          <option value="sponsor">Sponsor</option>
          <option value="press">Pers</option>
        </select>
      </div>

      <div class="form-group">
        <label>Opmerkingen</label>
        <textarea name="notes" placeholder="Dieetwensen, vragen, etc." rows="2"></textarea>
      </div>

      <button type="submit" class="btn btn-primary">Inschrijven</button>
    </form>

    <div class="privacy">
      Door in te schrijven ga je akkoord met het delen van je gegevens met de organisator van dit event.
    </div>

    ${attendeeCount ? `<div class="attendee-count">${attendeeCount} deelnemer${attendeeCount === 1 ? '' : 's'} ingeschreven</div>` : ''}
  </div>`, `${event.name} - Inschrijven`);
});
