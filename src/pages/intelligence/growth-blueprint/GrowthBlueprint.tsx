// src/pages/growth-blueprint/GrowthBlueprint.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BarChart3, History, CheckCircle2, TrendingUp, Award, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import ScanForm from './components/ScanForm';
import ResultsView from './components/ResultsView';
import HistoryList from './components/HistoryList';

export default function GrowthBlueprint() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [activeTab, setActiveTab] = useState('new-scan');
  const [currentBlueprint, setCurrentBlueprint] = useState<any>(null);
  const [stats, setStats] = useState({ scans_this_month: 0, avg_score: 0, setups_completed: 0, opportunities: 0 });

  useEffect(() => {
    loadStats();
    loadLatestBlueprint();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, count } = await supabase.from('strategic_plans').select('*', { count: 'exact' }).eq('user_id', user.id);
      const plans = data || [];
      setStats({
        scans_this_month: count || 0,
        avg_score: plans.length > 0 ? 75 : 0,
        setups_completed: plans.filter((p: any) => p.status === 'completed').length,
        opportunities: plans.length * 3,
      });
    } catch (error) {
      console.warn('Failed to load stats:', error);
    }
  };

  /** Auto-load the most recent completed scan so Resultaten tab isn't empty */
  const loadLatestBlueprint = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: plans } = await supabase.from('strategic_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
      const blueprints = plans || [];
      const latest = blueprints.find((bp: any) => bp.status === 'completed') || blueprints[0];
      if (!latest) return;
      setCurrentBlueprint(latest);
      setActiveTab('results');
    } catch (error) {
      console.debug('Could not auto-load latest blueprint:', error);
    }
  };

  const handleScanComplete = (blueprint: any) => {
    setCurrentBlueprint(blueprint);
    setActiveTab('results');
    loadStats();
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Inclufy Growth Blueprint™</h1>
              <p className="text-purple-100 text-lg">{nl ? 'AI-gedreven bedrijfsanalyse • Inzichten in 60 seconden' : fr ? 'Analyse commerciale par IA • Insights en 60 secondes' : 'AI-powered business analysis • Get insights in 60 seconds'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /><span>{nl ? 'Website Analyse' : fr ? 'Analyse du site web' : 'Website Analysis'}</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /><span>{nl ? 'SEO Audit' : fr ? 'Audit SEO' : 'SEO Audit'}</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /><span>{nl ? 'Contentkwaliteit' : fr ? 'Qualite du contenu' : 'Content Quality'}</span></div>
          </div>
        </div>
      </div>
      <div className="w-full py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="new-scan" className="flex items-center gap-2"><Sparkles className="w-4 h-4" />{nl ? 'Nieuwe Scan' : fr ? 'Nouveau Scan' : 'New Scan'}</TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />{nl ? 'Resultaten' : fr ? 'Resultats' : 'Results'}</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2"><History className="w-4 h-4" />{nl ? 'Eerdere Scans' : fr ? 'Scans precedents' : 'Past Scans'}</TabsTrigger>
          </TabsList>
          <TabsContent value="new-scan"><ScanForm onScanComplete={handleScanComplete} /></TabsContent>
          <TabsContent value="results"><ResultsView blueprint={currentBlueprint} /></TabsContent>
          <TabsContent value="history"><HistoryList onSelectBlueprint={(bp: any) => { setCurrentBlueprint(bp); setActiveTab('results'); }} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
