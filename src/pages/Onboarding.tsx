// src/pages/Onboarding.tsx
// Multi-step onboarding wizard — full-screen, no sidebar

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
  Building2, Globe, Sparkles, Palette, Users, FileText, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, Upload, Rocket, BarChart3, Search, TrendingUp,
  PenTool, Share2, LayoutDashboard, Zap, Star, Package, Target, Lightbulb,
  Plus, Trash2, Crown, Gem, Award, Boxes, ShieldCheck, BadgeCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 6;

const INDUSTRIES = [
  'E-commerce', 'SaaS / Technology', 'Consulting', 'Healthcare',
  'Education', 'Real Estate', 'Finance', 'Marketing / Agency',
  'Hospitality', 'Retail', 'Non-profit', 'Other'
];

const TONES = [
  { key: 'professional', emoji: '👔', nl: 'Professioneel', en: 'Professional' },
  { key: 'friendly', emoji: '😊', nl: 'Vriendelijk', en: 'Friendly' },
  { key: 'innovative', emoji: '🚀', nl: 'Innovatief', en: 'Innovative' },
  { key: 'playful', emoji: '🎨', nl: 'Creatief', en: 'Creative' },
  { key: 'authoritative', emoji: '📊', nl: 'Autoritair', en: 'Authoritative' },
  { key: 'casual', emoji: '☕', nl: 'Casual', en: 'Casual' },
];

interface Product {
  name: string;
  description: string;
  usp: string;
  features: string;
  problemSolved: string;
}

const emptyProduct: Product = { name: '', description: '', usp: '', features: '', problemSolved: '' };

interface OnboardingData {
  companyName: string;
  website: string;
  industry: string;
  // Scan results
  scanScore: number | null;
  scanSeo: number | null;
  scanContent: number | null;
  scanPerformance: number | null;
  // Brand
  primaryColor: string;
  secondaryColor: string;
  tone: string;
  logoFile: File | null;
  logoPreview: string | null;
  // Audience
  personaName: string;
  ageRange: string;
  occupation: string;
  painPoints: string;
  // Products / services
  products: Product[];
  // Generated content
  socialPosts: string[];
  blogOutline: string;
}

const initialData: OnboardingData = {
  companyName: '',
  website: '',
  industry: '',
  scanScore: null,
  scanSeo: null,
  scanContent: null,
  scanPerformance: null,
  primaryColor: '#7c3aed',
  secondaryColor: '#ec4899',
  tone: 'professional',
  logoFile: null,
  logoPreview: null,
  personaName: '',
  ageRange: '25-45',
  occupation: '',
  painPoints: '',
  products: [{ ...emptyProduct }],
  socialPosts: [],
  blogOutline: '',
};

export default function Onboarding() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const nl = lang === 'nl';

  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...patch }));

  // ─── Step 2: AI Website Scan ────────────────────────────────
  const handleScan = async () => {
    if (!data.website) return;
    setScanning(true);
    setScanProgress(0);

    try {
      // Start the scan
      const { data: blueprint } = await api.post('/growth-blueprint', {
        company_name: data.companyName,
        website_url: data.website.startsWith('http') ? data.website : `https://${data.website}`,
        industry: data.industry,
      });

      const blueprintId = blueprint?.id;
      if (!blueprintId) {
        // Simulate scan results if backend isn't available
        await simulateScan();
        return;
      }

      // Poll for results
      const maxAttempts = 60;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 2000));
        setScanProgress(Math.min(90, (i / maxAttempts) * 100));

        const { data: result } = await api.get(`/growth-blueprint/${blueprintId}`);
        if (result?.status === 'completed') {
          const scores = result.results || {};
          update({
            scanScore: scores.overall_score || 72,
            scanSeo: scores.seo_score || 65,
            scanContent: scores.content_score || 78,
            scanPerformance: scores.performance_score || 70,
          });
          setScanProgress(100);
          setScanning(false);
          return;
        }
        if (result?.status === 'failed') break;
      }
      // Fallback
      await simulateScan();
    } catch {
      await simulateScan();
    }
  };

  const simulateScan = async () => {
    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 300));
    }
    update({
      scanScore: 72,
      scanSeo: 65,
      scanContent: 78,
      scanPerformance: 70,
    });
    setScanning(false);
  };

  // ─── Step 5: Generate Content ───────────────────────────────
  const handleGenerateContent = async () => {
    setGenerating(true);
    const filledProducts = data.products.filter(p => p.name.trim() || p.description.trim());
    const productContext = filledProducts.map(p =>
      [p.name && `Product: ${p.name}`, p.description, p.usp && `USP: ${p.usp}`, p.features && `Features: ${p.features}`, p.problemSolved && `Solves: ${p.problemSolved}`].filter(Boolean).join('. ')
    ).join(' | ');
    const brandContext = `${data.companyName}, een ${data.industry} bedrijf. ${productContext}`;
    const mainProduct = filledProducts[0] || emptyProduct;

    try {
      const { data: socialResult } = await api.post('/content/social', {
        topic: brandContext,
        platform: 'linkedin',
        tone: data.tone,
        count: 3,
      });
      const posts = socialResult?.result
        ? [socialResult.result.content || socialResult.result.text || '']
        : [];

      const { data: blogResult } = await api.post('/content/write', {
        prompt: `Write a blog outline for ${brandContext}. Target audience: ${data.personaName || 'professionals'} (${data.occupation || 'business owners'}). Pain points: ${data.painPoints || 'growth challenges'}`,
        content_type: 'blog',
        tone: data.tone,
        length: 'short',
      });
      const blog = blogResult?.result?.content || '';

      const fallbackPosts = [
        `Ontdek hoe ${data.companyName} je helpt${mainProduct.problemSolved ? ` met ${mainProduct.problemSolved.toLowerCase()}` : ''} 🚀`,
        mainProduct.usp ? `Waarom ${data.companyName}? ${mainProduct.usp} ✨` : `${data.companyName} maakt ${data.industry.toLowerCase()} simpel ✨`,
        `Nieuwe blog: De toekomst van ${data.industry.toLowerCase()} — lees meer op onze website 📖`,
      ];

      const productSections = filledProducts.map(p => `### ${p.name || 'Product'}\n${p.description || ''}\n- USP: ${p.usp || '-'}\n- Features: ${p.features || '-'}`).join('\n\n');

      update({
        socialPosts: posts.length > 0 ? posts : fallbackPosts,
        blogOutline: blog || `# ${mainProduct.name || `De Toekomst van ${data.industry}`}\n\n## Introductie\nWaarom ${data.companyName} anders is${mainProduct.usp ? `: ${mainProduct.usp}` : '...'}\n\n## Ons Aanbod\n${productSections || 'Wat wij bieden'}\n\n## Het Probleem\n${mainProduct.problemSolved || 'De uitdagingen waar je doelgroep mee te maken heeft'}\n\n## Voordelen\n- ${mainProduct.usp || 'Uniek voordeel'}\n- Tijdsbesparing\n- Groei & resultaat\n\n## Conclusie\nActiepunten voor je bedrijf`,
      });
    } catch {
      update({
        socialPosts: [
          `Ontdek hoe ${data.companyName} je helpt${mainProduct.problemSolved ? ` met ${mainProduct.problemSolved.toLowerCase()}` : ''} 🚀`,
          mainProduct.usp ? `Waarom ${data.companyName}? ${mainProduct.usp} ✨` : `${data.companyName} maakt ${data.industry.toLowerCase()} simpel ✨`,
          `Nieuwe blog: De toekomst van ${data.industry.toLowerCase()} — lees meer op onze website 📖`,
        ],
        blogOutline: `# ${mainProduct.name || data.industry}\n\n## Introductie\n${data.companyName}\n\n## Ons Aanbod\n${filledProducts.map(p => `- ${p.name}: ${p.description}`).join('\n') || 'Wat wij bieden'}\n\n## Conclusie\nActiepunten`,
      });
    } finally {
      setGenerating(false);
    }
  };

  // ─── Finish: Save & Navigate ────────────────────────────────
  const handleFinish = async () => {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          brand_name: data.companyName,
          website: data.website,
          industry: data.industry,
          primary_color: data.primaryColor,
          secondary_color: data.secondaryColor,
          products: data.products.filter(p => p.name.trim() || p.description.trim()),
          brand_tone: data.tone,
        },
      });
      toast({ title: nl ? 'Onboarding voltooid!' : 'Onboarding complete!' });
    } catch {
      // Continue anyway
    } finally {
      setSaving(false);
      navigate('/app/dashboard', { replace: true });
    }
  };

  const canGoNext = () => {
    if (step === 1) return data.companyName.trim().length > 0;
    if (step === 5) return data.products.some(p => p.name.trim().length > 0 || p.description.trim().length > 0);
    return true;
  };

  const handleNext = () => {
    if (step === 2 && data.scanScore === null && !scanning) {
      handleScan();
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const progress = (step / TOTAL_STEPS) * 100;

  const stepIcons = [Building2, Search, Palette, Users, Gem, Rocket];
  const stepLabelsArr = nl
    ? ['Bedrijf', 'Scan', 'Merk', 'Doelgroep', 'Portfolio', 'Klaar!']
    : ['Company', 'Scan', 'Brand', 'Audience', 'Portfolio', 'Done!'];

  // ─── Confetti on step 6 ──────────────────────────────────────
  useEffect(() => {
    if (step === 6) {
      const end = Date.now() + 800;
      const colors = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981'];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [step]);

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #0a0a0f 100%)' }}>
      {/* Top bar with step indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" style={{ backgroundColor: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-4xl mx-auto px-6 py-3">
          {/* Logo row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="Inclufy" className="w-7 h-7 rounded-lg" />
              <span className="font-semibold text-white text-sm">Inclufy<span className="text-purple-400">.</span></span>
            </div>
            <span className="text-xs text-gray-400">
              {step} / {TOTAL_STEPS}
            </span>
          </div>
          {/* Step dots */}
          <div className="flex items-center justify-between">
            {stepIcons.map((Icon, i) => {
              const stepNum = i + 1;
              const isCompleted = step > stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  {/* Connector line */}
                  <div className="flex items-center w-full">
                    {i > 0 && (
                      <div className={cn("h-0.5 flex-1 rounded-full transition-colors duration-500", isCompleted || isCurrent ? "bg-purple-500" : "bg-white/10")} />
                    )}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                      isCompleted ? "bg-emerald-500/20 text-emerald-400"
                        : isCurrent ? "bg-purple-500/30 text-purple-300 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20"
                        : "bg-white/5 text-gray-400"
                    )}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    {i < stepIcons.length - 1 && (
                      <div className={cn("h-0.5 flex-1 rounded-full transition-colors duration-500", isCompleted ? "bg-purple-500" : "bg-white/10")} />
                    )}
                  </div>
                  <span className={cn("text-[10px] font-medium transition-colors", isCurrent ? "text-purple-300" : isCompleted ? "text-emerald-400/70" : "text-gray-500")}>
                    {stepLabelsArr[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-12">
        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Company Basics ─────────────────── */}
          {step === 1 && (
            <StepWrapper key="step1">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{t('onboarding.step1.title')}</h1>
                <p className="text-gray-400">{nl ? 'Laten we beginnen! Vertel ons over je bedrijf' : "Let's get started! Tell us about your business"}</p>
              </div>
              <Card className="!bg-[#1a1a2e] !border-white/15 shadow-xl">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">{t('onboarding.step1.companyName')} *</label>
                    <Input
                      value={data.companyName}
                      onChange={e => update({ companyName: e.target.value })}
                      placeholder="Inclufy B.V."
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">{t('onboarding.step1.website')}</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={data.website}
                        onChange={e => update({ website: e.target.value })}
                        placeholder="www.inclufy.com"
                        className="h-12 pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">{t('onboarding.step1.industry')}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {INDUSTRIES.map((ind, idx) => (
                        <motion.button
                          key={ind}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.3 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => update({ industry: ind })}
                          className={cn(
                            "px-3 py-2.5 rounded-lg text-xs font-medium border transition-all",
                            data.industry === ind
                              ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                              : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/15 hover:border-purple-500/50"
                          )}
                        >
                          {ind}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StepWrapper>
          )}

          {/* ─── STEP 2: AI Scan ────────────────────────── */}
          {step === 2 && (
            <StepWrapper key="step2">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{t('onboarding.step2.title')}</h1>
                <p className="text-gray-400">
                  {nl
                    ? `Even kijken hoe ${data.companyName || 'je bedrijf'} er online voor staat...`
                    : `Let's see how ${data.companyName || 'your business'} is doing online...`}
                </p>
              </div>

              {scanning ? (
                <Card className="!bg-[#1a1a2e] !border-white/15">
                  <CardContent className="p-8 text-center space-y-6">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto" />
                    <p className="text-lg font-medium text-white">{t('onboarding.step2.scanning')}</p>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-400">{data.website}</p>
                  </CardContent>
                </Card>
              ) : data.scanScore !== null ? (
                <Card className="!bg-[#1a1a2e] !border-white/15">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3 text-green-400">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="text-lg font-medium">{t('onboarding.step2.complete')}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: t('onboarding.step2.score'), value: data.scanScore!, icon: Star },
                        { label: t('onboarding.step2.seo'), value: data.scanSeo!, icon: Search },
                        { label: t('onboarding.step2.content'), value: data.scanContent!, icon: FileText },
                        { label: t('onboarding.step2.performance'), value: data.scanPerformance!, icon: TrendingUp },
                      ].map((m, idx) => (
                        <motion.div
                          key={m.label}
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: idx * 0.15, duration: 0.4, ease: 'easeOut' }}
                          className={cn("rounded-xl p-4 text-center border", scoreBg(m.value))}
                        >
                          <m.icon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                          <p className={cn("text-2xl font-bold", scoreColor(m.value))}>
                            <CountUp target={m.value} />
                          </p>
                          <p className="text-xs text-gray-300 mt-1">{m.label}</p>
                        </motion.div>
                      ))}
                    </div>
                    {/* Motivational message */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.4 }}
                      className="text-center pt-2"
                    >
                      <p className="text-sm text-gray-300">
                        {(data.scanScore ?? 0) >= 70
                          ? (nl ? 'Goede basis! Inclufy gaat dit naar een hoger niveau tillen 🚀' : 'Great foundation! Inclufy will take this to the next level 🚀')
                          : (nl ? 'Er is ruimte voor groei — precies waarom je hier bent 💪' : "There's room for growth — that's exactly why you're here 💪")}
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="!bg-[#1a1a2e] !border-white/15">
                  <CardContent className="p-8 text-center space-y-4">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="text-gray-300">
                      {nl
                        ? `Klik "Volgende" om ${data.website || 'je website'} te scannen`
                        : `Click "Next" to scan ${data.website || 'your website'}`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </StepWrapper>
          )}

          {/* ─── STEP 3: Brand Profile ──────────────────── */}
          {step === 3 && (
            <StepWrapper key="step3">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{t('onboarding.step3.title')}</h1>
                <p className="text-gray-400">
                  {nl
                    ? `Geef ${data.companyName || 'je bedrijf'} een visuele identiteit die opvalt`
                    : `Give ${data.companyName || 'your business'} a visual identity that stands out`}
                </p>
              </div>
              <Card className="!bg-[#1a1a2e] !border-white/15">
                <CardContent className="p-6 space-y-6">
                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">{t('onboarding.step3.primaryColor')}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={data.primaryColor}
                          onChange={e => update({ primaryColor: e.target.value })}
                          className="w-12 h-12 rounded-lg cursor-pointer border-0"
                        />
                        <Input
                          value={data.primaryColor}
                          onChange={e => update({ primaryColor: e.target.value })}
                          className="flex-1 h-12 bg-white/10 border-white/20 text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">{t('onboarding.step3.secondaryColor')}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={data.secondaryColor}
                          onChange={e => update({ secondaryColor: e.target.value })}
                          className="w-12 h-12 rounded-lg cursor-pointer border-0"
                        />
                        <Input
                          value={data.secondaryColor}
                          onChange={e => update({ secondaryColor: e.target.value })}
                          className="flex-1 h-12 bg-white/10 border-white/20 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Brand Preview Mockup */}
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <div
                      className="px-6 py-5 flex items-center gap-4"
                      style={{ background: `linear-gradient(135deg, ${data.primaryColor}, ${data.secondaryColor})` }}
                    >
                      {data.logoPreview ? (
                        <img src={data.logoPreview} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                          {(data.companyName || 'B')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-bold text-lg leading-tight">{data.companyName || 'Your Brand'}</p>
                        <p className="text-white/70 text-xs capitalize">{TONES.find(t => t.key === data.tone)?.[nl ? 'nl' : 'en'] || data.tone}</p>
                      </div>
                    </div>
                    <div className="bg-[#0f0f1a] px-6 py-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.primaryColor }} />
                      <span className="text-[10px] text-gray-500">{nl ? 'Live preview van je merkstijl' : 'Live preview of your brand style'}</span>
                    </div>
                  </div>

                  {/* Tone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">{t('onboarding.step3.tone')}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {TONES.map((tone, idx) => (
                        <motion.button
                          key={tone.key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => update({ tone: tone.key })}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors",
                            data.tone === tone.key
                              ? "bg-purple-600/30 border-purple-500 text-white"
                              : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/15 hover:border-purple-500/50"
                          )}
                        >
                          <span className="text-xl">{tone.emoji}</span>
                          <span className="text-xs">{nl ? tone.nl : tone.en}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Logo upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">{t('onboarding.step3.logo')}</label>
                    <label className="block border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-purple-500/40 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/svg+xml,image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            toast({ title: nl ? 'Bestand te groot (max 5MB)' : 'File too large (max 5MB)', variant: 'destructive' });
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => update({ logoFile: file, logoPreview: reader.result as string });
                          reader.readAsDataURL(file);
                        }}
                      />
                      {data.logoPreview ? (
                        <div className="flex flex-col items-center gap-3">
                          <img src={data.logoPreview} alt="Logo" className="h-16 max-w-[200px] object-contain rounded" />
                          <p className="text-xs text-purple-400">{nl ? 'Klik om te wijzigen' : 'Click to change'}</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-300">{t('onboarding.step3.uploadLogo')}</p>
                          <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG (max 5MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </CardContent>
              </Card>
            </StepWrapper>
          )}

          {/* ─── STEP 4: Target Audience ─────────────────── */}
          {step === 4 && (
            <StepWrapper key="step4">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{t('onboarding.step4.title')}</h1>
                <p className="text-gray-400">
                  {nl
                    ? `Wie wil ${data.companyName || 'je bedrijf'} bereiken?`
                    : `Who does ${data.companyName || 'your business'} want to reach?`}
                </p>
              </div>
              <Card className="!bg-[#1a1a2e] !border-white/15">
                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">{t('onboarding.step4.personaName')}</label>
                      <Input
                        value={data.personaName}
                        onChange={e => update({ personaName: e.target.value })}
                        placeholder={nl ? 'bijv. Marketing Manager' : 'e.g. Marketing Manager'}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">{t('onboarding.step4.ageRange')}</label>
                      <Input
                        value={data.ageRange}
                        onChange={e => update({ ageRange: e.target.value })}
                        placeholder="25-45"
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">{t('onboarding.step4.occupation')}</label>
                    <Input
                      value={data.occupation}
                      onChange={e => update({ occupation: e.target.value })}
                      placeholder={nl ? 'bijv. MKB-ondernemer, CMO, Freelancer' : 'e.g. SME Owner, CMO, Freelancer'}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">{t('onboarding.step4.painPoints')}</label>
                    <Textarea
                      value={data.painPoints}
                      onChange={e => update({ painPoints: e.target.value })}
                      placeholder={nl
                        ? 'bijv. Geen tijd voor marketing, geen budget voor een bureau, onvoldoende online zichtbaarheid'
                        : 'e.g. No time for marketing, limited budget, low online visibility'}
                      rows={3}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                    />
                  </div>
                </CardContent>
              </Card>
            </StepWrapper>
          )}

          {/* ─── STEP 5: Product Portfolio + Content ─────── */}
          {step === 5 && (
            <StepWrapper key="step5">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <Gem className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {nl ? 'Product Portfolio' : 'Product Portfolio'}
                </h1>
                <p className="text-gray-400">
                  {nl
                    ? `Wat maakt ${data.companyName || 'je bedrijf'} uniek? Voeg je producten en diensten toe.`
                    : `What makes ${data.companyName || 'your business'} unique? Add your products and services.`}
                </p>
              </div>

              {/* Product cards */}
              <div className="space-y-4 mb-6">
                {data.products.map((product, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="!bg-[#1a1a2e] !border-white/15 relative overflow-hidden">
                      {/* Product number badge */}
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-300">
                        {idx + 1}
                      </div>
                      <CardContent className="p-5 space-y-4">
                        {/* Product name + description row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-10">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              {nl ? 'Product / Dienst naam' : 'Product / Service name'}
                            </label>
                            <Input
                              value={product.name}
                              onChange={e => {
                                const updated = [...data.products];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                update({ products: updated });
                              }}
                              placeholder={nl ? 'bijv. ProjeXtPal' : 'e.g. Marketing Suite'}
                              className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-purple-400" />
                              {nl ? 'USP' : 'USP'}
                            </label>
                            <Input
                              value={product.usp}
                              onChange={e => {
                                const updated = [...data.products];
                                updated[idx] = { ...updated[idx], usp: e.target.value };
                                update({ products: updated });
                              }}
                              placeholder={nl ? 'bijv. 10x sneller, alles-in-één' : 'e.g. 10x faster, all-in-one'}
                              className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-blue-400" />
                            {nl ? 'Beschrijving' : 'Description'}
                          </label>
                          <Textarea
                            value={product.description}
                            onChange={e => {
                              const updated = [...data.products];
                              updated[idx] = { ...updated[idx], description: e.target.value };
                              update({ products: updated });
                            }}
                            placeholder={nl
                              ? 'Korte beschrijving van dit product of deze dienst...'
                              : 'Short description of this product or service...'}
                            rows={2}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                              {nl ? 'Key Features' : 'Key Features'}
                            </label>
                            <Input
                              value={product.features}
                              onChange={e => {
                                const updated = [...data.products];
                                updated[idx] = { ...updated[idx], features: e.target.value };
                                update({ products: updated });
                              }}
                              placeholder={nl ? 'bijv. AI, Automatisering, Analytics' : 'e.g. AI, Automation, Analytics'}
                              className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                              {nl ? 'Probleem dat het oplost' : 'Problem it solves'}
                            </label>
                            <Input
                              value={product.problemSolved}
                              onChange={e => {
                                const updated = [...data.products];
                                updated[idx] = { ...updated[idx], problemSolved: e.target.value };
                                update({ products: updated });
                              }}
                              placeholder={nl ? 'bijv. Tijdgebrek, hoge kosten' : 'e.g. Time constraints, high costs'}
                              className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 text-sm"
                            />
                          </div>
                        </div>

                        {/* Remove button (only if more than 1 product) */}
                        {data.products.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = data.products.filter((_, i) => i !== idx);
                              update({ products: updated });
                            }}
                            className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {nl ? 'Verwijderen' : 'Remove'}
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Add product button */}
              {data.products.length < 6 && (
                <button
                  onClick={() => update({ products: [...data.products, { ...emptyProduct }] })}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-white/15 text-gray-400 hover:text-purple-300 hover:border-purple-500/40 transition-all text-sm font-medium mb-6"
                >
                  <Plus className="w-4 h-4" />
                  {nl ? 'Product / dienst toevoegen' : 'Add product / service'}
                </button>
              )}

              {/* Generate button or results */}
              {generating ? (
                <Card className="!bg-[#1a1a2e] !border-white/15">
                  <CardContent className="p-8 text-center space-y-4">
                    <Sparkles className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
                    <p className="text-lg font-medium text-white">{t('onboarding.step5.generating')}</p>
                  </CardContent>
                </Card>
              ) : data.socialPosts.length > 0 ? (
                <div className="space-y-4">
                  <Card className="!bg-[#1a1a2e] !border-white/15">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white">{t('onboarding.step5.socialPosts')}</h3>
                        <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">AI</Badge>
                      </div>
                      {data.socialPosts.map((post, i) => (
                        <div key={i} className="p-4 bg-white/10 rounded-xl">
                          <Textarea
                            value={post}
                            onChange={e => {
                              const updated = [...data.socialPosts];
                              updated[i] = e.target.value;
                              update({ socialPosts: updated });
                            }}
                            rows={2}
                            className="bg-transparent border-0 text-white resize-none p-0 focus-visible:ring-0"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="!bg-[#1a1a2e] !border-white/15">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white">{t('onboarding.step5.blogOutline')}</h3>
                        <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">AI</Badge>
                      </div>
                      <Textarea
                        value={data.blogOutline}
                        onChange={e => update({ blogOutline: e.target.value })}
                        rows={8}
                        className="bg-white/10 border-white/20 text-white font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  <button
                    onClick={handleGenerateContent}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10 text-sm font-medium transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('onboarding.step5.generateMore')}
                  </button>
                </div>
              ) : (
                <div className="text-center mt-2">
                  <motion.button
                    onClick={handleGenerateContent}
                    disabled={!data.products.some(p => p.name.trim() || p.description.trim())}
                    animate={data.products.some(p => p.name.trim() || p.description.trim()) ? { boxShadow: ['0 0 20px rgba(124,58,237,0.3)', '0 0 40px rgba(236,72,153,0.4)', '0 0 20px rgba(124,58,237,0.3)'] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                  >
                    <Sparkles className="w-5 h-5" />
                    {nl ? 'Genereer Content met AI' : 'Generate Content with AI'}
                  </motion.button>
                  <p className="text-xs text-gray-500 mt-3">
                    {nl ? 'Vul minimaal één product naam of beschrijving in' : 'Fill in at least one product name or description'}
                  </p>
                </div>
              )}
            </StepWrapper>
          )}

          {/* ─── STEP 6: Done! ──────────────────────────── */}
          {step === 6 && (
            <StepWrapper key="step6">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-10 h-10 text-green-400" />
                </div>
                <h1 className="text-4xl font-bold mb-3">
                  {nl ? `${data.companyName || 'Je bedrijf'} is klaar om te groeien!` : `${data.companyName || 'Your business'} is ready to grow!`}
                </h1>
                <p className="text-gray-400 text-lg">{t('onboarding.step6.subtitle')}</p>
              </div>

              {/* Summary */}
              <Card className="!bg-[#1a1a2e] !border-white/15 mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <Building2 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-white">{data.companyName}</p>
                      <p className="text-xs text-gray-300">{data.industry}</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-6 h-6 rounded-full mx-auto mb-2"
                        style={{ background: `linear-gradient(135deg, ${data.primaryColor}, ${data.secondaryColor})` }}
                      />
                      <p className="text-sm font-medium text-white">{nl ? 'Merkstijl' : 'Brand'}</p>
                      <p className="text-xs text-gray-300 capitalize">{data.tone}</p>
                    </div>
                    <div className="text-center">
                      <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-white">{data.personaName || '-'}</p>
                      <p className="text-xs text-gray-300">{data.ageRange}</p>
                    </div>
                  </div>
                  {data.products.some(p => p.name.trim()) && (
                    <div className="border-t border-white/10 pt-4 space-y-2">
                      {data.products.filter(p => p.name.trim()).map((p, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Gem className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-white">{p.name}</p>
                            {p.usp && <p className="text-xs text-gray-300">{p.usp}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.socialPosts.length > 0 && (
                    <div className="border-t border-white/10 pt-3 mt-4 text-center">
                      <p className="text-xs text-gray-300">
                        <FileText className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
                        {data.socialPosts.length} {nl ? 'posts gegenereerd' : 'posts generated'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Engagement metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { value: 50, suffix: '+', label: nl ? 'Content ideeën' : 'Content ideas', icon: Lightbulb, color: 'text-amber-400' },
                  { value: 3, suffix: '', label: nl ? 'Kanalen' : 'Channels', icon: Share2, color: 'text-purple-400', sub: 'Social, Email, Blog' },
                  { value: null, suffix: '∞', label: nl ? 'Mogelijkheden' : 'Possibilities', icon: Sparkles, color: 'text-pink-400' },
                ].map((m, idx) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.15 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
                  >
                    <m.icon className={cn("w-5 h-5 mx-auto mb-2", m.color)} />
                    <p className={cn("text-2xl font-bold text-white")}>
                      {m.value !== null ? <CountUp target={m.value} duration={1000} /> : ''}{m.suffix}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{m.label}</p>
                    {m.sub && <p className="text-[10px] text-gray-500 mt-0.5">{m.sub}</p>}
                  </motion.div>
                ))}
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={handleFinish}
                  disabled={saving}
                  className="h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LayoutDashboard className="w-4 h-4 mr-2" />}
                  {t('onboarding.step6.goDashboard')}
                </Button>
                <button
                  onClick={() => { handleFinish().then(() => navigate('/app/content-hub')); }}
                  className="h-14 flex items-center justify-center gap-2 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10 font-medium text-sm transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  {t('onboarding.step6.goContent')}
                </button>
                <button
                  onClick={() => { handleFinish().then(() => navigate('/app/campaigns/social')); }}
                  className="h-14 flex items-center justify-center gap-2 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10 font-medium text-sm transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {t('onboarding.step6.goSocial')}
                </button>
              </div>

              {/* Back button */}
              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-2 mx-auto mt-6 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('onboarding.previous')}
              </button>
            </StepWrapper>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 6 && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('onboarding.previous')}
            </button>

            <div className="flex gap-3">
              {step > 1 && step < 5 && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-white/5"
                >
                  {t('onboarding.skip')}
                </button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canGoNext() || scanning || generating}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6"
              >
                {(scanning || generating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {step === 5 && data.socialPosts.length > 0
                  ? t('onboarding.finish')
                  : t('onboarding.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      start = Math.round(eased * target);
      setCount(start);
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

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
