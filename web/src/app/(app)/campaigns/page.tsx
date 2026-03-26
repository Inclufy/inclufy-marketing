'use client';

import { useState } from 'react';
import { useCampaigns, useCampaignStats, useCreateCampaign } from '@/hooks/useCampaigns';
import { formatDate, formatCurrency, statusColor, channelIcon } from '@/lib/utils';
import { Megaphone, Plus, TrendingUp, Wallet, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const STATUS_FILTERS = ['all', 'draft', 'active', 'paused', 'completed'] as const;

export default function CampaignsPage() {
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'multi-channel', channels: [] as string[], budget_amount: '' });
  const { data: campaigns, isLoading } = useCampaigns(filter);
  const { data: stats } = useCampaignStats();
  const createCampaign = useCreateCampaign();
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCampaign.mutateAsync({
        ...form,
        channels: form.channels as any,
        status: 'draft',
        budget_amount: form.budget_amount ? Number(form.budget_amount) : null,
      });
      toast.success('Campaign aangemaakt!');
      setShowCreate(false);
      setForm({ name: '', description: '', type: 'multi-channel', channels: [], budget_amount: '' });
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500">{stats?.total ?? 0} campaigns · {stats?.active ?? 0} actief</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors">
          <Plus className="h-4 w-4" /> Nieuwe Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-lg font-bold">{stats?.active ?? 0}</p><p className="text-xs text-gray-500">Actief</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><Wallet className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-lg font-bold">{formatCurrency(stats?.totalBudget ?? 0)}</p><p className="text-xs text-gray-500">Budget</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-lg font-bold">{formatCurrency(stats?.totalSpent ?? 0)}</p><p className="text-xs text-gray-500">Besteed</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s === 'all' ? 'Alle' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Campaigns Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
      ) : campaigns?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Nog geen campaigns</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kanalen</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Datum</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns?.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/campaigns/${c.id}`)}>
                  <td className="px-6 py-4"><p className="font-medium text-gray-900 text-sm">{c.name}</p><p className="text-xs text-gray-500 truncate max-w-xs">{c.description}</p></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.type}</td>
                  <td className="px-6 py-4 text-sm">{c.channels?.map(channelIcon).join(' ')}</td>
                  <td className="px-6 py-4 text-sm font-medium">{c.budget_amount ? formatCurrency(c.budget_amount) : '—'}</td>
                  <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>{c.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(c.created_at)}</td>
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nieuwe Campaign</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="multi-channel">Multi-channel</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input type="number" value={form.budget_amount} onChange={e => setForm({ ...form, budget_amount: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kanalen</label>
                <div className="flex flex-wrap gap-2">
                  {['linkedin', 'instagram', 'facebook', 'tiktok', 'x'].map(ch => (
                    <button key={ch} type="button" onClick={() => setForm(f => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }))} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${form.channels.includes(ch) ? 'bg-brand-100 text-brand-700 border border-brand-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {channelIcon(ch)} {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuleren</button>
                <button type="submit" disabled={createCampaign.isPending} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">{createCampaign.isPending ? 'Aanmaken...' : 'Campaign Aanmaken'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
