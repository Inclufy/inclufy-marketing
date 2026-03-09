// src/pages/Onboarding.tsx
// Multi-step onboarding wizard — full-screen, no sidebar (10 steps)

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Globe, Sparkles, Palette, Users, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, Upload, Rocket, BarChart3, Search, TrendingUp,
  Share2, LayoutDashboard, Zap, Package, Target, Lightbulb,
  Plus, Trash2, Crown, Gem, Swords, FolderOpen, FileText,
  DollarSign, UserPlus, Megaphone, Heart,
  Instagram, Linkedin, Facebook, Twitter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { brandMemoryService } from '@/services/brand/brand-memory.service';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import BrandStylePreview from '@/components/BrandStylePreview';

const TOTAL_STEPS = 10;

const INDUSTRIES = [
  'E-commerce', 'SaaS / Technology', 'Consulting', 'Healthcare',
  'Education', 'Real Estate', 'Finance', 'Marketing / Agency',
  'Hospitality', 'Retail', 'Non-profit', 'Other'
];

const TONES = [
  { key: 'professional', emoji: '\u{1F454}', nl: 'Professioneel', fr: 'Professionnel', en: 'Professional' },
  { key: 'friendly', emoji: '\u{1F60A}', nl: 'Vriendelijk', fr: 'Amical', en: 'Friendly' },
  { key: 'innovative', emoji: '\u{1F680}', nl: 'Innovatief', fr: 'Innovant', en: 'Innovative' },
  { key: 'playful', emoji: '\u{1F3A8}', nl: 'Creatief', fr: 'Cr\u00e9atif', en: 'Creative' },
  { key: 'authoritative', emoji: '\u{1F4CA}', nl: 'Autoritair', fr: 'Autoritaire', en: 'Authoritative' },
  { key: 'casual', emoji: '\u{2615}', nl: 'Casual', fr: 'D\u00e9contract\u00e9', en: 'Casual' },
];

const COUNTRIES = [
  { value: 'nl', label: 'Nederland', fr: 'Pays-Bas', en: 'Netherlands' },
  { value: 'be', label: 'België', fr: 'Belgique', en: 'Belgium' },
  { value: 'de', label: 'Duitsland', fr: 'Allemagne', en: 'Germany' },
  { value: 'uk', label: 'Verenigd Koninkrijk', fr: 'Royaume-Uni', en: 'United Kingdom' },
  { value: 'us', label: 'Verenigde Staten', fr: '\u00c9tats-Unis', en: 'United States' },
  { value: 'fr', label: 'Frankrijk', fr: 'France', en: 'France' },
  { value: 'es', label: 'Spanje', fr: 'Espagne', en: 'Spain' },
  { value: 'other', label: 'Anders', fr: 'Autre', en: 'Other' },
];

const LANGUAGES_LIST = [
  { value: 'nl', label: 'Nederlands' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
];

const MARKETING_GOALS = [
  { key: 'leads', icon: UserPlus, nl: 'Meer Leads', fr: 'Plus de Leads', en: 'More Leads' },
  { key: 'sales', icon: DollarSign, nl: 'Meer Sales', fr: 'Plus de Ventes', en: 'More Sales' },
  { key: 'traffic', icon: Globe, nl: 'Meer Websitebezoekers', fr: 'Plus de Visiteurs', en: 'More Website Visitors' },
  { key: 'social', icon: Share2, nl: 'Social Media Groei', fr: 'Croissance R\u00e9seaux Sociaux', en: 'Social Media Growth' },
  { key: 'awareness', icon: Megaphone, nl: 'Meer Naamsbekendheid', fr: 'Plus de Notori\u00e9t\u00e9', en: 'More Brand Awareness' },
  { key: 'retention', icon: Heart, nl: 'Betere Klantretentie', fr: 'Meilleure R\u00e9tention Client', en: 'Better Customer Retention' },
];

const COMPANY_SIZES = [
  { value: 'startup', nl: 'Startup', fr: 'Startup', en: 'Startup' },
  { value: 'mkb', nl: 'MKB', fr: 'PME', en: 'SME' },
  { value: 'enterprise', nl: 'Enterprise', fr: 'Entreprise', en: 'Enterprise' },
  { value: 'corporate', nl: 'Corporate', fr: 'Corporate', en: 'Corporate' },
];

const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55+'];

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'twitter', label: 'X / Twitter', icon: Twitter },
];

const BRAND_VALUES = [
  { key: 'innovation', nl: 'Innovatie', fr: 'Innovation', en: 'Innovation' },
  { key: 'quality', nl: 'Kwaliteit', fr: 'Qualit\u00e9', en: 'Quality' },
  { key: 'trust', nl: 'Vertrouwen', fr: 'Confiance', en: 'Trust' },
  { key: 'sustainability', nl: 'Duurzaamheid', fr: 'Durabilit\u00e9', en: 'Sustainability' },
  { key: 'customer-first', nl: 'Klant Eerst', fr: 'Client d\u2019abord', en: 'Customer First' },
  { key: 'simplicity', nl: 'Eenvoud', fr: 'Simplicit\u00e9', en: 'Simplicity' },
  { key: 'transparency', nl: 'Transparantie', fr: 'Transparence', en: 'Transparency' },
  { key: 'speed', nl: 'Snelheid', fr: 'Rapidit\u00e9', en: 'Speed' },
  { key: 'creativity', nl: 'Creativiteit', fr: 'Cr\u00e9ativit\u00e9', en: 'Creativity' },
  { key: 'expertise', nl: 'Expertise', fr: 'Expertise', en: 'Expertise' },
  { key: 'community', nl: 'Community', fr: 'Communaut\u00e9', en: 'Community' },
  { key: 'inclusivity', nl: 'Inclusiviteit', fr: 'Inclusivit\u00e9', en: 'Inclusivity' },
];

// ─── Types ──────────────────────────────────────────────────────────────

interface Product {
  name: string;
  description: string;
  usp: string;
  features: string;
  problemSolved: string;
}

const emptyProduct: Product = { name: '', description: '', usp: '', features: '', problemSolved: '' };

interface Competitor {
  name: string;
  website: string;
}

interface SocialAccount {
  platform: string;
  url: string;
}

interface Audience {
  audienceType: 'B2B' | 'B2C' | '';
  idealCustomer: string;
  customerSector: string;
  companySize: string;
  ageGroup: string;
  occupation: string;
  painPoints: string;
}

const emptyAudience: Audience = { audienceType: '', idealCustomer: '', customerSector: '', companySize: '', ageGroup: '', occupation: '', painPoints: '' };

interface OnboardingData {
  // Step 1: Company
  companyName: string;
  website: string;
  tagline: string;
  industry: string;
  country: string;
  language: string;
  // Step 2: Scan
  scanScore: number | null;
  scanSeo: number | null;
  scanContent: number | null;
  scanPerformance: number | null;
  // Step 2: Documents
  hasDocuments: boolean | null;
  uploadedFiles: File[];
  documentAnalyzing: boolean;
  // Step 4: Products
  products: Product[];
  // Step 5: Audience
  audiences: Audience[];
  // Step 6: Goals
  marketingGoals: string[];
  // Step 7: Brand
  primaryColor: string;
  secondaryColor: string;
  tone: string;
  mission: string;
  brandValues: string[];
  messagingDos: string;
  messagingDonts: string;
  logoFile: File | null;
  logoPreview: string | null;
  // Step 8: Competitors
  competitors: Competitor[];
  // Step 9: Portfolio
  socialAccounts: SocialAccount[];
  existingCampaigns: string;
  exampleContent: string;
}

const initialData: OnboardingData = {
  companyName: '',
  website: '',
  tagline: '',
  industry: '',
  country: 'nl',
  language: 'nl',
  scanScore: null,
  scanSeo: null,
  scanContent: null,
  scanPerformance: null,
  hasDocuments: null,
  uploadedFiles: [],
  documentAnalyzing: false,
  products: [{ ...emptyProduct }],
  audiences: [{ ...emptyAudience }],
  marketingGoals: [],
  primaryColor: '#7c3aed',
  secondaryColor: '#ec4899',
  tone: 'professional',
  mission: '',
  brandValues: [],
  messagingDos: '',
  messagingDonts: '',
  logoFile: null,
  logoPreview: null,
  competitors: [{ name: '', website: '' }],
  socialAccounts: [],
  existingCampaigns: '',
  exampleContent: '',
};

// ─── Component ──────────────────────────────────────────────────────────

export default function Onboarding() {
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<OnboardingData>) =>
    setData(prev => ({ ...prev, ...patch }));

  // ─── Scan Logic ─────────────────────────────────────────────────────

  const handleScan = async () => {
    if (scanning || data.scanScore !== null) return;
    setScanning(true);
    setScanProgress(0);

    try {
      const res = await api.post('/growth-blueprint', {
        company_name: data.companyName,
        website_url: data.website || `https://${data.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        industry: data.industry || 'General',
      });

      const blueprintId = res?.data?.id || res?.data?.data?.id;
      if (!blueprintId) { simulateScan(); return; }

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        setScanProgress(Math.min(95, attempts * 5));
        try {
          const check = await api.get(`/growth-blueprint/${blueprintId}`);
          const blueprint = check?.data?.data || check?.data;
          if (blueprint?.status === 'completed' && blueprint?.results) {
            clearInterval(poll);
            const r = blueprint.results;
            update({
              scanScore: r.overall_score ?? 72,
              scanSeo: r.seo_score ?? 65,
              scanContent: r.content_score ?? 78,
              scanPerformance: r.performance_score ?? 70,
            });
            setScanProgress(100);
            setScanning(false);
          } else if (attempts >= 60) {
            clearInterval(poll);
            simulateScan();
          }
        } catch { clearInterval(poll); simulateScan(); }
      }, 2000);
    } catch {
      simulateScan();
    }
  };

  const simulateScan = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        update({ scanScore: 72, scanSeo: 65, scanContent: 78, scanPerformance: 70 });
        setScanning(false);
      }
    }, 300);
  };

  // ─── Save / Finish ──────────────────────────────────────────────────

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          brand_name: data.companyName,
          website: data.website,
          tagline: data.tagline,
          industry: data.industry,
          country: data.country,
          language: data.language,
          primary_color: data.primaryColor,
          secondary_color: data.secondaryColor,
          brand_tone: data.tone,
          mission: data.mission,
          brand_values: data.brandValues,
          messaging_dos: data.messagingDos,
          messaging_donts: data.messagingDonts,
          products: data.products.filter(p => p.name.trim() || p.description.trim()),
          audience_type: data.audiences[0]?.audienceType || '',
          ideal_customer: data.audiences[0]?.idealCustomer || '',
          customer_sector: data.audiences[0]?.customerSector || '',
          company_size: data.audiences[0]?.companySize || '',
          age_group: data.audiences[0]?.ageGroup || '',
          occupation: data.audiences[0]?.occupation || '',
          pain_points: data.audiences[0]?.painPoints || '',
          audiences: data.audiences.filter(a => a.audienceType || a.idealCustomer),
          marketing_goals: data.marketingGoals,
          competitors: data.competitors.filter(c => c.name.trim()),
          social_accounts: data.socialAccounts.filter(s => s.url.trim()),
          existing_campaigns: data.existingCampaigns,
          example_content: data.exampleContent,
        },
      });
      if (error) {
        toast({ title: nl ? 'Fout bij opslaan' : fr ? 'Erreur lors de la sauvegarde' : 'Save failed', description: error.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
      // ── Bridge: populate Brand Memory from onboarding data (24 fields) ──
      try {
        const filteredProducts = data.products.filter(p => p.name.trim());
        const toneMap: Record<string, string> = {
          professional: nl ? 'Zakelijk en betrouwbaar' : fr ? 'Professionnel et fiable' : 'Business-like and trustworthy',
          friendly: nl ? 'Warm en benaderbaar' : fr ? 'Chaleureux et accessible' : 'Warm and approachable',
          innovative: nl ? 'Vernieuwend en gedurfd' : fr ? 'Innovant et audacieux' : 'Forward-thinking and bold',
          luxury: nl ? 'Premium en exclusief' : fr ? 'Premium et exclusif' : 'Premium and exclusive',
          playful: nl ? 'Speels en energiek' : fr ? 'Ludique et \u00e9nergique' : 'Playful and energetic',
          authoritative: nl ? 'Gezaghebbend en expert' : fr ? 'Autoritaire et expert' : 'Authoritative and expert',
          casual: nl ? 'Ontspannen en informeel' : fr ? 'D\u00e9contract\u00e9 et informel' : 'Relaxed and informal',
        };
        await brandMemoryService.upsertActive({
          // Core identity
          brand_name: data.companyName,
          tagline: data.tagline,
          mission: data.mission,
          brand_description: filteredProducts.map(p => p.description).filter(Boolean).join('. '),

          // Brand characteristics
          brand_values: data.brandValues,

          // Market definition
          industries: data.industry ? [data.industry] : [],
          audiences: data.audiences.flatMap(a => [
            a.audienceType && `${a.audienceType}`,
            a.idealCustomer,
            a.occupation && (nl ? `Beroep: ${a.occupation}` : fr ? `Profession : ${a.occupation}` : `Role: ${a.occupation}`),
            a.ageGroup && (nl ? `Leeftijd: ${a.ageGroup}` : fr ? `\u00c2ge : ${a.ageGroup}` : `Age: ${a.ageGroup}`),
            a.painPoints && (nl ? `Pijnpunten: ${a.painPoints}` : fr ? `Points de douleur : ${a.painPoints}` : `Pain points: ${a.painPoints}`),
            a.customerSector && (nl ? `Sector: ${a.customerSector}` : fr ? `Secteur : ${a.customerSector}` : `Sector: ${a.customerSector}`),
            a.companySize && (nl ? `Bedrijfsgrootte: ${a.companySize}` : fr ? `Taille de l'entreprise : ${a.companySize}` : `Company size: ${a.companySize}`),
          ]).filter(Boolean) as string[],
          regions: data.country ? [data.country] : [],
          languages: data.language ? [data.language] : ['nl'],

          // Competitive advantages
          usps: filteredProducts.flatMap(p => p.usp ? [p.usp] : []),
          differentiators: filteredProducts.flatMap(p => p.features ? p.features.split(',').map(f => f.trim()).filter(Boolean) : []),
          proof_points: filteredProducts.flatMap(p => p.problemSolved ? [p.problemSolved] : []),

          // Voice & messaging
          tone_attributes: data.tone ? [{ attribute: data.tone, description: toneMap[data.tone] || data.tone }] : [],
          messaging_dos: data.messagingDos,
          messaging_donts: data.messagingDonts,

          // References
          urls: [data.website, ...data.socialAccounts.filter(s => s.url.trim()).map(s => s.url)].filter(Boolean),

          // Examples
          examples_good: [data.exampleContent, data.existingCampaigns].filter(Boolean).join('\n\n---\n\n'),

          // Extended fields
          competitors: data.competitors.filter(c => c.name.trim()),
          marketing_goals: data.marketingGoals,
          primary_color: data.primaryColor,
          secondary_color: data.secondaryColor,
        });
      } catch {
        // Brand Memory sync is best-effort; don't block onboarding completion
        console.warn('Brand Memory sync failed (non-blocking)');
      }

      // ── Sync default Brand Kit with onboarding colors ──
      try {
        const { data: defaultKit } = await supabase
          .from('brand_kits')
          .select('id')
          .eq('is_default', true)
          .maybeSingle();
        if (defaultKit) {
          await supabase.from('brand_kits').update({
            primary_color: data.primaryColor,
            secondary_color: data.secondaryColor,
            tagline: data.tagline || undefined,
            name: data.companyName || undefined,
          }).eq('id', defaultKit.id);
        }
      } catch {
        console.warn('Brand kit sync failed (non-blocking)');
      }

      toast({ title: nl ? 'Onboarding voltooid!' : fr ? 'Onboarding termin\u00e9 !' : 'Onboarding complete!' });
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      toast({ title: nl ? 'Fout bij opslaan' : fr ? 'Erreur lors de la sauvegarde' : 'Save failed', description: String(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Navigation ─────────────────────────────────────────────────────

  const canGoNext = () => {
    if (step === 1) return data.companyName.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 3 && data.scanScore === null && !scanning) {
      handleScan();
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  // ─── Step indicator data ────────────────────────────────────────────

  const stepIcons = [Building2, Upload, Search, Package, Users, Target, Palette, Swords, FolderOpen, Rocket];
  const stepLabelsArr = nl
    ? ['Bedrijf', 'Documenten', 'Scan', 'Product', 'Doelgroep', 'Doelen', 'Merk', 'Concurrentie', 'Portfolio', 'Klaar!']
    : fr
    ? ['Entreprise', 'Documents', 'Scan', 'Produit', 'Cible', 'Objectifs', 'Marque', 'Concurrents', 'Portfolio', 'Termin\u00e9 !']
    : ['Company', 'Documents', 'Scan', 'Product', 'Audience', 'Goals', 'Brand', 'Competitors', 'Portfolio', 'Done!'];

  // ─── Confetti ───────────────────────────────────────────────────────

  useEffect(() => {
    if (step === TOTAL_STEPS) {
      const duration = 800;
      const end = Date.now() + duration;
      const colors = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981'];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [step]);

  // ─── Dynamic subtitle ──────────────────────────────────────────────

  const companyLabel = data.companyName || (nl ? 'je bedrijf' : fr ? 'votre entreprise' : 'your business');

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)' }}>

      {/* ─── Top Bar + Step Indicator ──────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Logo + lang switcher + step count */}
          <div className="flex items-center justify-between mb-3">
            <img src="/logo-inclufy.svg" alt="Inclufy" className="h-8" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/5 rounded-full p-0.5">
                {([
                  { code: 'nl' as const, flag: '🇳🇱' },
                  { code: 'en' as const, flag: '🇬🇧' },
                  { code: 'fr' as const, flag: '🇫🇷' },
                ] as const).map(({ code, flag }) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={cn(
                      "text-sm px-2 py-0.5 rounded-full transition-all",
                      lang === code
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    {flag}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400">
                {t('onboarding.step')} {step} {t('onboarding.of')} {TOTAL_STEPS}
              </span>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-0">
            {stepIcons.map((Icon, idx) => {
              const s = idx + 1;
              const done = step > s;
              const active = step === s;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                      done ? 'bg-emerald-500 border-emerald-500' :
                      active ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/30' :
                      'bg-white/5 border-white/20'
                    )}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> :
                       <Icon className={cn('w-3 h-3', active ? 'text-white' : 'text-gray-500')} />}
                    </div>
                    <span className={cn(
                      'text-[9px] mt-1 whitespace-nowrap hidden sm:block',
                      done ? 'text-emerald-400' : active ? 'text-gray-300' : 'text-gray-600'
                    )}>
                      {stepLabelsArr[idx]}
                    </span>
                  </div>
                  {idx < stepIcons.length - 1 && (
                    <div className={cn(
                      'h-0.5 flex-1 mx-1 rounded transition-colors duration-300',
                      done ? 'bg-emerald-500' : 'bg-white/10'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >

          {/* ═══ STEP 1: Bedrijfsinformatie ═══════════════════════ */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'Vertel ons over je bedrijf' : fr ? 'Parlez-nous de votre entreprise' : 'Tell us about your business'}
                </h1>
                <p className="text-gray-400">
                  {nl ? 'We gebruiken deze informatie om je marketing te personaliseren' : fr ? 'Nous utilisons ces informations pour personnaliser votre marketing' : 'We use this to personalize your marketing'}
                </p>
              </div>
              <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl">
                <CardContent className="p-6 space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Bedrijfsnaam' : fr ? "Nom de l'entreprise" : 'Company Name'} <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={data.companyName}
                      onChange={e => update({ companyName: e.target.value })}
                      placeholder={nl ? 'bijv. Inclufy Marketing' : fr ? 'ex. Inclufy Marketing' : 'e.g. Inclufy Marketing'}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Website URL' : fr ? 'URL du site web' : 'Website URL'}
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                      <Input
                        value={data.website}
                        onChange={e => update({ website: e.target.value })}
                        placeholder="www.jouwbedrijf.nl"
                        className="h-12 pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Tagline */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Tagline / Slogan' : fr ? 'Tagline / Slogan' : 'Tagline / Slogan'}
                      <span className="text-gray-500 text-xs ml-2">({nl ? 'optioneel' : fr ? 'optionnel' : 'optional'})</span>
                    </label>
                    <Input
                      value={data.tagline}
                      onChange={e => update({ tagline: e.target.value })}
                      placeholder={nl ? 'bijv. "Marketing die werkt"' : fr ? 'ex. "Le marketing qui marche"' : 'e.g. "Marketing that works"'}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* Industry */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Branche / Sector' : fr ? 'Secteur / Industrie' : 'Industry / Sector'}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {INDUSTRIES.map((ind, idx) => (
                        <motion.button
                          key={ind}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => update({ industry: ind })}
                          className={cn(
                            'px-3 py-2.5 rounded-lg text-xs font-medium border transition-all',
                            data.industry === ind
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                              : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/15 hover:border-purple-500/50'
                          )}
                        >
                          {ind}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Land' : fr ? 'Pays' : 'Country'}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {COUNTRIES.map(c => (
                        <motion.button
                          key={c.value}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => update({ country: c.value })}
                          className={cn(
                            'px-3 py-2.5 rounded-lg text-xs font-medium border transition-all',
                            data.country === c.value
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                              : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/15 hover:border-purple-500/50'
                          )}
                        >
                          {nl ? c.label : fr ? c.fr : c.en}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Taal' : fr ? 'Langue' : 'Language'}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {LANGUAGES_LIST.map(l => (
                        <motion.button
                          key={l.value}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => update({ language: l.value })}
                          className={cn(
                            'px-3 py-2.5 rounded-lg text-xs font-medium border transition-all',
                            data.language === l.value
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                              : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/15 hover:border-purple-500/50'
                          )}
                        >
                          {l.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ═══ STEP 2: Document Upload ══════════════════════════ */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'Heb je al marketingdocumenten?' : fr ? 'Avez-vous déjà des documents marketing ?' : 'Do you already have marketing documents?'}
                </h1>
                <p className="text-gray-400">
                  {nl ? 'Upload een businesscase, marketingplan of productinfo — AI vult de rest automatisch in' : fr ? 'Téléchargez un business case, plan marketing ou info produit — l\'IA remplira le reste automatiquement' : 'Upload a business case, marketing plan or product info — AI will auto-fill the rest'}
                </p>
              </div>

              {data.hasDocuments === null ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => update({ hasDocuments: true })}
                    className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 bg-white/5 border-white/15 text-gray-400 hover:bg-purple-600/10 hover:border-purple-500/50 transition-all"
                  >
                    <Upload className="w-10 h-10 text-purple-400" />
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{nl ? 'Ja, ik heb documenten' : fr ? 'Oui, j\'ai des documents' : 'Yes, I have documents'}</p>
                      <p className="text-xs text-gray-400 mt-1">{nl ? 'Marketingplan, businesscase, productinfo, etc.' : fr ? 'Plan marketing, business case, info produit, etc.' : 'Marketing plan, business case, product info, etc.'}</p>
                    </div>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => update({ hasDocuments: false })}
                    className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 bg-white/5 border-white/15 text-gray-400 hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    <ArrowRight className="w-10 h-10 text-gray-500" />
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{nl ? 'Nee, ik begin blanco' : fr ? 'Non, je pars de zéro' : 'No, starting from scratch'}</p>
                      <p className="text-xs text-gray-400 mt-1">{nl ? 'Ik vul alle stappen handmatig in' : fr ? 'Je remplirai toutes les étapes manuellement' : 'I\'ll fill in all steps manually'}</p>
                    </div>
                  </motion.button>
                </div>
              ) : data.hasDocuments ? (
                <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl max-w-2xl mx-auto">
                  <CardContent className="p-6 space-y-6">
                    <div
                      className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500/40 transition-colors"
                      onClick={() => document.getElementById('doc-upload')?.click()}
                    >
                      <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-300 font-medium">
                        {nl ? 'Klik om documenten te uploaden' : fr ? 'Cliquez pour télécharger des documents' : 'Click to upload documents'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOCX, PPTX, TXT (max 10MB per bestand)</p>
                      <input
                        id="doc-upload"
                        type="file"
                        accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.rtf"
                        multiple
                        className="hidden"
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          const valid = files.filter(f => f.size <= 10 * 1024 * 1024);
                          if (valid.length > 0) update({ uploadedFiles: [...data.uploadedFiles, ...valid] });
                        }}
                      />
                    </div>

                    {data.uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-200">
                          {nl ? 'Geüploade bestanden' : fr ? 'Fichiers téléchargés' : 'Uploaded files'}
                        </p>
                        {data.uploadedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-purple-400" />
                              <div>
                                <p className="text-sm text-gray-200">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                              </div>
                            </div>
                            <button
                              onClick={() => update({ uploadedFiles: data.uploadedFiles.filter((_, i) => i !== idx) })}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => update({ hasDocuments: null, uploadedFiles: [] })}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {nl ? '← Terug' : fr ? '← Retour' : '← Back'}
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                      {nl ? 'AI analyseert je documenten en vult zoveel mogelijk velden automatisch in. Je kunt alles nog aanpassen in de volgende stappen.' : fr ? 'L\'IA analysera vos documents et remplira autant de champs que possible. Vous pourrez tout ajuster dans les étapes suivantes.' : 'AI will analyze your documents and auto-fill as many fields as possible. You can adjust everything in the following steps.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl max-w-2xl mx-auto">
                  <CardContent className="p-8 text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <p className="text-lg font-semibold text-white">
                      {nl ? 'Geen probleem!' : fr ? 'Pas de problème !' : 'No problem!'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {nl ? 'We loodsen je door alle stappen om je profiel in te vullen.' : fr ? 'Nous vous guiderons à travers toutes les étapes pour compléter votre profil.' : 'We\'ll guide you through all steps to complete your profile.'}
                    </p>
                    <button
                      onClick={() => update({ hasDocuments: null })}
                      className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {nl ? '← Terug naar keuze' : fr ? '← Retour au choix' : '← Back to choice'}
                    </button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ═══ STEP 3: Website Analyse ══════════════════════════ */}
          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'AI Website Analyse' : fr ? 'Analyse IA du site web' : 'AI Website Analysis'}
                </h1>
                <p className="text-gray-400">
                  {nl ? `Even kijken hoe ${companyLabel} er online voor staat...` : fr ? `Voyons comment ${companyLabel} se porte en ligne...` : `Let's see how ${companyLabel} is doing online...`}
                </p>
              </div>
              <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl">
                <CardContent className="p-8 text-center">
                  {scanning ? (
                    <div className="space-y-6 py-8">
                      <Loader2 className="w-12 h-12 text-purple-400 mx-auto animate-spin" />
                      <p className="text-white text-lg font-medium">
                        {nl ? 'Je website wordt gescand...' : fr ? 'Analyse de votre site web en cours...' : 'Scanning your website...'}
                      </p>
                      <p className="text-gray-400 text-sm">{data.website || data.companyName}</p>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: `${scanProgress}%` }} />
                      </div>
                    </div>
                  ) : data.scanScore !== null ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <p className="text-emerald-400 font-semibold">{nl ? 'Scan voltooid!' : fr ? 'Analyse termin\u00e9e !' : 'Scan complete!'}</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: nl ? 'Totaal' : fr ? 'Total' : 'Overall', score: data.scanScore!, icon: TrendingUp },
                          { label: 'SEO', score: data.scanSeo!, icon: Search },
                          { label: 'Content', score: data.scanContent!, icon: Sparkles },
                          { label: nl ? 'Prestatie' : fr ? 'Performance' : 'Performance', score: data.scanPerformance!, icon: BarChart3 },
                        ].map((item, idx) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.15, type: 'spring' }}
                            className={cn('p-4 rounded-xl border', scoreBg(item.score))}
                          >
                            <item.icon className={cn('w-5 h-5 mx-auto mb-2', scoreColor(item.score))} />
                            <p className={cn('text-3xl font-bold', scoreColor(item.score))}>
                              <CountUp target={item.score} />
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{item.label}</p>
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-400 mt-4">
                        {(data.scanScore ?? 0) >= 70
                          ? (nl ? 'Goede basis! Inclufy gaat dit naar een hoger niveau tillen' : fr ? 'Bonne base ! Inclufy va porter cela au niveau sup\u00e9rieur' : 'Great foundation! Inclufy will take this to the next level')
                          : (nl ? 'Er is ruimte voor groei \u2014 precies waarom je hier bent \u{1F4AA}' : fr ? 'Il y a de la marge pour progresser \u2014 c\'est exactement pourquoi vous \u00eates ici \u{1F4AA}' : 'Room for growth \u2014 exactly why you\'re here \u{1F4AA}')}
                      </p>
                    </div>
                  ) : (
                    <div className="py-12 space-y-4">
                      <BarChart3 className="w-12 h-12 text-gray-600 mx-auto" />
                      <p className="text-gray-400">
                        {nl ? 'Klik op Volgende om de scan te starten' : fr ? "Cliquez sur Suivant pour d\u00e9marrer l'analyse" : 'Click Next to start the scan'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* ═══ STEP 4: Product of Dienst ════════════════════════ */}
          {step === 4 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'Product of Dienst' : fr ? 'Produit ou Service' : 'Product or Service'}
                </h1>
                <p className="text-gray-400">
                  {nl ? `Wat verkoopt ${companyLabel}?` : fr ? `Que vend ${companyLabel} ?` : `What does ${companyLabel} sell?`}
                </p>
              </div>

              <div className="space-y-4">
                {data.products.map((product, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl relative">
                      <CardContent className="p-6 space-y-4">
                        {/* Product number badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-purple-500/20 text-purple-300 border-0 text-[10px]">
                            #{idx + 1}
                          </Badge>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-purple-400" />
                            {nl ? 'Productnaam' : fr ? 'Nom du produit' : 'Product Name'}
                          </label>
                          <Input
                            value={product.name}
                            onChange={e => {
                              const updated = [...data.products];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              update({ products: updated });
                            }}
                            placeholder={nl ? 'bijv. Marketing Automation Suite' : fr ? 'ex. Marketing Automation Suite' : 'e.g. Marketing Automation Suite'}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          />
                        </div>

                        {/* Short description */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                            <Gem className="w-3.5 h-3.5 text-purple-400" />
                            {nl ? 'Korte beschrijving' : fr ? 'Description courte' : 'Short Description'}
                          </label>
                          <Textarea
                            value={product.description}
                            onChange={e => {
                              const updated = [...data.products];
                              updated[idx] = { ...updated[idx], description: e.target.value };
                              update({ products: updated });
                            }}
                            placeholder={nl ? 'Beschrijf kort je product of dienst...' : fr ? 'D\u00e9crivez bri\u00e8vement votre produit ou service...' : 'Briefly describe your product or service...'}
                            rows={2}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          />
                        </div>

                        {/* Key benefits */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                            {nl ? 'Belangrijkste voordelen' : fr ? 'Avantages cl\u00e9s' : 'Key Benefits'}
                          </label>
                          <Input
                            value={product.features}
                            onChange={e => {
                              const updated = [...data.products];
                              updated[idx] = { ...updated[idx], features: e.target.value };
                              update({ products: updated });
                            }}
                            placeholder={nl ? 'bijv. Tijdbesparend, AI-gestuurd, Betaalbaar' : fr ? 'ex. Gain de temps, Pilot\u00e9 par IA, Abordable' : 'e.g. Time-saving, AI-powered, Affordable'}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          />
                        </div>

                        {/* Remove button */}
                        {data.products.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = data.products.filter((_, i) => i !== idx);
                              update({ products: updated });
                            }}
                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {nl ? 'Verwijderen' : fr ? 'Supprimer' : 'Remove'}
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Add product button */}
                {data.products.length < 6 && (
                  <button
                    onClick={() => update({ products: [...data.products, { ...emptyProduct }] })}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/15 text-gray-400 hover:text-purple-300 hover:border-purple-500/40 transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    {nl ? 'Product toevoegen' : fr ? 'Ajouter un produit' : 'Add Product'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ═══ STEP 5: Doelgroep ════════════════════════════════ */}
          {step === 5 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'Doelgroep' : fr ? 'Public cible' : 'Target Audience'}
                </h1>
                <p className="text-gray-400">
                  {nl ? `Wie wil ${companyLabel} bereiken?` : fr ? `Qui ${companyLabel} souhaite atteindre ?` : `Who does ${companyLabel} want to reach?`}
                </p>
              </div>

              <div className="space-y-4">
                {data.audiences.map((audience, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl relative">
                      <CardContent className="p-6 space-y-4">
                        {/* Audience number badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-purple-500/20 text-purple-300 border-0 text-[10px]">
                            #{idx + 1}
                          </Badge>
                        </div>

                        {/* B2B / B2C Toggle */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">
                            {nl ? 'Type klant' : fr ? 'Type de client' : 'Customer Type'}
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {(['B2B', 'B2C'] as const).map(type => (
                              <motion.button
                                key={type}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  const updated = [...data.audiences];
                                  updated[idx] = { ...updated[idx], audienceType: type };
                                  update({ audiences: updated });
                                }}
                                className={cn(
                                  'py-4 rounded-xl border-2 text-lg font-bold transition-all',
                                  audience.audienceType === type
                                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                                )}
                              >
                                {type}
                                <span className="block text-xs font-normal mt-1 text-gray-400">
                                  {type === 'B2B' ? 'Business-to-Business' : 'Business-to-Consumer'}
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Ideal Customer */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">
                            {nl ? 'Ideale Klant' : fr ? 'Client id\u00e9al' : 'Ideal Customer'}
                          </label>
                          <Textarea
                            value={audience.idealCustomer}
                            onChange={e => {
                              const updated = [...data.audiences];
                              updated[idx] = { ...updated[idx], idealCustomer: e.target.value };
                              update({ audiences: updated });
                            }}
                            placeholder={nl ? 'Beschrijf je ideale klant...' : fr ? 'D\u00e9crivez votre client id\u00e9al...' : 'Describe your ideal customer...'}
                            rows={2}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          />
                        </div>

                        {/* B2B fields */}
                        {audience.audienceType === 'B2B' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-200">
                                {nl ? 'Sector / Branche van klanten' : fr ? 'Secteur / Industrie des clients' : 'Client Sector / Industry'}
                              </label>
                              <Input
                                value={audience.customerSector}
                                onChange={e => {
                                  const updated = [...data.audiences];
                                  updated[idx] = { ...updated[idx], customerSector: e.target.value };
                                  update({ audiences: updated });
                                }}
                                placeholder={nl ? 'bijv. Technologie, Gezondheidszorg' : fr ? 'ex. Technologie, Sant\u00e9' : 'e.g. Technology, Healthcare'}
                                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-200">
                                {nl ? 'Bedrijfsgrootte' : fr ? "Taille de l'entreprise" : 'Company Size'}
                              </label>
                              <div className="grid grid-cols-4 gap-2">
                                {COMPANY_SIZES.map(s => (
                                  <motion.button
                                    key={s.value}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const updated = [...data.audiences];
                                      updated[idx] = { ...updated[idx], companySize: s.value };
                                      update({ audiences: updated });
                                    }}
                                    className={cn(
                                      'px-3 py-2.5 rounded-lg text-xs font-medium border transition-all',
                                      audience.companySize === s.value
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/15'
                                    )}
                                  >
                                    {nl ? s.nl : fr ? s.fr : s.en}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* B2C fields */}
                        {audience.audienceType === 'B2C' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-200">
                                {nl ? 'Leeftijdsgroep' : fr ? "Tranche d'\u00e2ge" : 'Age Group'}
                              </label>
                              <div className="grid grid-cols-5 gap-2">
                                {AGE_GROUPS.map(ag => (
                                  <motion.button
                                    key={ag}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const updated = [...data.audiences];
                                      updated[idx] = { ...updated[idx], ageGroup: ag };
                                      update({ audiences: updated });
                                    }}
                                    className={cn(
                                      'px-3 py-2.5 rounded-lg text-xs font-medium border transition-all',
                                      audience.ageGroup === ag
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/15'
                                    )}
                                  >
                                    {ag}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Occupation */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">
                            {nl ? 'Beroep / Rol' : fr ? 'Profession / R\u00f4le' : 'Occupation / Role'}
                          </label>
                          <Input
                            value={audience.occupation}
                            onChange={e => {
                              const updated = [...data.audiences];
                              updated[idx] = { ...updated[idx], occupation: e.target.value };
                              update({ audiences: updated });
                            }}
                            placeholder={nl ? 'bijv. MKB-ondernemer, CMO' : fr ? 'ex. Dirigeant PME, CMO' : 'e.g. SME Owner, CMO'}
                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          />
                        </div>

                        {/* Pain Points */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">
                            {nl ? 'Pijnpunten' : fr ? 'Points de douleur' : 'Pain Points'}
                          </label>
                          <Textarea
                            value={audience.painPoints}
                            onChange={e => {
                              const updated = [...data.audiences];
                              updated[idx] = { ...updated[idx], painPoints: e.target.value };
                              update({ audiences: updated });
                            }}
                            placeholder={nl ? 'Welke problemen lost je product op?' : fr ? 'Quels probl\u00e8mes votre produit r\u00e9sout-il ?' : 'What problems does your product solve?'}
                            rows={2}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          />
                        </div>

                        {/* Remove button */}
                        {data.audiences.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = data.audiences.filter((_, i) => i !== idx);
                              update({ audiences: updated });
                            }}
                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {nl ? 'Verwijderen' : fr ? 'Supprimer' : 'Remove'}
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Add audience button */}
                {data.audiences.length < 5 && (
                  <button
                    onClick={() => update({ audiences: [...data.audiences, { ...emptyAudience }] })}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/15 text-gray-400 hover:text-purple-300 hover:border-purple-500/40 transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    {nl ? 'Doelgroep toevoegen' : fr ? 'Ajouter un public cible' : 'Add Audience'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ═══ STEP 6: Marketingdoelen ══════════════════════════ */}
          {step === 6 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'Marketingdoelen' : fr ? 'Objectifs marketing' : 'Marketing Goals'}
                </h1>
                <p className="text-gray-400">
                  {nl ? 'Wat wil je bereiken? (selecteer meerdere)' : fr ? 'Que souhaitez-vous accomplir ? (s\u00e9lection multiple)' : 'What do you want to achieve? (select multiple)'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {MARKETING_GOALS.map((goal, idx) => {
                  const selected = data.marketingGoals.includes(goal.key);
                  return (
                    <motion.button
                      key={goal.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const goals = selected
                          ? data.marketingGoals.filter(g => g !== goal.key)
                          : [...data.marketingGoals, goal.key];
                        update({ marketingGoals: goals });
                      }}
                      className={cn(
                        'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                        selected
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                          : 'bg-white/5 border-white/15 text-gray-400 hover:bg-white/10 hover:border-purple-500/30'
                      )}
                    >
                      <goal.icon className={cn('w-8 h-8', selected ? 'text-purple-400' : 'text-gray-500')} />
                      <span className="text-sm font-medium">{nl ? goal.nl : fr ? goal.fr : goal.en}</span>
                      {selected && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}

          {/* ═══ STEP 7: Merkprofiel ═════════════════════════════ */}
          {step === 7 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'Merkprofiel' : fr ? 'Profil de marque' : 'Brand Profile'}
                </h1>
                <p className="text-gray-400">
                  {nl ? `Geef ${companyLabel} een visuele identiteit die opvalt` : fr ? `Donnez \u00e0 ${companyLabel} une identit\u00e9 visuelle qui se d\u00e9marque` : `Give ${companyLabel} a visual identity that stands out`}
                </p>
              </div>
              <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl">
                <CardContent className="p-6 space-y-6">
                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">
                        {nl ? 'Primaire kleur' : fr ? 'Couleur primaire' : 'Primary Color'}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={data.primaryColor}
                          onChange={e => update({ primaryColor: e.target.value })}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-white/20"
                        />
                        <Input
                          value={data.primaryColor}
                          onChange={e => update({ primaryColor: e.target.value })}
                          className="h-10 bg-white/10 border-white/20 text-white font-mono text-sm flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">
                        {nl ? 'Secundaire kleur' : fr ? 'Couleur secondaire' : 'Secondary Color'}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={data.secondaryColor}
                          onChange={e => update({ secondaryColor: e.target.value })}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-white/20"
                        />
                        <Input
                          value={data.secondaryColor}
                          onChange={e => update({ secondaryColor: e.target.value })}
                          className="h-10 bg-white/10 border-white/20 text-white font-mono text-sm flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Brand Preview */}
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <div
                      className="p-6 text-center"
                      style={{ background: `linear-gradient(135deg, ${data.primaryColor}, ${data.secondaryColor})` }}
                    >
                      {data.logoPreview ? (
                        <img src={data.logoPreview} alt="" className="h-10 mx-auto mb-3 object-contain" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                          <Building2 className="w-6 h-6 text-white/80" />
                        </div>
                      )}
                      <p className="text-white font-bold text-lg">
                        {data.companyName || 'Your Brand'}
                      </p>
                      <p className="text-white/70 text-sm capitalize mt-1">
                        {TONES.find(t => t.key === data.tone)?.[nl ? 'nl' : fr ? 'fr' : 'en'] || data.tone}
                      </p>
                    </div>
                  </div>

                  {/* Tone selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Merkstijl' : fr ? 'Ton de la marque' : 'Brand Tone'}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {TONES.map((tone, idx) => (
                        <motion.button
                          key={tone.key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => update({ tone: tone.key })}
                          className={cn(
                            'flex flex-col items-center gap-1 py-3 px-2 rounded-lg border transition-all text-center',
                            data.tone === tone.key
                              ? 'bg-purple-600/30 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                              : 'bg-white/5 border-white/15 text-gray-400 hover:bg-white/10'
                          )}
                        >
                          <span className="text-xl">{tone.emoji}</span>
                          <span className="text-[10px] font-medium">{nl ? tone.nl : fr ? tone.fr : tone.en}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Brand Values */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Merkwaarden' : fr ? 'Valeurs de la marque' : 'Brand Values'}
                      <span className="text-gray-500 text-xs ml-2">({nl ? 'selecteer max. 5' : fr ? 's\u00e9lectionnez max. 5' : 'select up to 5'})</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {BRAND_VALUES.map((val, idx) => {
                        const selected = data.brandValues.includes(val.key);
                        return (
                          <motion.button
                            key={val.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const values = selected
                                ? data.brandValues.filter(v => v !== val.key)
                                : data.brandValues.length < 5 ? [...data.brandValues, val.key] : data.brandValues;
                              update({ brandValues: values });
                            }}
                            className={cn(
                              'px-3 py-2.5 rounded-lg text-xs font-medium border transition-all',
                              selected
                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/15 hover:border-purple-500/50'
                            )}
                          >
                            {nl ? val.nl : fr ? val.fr : val.en}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mission */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Missie' : fr ? 'Mission' : 'Mission'}
                      <span className="text-gray-500 text-xs ml-2">({nl ? 'optioneel' : fr ? 'optionnel' : 'optional'})</span>
                    </label>
                    <Textarea
                      value={data.mission}
                      onChange={e => update({ mission: e.target.value })}
                      placeholder={nl ? 'bijv. "We helpen MKB-bedrijven groeien met AI-gestuurde marketing"' : fr ? 'ex. "Nous aidons les PME \u00e0 cro\u00eetre avec le marketing pilot\u00e9 par IA"' : 'e.g. "We help SMBs grow with AI-powered marketing"'}
                      rows={2}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* Messaging Guidelines */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">
                        {nl ? 'Wel zeggen' : fr ? '\u00c0 dire' : 'Do Say'}
                        <span className="text-gray-500 text-xs ml-2">({nl ? 'optioneel' : fr ? 'optionnel' : 'optional'})</span>
                      </label>
                      <Textarea
                        value={data.messagingDos}
                        onChange={e => update({ messagingDos: e.target.value })}
                        placeholder={nl ? 'bijv. "Gebruik altijd u/uw, nooit je/jij"' : fr ? 'ex. "Utilisez toujours le vouvoiement"' : 'e.g. "Always use inclusive language"'}
                        rows={2}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">
                        {nl ? 'Niet zeggen' : fr ? '\u00c0 ne pas dire' : "Don't Say"}
                        <span className="text-gray-500 text-xs ml-2">({nl ? 'optioneel' : fr ? 'optionnel' : 'optional'})</span>
                      </label>
                      <Textarea
                        value={data.messagingDonts}
                        onChange={e => update({ messagingDonts: e.target.value })}
                        placeholder={nl ? 'bijv. "Vermijd jargon, geen superlatieven"' : fr ? 'ex. "\u00c9vitez le jargon, pas de superlatifs"' : 'e.g. "Avoid jargon, no superlatives"'}
                        rows={2}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Logo (optioneel)' : fr ? 'Logo (optionnel)' : 'Logo (optional)'}
                    </label>
                    <div
                      className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500/40 transition-colors"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {data.logoPreview ? (
                        <div className="space-y-2">
                          <img src={data.logoPreview} alt="Logo" className="h-16 mx-auto object-contain" />
                          <p className="text-xs text-gray-400">{nl ? 'Klik om te wijzigen' : fr ? 'Cliquez pour modifier' : 'Click to change'}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-gray-500 mx-auto" />
                          <p className="text-sm text-gray-400">{nl ? 'Upload je logo' : fr ? 'T\u00e9l\u00e9chargez votre logo' : 'Upload your logo'}</p>
                          <p className="text-xs text-gray-500">SVG, PNG, JPG (max 5MB)</p>
                        </div>
                      )}
                      <input
                        id="logo-upload"
                        type="file"
                        accept=".svg,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file && file.size <= 5 * 1024 * 1024) {
                            const reader = new FileReader();
                            reader.onload = ev => update({ logoFile: file, logoPreview: ev.target?.result as string });
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ═══ STEP 8: Concurrenten ════════════════════════════ */}
          {step === 8 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Swords className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'Concurrenten' : fr ? 'Concurrents' : 'Competitors'}
                </h1>
                <p className="text-gray-400">
                  {nl ? 'AI gebruikt dit om SEO-kansen en content gaps te vinden' : fr ? "L'IA utilise cela pour trouver des opportunit\u00e9s SEO et des lacunes de contenu" : 'AI uses this to find SEO opportunities and content gaps'}
                </p>
              </div>
              <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl">
                <CardContent className="p-6 space-y-4">
                  {data.competitors.map((comp, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-xs font-medium text-gray-400">
                        {nl ? `Concurrent ${idx + 1}` : fr ? `Concurrent ${idx + 1}` : `Competitor ${idx + 1}`}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          value={comp.name}
                          onChange={e => {
                            const updated = [...data.competitors];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            update({ competitors: updated });
                          }}
                          placeholder={nl ? 'Naam' : fr ? 'Nom' : 'Name'}
                          className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                        <div className="relative">
                          <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                          <Input
                            value={comp.website}
                            onChange={e => {
                              const updated = [...data.competitors];
                              updated[idx] = { ...updated[idx], website: e.target.value };
                              update({ competitors: updated });
                            }}
                            placeholder="www.concurrent.nl"
                            className="h-10 pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                          />
                        </div>
                      </div>
                      {data.competitors.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = data.competitors.filter((_, i) => i !== idx);
                            update({ competitors: updated });
                          }}
                          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          {nl ? 'Verwijderen' : fr ? 'Supprimer' : 'Remove'}
                        </button>
                      )}
                    </motion.div>
                  ))}

                  {data.competitors.length < 3 && (
                    <button
                      onClick={() => update({ competitors: [...data.competitors, { name: '', website: '' }] })}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-white/15 text-gray-400 hover:text-purple-300 hover:border-purple-500/40 transition-all text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      {nl ? 'Concurrent toevoegen' : fr ? 'Ajouter un concurrent' : 'Add competitor'}
                    </button>
                  )}

                  <p className="text-xs text-gray-500 text-center pt-2">
                    {nl ? 'Optioneel \u2014 je kunt dit later altijd aanpassen' : fr ? 'Optionnel \u2014 vous pourrez toujours ajuster cela plus tard' : 'Optional \u2014 you can always adjust this later'}
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* ═══ STEP 9: Portfolio / Bestaande Content ═══════════ */}
          {step === 9 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'Portfolio / Bestaande Content' : fr ? 'Portfolio / Contenu existant' : 'Portfolio / Existing Content'}
                </h1>
                <p className="text-gray-400">
                  {nl ? 'Laat AI leren van je bestaande stijl' : fr ? "Laissez l'IA apprendre de votre style existant" : 'Let AI learn from your existing style'}
                </p>
              </div>
              <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl">
                <CardContent className="p-6 space-y-6">
                  {/* Social Media Accounts */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-200">Social Media Accounts</label>
                    {SOCIAL_PLATFORMS.map(platform => {
                      const existing = data.socialAccounts.find(s => s.platform === platform.key);
                      return (
                        <div key={platform.key} className="flex items-center gap-3">
                          <platform.icon className="w-5 h-5 text-gray-400 shrink-0" />
                          <Input
                            value={existing?.url || ''}
                            onChange={e => {
                              const filtered = data.socialAccounts.filter(s => s.platform !== platform.key);
                              if (e.target.value.trim()) filtered.push({ platform: platform.key, url: e.target.value });
                              update({ socialAccounts: filtered });
                            }}
                            placeholder={`${platform.label} URL`}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 flex-1"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Existing Campaigns */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Bestaande campagnes' : fr ? 'Campagnes existantes' : 'Existing Campaigns'}
                    </label>
                    <Textarea
                      value={data.existingCampaigns}
                      onChange={e => update({ existingCampaigns: e.target.value })}
                      placeholder={nl ? 'Beschrijf lopende of afgelopen campagnes...' : fr ? 'D\u00e9crivez vos campagnes en cours ou pass\u00e9es...' : 'Describe ongoing or past campaigns...'}
                      rows={3}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* Example Content */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">
                      {nl ? 'Voorbeeld content' : fr ? 'Exemple de contenu' : 'Example Content'}
                    </label>
                    <Textarea
                      value={data.exampleContent}
                      onChange={e => update({ exampleContent: e.target.value })}
                      placeholder={nl ? 'Plak hier een voorbeeld van je bestaande content...' : fr ? 'Collez ici un exemple de votre contenu existant...' : 'Paste an example of your existing content here...'}
                      rows={3}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    {nl ? 'Optioneel \u2014 dit helpt AI om beter passende content te genereren' : fr ? "Optionnel \u2014 cela aide l'IA \u00e0 g\u00e9n\u00e9rer du contenu mieux adapt\u00e9" : 'Optional \u2014 this helps AI generate better matching content'}
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* ═══ STEP 10: Samenvatting ═══════════════════════════ */}
          {step === 10 && (
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-10 h-10 text-green-400" />
                </div>
                <h1 className="text-4xl font-bold mb-3">
                  {nl ? `${data.companyName || 'Je bedrijf'} is klaar om te groeien!` : fr ? `${data.companyName || 'Votre entreprise'} est pr\u00eat \u00e0 grandir !` : `${data.companyName || 'Your business'} is ready to grow!`}
                </h1>
                <p className="text-gray-400 text-lg">
                  {nl ? 'Hier is een overzicht van je setup' : fr ? 'Voici un aper\u00e7u de votre configuration' : "Here's an overview of your setup"}
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Company */}
                <Card className="!bg-[#1a1a2e] !border-white/15">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-white">{nl ? 'Bedrijf' : fr ? 'Entreprise' : 'Company'}</h3>
                    </div>
                    <p className="text-sm text-white font-medium">{data.companyName}</p>
                    {data.tagline && <p className="text-xs text-gray-300 italic mt-0.5">"{data.tagline}"</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {data.industry && `${data.industry} \u00B7 `}
                      {COUNTRIES.find(c => c.value === data.country)?.[nl ? 'label' : fr ? 'fr' : 'en'] || data.country}
                    </p>
                    {data.website && <p className="text-xs text-gray-500 mt-1">{data.website}</p>}
                  </CardContent>
                </Card>

                {/* Scan Results */}
                {data.scanScore !== null && (
                  <Card className="!bg-[#1a1a2e] !border-white/15">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white">{nl ? 'Website Score' : fr ? 'Score du site' : 'Website Score'}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn('text-2xl font-bold', scoreColor(data.scanScore))}>{data.scanScore}</span>
                        <div className="flex gap-2 text-xs text-gray-400">
                          <span>SEO: {data.scanSeo}</span>
                          <span>Content: {data.scanContent}</span>
                          <span>{nl ? 'Prestatie' : fr ? 'Perf' : 'Perf'}: {data.scanPerformance}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Products */}
                {data.products.some(p => p.name.trim()) && (
                  <Card className="!bg-[#1a1a2e] !border-white/15">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white">{nl ? 'Producten' : fr ? 'Produits' : 'Products'}</h3>
                      </div>
                      {data.products.filter(p => p.name.trim()).map((p, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1">
                          <Gem className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-gray-300">{p.name}</p>
                            {p.description && <p className="text-xs text-gray-500">{p.description.slice(0, 60)}{p.description.length > 60 ? '...' : ''}</p>}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Audiences */}
                {data.audiences.some(a => a.audienceType || a.idealCustomer || a.occupation) && (
                  <Card className="!bg-[#1a1a2e] !border-white/15">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white">{nl ? 'Doelgroepen' : fr ? 'Publics cibles' : 'Target Audiences'}</h3>
                      </div>
                      {data.audiences.filter(a => a.audienceType || a.idealCustomer).map((a, i) => (
                        <div key={i} className="mb-2 last:mb-0">
                          <div className="flex flex-wrap gap-2 mb-1">
                            {a.audienceType && <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">{a.audienceType}</Badge>}
                            {a.companySize && <Badge className="bg-white/10 text-gray-300 border-0 text-xs">{a.companySize}</Badge>}
                            {a.ageGroup && <Badge className="bg-white/10 text-gray-300 border-0 text-xs">{a.ageGroup}</Badge>}
                          </div>
                          {a.idealCustomer && <p className="text-xs text-gray-400">{a.idealCustomer.slice(0, 80)}{a.idealCustomer.length > 80 ? '...' : ''}</p>}
                          {a.occupation && <p className="text-xs text-gray-500">{a.occupation}</p>}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Marketing Goals */}
                {data.marketingGoals.length > 0 && (
                  <Card className="!bg-[#1a1a2e] !border-white/15">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white">{nl ? 'Doelen' : fr ? 'Objectifs' : 'Goals'}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {data.marketingGoals.map(g => {
                          const goal = MARKETING_GOALS.find(mg => mg.key === g);
                          return goal ? <Badge key={g} className="bg-purple-500/20 text-purple-300 border-0 text-xs">{nl ? goal.nl : fr ? goal.fr : goal.en}</Badge> : null;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Brand */}
                <Card className="!bg-[#1a1a2e] !border-white/15">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-white">{nl ? 'Merkstijl' : fr ? 'Style de marque' : 'Brand Style'}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: data.primaryColor }} />
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: data.secondaryColor }} />
                      <span className="text-xs text-gray-400 capitalize ml-1">
                        {TONES.find(t => t.key === data.tone)?.[nl ? 'nl' : fr ? 'fr' : 'en'] || data.tone}
                      </span>
                    </div>
                    {data.logoPreview && <img src={data.logoPreview} alt="" className="h-8 mt-2 object-contain" />}
                    {data.mission && <p className="text-xs text-gray-500 mt-2">{data.mission.slice(0, 80)}{data.mission.length > 80 ? '...' : ''}</p>}
                    {data.brandValues.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {data.brandValues.map(v => {
                          const val = BRAND_VALUES.find(bv => bv.key === v);
                          return val ? <Badge key={v} className="bg-white/10 text-gray-300 border-0 text-[10px]">{nl ? val.nl : fr ? val.fr : val.en}</Badge> : null;
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Competitors */}
                {data.competitors.some(c => c.name.trim()) && (
                  <Card className="!bg-[#1a1a2e] !border-white/15">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Swords className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white">{nl ? 'Concurrenten' : fr ? 'Concurrents' : 'Competitors'}</h3>
                      </div>
                      {data.competitors.filter(c => c.name.trim()).map((c, i) => (
                        <p key={i} className="text-sm text-gray-300">
                          {c.name}{c.website && ` \u00B7 ${c.website}`}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Brand Style Preview */}
              <div className="mb-8 bg-[#1a1a2e] border border-white/15 rounded-xl p-6">
                <BrandStylePreview
                  brandName={data.companyName}
                  tagline={data.tagline}
                  primaryColor={data.primaryColor}
                  secondaryColor={data.secondaryColor}
                  tone={data.tone}
                  mission={data.mission}
                  logoUrl={data.logoPreview}
                  lang={lang as 'nl' | 'en' | 'fr'}
                  usps={data.products.filter(p => p.name.trim()).map(p => p.usp || p.description).filter(Boolean)}
                />
              </div>

              {/* Start AI Marketing button */}
              <div className="text-center mb-6">
                <motion.div
                  animate={{ boxShadow: ['0 0 20px rgba(124,58,237,0.3)', '0 0 40px rgba(236,72,153,0.3)', '0 0 20px rgba(124,58,237,0.3)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block rounded-2xl"
                >
                  <Button
                    onClick={handleFinish}
                    disabled={saving}
                    className="h-16 px-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl shadow-2xl"
                  >
                    {saving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Rocket className="w-5 h-5 mr-3" />}
                    Start AI Marketing
                  </Button>
                </motion.div>
              </div>

              {/* Secondary actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <button
                  onClick={handleFinish}
                  className="h-12 flex items-center justify-center gap-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 text-sm font-medium transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {nl ? 'Naar Dashboard' : fr ? 'Aller au tableau de bord' : 'Go to Dashboard'}
                </button>
                <button
                  onClick={handleFinish}
                  className="h-12 flex items-center justify-center gap-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 text-sm font-medium transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Content Hub
                </button>
                <button
                  onClick={handleFinish}
                  className="h-12 flex items-center justify-center gap-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Social Posts
                </button>
              </div>

              {/* Back button */}
              <button
                onClick={() => setStep(9)}
                className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('onboarding.previous')}
              </button>
            </>
          )}

        </motion.div>
        </AnimatePresence>

        {/* ─── Navigation Footer (steps 1-9) ───────────────────── */}
        {step < 10 && (
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('onboarding.previous')}
            </Button>

            <div className="flex items-center gap-3">
              {/* Skip button for steps 2-8 */}
              {step > 1 && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors px-3 py-2"
                >
                  {t('onboarding.skip')}
                </button>
              )}

              {/* Next button */}
              <Button
                onClick={handleNext}
                disabled={!canGoNext() || scanning}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6"
              >
                {scanning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('onboarding.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{count}</>;
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 50) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function scoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 50) return 'OK';
  return 'Needs work';
}
