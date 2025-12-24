// src/pages/LuxeDashboard.tsx
// Showcase of the Luxe Design System applied to Inclufy Marketing

import { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Bell,
  Plus,
  ChevronRight,
  Star,
  Zap,
  Target,
  Brain,
  Palette,
  Globe,
  ArrowRight,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const LuxeDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  const stats = [
    {
      title: 'Total Revenue',
      value: '$127,543',
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Active Campaigns',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: Activity,
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Total Contacts',
      value: '12,847',
      change: '+18%',
      trend: 'up',
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Conversion Rate',
      value: '3.24%',
      change: '+0.8%',
      trend: 'up',
      icon: Target,
      gradient: 'from-orange-500 to-red-600'
    }
  ];

  const campaigns = [
    { name: 'Summer Sale 2024', status: 'active', performance: 87, revenue: '$45,230' },
    { name: 'Product Launch', status: 'scheduled', performance: 0, revenue: '-' },
    { name: 'Newsletter May', status: 'completed', performance: 92, revenue: '$12,450' },
  ];

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-pink-950">
      {/* Premium Navigation */}
      <nav className="luxe-nav px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <motion.h1 
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-6 h-6 text-purple-600" />
              Inclufy
            </motion.h1>
            <div className="hidden md:flex gap-1">
              <a href="#" className="luxe-nav-item luxe-nav-item-active">Dashboard</a>
              <a href="#" className="luxe-nav-item">Campaigns</a>
              <a href="#" className="luxe-nav-item">Journeys</a>
              <a href="#" className="luxe-nav-item">Analytics</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="luxe-button luxe-button-glass relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </button>
            <button className="luxe-button luxe-button-premium">
              <Zap className="w-4 h-4" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 backdrop-blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <motion.div {...fadeIn} className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="luxe-heading">Welcome back, Sami</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Your marketing campaigns are performing 
              <span className="text-green-600 font-semibold"> 23% better </span>
              than last month
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="luxe-card luxe-glass p-6 backdrop-blur-xl border border-white/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
                {stat.value}
              </p>
              <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full bg-gradient-to-r ${stat.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Campaigns Section */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="luxe-card luxe-glass backdrop-blur-xl border border-white/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold luxe-heading">Active Campaigns</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Monitor your campaign performance</p>
                </div>
                <button className="luxe-button luxe-button-primary">
                  <Plus className="w-4 h-4" />
                  New Campaign
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaigns.map((campaign, index) => (
                  <motion.div 
                    key={campaign.name}
                    className="p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-500/50 transition-all"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                            campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Revenue</p>
                        <p className="font-semibold">{campaign.revenue}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Performance</span>
                        <span className="font-medium">{campaign.performance}%</span>
                      </div>
                      <Progress value={campaign.performance} className="h-2" />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Features Section */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Premium Feature Card */}
            <Card className="luxe-card bg-gradient-to-br from-purple-600 to-pink-600 text-white border-0 overflow-hidden relative">
              <div className="absolute inset-0 bg-black/20" />
              <CardHeader className="relative z-10">
                <div className="luxe-badge luxe-badge-premium mb-3">
                  PREMIUM FEATURE
                </div>
                <h3 className="text-2xl font-semibold mb-2">AI Content Studio</h3>
                <p className="text-purple-100">
                  Generate compelling content with our advanced AI engine
                </p>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Credits Used</span>
                    <span>2,450 / 5,000</span>
                  </div>
                  <Progress value={49} className="h-2 bg-purple-800" />
                </div>
                <button className="w-full luxe-button bg-white text-purple-600 hover:bg-purple-50">
                  <Brain className="w-4 h-4" />
                  Generate Content
                </button>
              </CardContent>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            </Card>

            {/* Quick Actions */}
            <Card className="luxe-card luxe-glass backdrop-blur-xl border border-white/20">
              <CardHeader>
                <h3 className="text-xl font-semibold luxe-heading">Quick Actions</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Palette, label: 'Brand Kit', color: 'from-blue-500 to-cyan-500' },
                  { icon: Globe, label: 'Social Scheduler', color: 'from-green-500 to-emerald-500' },
                  { icon: Layers, label: 'Journey Builder', color: 'from-orange-500 to-amber-500' },
                ].map((action, index) => (
                  <motion.button
                    key={action.label}
                    className="w-full p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-500/50 transition-all flex items-center justify-between group"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{action.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LuxeDashboard;