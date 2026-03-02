import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Building2, Users, DollarSign, Target,
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, X, Calendar, MapPin
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface PostScanWizardProps {
  blueprintId: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface WizardData {
  company_name: string;
  industry: string;
  website_url: string;
  mission: string;
  founding_year: number | null;
  company_size: string;
  hq_location: string;
  employee_count: number | null;
  founders: Array<{
    name: string;
    role: string;
    bio: string;
  }>;
  target_age_range: string;
  target_job_title: string;
  target_company_size: string;
  target_location: string;
  pain_points: string[];
  monthly_budget: number;
  annual_budget: number;
  team_size: number;
  content_creators: number;
  goals: Array<{
    title: string;
    current: number;
    target: number;
    timeline: string;
    kpi: string;
  }>;
}

export function PostScanWizard({ blueprintId, onComplete, onSkip }: PostScanWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);

  const totalSteps = 4;

  useEffect(() => {
    loadBlueprintData();
  }, [blueprintId]);

  const loadBlueprintData = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`/api/growth-blueprint/${blueprintId}`);
      const data = response.data;
      const blueprint = data.blueprint;
      const statusQuo = data.status_quo;
      const aiAnalysis = statusQuo?.ai_analysis || {};
      const linkedinData = statusQuo?.linkedin_data || {};
      
      console.log('📊 Loaded data:', { aiAnalysis, linkedinData });
      
      // Extract ALL available data with fallbacks
      const foundingYear = linkedinData.founded_year || 
                          aiAnalysis.founding_year || 
                          statusQuo?.founding_year || 
                          null;
      
      const companySize = linkedinData.company_size || 
                         aiAnalysis.company_size || 
                         'Unknown';
      
      const hqLocation = linkedinData.hq_location || 
                        aiAnalysis.hq_location || 
                        '';
      
      const employeeCount = linkedinData.employee_count || 
                           aiAnalysis.employee_count || 
                           null;
      
      // Merge founders from all sources
      const foundersFromLinkedIn = linkedinData.founders || [];
      const foundersFromAI = aiAnalysis.founders || [];
      const allFounders = [...foundersFromLinkedIn, ...foundersFromAI];
      
      // Deduplicate by name
      const uniqueFounders = allFounders.filter((founder, index, self) =>
        index === self.findIndex(f => f.name === founder.name)
      );
      
      setWizardData({
        // Pre-filled from ALL sources (LinkedIn + AI + Google)
        company_name: blueprint.company_name,
        industry: linkedinData.industry || statusQuo?.industry || aiAnalysis.industry || 'Unknown',
        website_url: statusQuo?.website_url || blueprint.website_url || '',
        mission: aiAnalysis.value_proposition || linkedinData.description || '',
        founding_year: foundingYear,
        company_size: companySize,
        hq_location: hqLocation,
        employee_count: employeeCount,
        founders: uniqueFounders,
        
        // User input needed
        target_age_range: '25-44',
        target_job_title: aiAnalysis.target_audience || '',
        target_company_size: companySize,
        target_location: hqLocation || 'Netherlands',
        pain_points: statusQuo?.weaknesses || [],
        
        // Budget estimates based on company size
        monthly_budget: estimateMonthlyBudget(employeeCount),
        annual_budget: estimateMonthlyBudget(employeeCount) * 12,
        team_size: estimateTeamSize(employeeCount),
        content_creators: 1,
        
        // AI-generated goals
        goals: generateGoals(statusQuo),
      });
      
      toast.success('✅ Data loaded from scan!');
      
    } catch (error) {
      console.error('Failed to load blueprint:', error);
      toast.error('Failed to load scan data');
    } finally {
      setLoading(false);
    }
  };

  const estimateMonthlyBudget = (employeeCount: number | null): number => {
    if (!employeeCount) return 2500;
    if (employeeCount < 10) return 1500;
    if (employeeCount < 50) return 3000;
    if (employeeCount < 200) return 7500;
    return 15000;
  };

  const estimateTeamSize = (employeeCount: number | null): number => {
    if (!employeeCount) return 2;
    if (employeeCount < 10) return 1;
    if (employeeCount < 50) return 2;
    if (employeeCount < 200) return 5;
    return 10;
  };

  const generateGoals = (statusQuo: any) => {
    const goals = [];
    const scores = {
      seo: statusQuo?.seo_score || 0,
      content: statusQuo?.content_score || 0,
      social: statusQuo?.social_score || 0,
    };
    
    if (scores.seo < 70) {
      goals.push({
        title: 'Improve SEO Performance',
        current: scores.seo,
        target: 80,
        timeline: '6 months',
        kpi: 'Organic traffic +150%'
      });
    }
    
    if (scores.content < 70) {
      goals.push({
        title: 'Enhance Content Quality',
        current: scores.content,
        target: 85,
        timeline: '4 months',
        kpi: 'Engagement rate +50%'
      });
    }
    
    if (scores.social < 50) {
      goals.push({
        title: 'Build Social Presence',
        current: scores.social,
        target: 75,
        timeline: '3 months',
        kpi: '3+ platforms, 500+ followers each'
      });
    }
    
    return goals;
  };

  const updateData = (field: string, value: any) => {
    setWizardData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeWizard = async () => {
    try {
      setSaving(true);
      
      // Save all wizard data
      await axios.post('/api/marketing-setup/', {
        blueprint_id: blueprintId,
        ...wizardData
      });
      
      // Mark blueprint as setup completed
      await axios.patch(`/api/growth-blueprint/${blueprintId}`, {
        setup_completed: true
      });
      
      toast.success('✅ Setup complete! Data saved to your profile.');
      onComplete();
      
    } catch (error: any) {
      console.error('Failed to save setup:', error);
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !wizardData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Complete Your Setup</h2>
        <button onClick={onSkip} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {currentStep === 1 && <BrandStep data={wizardData} onChange={updateData} />}
          {currentStep === 2 && <AudienceStep data={wizardData} onChange={updateData} />}
          {currentStep === 3 && <BudgetStep data={wizardData} onChange={updateData} />}
          {currentStep === 4 && <GoalsStep data={wizardData} onChange={updateData} />}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        {currentStep < totalSteps ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={completeWizard}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Complete Setup'}
          </button>
        )}
      </div>
    </div>
  );
}

const BrandStep = ({ data, onChange }: any) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <Building2 className="w-6 h-6 text-purple-600" />
      <div>
        <h3 className="text-xl font-bold">Brand Information</h3>
        <p className="text-gray-600">Pre-filled from LinkedIn + AI analysis</p>
      </div>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
        <div>
          <p className="font-medium text-green-900">
            {data.founders?.length || 0} founders • Founded {data.founding_year || 'unknown'} • {data.employee_count || '?'} employees
          </p>
          <p className="text-sm text-green-700">Review and edit if needed</p>
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Company Name</label>
        <input
          type="text"
          value={data.company_name}
          onChange={(e) => onChange('company_name', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Industry</label>
        <input
          type="text"
          value={data.industry}
          onChange={(e) => onChange('industry', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Founded</label>
        <input
          type="number"
          value={data.founding_year || ''}
          onChange={(e) => onChange('founding_year', Number(e.target.value))}
          placeholder="e.g. 2020"
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">HQ Location</label>
        <input
          type="text"
          value={data.hq_location}
          onChange={(e) => onChange('hq_location', e.target.value)}
          placeholder="e.g. Amsterdam"
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Mission</label>
      <textarea
        value={data.mission}
        onChange={(e) => onChange('mission', e.target.value)}
        rows={3}
        className="w-full px-4 py-2 border rounded-lg"
      />
    </div>

    {data.founders?.length > 0 && (
      <div>
        <label className="block text-sm font-medium mb-2">Founders (Detected)</label>
        {data.founders.map((founder: any, i: number) => (
          <div key={i} className="p-3 bg-blue-50 rounded-lg mb-2">
            <p className="font-medium">{founder.name}</p>
            <p className="text-sm text-gray-600">{founder.role}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const AudienceStep = ({ data, onChange }: any) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <Users className="w-6 h-6 text-blue-600" />
      <div>
        <h3 className="text-xl font-bold">Target Audience</h3>
        <p className="text-gray-600">Define who you're marketing to</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Age Range</label>
        <select value={data.target_age_range} onChange={(e) => onChange('target_age_range', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
          <option value="18-24">18-24</option>
          <option value="25-44">25-44</option>
          <option value="45-54">45-54</option>
          <option value="55+">55+</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Job Title</label>
        <input type="text" value={data.target_job_title} onChange={(e) => onChange('target_job_title', e.target.value)} placeholder="e.g. Marketing Manager" className="w-full px-4 py-2 border rounded-lg" />
      </div>
    </div>
  </div>
);

const BudgetStep = ({ data, onChange }: any) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <DollarSign className="w-6 h-6 text-green-600" />
      <div>
        <h3 className="text-xl font-bold">Budget & Resources</h3>
        <p className="text-gray-600">Estimated based on company size</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Monthly Budget (€)</label>
        <input type="number" value={data.monthly_budget} onChange={(e) => onChange('monthly_budget', Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Team Size</label>
        <input type="number" value={data.team_size} onChange={(e) => onChange('team_size', Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg" />
      </div>
    </div>
  </div>
);

const GoalsStep = ({ data, onChange }: any) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <Target className="w-6 h-6 text-orange-600" />
      <div>
        <h3 className="text-xl font-bold">Goals & KPIs</h3>
        <p className="text-gray-600">AI-generated from your scan</p>
      </div>
    </div>

    <div className="space-y-4">
      {data.goals.map((goal: any, i: number) => (
        <div key={i} className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-2">{goal.title}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-600">Current</p><p className="text-2xl font-bold">{goal.current}</p></div>
            <div><p className="text-sm text-gray-600">Target</p><p className="text-2xl font-bold text-green-600">{goal.target}</p></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">KPI: {goal.kpi}</p>
        </div>
      ))}
    </div>
  </div>
);
