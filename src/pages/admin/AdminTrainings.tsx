// src/pages/admin/AdminTrainings.tsx
// Trainingen beheer

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  RefreshCw,
  Loader2,
  Plus,
  Calendar,
  Users,
  Video,
  BookOpen,
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Training {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  participants: number;
  scheduled_at: string;
  created_at: string;
}

export default function AdminTrainings() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenant-admin/trainings');
      setTrainings(res.data || []);
    } catch {
      // Table may not exist
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{nl ? 'Trainingen' : fr ? 'Formations' : 'Trainings'}</h1>
          <p className="text-sm text-gray-500">{trainings.length} {nl ? 'trainingen' : fr ? 'formations' : 'trainings'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" /> {nl ? 'Training Toevoegen' : fr ? 'Ajouter une formation' : 'Add Training'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : trainings.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <GraduationCap className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">{nl ? 'Geen trainingen' : fr ? 'Aucune formation' : 'No trainings'}</p>
            <p className="text-sm mb-4">{nl ? 'Plan een training voor je gebruikers' : fr ? 'Planifiez une formation pour vos utilisateurs' : 'Schedule a training for your users'}</p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" /> {nl ? 'Eerste Training Aanmaken' : fr ? 'Creer la premiere formation' : 'Create First Training'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainings.map((training) => (
            <Card key={training.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    {training.type === 'video' ? (
                      <Video className="h-5 w-5 text-purple-600" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{training.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{training.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{training.participants || 0} {nl ? 'deelnemers' : fr ? 'participants' : 'participants'}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{training.scheduled_at ? new Date(training.scheduled_at).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-GB') : '-'}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{training.status || (nl ? 'gepland' : fr ? 'planifie' : 'scheduled')}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
