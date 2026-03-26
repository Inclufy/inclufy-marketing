'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Target, Save } from 'lucide-react';
import { toast } from 'sonner';
import { channelIcon } from '@/lib/utils';
import type { MarketingStrategy } from '@/types';

const CHANNELS = ['linkedin', 'instagram', 'facebook', 'tiktok', 'x'];
const DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

export default function StrategyPage() {
  const qc = useQueryClient();
  const { data: strategy, isLoading } = useQuery({
    queryKey: ['strategy'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('go_marketing_strategy').select('*').limit(1).maybeSingle();
      return data as MarketingStrategy | null;
    },
  });

  const [form, setForm] = useState({
    goals: '',
    budget_monthly: '',
    posts_per_week: '3',
    posting_days: ['ma', 'wo', 'vr'] as string[],
    autonomy_level: 'balanced' as 'conservative' | 'balanced' | 'aggressive',
    activeChannels: ['linkedin'] as string[],
  });

  useEffect(() => {
    if (strategy) {
      setForm({
        goals: strategy.goals?.join(', ') || '',
        budget_monthly: strategy.budget_monthly?.toString() || '',
        posts_per_week: strategy.posts_per_week?.toString() || '3',
        posting_days: strategy.posting_days || ['ma', 'wo', 'vr'],
        autonomy_level: strategy.autonomy_level || 'balanced',
        activeChannels: Object.entries(strategy.channels || {}).filter(([, v]: any) => v.active).map(([k]) => k),
      });
    }
  }, [strategy]);

  const save = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const channels: Record<string, { active: boolean; priority: number }> = {};
      form.activeChannels.forEach((ch, i) => { channels[ch] = { active: true, priority: i + 1 }; });

      const payload = {
        goals: form.goals.split(',').map(g => g.trim()).filter(Boolean),
        budget_monthly: form.budget_monthly ? Number(form.budget_monthly) : null,
        posts_per_week: Number(form.posts_per_week),
        posting_days: form.posting_days,
        autonomy_level: form.autonomy_level,
        channels,
        content_mix: { educational: 30, promotional: 20, behind_scenes: 20, thought_leadership: 20, user_generated: 10 },
      };

      if (strategy) {
        await supabase.from('go_marketing_strategy').update(payload).eq('id', strategy.id);
      } else {
        await supabase.from('go_marketing_strategy').insert({ ...payload, user_id: user!.id });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['strategy'] }); toast.success('Strategie opgeslagen'); },
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Marketing Strategie</h1><p className="text-gray-500">Configureer je marketing aanpak</p></div>

      <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Doelen</h2>
          <input value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} placeholder="Brand awareness, lead generatie, ..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />

          <h2 className="font-semibold text-gray-900 pt-2">Maandelijks Budget</h2>
          <input type="number" value={form.budget_monthly} onChange={e => setForm({ ...form, budget_monthly: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Kanalen</h2>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(ch => (
              <button key={ch} type="button" onClick={() => setForm(f => ({ ...f, activeChannels: f.activeChannels.includes(ch) ? f.activeChannels.filter(c => c !== ch) : [...f.activeChannels, ch] }))} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${form.activeChannels.includes(ch) ? 'bg-brand-100 text-brand-700 border border-brand-300' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                {channelIcon(ch)} {ch}
              </button>
            ))}
          </div>

          <h2 className="font-semibold text-gray-900 pt-2">Posts per week</h2>
          <input type="range" min="1" max="14" value={form.posts_per_week} onChange={e => setForm({ ...form, posts_per_week: e.target.value })} className="w-full" />
          <p className="text-sm text-gray-600 text-center">{form.posts_per_week} posts / week</p>

          <h2 className="font-semibold text-gray-900 pt-2">Posting dagen</h2>
          <div className="flex gap-2">
            {DAYS.map(d => (
              <button key={d} type="button" onClick={() => setForm(f => ({ ...f, posting_days: f.posting_days.includes(d) ? f.posting_days.filter(x => x !== d) : [...f.posting_days, d] }))} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${form.posting_days.includes(d) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Autonomie Niveau</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'conservative', label: 'Conservatief', desc: 'Handmatige goedkeuring voor alles' },
              { value: 'balanced', label: 'Gebalanceerd', desc: 'AI stelt voor, jij keurt goed' },
              { value: 'aggressive', label: 'Agressief', desc: 'AI publiceert automatisch na vertrouwen' },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => setForm({ ...form, autonomy_level: opt.value as any })} className={`rounded-xl border-2 p-4 text-left transition-colors ${form.autonomy_level === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={save.isPending} className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          <Save className="h-4 w-4" /> {save.isPending ? 'Opslaan...' : 'Strategie Opslaan'}
        </button>
      </form>
    </div>
  );
}
