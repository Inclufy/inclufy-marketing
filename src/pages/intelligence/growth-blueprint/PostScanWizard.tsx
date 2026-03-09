// src/components/intelligence/PostScanWizard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Building2,
  Users,
  DollarSign,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '@/contexts/LanguageContext';
import { brandMemoryService } from '@/services/brand/brand-memory.service';

interface PostScanWizardProps {
  blueprintId: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface WizardData {
  // From Blueprint
  company_name: string;
  industry: string;
  website_url: string;
  mission: string;
  brand_colors: string[];
  
  // User Input Needed
  target_age_range: string;
  target_job_title: string;
  target_company_size: string;
  target_location: string;
  pain_points: string[];
  
  monthly_budget: number;
  annual_budget: number;
  team_size: number;
  content_creators: number;
  current_tools: string[];
  
  goals: Array<{
    title: string;
    current: number;
    target: number;
    timeline: string;
    kpi: string;
  }>;
}

export const PostScanWizard: React.FC<PostScanWizardProps> = ({
  blueprintId,
  onComplete,
  onSkip
}) => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
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

      // Fetch brand memory as fallback data source
      let brandMemory: any = null;
      try {
        brandMemory = await brandMemoryService.getOrCreateActive();
      } catch (e) {
        console.debug('Could not load brand memory for PostScanWizard fallback:', e);
      }

      // Fetch blueprint data
      const response = await axios.get(`/api/growth-blueprint/${blueprintId}`);
      const blueprint = response.data;

      // Pre-fill wizard with blueprint data + brand memory fallback
      const aiAnalysis = blueprint.status_quo?.ai_analysis || {};

      setWizardData({
        // Pre-filled from scan + Brand Memory fallback
        company_name: blueprint.blueprint.company_name || brandMemory?.brand_name || '',
        industry: blueprint.status_quo?.industry || (brandMemory?.industries?.length ? brandMemory.industries[0] : '') || 'Unknown',
        website_url: blueprint.status_quo?.website_url || (brandMemory?.urls?.length ? brandMemory.urls[0] : '') || '',
        mission: aiAnalysis.value_proposition || brandMemory?.mission || '',
        brand_colors: [brandMemory?.primary_color || '#6B46C1', brandMemory?.secondary_color || '#EC4899'],

        // Empty - needs user input
        target_age_range: '',
        target_job_title: '',
        target_company_size: '',
        target_location: 'Netherlands',
        pain_points: blueprint.status_quo?.weaknesses || [],

        monthly_budget: 0,
        annual_budget: 0,
        team_size: 0,
        content_creators: 0,
        current_tools: [],

        // AI-generated goals from weaknesses
        goals: generateGoalsFromWeaknesses(blueprint.status_quo),
      });

    } catch (error) {
      console.error('Failed to load blueprint:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateGoalsFromWeaknesses = (statusQuo: any) => {
    const weaknesses = statusQuo?.weaknesses || [];
    const scores = {
      seo: statusQuo?.seo_score || 0,
      content: statusQuo?.content_score || 0,
      social: statusQuo?.social_score || 0,
    };
    
    const goals = [];
    
    if (scores.seo < 70) {
      goals.push({
        title: 'Improve SEO Performance',
        current: scores.seo,
        target: 80,
        timeline: '6 months',
        kpi: 'Organic traffic increase by 150%'
      });
    }
    
    if (scores.content < 70) {
      goals.push({
        title: 'Enhance Content Quality',
        current: scores.content,
        target: 85,
        timeline: '4 months',
        kpi: 'Content engagement rate +50%'
      });
    }
    
    if (scores.social < 50) {
      goals.push({
        title: 'Build Social Media Presence',
        current: scores.social,
        target: 75,
        timeline: '3 months',
        kpi: 'Active on 3+ platforms with 500+ followers each'
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
      
      // Save to marketing setup
      await axios.post('/api/marketing-setup', {
        blueprint_id: blueprintId,
        ...wizardData
      });
      
      onComplete();
      
    } catch (error) {
      console.error('Failed to save setup:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!wizardData) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            {nl ? `Stap ${currentStep} van ${totalSteps}` : fr ? `Etape ${currentStep} sur ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
          </span>
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {nl ? 'Later doen' : fr ? 'Passer pour le moment' : 'Skip for now'}
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <BrandStep
              data={wizardData}
              onChange={updateData}
            />
          )}
          
          {currentStep === 2 && (
            <AudienceStep
              data={wizardData}
              onChange={updateData}
            />
          )}
          
          {currentStep === 3 && (
            <BudgetStep
              data={wizardData}
              onChange={updateData}
            />
          )}
          
          {currentStep === 4 && (
            <GoalsStep
              data={wizardData}
              onChange={updateData}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          {nl ? 'Terug' : fr ? 'Retour' : 'Back'}
        </button>

        {currentStep < totalSteps ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            {nl ? 'Volgende' : fr ? 'Suivant' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={completeWizard}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {nl ? 'Opslaan...' : fr ? 'Enregistrement...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {nl ? 'Setup Voltooien' : fr ? 'Terminer la configuration' : 'Complete Setup'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Step 1: Brand Information
const BrandStep: React.FC<any> = ({ data, onChange }) => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-purple-100 rounded-lg">
        <Building2 className="w-6 h-6 text-purple-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{nl ? 'Merkinformatie' : fr ? 'Informations de marque' : 'Brand Information'}</h2>
        <p className="text-gray-600">{nl ? 'Automatisch ingevuld vanuit je website scan' : fr ? 'Rempli automatiquement depuis votre scan de site web' : 'Auto-filled from your website scan'}</p>
      </div>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
      <div>
        <p className="font-medium text-green-900">{nl ? 'Data geimporteerd vanuit scan' : fr ? 'Donnees importees depuis le scan' : 'Data imported from scan'}</p>
        <p className="text-sm text-green-700">{nl ? 'Controleer en pas aan indien nodig' : fr ? 'Verifiez et modifiez si necessaire' : 'Review and edit if needed'}</p>
      </div>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Bedrijfsnaam' : fr ? 'Nom de l\'entreprise' : 'Company Name'}
        </label>
        <input
          type="text"
          value={data.company_name}
          onChange={(e) => onChange('company_name', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Branche' : fr ? 'Secteur' : 'Industry'}
        </label>
        <input
          type="text"
          value={data.industry}
          onChange={(e) => onChange('industry', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Website URL' : fr ? 'URL du site web' : 'Website URL'}
        </label>
        <input
          type="url"
          value={data.website_url}
          onChange={(e) => onChange('website_url', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Missie' : fr ? 'Declaration de mission' : 'Mission Statement'}
        </label>
        <textarea
          value={data.mission}
          onChange={(e) => onChange('mission', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
    </div>
  </div>
  );
};

// Step 2: Target Audience
const AudienceStep: React.FC<any> = ({ data, onChange }) => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-blue-100 rounded-lg">
        <Users className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{nl ? 'Doelgroep' : fr ? 'Public cible' : 'Target Audience'}</h2>
        <p className="text-gray-600">{nl ? 'Definieer naar wie je marketing richt' : fr ? 'Definissez votre cible marketing' : 'Define who you\'re marketing to'}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Leeftijdsbereik' : fr ? 'Tranche d\'age' : 'Age Range'}
        </label>
        <select
          value={data.target_age_range}
          onChange={(e) => onChange('target_age_range', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">{nl ? 'Selecteer bereik' : fr ? 'Selectionnez' : 'Select range'}</option>
          <option value="18-24">18-24</option>
          <option value="25-34">25-34</option>
          <option value="35-44">35-44</option>
          <option value="45-54">45-54</option>
          <option value="55+">55+</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Functietitel' : fr ? 'Titre du poste' : 'Job Title'}
        </label>
        <input
          type="text"
          value={data.target_job_title}
          onChange={(e) => onChange('target_job_title', e.target.value)}
          placeholder={nl ? 'bijv. Marketing Manager' : fr ? 'p.ex. Responsable Marketing' : 'e.g. Marketing Manager'}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Bedrijfsgrootte' : fr ? 'Taille de l\'entreprise' : 'Company Size'}
        </label>
        <select
          value={data.target_company_size}
          onChange={(e) => onChange('target_company_size', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">{nl ? 'Selecteer grootte' : fr ? 'Selectionnez la taille' : 'Select size'}</option>
          <option value="1-10">{nl ? '1-10 medewerkers' : fr ? '1-10 employes' : '1-10 employees'}</option>
          <option value="11-50">{nl ? '11-50 medewerkers' : fr ? '11-50 employes' : '11-50 employees'}</option>
          <option value="51-200">{nl ? '51-200 medewerkers' : fr ? '51-200 employes' : '51-200 employees'}</option>
          <option value="201-500">{nl ? '201-500 medewerkers' : fr ? '201-500 employes' : '201-500 employees'}</option>
          <option value="500+">{nl ? '500+ medewerkers' : fr ? '500+ employes' : '500+ employees'}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Locatie' : fr ? 'Localisation' : 'Location'}
        </label>
        <input
          type="text"
          value={data.target_location}
          onChange={(e) => onChange('target_location', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {nl ? 'Pijnpunten (vanuit scan)' : fr ? 'Points de douleur (du scan)' : 'Pain Points (from scan)'}
      </label>
      <div className="space-y-2">
        {data.pain_points.map((pain: string, index: number) => (
          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">{pain}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

// Step 3: Budget & Resources
const BudgetStep: React.FC<any> = ({ data, onChange }) => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-green-100 rounded-lg">
        <DollarSign className="w-6 h-6 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{nl ? 'Budget & Middelen' : fr ? 'Budget & Ressources' : 'Budget & Resources'}</h2>
        <p className="text-gray-600">{nl ? 'Definieer je marketingcapaciteit' : fr ? 'Definissez votre capacite marketing' : 'Define your marketing capacity'}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Maandelijks Budget (€)' : fr ? 'Budget mensuel (€)' : 'Monthly Budget (€)'}
        </label>
        <input
          type="number"
          value={data.monthly_budget}
          onChange={(e) => onChange('monthly_budget', Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Jaarlijks Budget (€)' : fr ? 'Budget annuel (€)' : 'Annual Budget (€)'}
        </label>
        <input
          type="number"
          value={data.annual_budget}
          onChange={(e) => onChange('annual_budget', Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Marketingteam Grootte' : fr ? 'Taille de l\'equipe marketing' : 'Marketing Team Size'}
        </label>
        <input
          type="number"
          value={data.team_size}
          onChange={(e) => onChange('team_size', Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nl ? 'Content Creators' : fr ? 'Createurs de contenu' : 'Content Creators'}
        </label>
        <input
          type="number"
          value={data.content_creators}
          onChange={(e) => onChange('content_creators', Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </div>
  </div>
  );
};

// Step 4: Goals & KPIs
const GoalsStep: React.FC<any> = ({ data, onChange }) => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  return (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-orange-100 rounded-lg">
        <Target className="w-6 h-6 text-orange-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{nl ? 'Doelen & KPI\'s' : fr ? 'Objectifs & KPI' : 'Goals & KPIs'}</h2>
        <p className="text-gray-600">{nl ? 'AI-suggesties op basis van je scan' : fr ? 'Suggestions IA basees sur votre scan' : 'AI-suggested based on your scan'}</p>
      </div>
    </div>

    <div className="space-y-4">
      {data.goals.map((goal: any, index: number) => (
        <div key={index} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{goal.title}</h3>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
              {goal.timeline}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-gray-600">{nl ? 'Huidig' : fr ? 'Actuel' : 'Current'}</p>
              <p className="text-2xl font-bold text-gray-900">{goal.current}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{nl ? 'Doel' : fr ? 'Objectif' : 'Target'}</p>
              <p className="text-2xl font-bold text-green-600">{goal.target}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>KPI: {goal.kpi}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};
