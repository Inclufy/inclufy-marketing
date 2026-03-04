import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BarChart3, History, CheckCircle2, TrendingUp, Award, Target, Zap } from 'lucide-react';
import axios from 'axios';
import ScanForm from './components/ScanForm';
import ResultsView from './components/ResultsView';
import HistoryList from './components/HistoryList';

interface Stats {
  scans_this_month: number;
  avg_score: number;
  setups_completed: number;
  opportunities: number;
}

export default function GrowthBlueprint() {
  const [activeTab, setActiveTab] = useState('new-scan');
  const [currentBlueprint, setCurrentBlueprint] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    scans_this_month: 0,
    avg_score: 0,
    setups_completed: 0,
    opportunities: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

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
    <div className="w-full">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Inclufy Growth Blueprint™</h1>
              <p className="text-purple-100 text-lg">
                AI-powered business analysis • Get insights in 60 seconds
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Website Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>SEO Audit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Content Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Social Media Check</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Growth Recommendations</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 rounded-xl mt-4">
        <div className="px-6 py-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
              label="Scans This Month"
              value={stats.scans_this_month}
              trend="+3 from last month"
              trendUp={true}
            />
            <StatCard
              icon={<Award className="w-5 h-5 text-purple-600" />}
              label="Average Score"
              value={stats.avg_score}
              trend="+8 points"
              trendUp={true}
            />
            <StatCard
              icon={<Target className="w-5 h-5 text-green-600" />}
              label="Setups Completed"
              value={stats.setups_completed}
              trend="67% completion"
              trendUp={true}
            />
            <StatCard
              icon={<Zap className="w-5 h-5 text-orange-600" />}
              label="Quick Wins"
              value={stats.opportunities}
              trend="Opportunities found"
              trendUp={true}
            />
          </div>
        </div>
      </div>

      <div className="py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="new-scan" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              New Scan
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Past Scans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-scan">
            <ScanForm onScanComplete={handleScanComplete} />
          </TabsContent>

          <TabsContent value="results">
            <ResultsView blueprint={currentBlueprint} />
          </TabsContent>

          <TabsContent value="history">
            <HistoryList onSelectBlueprint={(bp: any) => {
              setCurrentBlueprint(bp);
              setActiveTab('results');
            }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend: string;
  trendUp: boolean;
}

function StatCard({ icon, label, value, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-gray-100 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <p className={`text-xs ${trendUp ? 'text-green-600' : 'text-gray-600'}`}>
        {trend}
      </p>
    </div>
  );
}
