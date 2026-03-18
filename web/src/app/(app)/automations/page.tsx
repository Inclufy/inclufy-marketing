'use client';

import { useAutomations, useToggleAutomation, useAutomationStats } from '@/hooks/useAutomations';
import { Zap, Play, Pause, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationsPage() {
  const { data: automations, isLoading } = useAutomations();
  const { data: stats } = useAutomationStats();
  const toggle = useToggleAutomation();

  const handleToggle = async (id: string, current: boolean) => {
    await toggle.mutateAsync({ id, is_active: !current });
    toast.success(!current ? 'Automation geactiveerd' : 'Automation gepauzeerd');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing Automations</h1>
        <p className="text-gray-500">Beheer je geautomatiseerde workflows</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center"><Zap className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-lg font-bold">{stats?.total ?? 0}</p><p className="text-xs text-gray-500">Totaal</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><Play className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-lg font-bold">{stats?.active ?? 0}</p><p className="text-xs text-gray-500">Actief</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><Activity className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-lg font-bold">{stats?.totalRuns ?? 0}</p><p className="text-xs text-gray-500">Uitvoeringen</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-lg font-bold">{stats?.successRate ?? 0}%</p><p className="text-xs text-gray-500">Succes rate</p></div>
        </div>
      </div>

      {/* Automations List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
      ) : automations?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Zap className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Nog geen automations</p>
          <p className="text-sm text-gray-400 mt-1">Maak automations aan in de mobiele app</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations?.map(a => (
            <div key={a.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: a.color + '20' }}>
                {a.icon || '⚡'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{a.name}</h3>
                <p className="text-sm text-gray-500">{a.description}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  <span>Trigger: {a.trigger_type}</span>
                  <span>·</span>
                  <span>{(a.stats as any)?.runs ?? 0} runs</span>
                  <span>·</span>
                  <span>Mode: {a.autopilot_mode}</span>
                </div>
              </div>
              <button
                onClick={() => handleToggle(a.id, a.is_active)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${a.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {a.is_active ? (
                  <span className="flex items-center gap-1.5"><Play className="h-3.5 w-3.5" /> Actief</span>
                ) : (
                  <span className="flex items-center gap-1.5"><Pause className="h-3.5 w-3.5" /> Gepauzeerd</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
