'use client';

import { useCampaignStats } from '@/hooks/useCampaigns';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export default function BudgetPage() {
  const { data: stats } = useCampaignStats();
  const remaining = (stats?.totalBudget ?? 0) - (stats?.totalSpent ?? 0);
  const pct = stats?.totalBudget ? Math.round(((stats?.totalSpent ?? 0) / stats.totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Budget Monitor</h1><p className="text-gray-500">Overzicht van je marketing uitgaven</p></div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><Wallet className="h-5 w-5 text-blue-600" /></div><span className="text-sm text-gray-500">Totaal Budget</span></div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalBudget ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center"><TrendingDown className="h-5 w-5 text-red-600" /></div><span className="text-sm text-gray-500">Besteed</span></div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalSpent ?? 0)}</p>
          <div className="mt-2 h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-red-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
          <p className="text-xs text-gray-500 mt-1">{pct}% van budget</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-600" /></div><span className="text-sm text-gray-500">Resterend</span></div>
          <p className={`text-3xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(remaining)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Budget per Campaign</h2>
        <p className="text-sm text-gray-400">Gedetailleerd overzicht komt binnenkort beschikbaar. Bekijk individuele campaigns voor kosten en inkomsten.</p>
      </div>
    </div>
  );
}
