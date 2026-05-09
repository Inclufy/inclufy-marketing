'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, Send, User, Sparkles, Loader2, Lightbulb, Target, FileText, BarChart3, MessageSquare, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { IssuesTab } from '@/components/copilot/IssuesTab';

type CopilotTab = 'chat' | 'issues';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { icon: Lightbulb, label: 'Content idee', prompt: 'Geef me 3 content ideeën voor LinkedIn deze week' },
  { icon: Target, label: 'Strategie tip', prompt: 'Wat zijn de beste marketingstrategieën voor een klein bedrijf?' },
  { icon: FileText, label: 'Post schrijven', prompt: 'Schrijf een professionele LinkedIn post over ons nieuwste product' },
  { icon: BarChart3, label: 'Analyse', prompt: 'Analyseer onze huidige marketing aanpak en geef verbeterpunten' },
];

export default function CopilotPage() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<CopilotTab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Call Supabase edge function for AI response
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/event-studio-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
            mode: 'copilot',
          }),
        }
      );

      let assistantContent = 'Sorry, er ging iets mis. Probeer het opnieuw.';
      if (response.ok) {
        const data = await response.json();
        assistantContent = data.content || data.message || data.reply || assistantContent;
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Kan geen verbinding maken met AMOS AI. Controleer je internetverbinding.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AMOS AI Copilot</h1>
            <p className="text-xs text-gray-500">Je persoonlijke marketing assistent</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-medium transition-all ${
            activeTab === 'chat'
              ? 'border-purple-500 bg-purple-50/50 text-purple-600'
              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-medium transition-all ${
            activeTab === 'issues'
              ? 'border-purple-500 bg-purple-50/50 text-purple-600'
              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Issues
        </button>
      </div>

      {activeTab === 'issues' ? (
        <div className="flex-1 overflow-hidden">
          <IssuesTab pathname={pathname || '/copilot'} isActive={activeTab === 'issues'} />
        </div>
      ) : (
      <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hoe kan ik je helpen?</h2>
            <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
              Vraag me om content te schrijven, strategie te bespreken, of marketing inzichten te geven.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-lg w-full">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:border-brand-300 hover:bg-brand-50/50 transition-all"
                >
                  <s.icon className="h-5 w-5 text-brand-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.label}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{s.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-brand-200' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl bg-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                    <span className="text-sm text-gray-500">AMOS denkt na...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stel een vraag aan AMOS AI..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              style={{ maxHeight: 120 }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
