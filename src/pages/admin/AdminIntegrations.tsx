// src/pages/admin/AdminIntegrations.tsx
// Integraties overzicht en beheer

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Puzzle,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink,
  Brain,
  Sparkles,
  CreditCard,
  Database,
  Mail,
  BarChart3,
  Users,
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  configured: boolean;
  status: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  brain: Brain,
  sparkles: Sparkles,
  'credit-card': CreditCard,
  database: Database,
  mail: Mail,
  'bar-chart': BarChart3,
  users: Users,
};

export default function AdminIntegrations() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const CATEGORY_LABELS: Record<string, string> = {
    ai: 'Artificial Intelligence',
    payment: nl ? 'Betalingen' : fr ? 'Paiements' : 'Payments',
    infrastructure: nl ? 'Infrastructuur' : fr ? 'Infrastructure' : 'Infrastructure',
    communication: nl ? 'Communicatie' : fr ? 'Communication' : 'Communication',
    analytics: 'Analytics',
    marketing: 'Marketing',
    crm: 'CRM',
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenant-admin/integrations');
      setIntegrations(res.data || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeCount = integrations.filter(i => i.configured).length;

  // Group by category
  const grouped = integrations.reduce((acc, int) => {
    const cat = int.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(int);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{nl ? 'Integraties' : fr ? 'Integrations' : 'Integrations'}</h1>
          <p className="text-sm text-gray-500">
            {activeCount} {nl ? 'van' : fr ? 'sur' : 'of'} {integrations.length} {nl ? 'actief' : fr ? 'actives' : 'active'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((integration) => {
                const IconComponent = ICON_MAP[integration.icon] || Puzzle;
                return (
                  <Card key={integration.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          integration.configured
                            ? 'bg-purple-50 dark:bg-purple-900/20'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <IconComponent className={`h-6 w-6 ${
                            integration.configured ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{integration.name}</h3>
                            {integration.configured ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1">
                                <CheckCircle className="h-3 w-3" /> {nl ? 'Actief' : fr ? 'Actif' : 'Active'}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 border-0 text-xs gap-1">
                                <XCircle className="h-3 w-3" /> {nl ? 'Inactief' : fr ? 'Inactif' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{integration.description}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
