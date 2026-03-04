// src/pages/admin/AdminDemoRequests.tsx
// Demo verzoeken beheer

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquareText,
  RefreshCw,
  Loader2,
  Calendar,
  Mail,
  Building2,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  CalendarCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface DemoRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  status: string;
  notes: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'In afwachting', color: 'bg-amber-100 text-amber-700', icon: Clock },
  scheduled: { label: 'Ingepland', color: 'bg-blue-100 text-blue-700', icon: CalendarCheck },
  completed: { label: 'Voltooid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Geannuleerd', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminDemoRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      const res = await api.get('/tenant-admin/demo-requests', { params });
      setRequests(res.data || []);
    } catch {
      // Table may not exist
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await api.patch(`/tenant-admin/demo-requests/${requestId}`, { status: newStatus });
      toast({ title: 'Status bijgewerkt' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Bijwerken mislukt', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Demo Verzoeken</h1>
          <p className="text-sm text-gray-500">{requests.length} verzoeken</p>
        </div>
        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="pending">In afwachting</SelectItem>
              <SelectItem value="scheduled">Ingepland</SelectItem>
              <SelectItem value="completed">Voltooid</SelectItem>
              <SelectItem value="cancelled">Geannuleerd</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Vernieuwen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = requests.filter(r => r.status === key).length;
          return (
            <Card key={key} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(key)}>
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

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <MessageSquareText className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Geen demo verzoeken</p>
            <p className="text-sm">Er zijn nog geen demo verzoeken ontvangen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            return (
              <Card key={req.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {req.name || 'Onbekend'}
                        </h3>
                        <Badge className={`${statusConfig.color} border-0 text-xs`}>{statusConfig.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {req.email && (
                          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{req.email}</span>
                        )}
                        {req.company && (
                          <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{req.company}</span>
                        )}
                        {req.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{req.phone}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {req.created_at ? new Date(req.created_at).toLocaleDateString('nl-NL') : '-'}
                        </span>
                      </div>
                      {req.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{req.message}</p>
                      )}
                    </div>
                    <Select value={req.status} onValueChange={(val) => handleStatusChange(req.id, val)}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">In afwachting</SelectItem>
                        <SelectItem value="scheduled">Ingepland</SelectItem>
                        <SelectItem value="completed">Voltooid</SelectItem>
                        <SelectItem value="cancelled">Geannuleerd</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
