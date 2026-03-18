'use client';

import { useState } from 'react';
import { useProposals, useProposalStats, useApproveProposal, useRejectProposal, useUpdateProposal } from '@/hooks/useProposals';
import { formatDate, statusColor, channelIcon } from '@/lib/utils';
import type { ProposalStatus, ContentProposal } from '@/types';
import { FileCheck, Check, X, Edit3, Send, Clock, Hash } from 'lucide-react';
import { toast } from 'sonner';

const TABS: { label: string; value: ProposalStatus | undefined }[] = [
  { label: 'Alle', value: undefined },
  { label: 'Wachtend', value: 'pending' },
  { label: 'Goedgekeurd', value: 'approved' },
  { label: 'Afgewezen', value: 'rejected' },
  { label: 'Gepubliceerd', value: 'published' },
];

export default function ProposalsPage() {
  const [tab, setTab] = useState<ProposalStatus | undefined>(undefined);
  const [editing, setEditing] = useState<ContentProposal | null>(null);
  const { data: proposals, isLoading } = useProposals(tab);
  const { data: stats } = useProposalStats();
  const approve = useApproveProposal();
  const reject = useRejectProposal();
  const update = useUpdateProposal();

  const handleApprove = async (id: string) => {
    await approve.mutateAsync(id);
    toast.success('Voorstel goedgekeurd!');
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reden voor afwijzing (optioneel):');
    await reject.mutateAsync({ id, reason: reason || undefined });
    toast.info('Voorstel afgewezen');
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    await update.mutateAsync({ id: editing.id, title: editing.title, content_text: editing.content_text, channel: editing.channel });
    toast.success('Voorstel bijgewerkt');
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Proposals</h1>
          <p className="text-gray-500">Beoordeel en beheer AI-gegenereerde content</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Totaal', value: stats?.total ?? 0, color: 'bg-gray-50 text-gray-700' },
          { label: 'Wachtend', value: stats?.pending ?? 0, color: 'bg-amber-50 text-amber-700' },
          { label: 'Goedgekeurd', value: stats?.approved ?? 0, color: 'bg-green-50 text-green-700' },
          { label: 'Afgewezen', value: stats?.rejected ?? 0, color: 'bg-red-50 text-red-700' },
          { label: 'Gepubliceerd', value: stats?.published ?? 0, color: 'bg-indigo-50 text-indigo-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-px">
        {TABS.map(t => (
          <button key={t.label} onClick={() => setTab(t.value)} className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.value ? 'bg-white border border-gray-200 border-b-white text-brand-700 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Proposals */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
      ) : proposals?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <FileCheck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Geen voorstellen gevonden</p>
          <p className="text-sm text-gray-400 mt-1">Genereer voorstellen vanuit de mobiele app</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {proposals?.map(p => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{channelIcon(p.channel)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                </div>
                {p.scheduled_for && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" /> {formatDate(p.scheduled_for)}
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">{p.content_text}</p>
              {p.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.hashtags.map((h, i) => (
                    <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">#{h}</span>
                  ))}
                </div>
              )}
              {p.rejection_reason && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Reden: {p.rejection_reason}</p>
              )}

              {/* Actions */}
              {p.status === 'pending' && (
                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                  <button onClick={() => handleApprove(p.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
                    <Check className="h-4 w-4" /> Goedkeuren
                  </button>
                  <button onClick={() => setEditing(p)} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                    <Edit3 className="h-4 w-4" /> Bewerken
                  </button>
                  <button onClick={() => handleReject(p.id)} className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors">
                    <X className="h-4 w-4" /> Afwijzen
                  </button>
                </div>
              )}
              {p.status === 'approved' && (
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors">
                    <Send className="h-4 w-4" /> Publiceren
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Voorstel Bewerken</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea value={editing.content_text} onChange={e => setEditing({ ...editing, content_text: e.target.value })} rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kanaal</label>
                <div className="flex gap-2">
                  {['linkedin', 'instagram', 'facebook', 'tiktok', 'x'].map(ch => (
                    <button key={ch} type="button" onClick={() => setEditing({ ...editing, channel: ch as any })} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${editing.channel === ch ? 'bg-brand-100 text-brand-700 border border-brand-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {channelIcon(ch)} {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditing(null)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuleren</button>
                <button onClick={handleSaveEdit} disabled={update.isPending} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">Opslaan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
