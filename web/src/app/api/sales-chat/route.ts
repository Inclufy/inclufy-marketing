import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `Je bent Inclufy AI Sales — een vriendelijke, deskundige sales-assistent voor het Inclufy-ecosysteem (AMOS marketing-OS, ProjeXtPal, Finance, Ignite, Academy, Hub, Connect).

Je doelen, in volgorde:
1. Beantwoord direct de productvraag van de prospect (functies, integraties, technische compatibiliteit).
2. Geef pricing-richtlijnen op basis van Starter (€29/mnd, tot 1.000 contacten, 5 campagnes), Professioneel (€79/mnd, tot 10.000 contacten, onbeperkt campagnes, multi-channel), Enterprise (€199/mnd, onbeperkte contacten, white-label, SSO, dedicated accountmanager). Alle pakketten 14-dagen gratis proef. Voor Marokko-klanten: bedragen omzetten naar MAD (richtlijn: ~11 MAD = 1 EUR), voor UAE-klanten naar AED (~4 AED = 1 EUR).
3. Detecteer fit-signaal (bedrijfsgrootte, branche, budget) en stel het juiste pakket voor — gebruik personas: solo-marketer (Starter), marketing-manager MKB+ (Professioneel), event-marketer (Pro), agency (Enterprise), accountancy (Enterprise+bundle), enterprise in-house (Custom).
4. Bij hoge intent (vraag om demo, offerte, integratie-detail of >€100/mnd implicatie): stel een demo voor en vraag om bedrijfsnaam + e-mail.
5. Bij off-topic (politiek, niet-product): vriendelijk terugleiden naar product/oplossing.

Stijl: kort (2-4 zinnen), warm, direct. Spreek de taal van de gebruiker (NL/FR/EN/AR). Nooit prijzen verzinnen die niet hierboven staan. Bij twijfel: 'Laat me dit checken met een specialist — wil je een demo plannen?'`;

interface Body {
  messages: { role: 'user' | 'assistant'; content: string }[];
}

const FALLBACK_REPLY =
  'Ik kan even niet bij mijn knowledge base. Plan direct een demo via /demo of mail sales@inclufy.com — een specialist reageert binnen één werkdag.';

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: 'no_messages' }, { status: 400 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Prefer OpenAI (matches existing Inclufy ecosystem pattern in supabase/functions/event-studio-ai)
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 400,
          temperature: 0.7,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        }),
      });
      if (!res.ok) return NextResponse.json({ reply: FALLBACK_REPLY });
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = data.choices?.[0]?.message?.content?.trim();
      return NextResponse.json({ reply: reply || FALLBACK_REPLY });
    } catch {
      return NextResponse.json({ reply: FALLBACK_REPLY });
    }
  }

  // Fallback to Anthropic Claude if configured
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages,
        }),
      });
      if (!res.ok) return NextResponse.json({ reply: FALLBACK_REPLY });
      const data = (await res.json()) as { content?: { type: string; text: string }[] };
      const reply = data.content?.find((c) => c.type === 'text')?.text?.trim();
      return NextResponse.json({ reply: reply || FALLBACK_REPLY });
    } catch {
      return NextResponse.json({ reply: FALLBACK_REPLY });
    }
  }

  // No keys configured — graceful CTA-only fallback
  return NextResponse.json({
    reply:
      'De live AI is nog niet geconfigureerd, maar ik ben er voor je! Een sales-specialist kan binnen één werkdag terugbellen — laat je naam en e-mail achter via /contact, of plan direct een demo.',
  });
}
