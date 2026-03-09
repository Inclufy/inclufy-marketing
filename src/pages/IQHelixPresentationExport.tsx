// src/pages/IQHelixPresentationExport.tsx
// Renders hidden presentation slides and exports them as a landscape PDF

import { forwardRef } from 'react';

// ─── Slide wrapper ────────────────────────────────────────────────────────
const Slide = ({ children, bg = 'bg-white' }: { children: React.ReactNode; bg?: string }) => (
  <div
    className={`presentation-slide ${bg} relative overflow-hidden`}
    style={{ width: 1280, height: 720, flexShrink: 0 }}
  >
    {children}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-400" />
    <div className="absolute bottom-2.5 left-10 right-10 flex justify-between items-center">
      <span className="text-[9px] text-gray-400">IQ Helix — Skill Intelligence & Assessment Platform</span>
      <span className="text-[9px] text-gray-400">&copy; 2026 IQ Helix</span>
    </div>
  </div>
);

// ─── Presentation container ───────────────────────────────────────────────
const PresentationSlides = forwardRef<HTMLDivElement>((_, ref) => (
  <div
    ref={ref}
    style={{ position: 'absolute', left: '-9999px', top: 0, width: 1280 }}
    className="text-gray-900"
  >
    {/* ═══ SLIDE 1 — TITLE (matches website hero) ═══ */}
    <Slide>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative flex flex-col justify-center h-full px-16">
        <div className="flex items-center gap-3 mb-5">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">USE CASE</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">ROC van Amsterdam</span>
        </div>
        <h1 className="text-6xl font-black leading-tight mb-5">
          IQ Helix bij het{' '}
          <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-400 bg-clip-text text-transparent">
            Loopbaan Expertise Centrum
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mb-10">
          Datagedreven Loopbaan & Assessment Platform voor objectieve studiekeuze, uitvalreductie en talentontwikkeling.
        </p>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Talent & Skill Intelligence
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Assessment Platform
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Datagedreven Inzichten
          </span>
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 2 — IQ HELIX PLATFORM (screenshots row 1) ═══ */}
    <Slide>
      <div className="flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Platform</p>
        <h2 className="text-3xl font-black mb-5">IQ Helix Platform</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: 'Student Dashboard', desc: 'Persoonlijk overzicht met voltooide assessments, scores, deadlines en recente activiteit.', img: '/cases/iqhelix-student-dashboard.png', border: 'border-red-500/20' },
            { title: 'Assessment Beheer', desc: 'Beheer, creeer en deel assessments met QR-codes, AI-generatie en marketplace templates.', img: '/cases/iqhelix-admin-portal.png', border: 'border-sky-500/20' },
            { title: 'Analytics Dashboard', desc: 'Overzicht van gebruikersactiviteit, engagement levels, top performers en completions.', img: '/cases/iqhelix-analytics.png', border: 'border-emerald-500/20' },
          ].map((card, i) => (
            <div key={i} className={`rounded-xl border ${card.border} bg-gray-50 overflow-hidden`}>
              <div className="h-[200px] overflow-hidden bg-gray-100 border-b border-gray-100">
                <img src={card.img} alt={card.title} className="w-full h-full object-cover object-top" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-[10px] text-gray-600 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 3 — IQ HELIX PLATFORM (screenshots row 2) ═══ */}
    <Slide>
      <div className="flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Platform</p>
        <h2 className="text-3xl font-black mb-5">IQ Helix Platform</h2>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { title: 'Assessment Ervaring', desc: 'Interactieve assessments met Likert-schalen, competentiecategorieen en voortgangsindicatie.', img: '/cases/iqhelix-competency.png', border: 'border-amber-500/20' },
            { title: 'Campaign Resultaten', desc: 'Gedetailleerde resultaatanalyse per campagne met score verdeling per afdeling en rol.', img: '/cases/iqhelix-campaign.png', border: 'border-rose-500/20' },
            { title: 'Assessment Starten', desc: 'Eenvoudig assessments starten met duidelijke instructies, vraagaantal en automatisch herstel.', img: '/cases/iqhelix-assessment-start.png', border: 'border-indigo-500/20' },
          ].map((card, i) => (
            <div key={i} className={`rounded-xl border ${card.border} bg-gray-50 overflow-hidden`}>
              <div className="h-[200px] overflow-hidden bg-gray-100 border-b border-gray-100">
                <img src={card.img} alt={card.title} className="w-full h-full object-cover object-top" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-[10px] text-gray-600 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Platform stats bar */}
        <div className="rounded-xl bg-gradient-to-r from-red-500/10 via-sky-500/10 to-emerald-500/10 border border-gray-200 p-4">
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-red-400">19</p>
              <p className="text-[9px] text-gray-500">Live Participants</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-400">100%</p>
              <p className="text-[9px] text-gray-500">Completion Rate</p>
            </div>
            <div>
              <p className="text-lg font-bold text-sky-400">5.2</p>
              <p className="text-[9px] text-gray-500">Avg Assessments/User</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">16+</p>
              <p className="text-[9px] text-gray-500">Marketplace Templates</p>
            </div>
            <div>
              <p className="text-lg font-bold text-rose-400">81%</p>
              <p className="text-[9px] text-gray-500">Active Users</p>
            </div>
          </div>
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 4 — FEITEN & CONTEXT ═══ */}
    <Slide>
      <div className="flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Feiten & Context</p>
        <h2 className="text-3xl font-black mb-5">Studie-uitval in het MBO</h2>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { value: '370.000', label: 'MBO-studenten in Nederland', cls: 'border-red-500/30 bg-red-500/10 text-red-400' },
            { value: '22.000+', label: 'Voortijdig stoppende studenten/jaar', cls: 'border-orange-500/30 bg-orange-500/10 text-orange-400' },
            { value: '20%', label: 'Uitval in het eerste studiejaar', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border ${s.cls} p-4 text-center`}>
              <p className={`text-3xl font-black`}>{s.value}</p>
              <p className="text-[11px] text-gray-600 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { level: 'Niveau 2', pct: '40%', note: 'uitval zonder diploma' },
            { level: 'Niveau 3', pct: '21%', note: 'uitval' },
            { level: 'Niveau 4', pct: '18%', note: 'uitval' },
          ].map((n, i) => (
            <div key={i} className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase">{n.level}</p>
              <p className="text-xl font-black text-gray-900">{n.pct}</p>
              <p className="text-[10px] text-gray-500">{n.note}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
          <p className="text-[11px] text-gray-500 mb-2 font-semibold">Veel voorkomende oorzaken:</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {['Verkeerde studiekeuze', 'Gebrek aan motivatie', 'Persoonlijke problemen', 'Financiele omstandigheden', 'Leerproblemen'].map((c, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />{c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 5 — PROBLEEMSTELLING ═══ */}
    <Slide>
      <div className="flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Probleemstelling</p>
        <h2 className="text-3xl font-black mb-4">Impact van studie-uitval</h2>
        <p className="text-gray-600 text-sm mb-5 max-w-3xl">
          Het ROC van Amsterdam begeleidt jaarlijks duizenden mbo-studenten. Honderden per jaar verlaten hun opleiding vroegtijdig of wisselen van studie.
        </p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-4">
            <h4 className="font-bold text-gray-900 mb-2 text-sm">Voor studenten</h4>
            <ul className="space-y-1.5 text-[11px] text-gray-600">
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 flex-shrink-0" />Vertraging in studie en carriere</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 flex-shrink-0" />Verlies van motivatie en zelfvertrouwen</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 flex-shrink-0" />Verhoogd risico op schoolverlaten</li>
            </ul>
          </div>
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
            <h4 className="font-bold text-gray-900 mb-2 text-sm">Voor onderwijsinstellingen</h4>
            <ul className="space-y-1.5 text-[11px] text-gray-600">
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0" />Verlies van onderwijscapaciteit</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0" />Hogere begeleidingskosten</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0" />Inefficiente instroom en doorstroom</li>
            </ul>
          </div>
          <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-4">
            <h4 className="font-bold text-gray-900 mb-2 text-sm">Voor de samenleving</h4>
            <ul className="space-y-1.5 text-[11px] text-gray-600">
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 flex-shrink-0" />Lagere arbeidsparticipatie</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 flex-shrink-0" />Hogere maatschappelijke kosten</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 flex-shrink-0" />Onbenut talent en potentieel</li>
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: 'Subjectieve intakes', desc: 'Afhankelijk van ervaring adviseurs' },
            { title: 'Beperkt talentinzicht', desc: 'Weinig objectief inzicht in capaciteiten' },
            { title: 'Tijdsintensief', desc: 'Onevenredig veel tijd aan basisintakes' },
            { title: 'Geen centrale data', desc: 'Geen datagedreven analyse beschikbaar' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5">
              <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 text-[10px] font-bold flex-shrink-0">{i + 1}</div>
              <div>
                <p className="text-[11px] font-bold text-gray-900">{item.title}</p>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 6 — OPLOSSING: IQ HELIX ═══ */}
    <Slide>
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px]" />
      </div>
      <div className="relative flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Oplossing</p>
        <h2 className="text-3xl font-black mb-3">IQ Helix Assessment Platform</h2>
        <p className="text-gray-600 text-sm mb-5 max-w-3xl">
          Datagedreven talent- en skillanalyse voorafgaand aan het loopbaangesprek. Online assessment voor objectief inzicht.
        </p>
        <div className="grid grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Cognitieve capaciteiten', cls: 'border-red-500/30 bg-red-500/10' },
            { label: 'Motivatie & werkvoorkeuren', cls: 'border-rose-500/30 bg-rose-500/10' },
            { label: 'Leerpotentieel', cls: 'border-sky-500/30 bg-sky-500/10' },
            { label: 'Talentprofielen', cls: 'border-emerald-500/30 bg-emerald-500/10' },
            { label: 'Match opleidingen', cls: 'border-amber-500/30 bg-amber-500/10' },
          ].map((m, i) => (
            <div key={i} className={`rounded-lg border ${m.cls} p-3 text-center`}>
              <p className="text-[11px] text-gray-700">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl bg-gray-500/5 border border-gray-500/20 p-4">
            <p className="text-[11px] font-medium text-gray-700 mb-1">&#10005; Voorheen</p>
            <p className="text-base italic text-gray-600">&ldquo;Wat denk je dat bij je past?&rdquo;</p>
          </div>
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
            <p className="text-[11px] font-medium text-emerald-500 mb-1">&#10003; Met IQ Helix</p>
            <p className="text-base italic text-gray-700">&ldquo;Dit zijn jouw gemeten talenten en ontwikkelpotentieel.&rdquo;</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {['Betere studiekeuzes', 'Meer zelfinzicht', 'Efficientere begeleiding', 'Lagere studie-uitval'].map((b, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
              <span className="text-red-400 text-[11px]">&#10003;</span>
              <span className="text-[11px] text-gray-700">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 7 — IMPLEMENTATIE ═══ */}
    <Slide>
      <div className="flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">Implementatie</p>
        <h2 className="text-3xl font-black mb-6">Van Intake &#8594; Inzicht &#8594; Impact</h2>
        <div className="grid grid-cols-3 gap-5">
          {[
            {
              step: '01', title: 'Intake', subtitle: 'Digitale Talentanalyse',
              items: ['Cognitieve capaciteiten', 'Leerpotentieel', 'Motivatie en interesses', 'Werkvoorkeuren'],
              highlight: 'Persoonlijk talentdashboard',
              borderCls: 'border-red-500/30', bgCls: 'bg-red-500/5', textCls: 'text-red-400', numCls: 'bg-red-500/20',
            },
            {
              step: '02', title: 'Inzicht', subtitle: 'Datagedreven Loopbaangesprek',
              items: ['Betere studiekeuze', 'Meer zelfinzicht', 'Hogere motivatie', 'Onderbouwd advies'],
              highlight: 'Van subjectief naar data',
              borderCls: 'border-sky-500/30', bgCls: 'bg-sky-500/5', textCls: 'text-sky-400', numCls: 'bg-sky-500/20',
            },
            {
              step: '03', title: 'Impact', subtitle: 'Strategische Inzichten',
              items: ['Talentverdeling opleidingen', 'Uitvalrisico per cohort', 'Skill-ontwikkeling', 'Arbeidsmarktaansluiting'],
              highlight: 'Datagedreven beleid',
              borderCls: 'border-emerald-500/30', bgCls: 'bg-emerald-500/5', textCls: 'text-emerald-400', numCls: 'bg-emerald-500/20',
            },
          ].map((s) => (
            <div key={s.step} className={`rounded-xl border ${s.borderCls} ${s.bgCls} p-5`}>
              <div className={`w-9 h-9 rounded-lg ${s.numCls} flex items-center justify-center ${s.textCls} font-bold text-sm mb-3`}>
                {s.step}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-0.5">{s.title}</h3>
              <p className="text-[11px] text-gray-600 mb-3">{s.subtitle}</p>
              <div className="space-y-1.5 mb-3">
                {s.items.map((item, j) => (
                  <p key={j} className="text-[11px] text-gray-500 flex items-center gap-2">
                    <span className={`w-1 h-1 rounded-full ${s.textCls.replace('text-', 'bg-')}`} />{item}
                  </p>
                ))}
              </div>
              <p className={`text-[11px] ${s.textCls} font-medium`}>&#10003; {s.highlight}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 8 — USE CASE ═══ */}
    <Slide>
      <div className="flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Use Case</p>
        <h2 className="text-3xl font-black mb-5">MBO College Zuidoost</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">Situatie</h3>
            <p className="text-[12px] text-gray-600 leading-relaxed mb-4">
              Binnen MBO College Zuidoost is studentondersteuning een belangrijk onderdeel. De populatie is divers met uiteenlopende ondersteuningsbehoeften.
            </p>
            <h4 className="text-[11px] font-semibold text-gray-700 mb-2">Samenwerking met:</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {['Zorgcoordinatoren', 'Studentbegeleiders', 'Jeugdteams gemeente', 'Psychologische ondersteuning'].map((p, i) => (
                <p key={i} className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />{p}
                </p>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">IQ Helix Impact</h3>
            <div className="space-y-3">
              {[
                'Objectieve talentanalyse voorafgaand aan intake',
                'Datagedreven matching met opleidingen en beroepen',
                'Cohortinzichten voor beleidsmakers en management',
                'Integratie met StudieMAX en WeekendCollege',
                'Vroegsignalering van uitvalrisico',
              ].map((impact, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-[10px]">&#10003;</span>
                  </div>
                  <span className="text-[12px] text-gray-700">{impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 9 — ROI ═══ */}
    <Slide>
      <div className="flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Return on Investment</p>
        <h2 className="text-3xl font-black mb-5">ROI bij 100 Deelnemers</h2>
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 text-center">
            <p className="text-2xl font-black text-orange-400">20</p>
            <p className="text-[10px] text-gray-600 mt-1">Huidige uitval (20%)</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">6</p>
            <p className="text-[10px] text-gray-600 mt-1">Voorkomen uitval</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
            <p className="text-2xl font-black text-amber-400">&euro;8.900</p>
            <p className="text-[10px] text-gray-600 mt-1">Investering</p>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <p className="text-2xl font-black text-red-400">&euro;66.100</p>
            <p className="text-[10px] text-gray-600 mt-1">Netto besparing</p>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 p-6 text-center mb-5">
          <p className="text-sm text-emerald-500 mb-1">Return on Investment</p>
          <p className="text-5xl font-black text-emerald-400">743%</p>
          <p className="text-sm text-gray-600 mt-1">
            Besparing van <span className="text-gray-900 font-semibold">&euro;75.000</span> op investering van <span className="text-gray-900 font-semibold">&euro;8.900</span>
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Uitvalpercentage', value: '20%' },
            { label: 'Kosten per uitvaller', value: '\u20AC12.500' },
            { label: 'Reductie door IQ Helix', value: '30%' },
            { label: 'Kosten per assessment', value: '\u20AC89' },
          ].map((d, i) => (
            <div key={i} className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 text-center">
              <p className="text-[10px] text-gray-500">{d.label}</p>
              <p className="text-sm text-gray-900 font-semibold">{d.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 10 — STRATEGISCHE WAARDE ═══ */}
    <Slide>
      <div className="flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Strategische Waarde</p>
        <h2 className="text-3xl font-black mb-5">IQ Helix ondersteunt de kernambities</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['Studiesuccesbeleid', 'LOB-doelstellingen', 'Regionale arbeidsmarktaansluiting', 'Datagedreven onderwijsontwikkeling', 'Doorstroom MBO \u2192 HBO', 'Leven Lang Ontwikkelen (LLO)'].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
              <span className="text-indigo-400 text-sm">&#10003;</span>
              <span className="text-[12px] text-gray-700">{item}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 p-6 text-center">
          <p className="text-[10px] text-red-400 uppercase tracking-widest mb-1">Positionering</p>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Talent & Skill Intelligence Hub</h3>
          <p className="text-[12px] text-gray-600 max-w-2xl mx-auto">
            Met IQ Helix evolueert het LEC naar de Talent & Skill Intelligence Hub van het ROC — waar studenten een onderbouwde ontwikkelroute krijgen.
          </p>
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 11 — NEXT STEPS ═══ */}
    <Slide>
      <div className="flex flex-col justify-center h-full px-14">
        <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Next Steps</p>
        <h2 className="text-3xl font-black mb-6">Mogelijke Startstrategie</h2>
        <div className="grid grid-cols-3 gap-5 mb-6">
          {[
            { step: '1', title: 'Pilot bij 1 domein', desc: 'Start bij Zorg & Welzijn of Techniek. 100 studenten, 1 semester.', numCls: 'bg-red-500/20 text-red-400' },
            { step: '2', title: 'Meting uitval & tevredenheid', desc: 'Meet studietevredenheid en uitvalcijfers versus controlegroep.', numCls: 'bg-sky-500/20 text-sky-400' },
            { step: '3', title: 'Opschaling ROC-breed', desc: 'Bij bewezen resultaten uitrollen over alle domeinen en colleges.', numCls: 'bg-emerald-500/20 text-emerald-400' },
          ].map((ns) => (
            <div key={ns.step} className="rounded-xl bg-gray-50 border border-gray-200 p-5">
              <div className={`w-10 h-10 rounded-full ${ns.numCls} flex items-center justify-center font-bold text-lg mb-3`}>
                {ns.step}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">{ns.title}</h3>
              <p className="text-[12px] text-gray-600">{ns.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-gray-300" />
          <p className="text-sm text-gray-500">Van Intake naar Inzicht. Van Inzicht naar Impact.</p>
          <div className="h-px w-16 bg-gray-300" />
        </div>
      </div>
    </Slide>

    {/* ═══ SLIDE 12 — CLOSING / CTA ═══ */}
    <Slide>
      <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-gray-900" />
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-[120px]" />
      </div>
      <div className="relative flex flex-col items-center justify-center h-full text-center px-14">
        <h2 className="text-5xl font-black text-white mb-3">
          Van Intake naar Inzicht.
        </h2>
        <h2 className="text-5xl font-black text-white mb-6">
          Van Inzicht naar Impact.
        </h2>
        <p className="text-xl text-white/70 mb-8">
          IQ Helix — Skill Intelligence & Assessment Platform
        </p>
        <div className="flex items-center gap-8 text-sm text-white/60">
          <span>Plan een Demo</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span>Neem Contact Op</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span>iqhelix.com</span>
        </div>
      </div>
    </Slide>
  </div>
));

PresentationSlides.displayName = 'PresentationSlides';

export default PresentationSlides;
