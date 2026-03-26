'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { useState } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TeamMember } from '@/types';

function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('go_team_directory').select('*').order('created_at', { ascending: false });
      return (data || []) as TeamMember[];
    },
  });
}

export default function TeamPage() {
  const { data: members, isLoading } = useTeam();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', expertise: '' });

  const create = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('go_team_directory').insert({ name: form.name, role: form.role, expertise: form.expertise.split(',').map(e => e.trim()).filter(Boolean), user_id: user!.id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); setShowCreate(false); setForm({ name: '', role: '', expertise: '' }); toast.success('Teamlid toegevoegd'); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const supabase = createClient(); await supabase.from('go_team_directory').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Team Directory</h1><p className="text-gray-500">{members?.length ?? 0} teamleden</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> Toevoegen</button>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
      : members?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center"><Users className="mx-auto h-12 w-12 text-gray-300" /><p className="mt-4 text-gray-500">Nog geen teamleden</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members?.map(m => (
            <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">{m.name.charAt(0)}</div>
                  <div><h3 className="font-semibold text-gray-900">{m.name}</h3><p className="text-sm text-gray-500">{m.role}</p></div>
                </div>
                <button onClick={() => { if (confirm('Verwijderen?')) remove.mutate(m.id); }} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              {m.expertise?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">{m.expertise.map((e, i) => <span key={i} className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-600">{e}</span>)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Nieuw Teamlid</h2>
            <form onSubmit={e => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Naam" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Rol / Functie" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              <input value={form.expertise} onChange={e => setForm({ ...form, expertise: e.target.value })} placeholder="Expertise (komma-gescheiden)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              <div className="flex gap-3"><button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-50">Annuleren</button><button type="submit" className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Toevoegen</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
