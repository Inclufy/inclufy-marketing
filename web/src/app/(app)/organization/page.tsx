'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Building2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Organization } from '@/types';

const supabase = createClient();

export default function OrganizationPage() {
  const qc = useQueryClient();
  const { data: org, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data } = await supabase.from('go_organization').select('*').limit(1).maybeSingle();
      return data as Organization | null;
    },
  });

  const [form, setForm] = useState({ name: '', description: '', pitch: '', boilerplate: '', industry: '', website: '' });

  useEffect(() => {
    if (org) setForm({ name: org.name || '', description: org.description || '', pitch: org.pitch || '', boilerplate: org.boilerplate || '', industry: org.industry || '', website: org.website || '' });
  }, [org]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (org) {
        await supabase.from('go_organization').update(form).eq('id', org.id);
      } else {
        await supabase.from('go_organization').insert({ ...form, user_id: user!.id });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization'] }); toast.success('Organisatie opgeslagen'); },
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Organisatie</h1><p className="text-gray-500">Bedrijfsinformatie voor AI content generatie</p></div>

      <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industrie</label>
            <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Elevator Pitch</label>
          <textarea value={form.pitch} onChange={e => setForm({ ...form, pitch: e.target.value })} rows={2} placeholder="Korte pitch voor AI content" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boilerplate</label>
          <textarea value={form.boilerplate} onChange={e => setForm({ ...form, boilerplate: e.target.value })} rows={3} placeholder="Standaard bedrijfstekst voor persberichten" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <button type="submit" disabled={save.isPending} className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          <Save className="h-4 w-4" /> {save.isPending ? 'Opslaan...' : 'Opslaan'}
        </button>
      </form>
    </div>
  );
}
