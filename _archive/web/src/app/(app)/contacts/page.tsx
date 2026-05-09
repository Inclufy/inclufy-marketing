'use client';

import { useState } from 'react';
import { useContacts, useCreateContact, useDeleteContact, useContactStats } from '@/hooks/useContacts';
import { formatDate } from '@/lib/utils';
import { Users, Plus, Search, Mail, Phone, Building2, Trash2, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: 'manual', notes: '' });
  const { data: contacts, isLoading } = useContacts(search);
  const { data: stats } = useContactStats();
  const create = useCreateContact();
  const remove = useDeleteContact();

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Naam is verplicht');
    await create.mutateAsync(form);
    toast.success('Contact aangemaakt');
    setForm({ name: '', email: '', phone: '', company: '', source: 'manual', notes: '' });
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit contact wilt verwijderen?')) return;
    await remove.mutateAsync(id);
    toast.success('Contact verwijderd');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacten & CRM</h1>
          <p className="text-gray-500">Beheer je leads en contactpersonen</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nieuw Contact
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-lg font-bold">{stats?.total ?? 0}</p><p className="text-xs text-gray-500">Totaal</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><UserPlus className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-lg font-bold">{stats?.thisMonth ?? 0}</p><p className="text-xs text-gray-500">Deze maand</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center"><Mail className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-lg font-bold">{stats?.withEmail ?? 0}</p><p className="text-xs text-gray-500">Met e-mail</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-lg font-bold">{stats?.withCompany ?? 0}</p><p className="text-xs text-gray-500">Met bedrijf</p></div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op naam, e-mail of bedrijf..."
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Contacts Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
      ) : contacts?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">{search ? 'Geen resultaten gevonden' : 'Nog geen contacten'}</p>
          <p className="text-sm text-gray-400 mt-1">Voeg je eerste contact toe om te beginnen</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Naam</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">E-mail</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Telefoon</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Bedrijf</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Bron</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Datum</th>
                <th className="px-5 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contacts?.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{c.email || '-'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 hidden md:table-cell">{c.phone || '-'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 hidden lg:table-cell">{c.company || '-'}</td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{c.source}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 hidden xl:table-cell">{formatDate(c.created_at)}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(c.id)} className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nieuw Contact</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijf</label>
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuleren</button>
                <button onClick={handleCreate} disabled={create.isPending} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">Aanmaken</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
