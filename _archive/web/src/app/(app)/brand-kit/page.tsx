'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { useState } from 'react';
import { Palette, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { BrandKit } from '@/types';

function useBrandKits() {
  return useQuery({
    queryKey: ['brand-kits'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('brand_kits').select('*').order('is_default', { ascending: false });
      return (data || []) as BrandKit[];
    },
  });
}

export default function BrandKitPage() {
  const { data: kits, isLoading } = useBrandKits();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', primary_color: '#6366F1', secondary_color: '#8B5CF6', font_family: 'Inter', tagline: '' });

  const create = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('brand_kits').insert({ ...form, user_id: user!.id, is_default: (kits?.length ?? 0) === 0 });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brand-kits'] }); setShowCreate(false); toast.success('Brand Kit aangemaakt'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Brand Kits</h1><p className="text-gray-500">Beheer je merk identiteit</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> Nieuw</button>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
      : kits?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center"><Palette className="mx-auto h-12 w-12 text-gray-300" /><p className="mt-4 text-gray-500">Nog geen brand kits</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kits?.map(kit => (
            <div key={kit.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{kit.name}</h3>
                {kit.is_default && <span className="flex items-center gap-1 text-xs text-amber-600"><Star className="h-3 w-3 fill-amber-400" /> Default</span>}
              </div>
              <div className="flex gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg border border-gray-200" style={{ backgroundColor: kit.primary_color }} />
                  <span className="text-xs text-gray-500">{kit.primary_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg border border-gray-200" style={{ backgroundColor: kit.secondary_color }} />
                  <span className="text-xs text-gray-500">{kit.secondary_color}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{kit.font_family}</p>
              {kit.tagline && <p className="text-xs text-gray-400 mt-1 italic">{kit.tagline}</p>}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Nieuwe Brand Kit</h2>
            <form onSubmit={e => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Naam" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Primaire kleur</label><input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-full rounded-lg border cursor-pointer" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Secundaire kleur</label><input type="color" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} className="h-10 w-full rounded-lg border cursor-pointer" /></div>
              </div>
              <input value={form.font_family} onChange={e => setForm({ ...form, font_family: e.target.value })} placeholder="Font (bijv. Inter)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              <input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline (optioneel)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              <div className="flex gap-3"><button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-50">Annuleren</button><button type="submit" className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Aanmaken</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
