// src/pages/admin/AdminRegistrations.tsx
// Registraties / trial signups beheer

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  RefreshCw,
  Loader2,
  Calendar,
  Mail,
  Globe,
  CheckCircle,
  Clock,
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Registration {
  id: string;
  email: string;
  full_name: string;
  type: string;
  status: string;
  source: string;
  created_at: string;
}

export default function AdminRegistrations() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenant-admin/registrations');
      setRegistrations(res.data || []);
    } catch {
      // May not exist
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const trialCount = registrations.filter(r => r.type === 'trial').length;
  const directCount = registrations.filter(r => r.source === 'direct').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{nl ? 'Registraties' : fr ? 'Inscriptions' : 'Registrations'}</h1>
          <p className="text-sm text-gray-500">{registrations.length} {nl ? 'registraties' : fr ? 'inscriptions' : 'registrations'} | {trialCount} trials</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{registrations.length}</p>
              <p className="text-xs text-gray-500">{nl ? 'Totaal' : fr ? 'Total' : 'Total'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{trialCount}</p>
              <p className="text-xs text-gray-500">Trial</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{directCount}</p>
              <p className="text-xs text-gray-500">Direct</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <UserPlus className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">{nl ? 'Geen registraties' : fr ? 'Aucune inscription' : 'No registrations'}</p>
              <p className="text-sm">{nl ? 'Er zijn nog geen registraties ontvangen' : fr ? 'Aucune inscription n\'a encore ete recue' : 'No registrations have been received yet'}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{nl ? 'Gebruiker' : fr ? 'Utilisateur' : 'User'}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{nl ? 'Bron' : fr ? 'Source' : 'Source'}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{nl ? 'Datum' : fr ? 'Date' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {(reg.full_name || reg.email || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{reg.full_name || reg.email?.split('@')[0]}</p>
                          <p className="text-xs text-gray-500">{reg.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">{reg.type || 'trial'}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`text-xs border-0 ${reg.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {reg.status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{reg.source || 'direct'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {reg.created_at ? new Date(reg.created_at).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-GB') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
