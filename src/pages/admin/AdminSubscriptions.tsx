// src/pages/admin/AdminSubscriptions.tsx
// Abonnementen beheer

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  RefreshCw,
  Loader2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Subscription {
  id: string;
  organization_id: string;
  plan: string;
  status: string;
  amount: number;
  interval: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  active: { label: 'Actief', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  canceled: { label: 'Geannuleerd', icon: XCircle, color: 'bg-red-100 text-red-700' },
  past_due: { label: 'Achterstallig', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
  trialing: { label: 'Trial', icon: Clock, color: 'bg-blue-100 text-blue-700' },
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  free: 'Gratis',
};

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenant-admin/subscriptions');
      setSubscriptions(res.data || []);
    } catch {
      // Table may not exist
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalMRR = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.interval === 'month' ? s.amount : s.amount / 12), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Abonnementen</h1>
          <p className="text-sm text-gray-500">{subscriptions.length} abonnementen | MRR: &euro;{totalMRR.toFixed(2)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Vernieuwen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['active', 'trialing', 'past_due', 'canceled'].map((status) => {
          const count = subscriptions.filter(s => s.status === status).length;
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
          return (
            <Card key={status} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <config.icon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <CreditCard className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Geen abonnementen</p>
              <p className="text-sm">Er zijn nog geen abonnementen geregistreerd</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Bedrag</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Interval</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Aangemaakt</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const statusConfig = STATUS_CONFIG[sub.status] || STATUS_CONFIG.active;
                  return (
                    <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="py-3 px-4 font-medium">{PLAN_LABELS[sub.plan] || sub.plan}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${statusConfig.color} border-0 text-xs`}>{statusConfig.label}</Badge>
                      </td>
                      <td className="py-3 px-4">&euro;{sub.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{sub.interval === 'year' ? 'Jaarlijks' : 'Maandelijks'}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {sub.created_at ? new Date(sub.created_at).toLocaleDateString('nl-NL') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
