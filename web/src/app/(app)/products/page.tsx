'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product } from '@/types';

function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('go_products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });
}

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', price: '' });

  const create = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('go_products').insert({ ...form, price: form.price ? Number(form.price) : null, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setShowCreate(false); setForm({ name: '', description: '', category: '', price: '' }); toast.success('Product toegevoegd'); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const supabase = createClient(); await supabase.from('go_products').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product verwijderd'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Producten & Diensten</h1><p className="text-gray-500">{products?.length ?? 0} items</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> Toevoegen</button>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
      : products?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center"><Package className="mx-auto h-12 w-12 text-gray-300" /><p className="mt-4 text-gray-500">Nog geen producten</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products?.map(p => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                <button onClick={() => { if (confirm('Verwijderen?')) remove.mutate(p.id); }} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{p.description}</p>
              <div className="mt-3 flex items-center gap-2">
                {p.category && <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{p.category}</span>}
                {p.price && <span className="text-sm font-medium text-gray-700">{formatCurrency(p.price)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Nieuw Product</h2>
            <form onSubmit={e => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Product naam" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Beschrijving" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Categorie" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Prijs" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-50">Annuleren</button><button type="submit" className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Toevoegen</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
