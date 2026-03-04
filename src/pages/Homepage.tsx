// src/pages/Homepage.tsx
// Luxury landing page for Inclufy Marketing

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Brain,
  Target,
  Rocket,
  Users,
  BarChart3,
  ArrowRight,
  Check,
  Star,
  Globe,
  Shield,
  Mail,
  MessageSquare,
  FileText,
  Video,
  Megaphone,
  Layers,
  Lightbulb,
  TrendingUp,
  Palette,
  Bot,
  Search,
  PenTool,
  Send,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Animation Variants ───────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Data ─────────────────────────────────────────────────────────────────
const capabilities = [
  {
    icon: Brain,
    title: 'Brand Memory AI',
    desc: 'Your AI learns your brand voice, guidelines, and tone — every piece of content stays perfectly on-brand.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: PenTool,
    title: 'AI Content Studio',
    desc: 'Generate blog posts, ad copy, emails, product descriptions, and press releases in seconds.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    icon: Palette,
    title: 'Visual Generation',
    desc: 'Create marketing images, social graphics, and hero banners with AI — no design skills needed.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Send,
    title: 'Email Campaigns',
    desc: 'Build, send, and track email campaigns with AI-powered subject lines and A/B testing.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Search,
    title: 'Market Intelligence',
    desc: 'AI-driven competitive analysis, trend detection, and growth opportunity mapping.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  {
    icon: Bot,
    title: 'Marketing Automation',
    desc: 'Set up customer journeys, automated workflows, and conversational AI agents that run 24/7.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
];

const process = [
  {
    step: '01',
    title: 'Set Up Your Brand',
    desc: 'Import your brand guidelines, voice, audience, and goals. The AI learns everything about your business.',
    icon: Lightbulb,
  },
  {
    step: '02',
    title: 'Generate & Orchestrate',
    desc: 'Create content, launch campaigns, and automate workflows — all from a single intelligent dashboard.',
    icon: Layers,
  },
  {
    step: '03',
    title: 'Measure & Optimize',
    desc: 'Real-time analytics, growth blueprints, and AI recommendations to continuously improve performance.',
    icon: TrendingUp,
  },
];

const testimonials = [
  {
    name: 'Amara Osei',
    role: 'Head of Growth, Finova',
    quote: 'Inclufy cut our content production time by 80%. The brand memory feature means everything stays on-voice without manual review.',
    initials: 'AO',
  },
  {
    name: 'Daniel Reeves',
    role: 'CMO, Meridian Health',
    quote: 'The growth blueprint alone was worth the investment. We identified three untapped segments that now drive 40% of our pipeline.',
    initials: 'DR',
  },
  {
    name: 'Leila Nakamura',
    role: 'Marketing Director, Skyline SaaS',
    quote: 'We replaced four separate tools with Inclufy. Content, email, analytics, automation — all in one place with AI that actually understands our brand.',
    initials: 'LN',
  },
];

const stats = [
  { value: '10x', label: 'Faster Content' },
  { value: '80%', label: 'Less Manual Work' },
  { value: '3.2x', label: 'Average ROI' },
  { value: '24/7', label: 'AI Automation' },
];

const contentTypes = [
  { icon: FileText, label: 'Blog Posts' },
  { icon: Mail, label: 'Email Campaigns' },
  { icon: MessageSquare, label: 'Social Media' },
  { icon: Megaphone, label: 'Ad Copy' },
  { icon: Video, label: 'Video Scripts' },
  { icon: Globe, label: 'Landing Pages' },
];

// ─── Component ────────────────────────────────────────────────────────────
export default function Homepage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* ═══ NAVIGATION ═══ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Inclufy" className="w-9 h-9 rounded-lg" />
            <span className="text-lg font-semibold tracking-tight">
              Inclufy<span className="text-purple-400">.</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-5">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/20 rounded-full blur-[150px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Marketing Platform
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              The Future of
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-rose-400 to-amber-300 text-transparent bg-clip-text">
                Marketing
              </span>
              {' '}is Here
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Inclufy unifies content creation, campaign orchestration, market intelligence,
              and analytics into one AI-native platform — so your team can focus on strategy, not busywork.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 rounded-full text-base px-8 h-12 font-medium">
                  Start Free — No Card Required
                  <Rocket className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-full text-base px-8 h-12 border-white/20 text-gray-300 hover:bg-white/5 hover:text-white font-medium">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  View Live Demo
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="flex items-center justify-center gap-6 text-sm text-gray-500">
              {['14-day free trial', 'No credit card', 'Cancel anytime'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            className="mt-20 relative max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-purple-500/40 via-transparent to-transparent" />
            <div className="absolute -inset-8 bg-purple-600/15 rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#111118] overflow-hidden shadow-2xl shadow-purple-900/20">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-gray-500 font-mono">
                    app.inclufy.com/dashboard
                  </div>
                </div>
              </div>
              {/* Dashboard mockup */}
              <div className="aspect-[16/9] bg-gradient-to-br from-[#111118] via-[#15151f] to-[#111118] p-6 md:p-10">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Campaigns Active', val: '12', color: 'purple' },
                    { label: 'Content Generated', val: '847', color: 'rose' },
                    { label: 'Emails Sent', val: '23.4K', color: 'emerald' },
                    { label: 'Avg. Open Rate', val: '34.2%', color: 'amber' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                      <p className={`text-2xl font-bold text-${m.color}-400`}>{m.val}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 h-44">
                    <p className="text-xs text-gray-500 mb-3">Growth Timeline</p>
                    <div className="flex items-end gap-2 h-28">
                      {[35, 52, 45, 68, 72, 58, 82, 90, 78, 95, 88, 100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-purple-600 to-purple-400" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 h-44">
                    <p className="text-xs text-gray-500 mb-3">Content Mix</p>
                    <div className="flex items-center justify-center h-28">
                      <div className="w-24 h-24 rounded-full border-[6px] border-purple-500 border-t-rose-400 border-r-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-rose-400 text-transparent bg-clip-text mb-1">
                  {s.value}
                </div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-sm uppercase tracking-widest text-purple-400 mb-4 block">Platform Capabilities</span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              Everything You Need,
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-rose-400 text-transparent bg-clip-text">
                Nothing You Don't
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Six core modules that replace your entire marketing stack — powered by AI that learns your brand.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                variants={fadeUp}
                custom={i}
                className={`group relative rounded-2xl border ${cap.border} ${cap.bg} p-7 hover:border-white/20 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-11 h-11 rounded-xl ${cap.bg} flex items-center justify-center mb-5`}>
                  <cap.icon className={`w-5 h-5 ${cap.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{cap.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CONTENT TYPES ═══ */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              One Platform. Every Content Type.
            </h2>
            <p className="text-gray-400">From first draft to published — AI handles the heavy lifting.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {contentTypes.map((ct, i) => (
              <motion.div
                key={ct.label}
                variants={fadeUp}
                custom={i}
                className="group text-center py-6 px-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300 cursor-default"
              >
                <ct.icon className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:text-purple-400 transition-colors" />
                <p className="text-sm font-medium text-gray-300">{ct.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-sm uppercase tracking-widest text-purple-400 mb-4 block">How It Works</span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              Three Steps to{' '}
              <span className="bg-gradient-to-r from-purple-400 to-amber-300 text-transparent bg-clip-text">
                Marketing Excellence
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {process.map((p, i) => (
              <motion.div
                key={p.step}
                className="relative"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 h-full">
                  <span className="text-5xl font-bold text-white/5 block mb-4">
                    {p.step}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center mb-5">
                    <p.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{p.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
                {i < process.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-10">
                    <ChevronRight className="w-6 h-6 text-white/10" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-24 md:py-32 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-sm uppercase tracking-widest text-purple-400 mb-4 block">Testimonials</span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              Trusted by{' '}
              <span className="bg-gradient-to-r from-purple-400 to-rose-400 text-transparent bg-clip-text">
                Growth Teams
              </span>
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-8"
              >
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-rose-500 flex items-center justify-center text-white text-sm font-semibold">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-purple-600/15 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-4xl md:text-6xl font-bold mb-6"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              Ready to Elevate
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-rose-400 to-amber-300 text-transparent bg-clip-text">
                Your Marketing?
              </span>
            </motion.h2>

            <motion.p variants={fadeUp} custom={1} className="text-lg text-gray-400 mb-10 max-w-lg mx-auto">
              Join forward-thinking teams who use Inclufy to create better content, run smarter campaigns, and grow faster.
            </motion.p>

            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 rounded-full text-base px-8 h-12 font-medium">
                  Start Your Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="rounded-full text-base px-8 h-12 border-white/20 text-gray-300 hover:bg-white/5 hover:text-white font-medium">
                  See Pricing
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 bg-[#07070c]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/favicon.svg" alt="Inclufy" className="w-9 h-9 rounded-lg" />
                <span className="text-lg font-semibold">
                  Inclufy<span className="text-purple-400">.</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                The AI-native marketing platform that understands your brand and scales your output.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <Shield className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600">SOC 2 Compliant &middot; GDPR Ready</span>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-gray-300 transition-colors">Features</a></li>
                <li><Link to="/pricing" className="hover:text-gray-300 transition-colors">Pricing</Link></li>
                <li><a href="#how-it-works" className="hover:text-gray-300 transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-gray-300 transition-colors">Testimonials</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><span className="cursor-default">About</span></li>
                <li><span className="cursor-default">Blog</span></li>
                <li><span className="cursor-default">Careers</span></li>
                <li><span className="cursor-default">Contact</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><span className="cursor-default">Privacy Policy</span></li>
                <li><span className="cursor-default">Terms of Service</span></li>
                <li><span className="cursor-default">Security</span></li>
                <li><span className="cursor-default">GDPR</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600">
            <p>&copy; {new Date().getFullYear()} Inclufy Marketing. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Built with AI, crafted with care.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
