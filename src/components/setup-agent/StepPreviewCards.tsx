// src/components/setup-agent/StepPreviewCards.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Globe, Users, Target, Zap, Brain, FileText, Star, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
  WebsiteAnalysis,
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
