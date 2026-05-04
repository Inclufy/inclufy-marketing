'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const SUGGESTED = [
  'Wat kost het Professioneel-pakket?',
  'Welk pakket past bij een MKB met 5 contactpersonen?',
  'Werkt dit met onze huidige CRM?',
  'Kan ik een demo krijgen?',
];

const SYSTEM_GREETING: Message = {
  role: 'assistant',
  ts: Date.now(),
  content: 'Hoi, ik ben Inclufy AI. Ik beantwoord direct je vragen over functies, pricing en integraties. Waar kan ik je mee helpen?',
};

export function SalesChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([SYSTEM_GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const user: Message = { role: 'user', content: trimmed, ts: Date.now() };
    setMessages((m) => [...m, user]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/sales-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, user].map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok) throw new Error(`status_${res.status}`);
      const data = (await res.json()) as { reply: string };
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, ts: Date.now() }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          ts: Date.now(),
          content:
            'Sorry, ik kan even niet bij mijn knowledge base. Bel/mail ons gerust via de contactpagina, of plan direct een demo.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Sluit sales chat' : 'Open sales chat'}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all',
          'bg-gradient-to-br from-brand-400 to-brand-600 text-white hover:scale-105',
          open && 'scale-90',
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Inclufy sales chat"
          className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl"
        >
          <header className="flex items-center gap-3 border-b border-[hsl(var(--border))] bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Inclufy AI Sales</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Online · gemiddelde reactie &lt; 30 sec</p>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                  m.role === 'user'
                    ? 'ml-auto bg-brand-500 text-white'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]',
                )}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="flex max-w-[85%] gap-1 rounded-2xl bg-[hsl(var(--muted))] px-3 py-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--muted-foreground))]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--muted-foreground))] [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--muted-foreground))] [animation-delay:240ms]" />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-3 py-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-1 text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-[hsl(var(--border))] px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Typ je vraag..."
              className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Verstuur"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
