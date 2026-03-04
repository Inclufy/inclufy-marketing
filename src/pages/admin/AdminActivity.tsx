// src/pages/admin/AdminActivity.tsx
// Platform activiteitslog

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  RefreshCw,
  Loader2,
  Megaphone,
  UserPlus,
  FileText,
  Mail,
  Clock,
} from 'lucide-react';
import api from '@/lib/api';

interface ActivityItem {
  type: string;
  description: string;
  status: string;
  timestamp: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  campaign: Megaphone,
  registration: UserPlus,
  content: FileText,
  email: Mail,
};

const TYPE_COLORS: Record<string, string> = {
  campaign: 'bg-blue-100 text-blue-600',
  registration: 'bg-emerald-100 text-emerald-600',
  content: 'bg-purple-100 text-purple-600',
  email: 'bg-amber-100 text-amber-600',
};

export default function AdminActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenant-admin/dashboard/activity?limit=50');
      setActivities(res.data || []);
    } catch {
      // May not exist
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activiteit</h1>
          <p className="text-sm text-gray-500">Recente platform activiteit</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Vernieuwen
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Activity className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Geen activiteit</p>
              <p className="text-sm">Er is nog geen activiteit geregistreerd</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {activities.map((item, i) => {
                const Icon = TYPE_ICONS[item.type] || Activity;
                const colorClass = TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600';
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">{item.description}</p>
                      {item.status && (
                        <Badge variant="outline" className="mt-1 text-[10px]">{item.status}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {item.timestamp ? new Date(item.timestamp).toLocaleString('nl-NL', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      }) : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
