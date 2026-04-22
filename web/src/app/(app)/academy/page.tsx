'use client';

import { useState } from 'react';
import {
  GraduationCap, Award, Users, BookOpen, Lightbulb, Target, Trophy,
  ChevronRight, Star, Clock, BarChart3, Sparkles, CheckCircle2,
  Play, ArrowRight, Layers, BrainCircuit, Briefcase, TrendingUp,
  Rocket, Shield, Zap, Heart, Search, Filter, BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Skill Assessment Data ── */
const skillDomains = [
  { id: 'leadership', label: 'Leadership & Management', icon: Trophy, color: 'from-purple-500 to-purple-700', score: null as number | null },
  { id: 'digital', label: 'Digital Transformation', icon: Zap, color: 'from-blue-500 to-blue-700', score: null as number | null },
  { id: 'agile', label: 'Agile & Scrum', icon: Rocket, color: 'from-emerald-500 to-emerald-700', score: null as number | null },
  { id: 'softskills', label: 'Soft Skills', icon: Heart, color: 'from-pink-500 to-pink-700', score: null as number | null },
  { id: 'ai', label: 'AI & Data Literacy', icon: BrainCircuit, color: 'from-amber-500 to-amber-700', score: null as number | null },
  { id: 'project', label: 'Project Management', icon: Target, color: 'from-teal-500 to-teal-700', score: null as number | null },
];

const assessmentQuestions: Record<string, { q: string; options: string[] }[]> = {
  leadership: [
    { q: 'How do you handle team conflicts?', options: ['Avoid them', 'Mediate when asked', 'Proactively address them', 'Coach teams to resolve independently'] },
    { q: 'How do you set goals for your team?', options: ['No formal process', 'Annual goals', 'Quarterly OKRs', 'Continuous alignment with strategy'] },
    { q: 'How do you give feedback?', options: ['Rarely', 'During reviews', 'Regular 1-on-1s', 'Real-time with coaching framework'] },
  ],
  digital: [
    { q: 'How familiar are you with digital strategy?', options: ['Not at all', 'Basic awareness', 'Can contribute to planning', 'Lead digital transformation'] },
    { q: 'Experience with AI/automation tools?', options: ['Never used', 'Tried a few', 'Use regularly', 'Implement and train others'] },
    { q: 'Data-driven decision making?', options: ['Gut feeling', 'Basic metrics', 'Analytics dashboards', 'Predictive models'] },
  ],
  agile: [
    { q: 'Agile methodology experience?', options: ['None', 'Heard of it', 'Practiced in team', 'Certified practitioner'] },
    { q: 'Sprint planning involvement?', options: ['Never', 'Attend standups', 'Active contributor', 'Scrum Master / PO'] },
    { q: 'Continuous improvement practices?', options: ['None', 'Occasional retros', 'Regular retros with actions', 'Kaizen culture embedded'] },
  ],
  softskills: [
    { q: 'Communication style awareness?', options: ['Not aware', 'Know basics', 'Adapt to audience', 'Train others in communication'] },
    { q: 'Collaboration in diverse teams?', options: ['Prefer solo work', 'Work in small teams', 'Cross-functional collaboration', 'Lead multicultural teams'] },
    { q: 'Handling pressure and deadlines?', options: ['Struggle often', 'Manage okay', 'Thrive under pressure', 'Help others manage stress'] },
  ],
  ai: [
    { q: 'Understanding of AI concepts?', options: ['No knowledge', 'Know buzzwords', 'Understand applications', 'Can evaluate AI solutions'] },
    { q: 'Data literacy level?', options: ['Cannot read data', 'Basic charts', 'Analyze datasets', 'Build data models'] },
    { q: 'AI tool adoption?', options: ['Never used', 'ChatGPT basics', 'Multiple AI tools daily', 'Build AI workflows'] },
  ],
  project: [
    { q: 'Project planning skills?', options: ['No experience', 'Basic task lists', 'Gantt charts & WBS', 'Full PMO methodology'] },
    { q: 'Risk management approach?', options: ['React to problems', 'Identify obvious risks', 'Risk register & mitigation', 'Proactive risk framework'] },
    { q: 'Stakeholder management?', options: ['Minimal contact', 'Status updates', 'Active engagement', 'Strategic relationship building'] },
  ],
};

/* ── Learning Programs (Marketplace Items) ── */
const programs = [
  {
    id: 1, title: 'Leadership Development', duration: '6 months', level: 'Advanced',
    category: 'leadership', badge: 'Certified Leader',
    description: 'Personal leadership, strategy, change leadership, and global context.',
    skills: ['Strategic Thinking', 'Change Management', 'Team Development'],
    price: 2495, rating: 4.8, enrolled: 342, modules: 24,
    featured: true,
  },
  {
    id: 2, title: 'Digital Transformation & Innovation', duration: '4-6 months', level: 'Intermediate',
    category: 'digital', badge: 'CDTP Ready',
    description: 'Digital strategy, business models, data & AI, change management. CDTP prep.',
    skills: ['Digital Strategy', 'Business Model Innovation', 'Data & AI'],
    price: 1995, rating: 4.7, enrolled: 256, modules: 18,
    featured: true,
  },
  {
    id: 3, title: 'Agile & Scrum Mastery', duration: '3 months', level: 'Beginner',
    category: 'agile', badge: 'Agile Practitioner',
    description: 'Project management fundamentals, agile working, and delivering results.',
    skills: ['Scrum', 'Kanban', 'Sprint Planning', 'Retrospectives'],
    price: 895, rating: 4.9, enrolled: 521, modules: 12,
    featured: false,
  },
  {
    id: 4, title: 'Soft Skills & Communication', duration: '2 months', level: 'Beginner',
    category: 'softskills', badge: 'Communication Pro',
    description: 'Time management, role plays, feedback, teamwork, and customer focus.',
    skills: ['Communication', 'Teamwork', 'Problem Solving'],
    price: 695, rating: 4.6, enrolled: 418, modules: 10,
    featured: false,
  },
  {
    id: 5, title: 'AI & Data Literacy for Leaders', duration: '2 months', level: 'Intermediate',
    category: 'ai', badge: 'AI Literate',
    description: 'Understand AI applications, evaluate solutions, and build AI-driven workflows.',
    skills: ['AI Fundamentals', 'Data Analysis', 'Prompt Engineering'],
    price: 1295, rating: 4.8, enrolled: 189, modules: 14,
    featured: true,
  },
  {
    id: 6, title: 'Integration & Inclusion Program', duration: '4 months', level: 'Beginner',
    category: 'softskills', badge: 'Inclusion Champion',
    description: 'For newcomers and expats: Dutch language, culture, and work-related soft skills.',
    skills: ['Cross-cultural Communication', 'Dutch Language', 'Work Ethics'],
    price: 995, rating: 4.5, enrolled: 167, modules: 16,
    featured: false,
  },
  {
    id: 7, title: 'Project-Based Working', duration: '3 months', level: 'Intermediate',
    category: 'project', badge: 'Project Pro',
    description: 'Learn by doing — training embedded in real company projects with AI support.',
    skills: ['Project Planning', 'Risk Management', 'Stakeholder Engagement'],
    price: 1195, rating: 4.7, enrolled: 298, modules: 15,
    featured: false,
  },
  {
    id: 8, title: 'WorkBoost AI Masterclass', duration: '1 month', level: 'Advanced',
    category: 'ai', badge: 'WorkBoost Expert',
    description: 'Master the WorkBoost AI activation tool for personalized, scalable training.',
    skills: ['WorkBoost', 'AI-Activated Learning', 'Program Design'],
    price: 595, rating: 4.9, enrolled: 134, modules: 8,
    featured: false,
  },
];

const categoryFilters = [
  { id: 'all', label: 'All Programs', icon: Layers },
  { id: 'leadership', label: 'Leadership', icon: Trophy },
  { id: 'digital', label: 'Digital', icon: Zap },
  { id: 'agile', label: 'Agile', icon: Rocket },
  { id: 'softskills', label: 'Soft Skills', icon: Heart },
  { id: 'ai', label: 'AI & Data', icon: BrainCircuit },
  { id: 'project', label: 'Project Mgmt', icon: Target },
];

const levelColors: Record<string, string> = {
  Beginner: 'bg-emerald-100 text-emerald-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Advanced: 'bg-purple-100 text-purple-700',
};

/* ── Page Component ── */
export default function AcademyMarketplacePage() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'assessment' | 'my-learning'>('marketplace');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assessmentDomain, setAssessmentDomain] = useState<string | null>(null);
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [currentAnswers, setCurrentAnswers] = useState<number[]>([]);

  const filtered = programs.filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const featuredPrograms = programs.filter(p => p.featured);

  function startAssessment(domain: string) {
    setAssessmentDomain(domain);
    setAssessmentStep(0);
    setCurrentAnswers([]);
    setActiveTab('assessment');
  }

  function answerQuestion(answerIdx: number) {
    if (!assessmentDomain) return;
    const newAnswers = [...currentAnswers, answerIdx];
    setCurrentAnswers(newAnswers);
    const questions = assessmentQuestions[assessmentDomain];
    if (newAnswers.length >= questions.length) {
      const avg = newAnswers.reduce((a, b) => a + b, 0) / newAnswers.length;
      const score = Math.round((avg / 3) * 100);
      setScores(prev => ({ ...prev, [assessmentDomain]: score }));
      setAssessmentDomain(null);
      setActiveTab('assessment');
    } else {
      setAssessmentStep(newAnswers.length);
    }
  }

  const completedAssessments = Object.keys(scores).length;
  const overallScore = completedAssessments > 0 ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / completedAssessments) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-inclufy-purple to-purple-900">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-inclufy-purple">Inclufy Academy</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Skill-Based Marketplace</h1>
          <p className="text-gray-500">Assess your skills, find the right programs, upskill with AI</p>
        </div>
        <div className="flex items-center gap-3">
          {completedAssessments > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2">
              <BarChart3 className="h-4 w-4 text-inclufy-purple" />
              <span className="text-sm font-semibold text-inclufy-purple">Score: {overallScore}%</span>
            </div>
          )}
          <button className="flex items-center gap-2 rounded-lg bg-inclufy-purple px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 transition-colors">
            <Sparkles className="h-4 w-4" /> WorkBoost AI
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {[
          { id: 'marketplace' as const, label: 'Marketplace', icon: Layers },
          { id: 'assessment' as const, label: 'Skill Assessment', icon: BarChart3 },
          { id: 'my-learning' as const, label: 'My Learning', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ MARKETPLACE TAB ═══ */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Featured Hero */}
          <div className="rounded-2xl bg-gradient-to-br from-inclufy-purple via-purple-800 to-purple-950 p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" /> AI-Powered Learning
                </div>
                <h2 className="text-3xl font-bold">Upskill Your Teams with Purpose</h2>
                <p className="text-purple-200">
                  Personalized, project-based, AI-activated learning. From soft skills to leadership —
                  measurable business results with WorkBoost.
                </p>
                <div className="flex gap-3 pt-2">
                  <button className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-inclufy-purple hover:bg-purple-50 transition-colors">
                    Explore Programs <ArrowRight className="h-4 w-4" />
                  </button>
                  <button className="flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                    <Play className="h-4 w-4" /> Watch Demo
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { n: '10+', l: 'Programs' },
                  { n: '2,300+', l: 'Learners' },
                  { n: '4.8', l: 'Avg Rating' },
                ].map(s => (
                  <div key={s.l} className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center">
                    <p className="text-2xl font-bold">{s.n}</p>
                    <p className="text-xs text-purple-200">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Why Inclufy Academy */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-inclufy-purple">Why Inclufy Academy?</span>
              <h2 className="mt-1 text-xl font-bold text-gray-900">Learning that delivers real impact</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { img: '/illustrations/academy-1.svg', title: 'Personalized', desc: 'Tailored learning paths per role and team.' },
                { img: '/illustrations/academy-2.svg', title: 'Action-Oriented', desc: 'Skills applied directly in business projects.' },
                { img: '/illustrations/academy-3.svg', title: 'AI-Activated', desc: 'Engaging, measurable, and scalable with WorkBoost.' },
                { img: '/illustrations/academy-4.svg', title: 'Future-Proof', desc: 'Builds digital and leadership capabilities.' },
              ].map(card => (
                <div key={card.title} className="group rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md hover:border-purple-200 transition-all text-center">
                  <img src={card.img} alt={card.title} className="mx-auto h-32 w-full object-contain rounded-lg" />
                  <h3 className="mt-3 font-semibold text-gray-900">{card.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search programs, skills, or topics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-inclufy-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {categoryFilters.map(f => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                    categoryFilter === f.id
                      ? 'bg-inclufy-purple text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <f.icon className="h-3.5 w-3.5" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Program Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(program => (
              <div
                key={program.id}
                className="group rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-purple-200 transition-all duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className={cn(
                  'px-5 py-4 bg-gradient-to-r',
                  program.category === 'leadership' && 'from-purple-500 to-purple-700',
                  program.category === 'digital' && 'from-blue-500 to-blue-700',
                  program.category === 'agile' && 'from-emerald-500 to-emerald-700',
                  program.category === 'softskills' && 'from-pink-500 to-pink-700',
                  program.category === 'ai' && 'from-amber-500 to-amber-700',
                  program.category === 'project' && 'from-teal-500 to-teal-700',
                )}>
                  <div className="flex items-center justify-between">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', levelColors[program.level])}>
                      {program.level}
                    </span>
                    {program.featured && (
                      <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-xs font-semibold text-yellow-100">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">{program.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {program.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {program.modules} modules</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {program.skills.map(skill => (
                      <span key={skill} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Badge */}
                  <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2">
                    <BadgeCheck className="h-4 w-4 text-inclufy-purple" />
                    <span className="text-xs font-medium text-inclufy-purple">Earns: {program.badge}</span>
                  </div>

                  {/* Stats & Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /> {program.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {program.enrolled}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">&euro;{program.price.toLocaleString()}</span>
                  </div>

                  {/* CTA */}
                  <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-inclufy-purple px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 transition-colors group-hover:shadow-md">
                    Enroll Now <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No programs match your search</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ SKILL ASSESSMENT TAB ═══ */}
      {activeTab === 'assessment' && !assessmentDomain && (
        <div className="space-y-6">
          {/* Overall Score */}
          {completedAssessments > 0 && (
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-white p-6">
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="#E9D5FF" strokeWidth="6" />
                    <circle cx="40" cy="40" r="35" fill="none" stroke="#9C27B0" strokeWidth="6"
                      strokeDasharray={`${(overallScore / 100) * 220} 220`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-xl font-bold text-inclufy-purple">{overallScore}%</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Your Skill Profile</h3>
                  <p className="text-sm text-gray-500">{completedAssessments} of {skillDomains.length} assessments completed</p>
                  <div className="mt-2 flex gap-2">
                    {completedAssessments < skillDomains.length && (
                      <span className="text-xs text-inclufy-purple font-medium">Complete all assessments for personalized recommendations</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skillDomains.map(domain => {
              const score = scores[domain.id];
              const completed = score !== undefined;
              return (
                <div key={domain.id} className={cn(
                  'rounded-xl border bg-white p-5 transition-all',
                  completed ? 'border-purple-200' : 'border-gray-200 hover:border-purple-200 hover:shadow-md'
                )}>
                  <div className="flex items-start justify-between">
                    <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br', domain.color)}>
                      <domain.icon className="h-5 w-5 text-white" />
                    </div>
                    {completed && (
                      <div className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-gray-900">{domain.label}</h3>
                  <p className="mt-1 text-xs text-gray-500">3 questions &middot; 2 min</p>

                  {completed ? (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Your Score</span>
                        <span className="text-lg font-bold text-inclufy-purple">{score}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-inclufy-purple transition-all duration-500" style={{ width: `${score}%` }} />
                      </div>
                      <button
                        onClick={() => startAssessment(domain.id)}
                        className="mt-2 w-full rounded-lg border border-purple-200 px-3 py-2 text-xs font-medium text-inclufy-purple hover:bg-purple-50 transition-colors"
                      >
                        Retake Assessment
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startAssessment(domain.id)}
                      className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-inclufy-purple px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 transition-colors"
                    >
                      Start Assessment <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recommended Based on Scores */}
          {completedAssessments > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Recommended For You</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {programs
                  .filter(p => {
                    const score = scores[p.category];
                    return score !== undefined && score < 70;
                  })
                  .slice(0, 4)
                  .map(program => (
                    <div key={program.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-all">
                      <div className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br flex-shrink-0',
                        program.category === 'leadership' && 'from-purple-500 to-purple-700',
                        program.category === 'digital' && 'from-blue-500 to-blue-700',
                        program.category === 'agile' && 'from-emerald-500 to-emerald-700',
                        program.category === 'softskills' && 'from-pink-500 to-pink-700',
                        program.category === 'ai' && 'from-amber-500 to-amber-700',
                        program.category === 'project' && 'from-teal-500 to-teal-700',
                      )}>
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{program.title}</h3>
                        <p className="text-xs text-gray-500">{program.duration} &middot; {program.level}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">&euro;{program.price}</p>
                        <span className="text-xs text-inclufy-purple font-medium">Skill gap detected</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ASSESSMENT IN PROGRESS ═══ */}
      {activeTab === 'assessment' && assessmentDomain && (
        <div className="mx-auto max-w-2xl space-y-6">
          {(() => {
            const domain = skillDomains.find(d => d.id === assessmentDomain);
            if (!domain) return null;
            const questions = assessmentQuestions[assessmentDomain];
            const question = questions[assessmentStep];
            return (
              <>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label="Go back" onClick={() => { setAssessmentDomain(null); }} className="rounded-lg p-2 hover:bg-gray-100">
                    <ChevronRight className="h-4 w-4 rotate-180 text-gray-400" />
                  </button>
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', domain.color)}>
                    <domain.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">{domain.label}</h2>
                    <p className="text-xs text-gray-500">Question {assessmentStep + 1} of {questions.length}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-inclufy-purple transition-all duration-300"
                    style={{ width: `${((assessmentStep) / questions.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900">{question.q}</h3>
                  <div className="space-y-3">
                    {question.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => answerQuestion(idx)}
                        className="w-full flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left hover:border-inclufy-purple hover:bg-purple-50 transition-all group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-400 group-hover:border-inclufy-purple group-hover:text-inclufy-purple transition-colors">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ═══ MY LEARNING TAB ═══ */}
      {activeTab === 'my-learning' && (
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Start Your Learning Journey</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Take a skill assessment to get personalized recommendations, then enroll in programs from the marketplace.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setActiveTab('assessment')}
                className="flex items-center gap-2 rounded-lg bg-inclufy-purple px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 transition-colors"
              >
                <BarChart3 className="h-4 w-4" /> Take Skill Assessment
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Browse Marketplace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
