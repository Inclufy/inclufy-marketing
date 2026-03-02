// src/pages/growth-blueprint/GrowthBlueprint.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BarChart3, History, CheckCircle2, TrendingUp, Award, Target, Zap } from 'lucide-react';
import axios from 'axios';
import ScanForm from './components/ScanForm';
import ResultsView from './components/ResultsView';
import HistoryList from './components/HistoryList';

export default function GrowthBlueprint() {
  const [activeTab, setActiveTab] = useState('new-scan');
  const [currentBlueprint, setCurrentBlueprint] = useState<any>(null);
  const [stats, setStats] = useState({ scans_this_month: 0, avg_score: 0, setups_completed: 0, opportunities: 0 });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/growth-blueprint/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleScanComplete = (blueprint: any) => {
    setCurrentBlueprint(blueprint);
    setActiveTab('results');
    loadStats();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Inclufy Growth Blueprint™</h1>
              <p className="text-purple-100 text-lg">AI-powered business analysis • Get insights in 60 seconds</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /><span>Website Analysis</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /><span>SEO Audit</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /><span>Content Quality</span></div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="new-scan" className="flex items-center gap-2"><Sparkles className="w-4 h-4" />New Scan</TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />Results</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2"><History className="w-4 h-4" />Past Scans</TabsTrigger>
          </TabsList>
          <TabsContent value="new-scan"><ScanForm onScanComplete={handleScanComplete} /></TabsContent>
          <TabsContent value="results"><ResultsView blueprint={currentBlueprint} /></TabsContent>
          <TabsContent value="history"><HistoryList onSelectBlueprint={(bp: any) => { setCurrentBlueprint(bp); setActiveTab('results'); }} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
