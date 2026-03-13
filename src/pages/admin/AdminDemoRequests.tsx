// src/pages/admin/AdminDemoRequests.tsx
// Demo verzoeken beheer + Demo Environment Manager

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
  Heart,
  HardHat,
  Cloud,
  Factory,
  Sparkles,
  Trash2,
  ArrowRightLeft,
  Play,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { demoAgentService } from '@/services/demo-agent/demo-agent.service';
import type { IndustryType, SeedProgress } from '@/services/demo-agent/types';

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

export default function AdminDemoRequests() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: nl ? 'In afwachting' : fr ? 'En attente' : 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    scheduled: { label: nl ? 'Ingepland' : fr ? 'Planifie' : 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: CalendarCheck },
    completed: { label: nl ? 'Voltooid' : fr ? 'Termine' : 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { label: nl ? 'Geannuleerd' : fr ? 'Annule' : 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      let query = supabase.from('demo_requests').select('*').order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setRequests(data || []);
    } catch {
      // Table may not exist
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const { error: updateError } = await supabase.from('demo_requests').update({ status: newStatus }).eq('id', requestId);
      if (updateError) throw updateError;
      toast({ title: nl ? 'Status bijgewerkt' : fr ? 'Statut mis a jour' : 'Status updated' });
      fetchData();
    } catch (err: any) {
      toast({ title: nl ? 'Bijwerken mislukt' : fr ? 'Echec de la mise a jour' : 'Update failed', variant: 'destructive' });
    }
  };

  // ── Demo Environment Manager state ──────────────────────────────
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [activeIndustry, setActiveIndustry] = useState<IndustryType | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoProgress, setDemoProgress] = useState<SeedProgress | null>(null);

  const industries = demoAgentService.getAvailableIndustries();
  const INDUSTRY_ICONS: Record<string, React.ElementType> = { Heart, HardHat, Cloud, Building2, Factory };

  useEffect(() => {
    demoAgentService.getActiveIndustry().then(setActiveIndustry);
  }, []);

  const handleGenerateDemo = async () => {
    if (!selectedIndustry) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: 'Not authenticated', variant: 'destructive' }); return; }
    setDemoLoading(true);
    setDemoProgress(null);
    try {
      const hasData = await demoAgentService.hasDemoData(user.id);
      if (hasData) {
        await demoAgentService.switchIndustry(user.id, selectedIndustry, (p) => setDemoProgress(p));
      } else {
        await demoAgentService.seedIndustryDemo(user.id, selectedIndustry, (p) => setDemoProgress(p));
      }
      setActiveIndustry(selectedIndustry);
      toast({ title: nl ? 'Demo omgeving gegenereerd!' : fr ? 'Environnement demo genere !' : 'Demo environment generated!', description: `Industry: ${selectedIndustry}` });
    } catch (err: any) {
      toast({ title: nl ? 'Genereren mislukt' : fr ? 'Echec de la generation' : 'Generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setDemoLoading(false);
      setDemoProgress(null);
    }
  };

  const handleResetDemo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setDemoLoading(true);
    try {
      await demoAgentService.resetDemo(user.id, (p) => setDemoProgress(p));
      setActiveIndustry(null);
      setSelectedIndustry(null);
      toast({ title: nl ? 'Demo data gewist' : fr ? 'Donnees demo effacees' : 'Demo data cleared' });
    } catch (err: any) {
      toast({ title: 'Reset failed', description: err.message, variant: 'destructive' });
    } finally {
      setDemoLoading(false);
      setDemoProgress(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Demo Environment Manager ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              {nl ? 'Demo Omgeving' : fr ? 'Environnement Demo' : 'Demo Environment'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {nl ? 'Genereer industrie-specifieke demo data voor prospects' : fr ? 'Generez des donnees demo specifiques a l\'industrie' : 'Generate industry-specific demo data for prospect presentations'}
            </p>
          </div>
          {activeIndustry && (
            <Badge className="bg-purple-100 text-purple-700 border-0 text-sm px-3 py-1">
              {nl ? 'Actief' : fr ? 'Actif' : 'Active'}: {industries.find(i => i.id === activeIndustry)?.name}
            </Badge>
          )}
        </div>

        {/* Industry selector cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {industries.map((ind) => {
            const Icon = INDUSTRY_ICONS[ind.icon] || Building2;
            const isSelected = selectedIndustry === ind.id;
            const isActive = activeIndustry === ind.id;
            return (
              <Card
                key={ind.id}
                className={`border-2 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-purple-500 shadow-md ring-2 ring-purple-200' : 'border-transparent shadow-sm'} ${isActive ? 'bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900' : ''}`}
                onClick={() => setSelectedIndustry(ind.id)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: ind.color + '20' }}>
                    <Icon className="h-5 w-5" style={{ color: ind.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{ind.name}</span>
                  {isActive && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">{nl ? 'Actief' : 'Active'}</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleGenerateDemo}
            disabled={!selectedIndustry || demoLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {demoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : activeIndustry ? <ArrowRightLeft className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {demoLoading
              ? (demoProgress ? `${demoProgress.step} (${demoProgress.current}/${demoProgress.total})` : (nl ? 'Genereren...' : 'Generating...'))
              : activeIndustry
                ? (nl ? 'Wissel Industrie' : fr ? 'Changer d\'industrie' : 'Switch Industry')
                : (nl ? 'Genereer Demo' : fr ? 'Generer Demo' : 'Generate Demo')}
          </Button>

          {activeIndustry && (
            <Button variant="outline" onClick={handleResetDemo} disabled={demoLoading} className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              {nl ? 'Reset Demo' : fr ? 'Reinitialiser' : 'Reset Demo'}
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {demoProgress && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{demoProgress.step}</span>
              <span className="font-medium">{demoProgress.current}/{demoProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 rounded-full h-2 transition-all duration-300" style={{ width: `${(demoProgress.current / demoProgress.total) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Demo Requests Section ─────────────────────────────────── */}
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{nl ? 'Demo Verzoeken' : fr ? 'Demandes de demo' : 'Demo Requests'}</h1>
          <p className="text-sm text-gray-500">{requests.length} {nl ? 'verzoeken' : fr ? 'demandes' : 'requests'}</p>
        </div>
        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{nl ? 'Alle' : fr ? 'Tous' : 'All'}</SelectItem>
              <SelectItem value="pending">{nl ? 'In afwachting' : fr ? 'En attente' : 'Pending'}</SelectItem>
              <SelectItem value="scheduled">{nl ? 'Ingepland' : fr ? 'Planifie' : 'Scheduled'}</SelectItem>
              <SelectItem value="completed">{nl ? 'Voltooid' : fr ? 'Termine' : 'Completed'}</SelectItem>
              <SelectItem value="cancelled">{nl ? 'Geannuleerd' : fr ? 'Annule' : 'Cancelled'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
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
            <p className="text-lg font-medium">{nl ? 'Geen demo verzoeken' : fr ? 'Aucune demande de demo' : 'No demo requests'}</p>
            <p className="text-sm">{nl ? 'Er zijn nog geen demo verzoeken ontvangen' : fr ? 'Aucune demande de demo n\'a encore ete recue' : 'No demo requests have been received yet'}</p>
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
                          {req.name || (nl ? 'Onbekend' : fr ? 'Inconnu' : 'Unknown')}
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
                          {req.created_at ? new Date(req.created_at).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-GB') : '-'}
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
                        <SelectItem value="pending">{nl ? 'In afwachting' : fr ? 'En attente' : 'Pending'}</SelectItem>
                        <SelectItem value="scheduled">{nl ? 'Ingepland' : fr ? 'Planifie' : 'Scheduled'}</SelectItem>
                        <SelectItem value="completed">{nl ? 'Voltooid' : fr ? 'Termine' : 'Completed'}</SelectItem>
                        <SelectItem value="cancelled">{nl ? 'Geannuleerd' : fr ? 'Annule' : 'Cancelled'}</SelectItem>
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
    </div>
  );
}
