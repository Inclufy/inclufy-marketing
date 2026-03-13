// src/components/AICopilot.tsx
// AI Marketing Co-pilot — vaste sidebar rechts (zoals Inclufy Financieel)

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Loader2,
  Lightbulb,
  TrendingUp,
  Mail,
  FileText,
  Trash2,
  Minimize2,
  Copy,
  Check,
  ChevronRight,
  BarChart3,
  Zap,
  PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface CopilotInitialContext {
  systemPrompt: string;
  firstMessage?: string;
}

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: CopilotInitialContext | null;
  onContextConsumed?: () => void;
}

const QUICK_PROMPTS = [
  { icon: Lightbulb, label: 'Campagne idee', prompt: 'Geef me 3 creatieve campagne-ideeën voor mijn bedrijf' },
  { icon: Mail, label: 'E-mail schrijven', prompt: 'Schrijf een professionele marketing e-mail voor een product lancering' },
  { icon: TrendingUp, label: 'SEO tips', prompt: 'Geef me 5 SEO tips om mijn website hoger te laten ranken' },
  { icon: FileText, label: 'Social post', prompt: 'Maak een pakkende social media post voor Instagram en LinkedIn' },
];

const SUGGESTIONS = [
  { icon: BarChart3, title: 'Campagne analyse', desc: 'Bekijk de prestaties van je actieve campagnes' },
  { icon: PenTool, title: 'Content calendar', desc: 'Plan je content voor de komende week' },
  { icon: Zap, title: 'Groei tips', desc: 'Ontdek kansen om je bereik te vergroten' },
];

export default function AICopilot({ isOpen, onClose, initialContext, onContextConsumed }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextProcessedRef = useRef<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle initialContext: auto-send first message when copilot opens with context
  useEffect(() => {
    if (!isOpen || !initialContext || isLoading) return;
    // Prevent double-processing the same context
    const contextKey = `${initialContext.systemPrompt}:${initialContext.firstMessage || ''}`;
    if (contextProcessedRef.current === contextKey) return;
    contextProcessedRef.current = contextKey;

    // Set custom system prompt and clear chat for fresh context
    setCustomSystemPrompt(initialContext.systemPrompt);
    setMessages([]);

    // Auto-send the first message if provided
    if (initialContext.firstMessage) {
      setTimeout(() => {
        sendMessageWithPrompt(initialContext.firstMessage!, initialContext.systemPrompt);
      }, 400);
    }

    // Notify parent that context has been consumed
    onContextConsumed?.();
  }, [isOpen, initialContext]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const DEFAULT_SYSTEM_PROMPT = 'Je bent een behulpzame AI Marketing Co-pilot voor het Inclufy Marketing platform. Antwoord altijd in het Nederlands. Je helpt met marketing strategie, content creatie, campagne planning, SEO, social media, en e-mail marketing. Geef praktische, actiegerichte adviezen. Gebruik markdown formatting voor duidelijke structuur.';

  /** Core send function that accepts an explicit system prompt override */
  const sendMessageWithPrompt = async (text: string, systemPrompt?: string) => {
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMessage]
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: history,
          system_prompt: systemPrompt || customSystemPrompt || DEFAULT_SYSTEM_PROMPT,
        },
      });

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: fnError ? 'AI is tijdelijk niet beschikbaar. Probeer het later opnieuw.' : (fnData?.response || fnData?.content || 'Sorry, ik kon geen antwoord genereren.'),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('[AICopilot] Error:', err);
      const fallbackMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: getFallbackResponse(text),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;
    await sendMessageWithPrompt(messageText);
  };

  const clearChat = () => {
    setMessages([]);
    setCustomSystemPrompt(null);
    contextProcessedRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (rendered.startsWith('• ') || rendered.startsWith('- ')) {
        return <p key={i} className="ml-2 text-[13px]" dangerouslySetInnerHTML={{ __html: rendered }} />;
      }
      if (rendered.startsWith('### ')) {
        return <p key={i} className="font-bold text-xs mt-2" dangerouslySetInnerHTML={{ __html: rendered.slice(4) }} />;
      }
      if (rendered.startsWith('## ')) {
        return <p key={i} className="font-bold text-sm mt-2" dangerouslySetInnerHTML={{ __html: rendered.slice(3) }} />;
      }
      if (rendered.trim() === '') return <br key={i} />;
      return <p key={i} className="text-[13px]" dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed right-0 top-0 bottom-0 z-40 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden"
          style={{ width: 320 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Copilot</h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Online
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              {hasMessages && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                  onClick={clearChat}
                  title="Chat wissen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                onClick={onClose}
                title="Sluiten"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!hasMessages ? (
              /* Welcome state */
              <div className="p-4 space-y-5">
                {/* Welcome */}
                <div className="flex flex-col items-center text-center pt-4 pb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Hallo! Ik ben uw AI Copilot
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
                    Ik help u met marketing strategie, content & inzichten
                  </p>
                </div>

                {/* Suggestions */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Suggesties</p>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((sug) => (
                      <button
                        key={sug.title}
                        onClick={() => sendMessage(sug.desc)}
                        className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                          <sug.icon className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white">{sug.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{sug.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 mt-0.5 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Snelle Acties</p>
                  <div className="space-y-1">
                    {QUICK_PROMPTS.map((qp) => (
                      <button
                        key={qp.label}
                        onClick={() => sendMessage(qp.prompt)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      >
                        <qp.icon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{qp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Chat messages */
              <div className="px-4 py-3 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2.5",
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed group relative",
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                      )}
                    >
                      <div className="space-y-0.5">{renderContent(msg.content)}</div>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => copyMessage(msg.id, msg.content)}
                          className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                        >
                          {copiedId === msg.id ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                          {copiedId === msg.id ? 'Gekopieerd' : 'Kopiëren'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl rounded-bl-sm px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Aan het nadenken...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Stel een vraag..."
                className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="h-9 w-9 p-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5 text-center">
              Inclufy AI Copilot &middot; Powered by gespecialiseerde agents
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// Fallback responses when API is not available
function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('campagne') || lower.includes('campaign')) {
    return `Hier zijn 3 campagne-ideeën:\n\n**1. Seizoensgebonden Promotie**\nMaak een tijdgebonden aanbieding gekoppeld aan het huidige seizoen. Gebruik urgentie ("nog 48 uur") om conversies te verhogen.\n\n**2. User-Generated Content Campagne**\nVraag klanten om hun ervaring te delen op social media met een specifieke hashtag. Beloon de beste inzendingen.\n\n**3. Educational Content Series**\nCreëer een serie van 5 waardevolle tips of tutorials in je vakgebied. Dit bouwt autoriteit en trekt organisch verkeer aan.\n\n💡 *Tip: Ga naar Campagnes → Campagne Beheer om direct te starten!*`;
  }

  if (lower.includes('email') || lower.includes('e-mail') || lower.includes('nieuwsbrief')) {
    return `Hier zijn tips voor een effectieve marketing e-mail:\n\n**Onderwerpregel**\n• Houd het kort (max 50 tekens)\n• Gebruik personalisatie\n• Creëer urgentie of nieuwsgierigheid\n\n**Inhoud**\n• Begin met de belangrijkste boodschap\n• Eén duidelijke call-to-action\n• Kort en scanbaar (gebruik bulletpoints)\n\n**Timing**\n• Beste dagen: dinsdag t/m donderdag\n• Beste tijden: 10:00 of 14:00\n\n📧 *Ga naar Campagnes → E-mail Marketing om een campagne te starten!*`;
  }

  if (lower.includes('seo') || lower.includes('zoekmotor') || lower.includes('google')) {
    return `Top 5 SEO tips voor betere rankings:\n\n**1. Keyword Research**\nGebruik tools als Google Keyword Planner om relevante zoekwoorden te vinden.\n\n**2. On-Page Optimalisatie**\n• Optimaliseer title tags en meta descriptions\n• Gebruik H1, H2, H3 headers logisch\n• Voeg alt-tekst toe aan afbeeldingen\n\n**3. Content Kwaliteit**\nSchrijf uitgebreide, waardevolle content (1500+ woorden).\n\n**4. Technische SEO**\n• Snelle laadtijden (<3 sec)\n• Mobile-first design\n\n**5. Linkbuilding**\nVerkrijg kwalitatieve backlinks via gastblogs en partnerships.`;
  }

  if (lower.includes('social') || lower.includes('instagram') || lower.includes('linkedin')) {
    return `Social media best practices:\n\n**Instagram**\n• Gebruik 3-5 relevante hashtags\n• Post consistente Reels\n• Stories voor dagelijkse engagement\n\n**LinkedIn**\n• Deel vakkennis en inzichten\n• Post op werkdagen tussen 8:00-10:00\n• Gebruik polls voor engagement\n\n**Algemene tips**\n• 80/20 regel: 80% waarde, 20% promotie\n• Reageer binnen 1 uur op comments`;
  }

  if (lower.includes('prestatie') || lower.includes('analyse') || lower.includes('campagne analyse')) {
    return `Om je campagne prestaties te analyseren:\n\n**Belangrijkste KPIs**\n• Open rate (e-mail): streef naar >20%\n• Click-through rate: streef naar >2.5%\n• Conversie ratio: afhankelijk van branche\n• ROI: (opbrengst - kosten) / kosten × 100\n\n**Tips**\n• Vergelijk met vorige periodes\n• A/B test je onderwerpsregels\n• Segmenteer je doelgroep\n\n📊 *Ga naar Analytics voor een volledig overzicht!*`;
  }

  if (lower.includes('content') || lower.includes('plan')) {
    return `Content planning tips:\n\n**Weekplanning**\n• Maandag: Blog/artikel publiceren\n• Dinsdag: E-mail nieuwsbrief\n• Woensdag: Social media focus\n• Donderdag: Video/visuele content\n• Vrijdag: Community engagement\n\n**Content Mix**\n• 40% educatief\n• 30% entertainment\n• 20% inspirerend\n• 10% promotioneel\n\n📝 *Gebruik de Content Studio om je planning te organiseren!*`;
  }

  return `Bedankt voor je vraag! Hier zijn een paar dingen waar ik je mee kan helpen:\n\n• **"Geef me campagne-ideeën"** — Creatieve marketing campagnes\n• **"Schrijf een e-mail"** — Professionele marketing e-mails\n• **"SEO tips"** — Zoekmachineoptimalisatie advies\n• **"Maak een social post"** — Social media content\n• **"Analyseer mijn strategie"** — Feedback op je aanpak\n\nProbeer een van deze suggesties! 🚀`;
}
