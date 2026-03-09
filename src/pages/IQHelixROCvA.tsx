// src/pages/IQHelixROCvA.tsx
// IQ Helix Proposition for ROCvA — Talent Compass Use Case

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Brain,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  ArrowRight,
  Check,
  AlertTriangle,
  Lightbulb,
  Rocket,
  ChevronDown,
  ChevronUp,
  Calculator,
  BookOpen,
  Shield,
  Sparkles,
  Building2,
  ClipboardCheck,
  LineChart,
  Download,
  Loader2,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PresentationSlides from './IQHelixPresentationExport';

// ─── Animation Variants ───────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

// ─── ROI Calculator ───────────────────────────────────────────────────────
function ROICalculator() {
  const [participants, setParticipants] = useState(100);
  const [expanded, setExpanded] = useState(false);

  const uitvalPercentage = 0.20;
  const kostenPerUitval = 12500;
  const reductieIQHelix = 0.30;
  const kostenPerAssessment = 89;

  const huidigUitval = Math.round(participants * uitvalPercentage);
  const voorkomenUitval = Math.round(huidigUitval * reductieIQHelix);
  const besparingUitval = voorkomenUitval * kostenPerUitval;
  const investering = participants * kostenPerAssessment;
  const nettoROI = besparingUitval - investering;
  const roiPercentage = Math.round((nettoROI / investering) * 100);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <Calculator className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">ROI Calculator</h3>
      </div>

      <div className="mb-8">
        <label className="block text-sm text-gray-600 mb-2">Aantal deelnemers</label>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={participants}
          onChange={(e) => setParticipants(Number(e.target.value))}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>50</span>
          <span className="text-emerald-400 font-bold text-lg">{participants}</span>
          <span>500</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{huidigUitval}</p>
          <p className="text-xs text-gray-600 mt-1">Huidige uitval (20%)</p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{voorkomenUitval}</p>
          <p className="text-xs text-gray-600 mt-1">Voorkomen uitval</p>
        </div>
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">&euro;{investering.toLocaleString('nl-NL')}</p>
          <p className="text-xs text-gray-600 mt-1">Investering</p>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">&euro;{nettoROI.toLocaleString('nl-NL')}</p>
          <p className="text-xs text-gray-600 mt-1">Netto besparing</p>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 p-6 text-center">
        <p className="text-sm text-emerald-300 mb-1">Return on Investment</p>
        <p className="text-5xl font-black text-emerald-400">{roiPercentage}%</p>
        <p className="text-sm text-gray-600 mt-2">
          Besparing van <span className="text-gray-900 font-semibold">&euro;{besparingUitval.toLocaleString('nl-NL')}</span> op een investering van <span className="text-gray-900 font-semibold">&euro;{investering.toLocaleString('nl-NL')}</span>
        </p>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        data-roi-expand={expanded ? 'expanded' : 'collapsed'}
        className="flex items-center gap-2 mt-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Berekeningsdetails
      </button>
      {expanded && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600 space-y-2">
          <p>Gemiddeld uitvalpercentage MBO eerste jaar: <span className="text-gray-900">20%</span></p>
          <p>Geschatte kosten per uitvaller (herinschrijving, begeleiding, verloren bekostiging): <span className="text-gray-900">&euro;12.500</span></p>
          <p>Verwachte uitvalreductie door datagedreven intake: <span className="text-gray-900">30%</span></p>
          <p>Kosten per IQ Helix assessment: <span className="text-gray-900">&euro;89</span></p>
          <p className="pt-2 border-t border-gray-100">
            Formule: (Voorkomen uitval &times; Kosten per uitvaller) - (Deelnemers &times; Assessment kosten) = Netto ROI
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── PDF Export (Presentation Slides) ─────────────────────────────────────
function usePdfExport() {
  const contentRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportPdf = useCallback(async () => {
    if (!slidesRef.current || exporting) return;
    setExporting(true);

    try {
      // Dynamic imports for code-splitting
      const html2canvasMod = await import('html2canvas');
      const html2canvas = html2canvasMod.default;
      const { jsPDF } = await import('jspdf');

      const container = slidesRef.current;
      const slides = container.querySelectorAll('.presentation-slide');
      const slideCount = slides.length;
      if (slideCount === 0) {
        console.error('No presentation slides found');
        setExporting(false);
        return;
      }

      // Move entire container on-screen for one single capture (much faster)
      const origStyle = container.style.cssText;
      container.style.cssText = 'position:fixed; left:0; top:0; z-index:-1; width:1280px; pointer-events:none;';
      await new Promise(r => setTimeout(r, 200));

      // Single capture of the entire stacked container (1280 × slideCount*720)
      const fullCanvas = await html2canvas(container, {
        scale: 1,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1280,
        height: slideCount * 720,
      });

      // Restore hidden container immediately
      container.style.cssText = origStyle;

      // 16:9 landscape format (mm)
      const pageW = 338.67;
      const pageH = 190.5;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [pageH, pageW] });

      // Slice the full canvas into individual slide images
      for (let i = 0; i < slideCount; i++) {
        const slideCanvas = document.createElement('canvas');
        slideCanvas.width = 1280;
        slideCanvas.height = 720;
        const ctx = slideCanvas.getContext('2d')!;
        ctx.drawImage(fullCanvas, 0, i * 720, 1280, 720, 0, 0, 1280, 720);

        const imgData = slideCanvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) pdf.addPage([pageH, pageW], 'landscape');
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
      }

      pdf.save('IQ-Helix-ROCvA-Presentatie.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  return { contentRef, slidesRef, exporting, exportPdf };
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function IQHelixROCvA() {
  const { contentRef, slidesRef, exporting, exportPdf } = usePdfExport();

  return (
    <div className="min-h-screen bg-white text-gray-900" ref={contentRef}>
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                USE CASE
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                ROC van Amsterdam
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
              IQ Helix bij het{' '}
              <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-400 bg-clip-text text-transparent">
                Loopbaan Expertise Centrum
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mb-8">
              Datagedreven Loopbaan & Assessment Platform voor objectieve studiekeuze, uitvalreductie en talentontwikkeling.
            </p>
            <div className="flex flex-wrap gap-4 pdf-export-hide">
              <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold px-8">
                Pilot Aanvragen <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={exportPdf}
                disabled={exporting}
              >
                {exporting ? (
                  <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Presentatie genereren...</>
                ) : (
                  <><FileDown className="mr-2 w-4 h-4" /> Export Presentatie</>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── IQ HELIX PLATFORM — Product Screenshots ────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/10">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold">IQ Helix Platform</h2>
            </div>
            <p className="text-gray-600 mb-8">Bekijk het daadwerkelijke platform — van student dashboard tot analytics.</p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {/* Student Dashboard */}
              <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden group hover:border-red-500/30 transition-colors">
                <div className="h-40 overflow-hidden bg-gray-100 border-b border-gray-100">
                  <img src="/cases/iqhelix-student-dashboard.png" alt="Student Dashboard"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-red-400" />
                    <h3 className="font-semibold text-gray-900">Student Dashboard</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Persoonlijk overzicht met voltooide assessments, scores, deadlines en recente activiteit.</p>
                  <div className="space-y-1">
                    {['Assessment overzicht', 'Score tracking (100%)', 'Deadlines & planning', 'Recente activiteit feed'].map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                        <Check className="w-3 h-3 text-red-400" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Assessment Beheer */}
              <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden group hover:border-sky-500/30 transition-colors">
                <div className="h-40 overflow-hidden bg-gray-100 border-b border-gray-100">
                  <img src="/cases/iqhelix-admin-portal.png" alt="Admin Portal"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="w-4 h-4 text-sky-400" />
                    <h3 className="font-semibold text-gray-900">Assessment Beheer</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Beheer, creeer en deel assessments met QR-codes, AI-generatie en marketplace templates.</p>
                  <div className="space-y-1">
                    {['QR-code distributie', 'AI Generate assessments', 'Marketplace (16+ templates)', 'Toewijzen & delen'].map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                        <Check className="w-3 h-3 text-sky-400" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Analytics Dashboard */}
              <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="h-40 overflow-hidden bg-gray-100 border-b border-gray-100">
                  <img src="/cases/iqhelix-analytics.png" alt="Analytics Dashboard"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-gray-900">Analytics Dashboard</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Overzicht van gebruikersactiviteit, engagement levels, top performers en completions.</p>
                  <div className="space-y-1">
                    {['User engagement metrics', 'Top performers leaderboard', 'Completions per assessment', '81% active users ratio'].map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                        <Check className="w-3 h-3 text-emerald-400" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Assessment Ervaring */}
              <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden group hover:border-amber-500/30 transition-colors">
                <div className="h-40 overflow-hidden bg-gray-100 border-b border-gray-100">
                  <img src="/cases/iqhelix-competency.png" alt="Assessment Ervaring"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-gray-900">Assessment Ervaring</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Interactieve assessments met Likert-schalen, competentiecategorieen en voortgangsindicatie.</p>
                  <div className="space-y-1">
                    {['Likert-schaal vragen', 'Competentie categorieen', 'Voortgangsbalk', 'Automatisch opslaan'].map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                        <Check className="w-3 h-3 text-amber-400" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Campaign Resultaten */}
              <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden group hover:border-rose-500/30 transition-colors">
                <div className="h-40 overflow-hidden bg-gray-100 border-b border-gray-100">
                  <img src="/cases/iqhelix-campaign.png" alt="Campaign Results"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <LineChart className="w-4 h-4 text-rose-400" />
                    <h3 className="font-semibold text-gray-900">Campaign Resultaten</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Gedetailleerde resultaatanalyse per campagne met score verdeling per afdeling en rol.</p>
                  <div className="space-y-1">
                    {['Voortgang status', 'Score verdeling', 'Resultaten per afdeling', 'Resultaten per rol'].map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                        <Check className="w-3 h-3 text-rose-400" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Assessment Start */}
              <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden group hover:border-indigo-500/30 transition-colors">
                <div className="h-40 overflow-hidden bg-gray-100 border-b border-gray-100">
                  <img src="/cases/iqhelix-assessment-start.png" alt="Assessment Start"
                    className="w-full h-full object-cover object-center opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-semibold text-gray-900">Assessment Starten</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Eenvoudig assessments starten met duidelijke instructies, vraagaantal en automatisch herstel.</p>
                  <div className="space-y-1">
                    {['45 vragen per assessment', 'Gratis assessment optie', 'Automatisch opslaan', 'Direct starten'].map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                        <Check className="w-3 h-3 text-indigo-400" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Platform stats bar */}
            <div className="rounded-2xl bg-gradient-to-r from-red-500/10 via-sky-500/10 to-emerald-500/10 border border-gray-200 p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-red-400">19</p>
                  <p className="text-xs text-gray-500 mt-1">Live Participants</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">100%</p>
                  <p className="text-xs text-gray-500 mt-1">Completion Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-sky-400">5.2</p>
                  <p className="text-xs text-gray-500 mt-1">Avg Assessments/User</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">16+</p>
                  <p className="text-xs text-gray-500 mt-1">Marketplace Templates</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-rose-400">81%</p>
                  <p className="text-xs text-gray-500 mt-1">Active Users</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEITEN ──────────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-orange-500/10">
                <BarChart3 className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-3xl font-bold">Feiten & Context</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                <p className="text-4xl font-black text-red-400">370.000</p>
                <p className="text-sm text-gray-600 mt-2">MBO-studenten in Nederland</p>
              </motion.div>
              <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 text-center">
                <p className="text-4xl font-black text-orange-400">22.000+</p>
                <p className="text-sm text-gray-600 mt-2">Voortijdig stoppende studenten per jaar</p>
              </motion.div>
              <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                <p className="text-4xl font-black text-amber-400">20%</p>
                <p className="text-sm text-gray-600 mt-2">Uitval in het eerste studiejaar</p>
              </motion.div>
            </div>

            {/* Uitval per niveau */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Niveau 2</p>
                <p className="text-3xl font-black text-gray-900">40%</p>
                <p className="text-xs text-gray-500 mt-1">uitval zonder diploma</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Niveau 3</p>
                <p className="text-3xl font-black text-gray-900">21%</p>
                <p className="text-xs text-gray-500 mt-1">uitval</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Niveau 4</p>
                <p className="text-3xl font-black text-gray-900">18%</p>
                <p className="text-xs text-gray-500 mt-1">uitval</p>
              </div>
            </div>

            {/* Oorzaken */}
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold">Veel voorkomende oorzaken van studie-uitval</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {['Verkeerde studiekeuze', 'Gebrek aan motivatie of studierichting die niet past', 'Persoonlijke of mentale problemen', 'Financiele of sociale omstandigheden', 'Leerproblemen zoals dyslexie of dyscalculie'].map((cause, i) => (
                  <div key={i} className="flex items-start gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                    <span className="text-sm">{cause}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PROBLEEMSTELLING ────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold">Probleemstelling</h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-gray-200 p-8 mb-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                Het ROC van Amsterdam begeleidt jaarlijks duizenden mbo-studenten richting een opleiding en toekomstige loopbaan.
                Ondanks intensieve begeleiding blijkt dat de studiekeuze voor veel studenten een complexe beslissing blijft.
                Honderden studenten per jaar verlaten hun opleiding vroegtijdig of wisselen van studie.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Voor studenten */}
                <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-orange-400" />
                    <h4 className="font-semibold text-gray-900">Voor studenten</h4>
                  </div>
                  <ul className="space-y-2">
                    {['Vertraging in studie en carriere', 'Verlies van motivatie en zelfvertrouwen', 'Verhoogd risico op voortijdig schoolverlaten'].map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Voor onderwijsinstellingen */}
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    <h4 className="font-semibold text-gray-900">Voor onderwijsinstellingen</h4>
                  </div>
                  <ul className="space-y-2">
                    {['Verlies van onderwijscapaciteit', 'Hogere begeleidingskosten', 'Inefficiente instroom en doorstroom'].map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Voor de samenleving */}
                <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-orange-400" />
                    <h4 className="font-semibold text-gray-900">Voor de samenleving</h4>
                  </div>
                  <ul className="space-y-2">
                    {['Lagere arbeidsparticipatie', 'Hogere maatschappelijke kosten', 'Onbenut talent en potentieel'].map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Kernuitdagingen LEC */}
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Uitdagingen voor het Loopbaan Expertise Centrum</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {['Intakegesprekken zijn subjectief en afhankelijk van ervaring adviseurs', 'Beperkt inzicht in talenten en cognitieve capaciteiten van studenten', 'Loopbaanadviseurs besteden veel tijd aan basisintakes', 'Weinig centrale datagedreven analyse van studenttalent en cohortontwikkelingen'].map((challenge, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{challenge}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── OPLOSSING — IQ HELIX ───────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-red-500/10">
                <Lightbulb className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold">Oplossing: IQ Helix</h2>
            </div>

            <p className="text-gray-600 max-w-3xl mb-8">
              IQ Helix introduceert een datagedreven talent- en skillanalyse voorafgaand aan het loopbaangesprek.
              Studenten krijgen een online assessment waarmee objectief inzicht ontstaat in hun capaciteiten en potentieel.
            </p>

            {/* Assessment modules */}
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
              <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                <div className="inline-flex p-2 rounded-lg bg-red-500/10 mb-2"><Brain className="w-5 h-5 text-red-400" /></div>
                <p className="text-sm text-gray-700">Cognitieve capaciteiten</p>
              </motion.div>
              <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
                <div className="inline-flex p-2 rounded-lg bg-rose-500/10 mb-2"><Target className="w-5 h-5 text-rose-400" /></div>
                <p className="text-sm text-gray-700">Motivatie & werkvoorkeuren</p>
              </motion.div>
              <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-center">
                <div className="inline-flex p-2 rounded-lg bg-sky-500/10 mb-2"><TrendingUp className="w-5 h-5 text-sky-400" /></div>
                <p className="text-sm text-gray-700">Leerpotentieel</p>
              </motion.div>
              <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <div className="inline-flex p-2 rounded-lg bg-emerald-500/10 mb-2"><Users className="w-5 h-5 text-emerald-400" /></div>
                <p className="text-sm text-gray-700">Talentprofielen</p>
              </motion.div>
              <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                <div className="inline-flex p-2 rounded-lg bg-amber-500/10 mb-2"><ClipboardCheck className="w-5 h-5 text-amber-400" /></div>
                <p className="text-sm text-gray-700">Match opleidingen & beroepen</p>
              </motion.div>
            </div>

            {/* Before vs After */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 mb-8">
              <p className="text-sm text-gray-600 mb-4">Het gesprek tussen student en LEC-adviseur verschuift van:</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl bg-gray-500/5 border border-gray-500/20 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-600 text-xs font-bold">&#10005;</div>
                    <span className="text-sm font-medium text-gray-700">Voorheen</span>
                  </div>
                  <p className="text-lg italic text-gray-600">"Wat denk je dat bij je past?"</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">&#10003;</div>
                    <span className="text-sm font-medium text-emerald-300">Met IQ Helix</span>
                  </div>
                  <p className="text-lg italic text-gray-700">"Dit zijn jouw gemeten talenten en ontwikkelpotentieel."</p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <h3 className="text-xl font-semibold mb-4">Dit leidt tot:</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="p-2 rounded-lg bg-red-500/10"><Target className="w-4 h-4 text-red-400" /></div>
                <span className="text-sm text-gray-700">Betere studiekeuzes</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="p-2 rounded-lg bg-red-500/10"><Sparkles className="w-4 h-4 text-red-400" /></div>
                <span className="text-sm text-gray-700">Meer zelfinzicht bij studenten</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="p-2 rounded-lg bg-red-500/10"><Rocket className="w-4 h-4 text-red-400" /></div>
                <span className="text-sm text-gray-700">Efficientere begeleiding</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="p-2 rounded-lg bg-red-500/10"><Shield className="w-4 h-4 text-red-400" /></div>
                <span className="text-sm text-gray-700">Lagere studie-uitval</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── IMPLEMENTATIE — 3 STAPPEN ──────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-sky-500/10">
                <Rocket className="w-6 h-6 text-sky-400" />
              </div>
              <h2 className="text-3xl font-bold">Implementatie: Van Intake &rarr; Inzicht &rarr; Impact</h2>
            </div>

            <div className="space-y-6">
              {/* Stap 01 */}
              <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Stap 01</p>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Intake — Digitale Talentanalyse</h3>
                    <p className="text-gray-600 mb-4">Nieuwe studenten ontvangen voorafgaand aan hun loopbaangesprek een online assessment.</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['Cognitieve capaciteiten', 'Leerpotentieel', 'Motivatie en interesses', 'Werkvoorkeuren'].map((item, j) => (
                        <span key={j} className="px-3 py-1 rounded-full text-xs bg-gray-100 border border-gray-200 text-gray-700">{item}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-300">
                      <Check className="w-4 h-4" />Persoonlijk talentdashboard voor student en adviseur.
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stap 02 */}
              <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
                    <LineChart className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Stap 02</p>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Inzicht — Datagedreven Loopbaangesprek</h3>
                    <p className="text-gray-600 mb-4">Het gesprek verandert van een subjectieve intake naar een gesprek gebaseerd op data.</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['Betere studiekeuze', 'Meer zelfinzicht', 'Hogere motivatie'].map((item, j) => (
                        <span key={j} className="px-3 py-1 rounded-full text-xs bg-gray-100 border border-gray-200 text-gray-700">{item}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-sky-300">
                      <Check className="w-4 h-4" />Van subjectief naar datagedreven studieadvies.
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stap 03 */}
              <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Stap 03</p>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Impact — Strategische Inzichten voor het ROC</h3>
                    <p className="text-gray-600 mb-4">Geanonimiseerde cohortdata leveren waardevolle inzichten voor beleid.</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['Talentverdeling binnen opleidingen', 'Uitvalrisico per cohort', 'Skill-ontwikkeling binnen domeinen', 'Aansluiting op regionale arbeidsmarkt'].map((item, j) => (
                        <span key={j} className="px-3 py-1 rounded-full text-xs bg-gray-100 border border-gray-200 text-gray-700">{item}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <Check className="w-4 h-4" />Van individuele begeleiding naar datagedreven onderwijsontwikkeling.
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── USE CASE ───────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <BookOpen className="w-6 h-6 text-rose-400" />
              </div>
              <h2 className="text-3xl font-bold">Use Case: MBO College Zuidoost</h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-red-500/5 to-rose-500/5 border border-gray-200 p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Situatie</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Binnen MBO College Zuidoost van ROC van Amsterdam is studentondersteuning een belangrijk onderdeel van het onderwijsconcept.
                    De studentenpopulatie is divers en kent uiteenlopende ondersteuningsbehoeften.
                  </p>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Het LEC werkt samen met:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Zorgcoordinatoren', 'Studentbegeleiders', 'Jeugdteams gemeente', 'Psychologische ondersteuning'].map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <Check className="w-3 h-3 text-red-400" />{p}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">IQ Helix Impact</h3>
                  <div className="space-y-3">
                    {[
                      'Objectieve talentanalyse voor elke student voorafgaand aan intake',
                      'Datagedreven matching met opleidingen en beroepen',
                      'Cohortinzichten voor beleidsmakers en management',
                      'Integratie met StudieMAX en WeekendCollege programma\'s',
                      'Vroegsignalering van uitvalrisico',
                    ].map((impact, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="p-0.5 rounded-full bg-emerald-500/20 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-sm text-gray-700">{impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── ROI BIJ 100 DEELNEMERS ─────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold">ROI bij 100 Deelnemers</h2>
            </div>
            <ROICalculator />
          </motion.div>
        </div>
      </section>

      {/* ── STRATEGISCHE WAARDE ────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-indigo-500/10">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold">Strategische Waarde</h2>
            </div>

            <p className="text-gray-600 mb-6">IQ Helix ondersteunt de kernambities van ROC van Amsterdam:</p>

            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {['Studiesuccesbeleid', 'LOB-doelstellingen', 'Regionale arbeidsmarktaansluiting', 'Datagedreven onderwijsontwikkeling', 'Doorstroom MBO → HBO', 'Leven Lang Ontwikkelen (LLO)'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 p-8 text-center">
              <p className="text-sm text-red-300 uppercase tracking-wider mb-2">Positionering</p>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">Talent & Skill Intelligence Hub</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Met IQ Helix kan het Loopbaan Expertise Centrum evolueren naar de Talent & Skill Intelligence Hub van het ROC van Amsterdam —
                waar studenten niet alleen een opleiding kiezen, maar een onderbouwde ontwikkelroute krijgen.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── NEXT STEPS ─────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <Rocket className="w-6 h-6 text-rose-400" />
              </div>
              <h2 className="text-3xl font-bold">Next Steps</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-lg mb-4">1</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pilot bij 1 domein</h3>
                <p className="text-sm text-gray-600">Start met een pilotproject bij bijvoorbeeld Zorg & Welzijn of Techniek. 100 studenten, 1 semester.</p>
              </motion.div>

              <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-lg mb-4">2</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Meting van uitval & tevredenheid</h3>
                <p className="text-sm text-gray-600">Meet studietevredenheid, uitvalcijfers en kwaliteit van studiekeuze versus controlegroep.</p>
              </motion.div>

              <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}
                className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg mb-4">3</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Opschaling ROC-breed</h3>
                <p className="text-sm text-gray-600">Bij bewezen resultaten uitrollen over alle domeinen en colleges van ROC van Amsterdam.</p>
              </motion.div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 via-red-700 to-gray-900 p-12 text-center">
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
                  Van Intake naar Inzicht. Van Inzicht naar Impact.
                </h3>
                <p className="text-white/70 mb-8 max-w-xl mx-auto">
                  IQ Helix — Skill Intelligence & Assessment Platform
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8">
                    Plan een Demo <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                    Neem Contact Op
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">&copy; 2026 IQ Helix. Alle rechten voorbehouden.</p>
      </footer>

      {/* Hidden presentation slides for PDF export */}
      <PresentationSlides ref={slidesRef} />

      {/* Floating PDF Export Button */}
      <div className="fixed bottom-6 right-6 z-50 pdf-export-hide">
        <button
          onClick={exportPdf}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold shadow-2xl shadow-red-500/25 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {exporting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Presentatie genereren...</>
          ) : (
            <><Download className="w-5 h-5" /> Export Presentatie</>
          )}
        </button>
      </div>
    </div>
  );
}
