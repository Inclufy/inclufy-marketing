// src/components/setup-agent/StepPreviewCards.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Globe, Users, Target, Zap, Brain, FileText, Star, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
  WebsiteAnalysis,
  ExtendedWebsiteAnalysis,
  ProductInfo,
  AudienceDetailed,
  ScanScores,
  CompetitorResult,
  StrategyObjective,
  IntegrationResult,
  PersonaResult,
  TemplateResult,
} from '@/services/setup-agent/types';

const cardAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// ─── Brand Preview ────────────────────────────────────────────────
export function BrandPreviewCard({ data }: { data: WebsiteAnalysis }) {
  return (
    <motion.div {...cardAnim} className="rounded-lg border border-purple-200 bg-white dark:bg-gray-900 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-purple-600" />
        <span className="font-semibold text-sm">{data.brand_name}</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{data.description}</p>
      <div className="flex gap-2">
        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: data.primary_color }} />
        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: data.secondary_color }} />
        <span className="text-xs text-gray-500">{data.industry} &middot; {data.tone}</span>
      </div>
      {data.usps.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.usps.slice(0, 3).map((usp, i) => (
            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{usp}</Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Competitor Preview ───────────────────────────────────────────
export function CompetitorPreviewCard({ data }: { data: CompetitorResult }) {
  return (
    <motion.div {...cardAnim} className="rounded-lg border border-purple-200 bg-white dark:bg-gray-900 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{data.name}</span>
        <Badge variant="outline" className="text-[10px]">concurrent</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-medium text-green-600 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Sterktes
          </p>
          {data.strengths.slice(0, 2).map((s, i) => (
            <p key={i} className="text-[10px] text-gray-600 dark:text-gray-400 truncate">• {s}</p>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-medium text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Zwaktes
          </p>
          {data.weaknesses.slice(0, 2).map((w, i) => (
            <p key={i} className="text-[10px] text-gray-600 dark:text-gray-400 truncate">• {w}</p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Strategy Preview ─────────────────────────────────────────────
export function StrategyPreviewCard({ data }: { data: StrategyObjective }) {
  const priorityColor = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }[data.priority] || 'bg-gray-100 text-gray-700';

  return (
    <motion.div {...cardAnim} className="rounded-lg border border-purple-200 bg-white dark:bg-gray-900 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs">{data.title}</span>
        <Badge className={`text-[10px] px-1.5 py-0 ${priorityColor}`}>{data.priority}</Badge>
      </div>
      <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2">{data.description}</p>
      <div className="flex items-center gap-2 text-[10px] text-gray-500">
        <Target className="w-3 h-3" />
        <span>{data.target_value} {data.unit}</span>
      </div>
    </motion.div>
  );
}

// ─── Integration Preview ──────────────────────────────────────────
export function IntegrationPreviewCard({ data }: { data: IntegrationResult }) {
  return (
    <motion.div {...cardAnim} className="rounded-lg border border-purple-200 bg-white dark:bg-gray-900 p-2 flex items-center gap-2">
      <Zap className="w-4 h-4 text-purple-600 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{data.display_name}</p>
        <p className="text-[10px] text-gray-500 truncate">{data.reason}</p>
      </div>
      {data.priority === 'must_have' && (
        <Badge className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0 shrink-0">must-have</Badge>
      )}
    </motion.div>
  );
}

// ─── Persona Preview ──────────────────────────────────────────────
export function PersonaPreviewCard({ data }: { data: PersonaResult }) {
  return (
    <motion.div {...cardAnim} className="rounded-lg border border-purple-200 bg-white dark:bg-gray-900 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
          {data.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-xs">{data.name}</p>
          <p className="text-[10px] text-gray-500">
            {data.demographics?.occupation || data.demographics?.job_title}
          </p>
        </div>
      </div>
      {data.behavioral?.pain_points && (
        <div>
          <p className="text-[10px] font-medium text-gray-600">Pijnpunten:</p>
          {(Array.isArray(data.behavioral.pain_points) ? data.behavioral.pain_points : []).slice(0, 2).map((p: string, i: number) => (
            <p key={i} className="text-[10px] text-gray-500 truncate">• {p}</p>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Template Preview ─────────────────────────────────────────────
export function TemplatePreviewCard({ data }: { data: TemplateResult }) {
  return (
    <motion.div {...cardAnim} className="rounded-lg border border-purple-200 bg-white dark:bg-gray-900 p-2 flex items-center gap-2">
      <FileText className="w-4 h-4 text-purple-600 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{data.name}</p>
        <p className="text-[10px] text-gray-500">{data.content_type} &middot; {data.category}</p>
      </div>
    </motion.div>
  );
}

// ─── Extended Brand Preview (for onboarding full-page mode) ──────
export function ExtendedBrandPreviewCard({ data, scanScores }: { data: ExtendedWebsiteAnalysis; scanScores?: ScanScores | null }) {
  return (
    <motion.div {...cardAnim} className="rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: `linear-gradient(135deg, ${data.primary_color}, ${data.secondary_color})` }}>
            {data.brand_name?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="font-bold text-base">{data.brand_name}</h3>
            {data.tagline && <p className="text-xs text-gray-500 italic">{data.tagline}</p>}
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: data.primary_color }} title="Primary" />
          <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: data.secondary_color }} title="Secondary" />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400">{data.description}</p>

      {/* Industry + Tone */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-xs">{data.industry}</Badge>
        <Badge variant="outline" className="text-xs">{data.tone}</Badge>
        {data.mission && <Badge variant="outline" className="text-xs">Missie</Badge>}
      </div>

      {/* Mission */}
      {data.mission && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-[11px] font-medium text-purple-700 dark:text-purple-300 mb-1">Missie</p>
          <p className="text-xs text-gray-700 dark:text-gray-300">{data.mission}</p>
        </div>
      )}

      {/* USPs + Values */}
      <div className="grid grid-cols-2 gap-3">
        {data.usps?.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">USPs</p>
            {data.usps.slice(0, 4).map((usp, i) => (
              <p key={i} className="text-[11px] text-gray-500 truncate">• {usp}</p>
            ))}
          </div>
        )}
        {data.brand_values?.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Waarden</p>
            <div className="flex flex-wrap gap-1">
              {data.brand_values.map((v, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{v}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scan Scores */}
      {scanScores && scanScores.scanScore > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-2">Website Score</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Overall', value: scanScores.scanScore },
              { label: 'SEO', value: scanScores.scanSeo },
              { label: 'Content', value: scanScores.scanContent },
              { label: 'Performance', value: scanScores.scanPerformance },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className={`text-lg font-bold ${value >= 70 ? 'text-green-600' : value >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{value}</p>
                <p className="text-[10px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social URLs */}
      {data.social_urls && Object.values(data.social_urls).some(Boolean) && (
        <div>
          <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Gevonden Social Media</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.social_urls).filter(([, url]) => url).map(([platform]) => (
              <Badge key={platform} variant="outline" className="text-[10px] capitalize">{platform}</Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Product Preview Card ────────────────────────────────────────
export function ProductPreviewCard({ data }: { data: ProductInfo }) {
  return (
    <motion.div {...cardAnim} className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-sm">{data.name}</span>
      </div>
      {data.description && <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{data.description}</p>}
      {data.usp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1">
          <p className="text-[10px] text-blue-700 dark:text-blue-300">USP: {data.usp}</p>
        </div>
      )}
      {data.features && (
        <div className="flex flex-wrap gap-1">
          {data.features.split(',').slice(0, 4).map((f, i) => (
            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{f.trim()}</Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Audience Preview Card ───────────────────────────────────────
export function AudiencePreviewCard({ data }: { data: AudienceDetailed }) {
  return (
    <motion.div {...cardAnim} className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-sm">{data.idealCustomer || 'Doelgroep'}</span>
        </div>
        <Badge variant={data.audienceType === 'B2B' ? 'default' : 'secondary'} className="text-[10px]">
          {data.audienceType}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-gray-600 dark:text-gray-400">
        {data.customerSector && <p>Sector: {data.customerSector}</p>}
        {data.companySize && <p>Grootte: {data.companySize}</p>}
        {data.ageGroup && <p>Leeftijd: {data.ageGroup}</p>}
        {data.occupation && <p>Functie: {data.occupation}</p>}
      </div>
      {data.painPoints && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded px-2 py-1">
          <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Pijnpunten: {data.painPoints}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Summary Card (onboarding completion overview) ───────────────
export function OnboardingSummaryCard({
  brandName,
  industry,
  primaryColor,
  secondaryColor,
  productsCount,
  audiencesCount,
  competitorsCount,
  personasCount,
  objectivesCount,
  templatesCount,
  integrationsCount,
}: {
  brandName: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  productsCount: number;
  audiencesCount: number;
  competitorsCount: number;
  personasCount: number;
  objectivesCount: number;
  templatesCount: number;
  integrationsCount: number;
}) {
  const items = [
    { label: 'Producten', count: productsCount, icon: Star },
    { label: 'Doelgroepen', count: audiencesCount, icon: Users },
    { label: 'Concurrenten', count: competitorsCount, icon: Shield },
    { label: "Persona's", count: personasCount, icon: Brain },
    { label: 'Doelen', count: objectivesCount, icon: Target },
    { label: 'Templates', count: templatesCount, icon: FileText },
    { label: 'Integraties', count: integrationsCount, icon: Zap },
  ].filter(i => i.count > 0);

  return (
    <motion.div {...cardAnim} className="rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 md:p-6 space-y-4">
      {/* Brand header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
          {brandName.charAt(0)}
        </div>
        <div>
          <h3 className="font-bold text-lg">{brandName}</h3>
          <p className="text-xs text-gray-500">{industry}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map(({ label, count, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center shadow-sm">
            <Icon className="w-4 h-4 mx-auto mb-1 text-purple-600" />
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{count}</p>
            <p className="text-[10px] text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Check mark */}
      <div className="flex items-center gap-2 text-green-600">
        <Check className="w-5 h-5" />
        <span className="text-sm font-medium">Platform volledig geconfigureerd</span>
      </div>
    </motion.div>
  );
}
