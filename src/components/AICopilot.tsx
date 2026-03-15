// src/components/AICopilot.tsx
// AI Marketing Co-pilot — vaste sidebar rechts met Chat & Gids tabs

import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Loader2,
  Lightbulb,
  TrendingUp,
  Mail,
  FileText,
  Trash2,
  Minimize2,
  Copy,
  Check,
  ChevronRight,
  BarChart3,
  Zap,
  PenTool,
  Play,
  Info,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Target,
  Users,
  Rocket,
  Brain,
  Globe,
  Settings,
  Shield,
  BookOpen,
  RefreshCw,
  Upload,
  Calendar,
  Compass,
  Map,
  ExternalLink,
  Layout,
  Palette,
  Image,
  Video,
  Network,
  Workflow,
  Search,
  Award,
  Activity,
  Megaphone,
  MousePointerClick,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { GuidedTour, type TourStep } from '@/components/GuidedTour';

/* ─── Types ─── */
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface CopilotInitialContext {
  systemPrompt: string;
  firstMessage?: string;
}

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: CopilotInitialContext | null;
  onContextConsumed?: () => void;
  requestedTab?: CopilotTab;
}

type CopilotTab = 'chat' | 'guide';

/* ═══════════════════════════════════════════════════════════════════
   GUIDE CONTENT — per-page user guide with features, how-tos, tips
   ═══════════════════════════════════════════════════════════════════ */

interface GuideFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface GuideHowTo {
  title: string;
  steps: string[];
}

interface GuideContent {
  pageTitle: string;
  pageDescription: string;
  features: GuideFeature[];
  howTos: GuideHowTo[];
  tips: string[];
  tourSteps: TourStep[];
}

const GUIDE_MAP: Record<string, GuideContent> = {
  "/app/dashboard": {
    pageTitle: "Dashboard",
    pageDescription: "Uw centrale marketing cockpit met KPI's, campagneoverzicht en AI-inzichten.",
    features: [
      { icon: BarChart3, title: "KPI-overzicht", description: "Bereik, conversies, engagement en ROI in één oogopslag" },
      { icon: TrendingUp, title: "Campagne prestaties", description: "Real-time overzicht van actieve campagnes" },
      { icon: Lightbulb, title: "AI Inzichten", description: "Automatische aanbevelingen op basis van uw data" },
      { icon: Target, title: "Doelen tracker", description: "Voortgang richting uw marketing KPI's" },
    ],
    howTos: [
      { title: "Dashboard gebruiken", steps: ["Bekijk uw belangrijkste KPI's bovenaan", "Scroll naar beneden voor campagne-overzicht", "Klik op een KPI-kaart voor details", "Gebruik de datumfilter om periodes te vergelijken"] },
    ],
    tips: [
      "Check uw dashboard dagelijks voor actuele marketing prestaties.",
      "Gebruik de AI Inzichten voor datagedreven beslissingen.",
      "Vergelijk periodes om trends te herkennen.",
    ],
    tourSteps: [
      { title: "Welkom op het Dashboard", description: "Dit is uw centrale marketing cockpit. Hier ziet u alle belangrijke metrics." },
    ],
  },
  "/app/autonomous": {
    pageTitle: "AI Marketing",
    pageDescription: "Laat AI autonoom marketing taken uitvoeren: content, campagnes en optimalisatie.",
    features: [
      { icon: Brain, title: "Autonome AI Agents", description: "AI agents die zelfstandig marketing taken uitvoeren" },
      { icon: Zap, title: "Automatische optimalisatie", description: "Campagnes worden continu geoptimaliseerd door AI" },
      { icon: Sparkles, title: "Content generatie", description: "AI maakt content op basis van uw merk en doelgroep" },
      { icon: Target, title: "Smart targeting", description: "AI bepaalt de beste doelgroep per campagne" },
    ],
    howTos: [
      { title: "AI Marketing starten", steps: ["Open de AI Marketing pagina", "Kies het type taak (content, campagne, analyse)", "Geef instructies of laat AI het doen", "Review en publiceer het resultaat"] },
    ],
    tips: [
      "Start met eenvoudige taken en bouw complexiteit op.",
      "Review AI-output altijd vóór publicatie.",
      "Geef feedback aan de AI om de kwaliteit te verbeteren.",
    ],
    tourSteps: [
      { title: "AI Marketing", description: "Hier laat u AI autonoom marketing taken uitvoeren en optimaliseren." },
    ],
  },
  "/app/marketing-budget": {
    pageTitle: "Marketing Budget",
    pageDescription: "Beheer uw marketing budget, track uitgaven en analyseer ROI per kanaal.",
    features: [
      { icon: Target, title: "Budgetplanning", description: "Verdeel uw budget over kanalen en campagnes" },
      { icon: BarChart3, title: "Uitgaven tracking", description: "Real-time overzicht van besteed vs. beschikbaar budget" },
      { icon: TrendingUp, title: "ROI analyse", description: "Return on Investment per kanaal en campagne" },
      { icon: Lightbulb, title: "AI budget tips", description: "AI-suggesties voor optimale budgetverdeling" },
    ],
    howTos: [
      { title: "Budget instellen", steps: ["Open Marketing Budget", "Stel het totaalbudget in per periode", "Verdeel over kanalen (social, email, ads, etc.)", "Stel alerts in bij overschrijding"] },
    ],
    tips: [
      "Verdeel uw budget op basis van kanaal-ROI data.",
      "Houd altijd 10-15% reserve voor onverwachte kansen.",
      "Review uw budgetverdeling maandelijks op basis van prestaties.",
    ],
    tourSteps: [
      { title: "Marketing Budget", description: "Hier plant en monitort u uw marketing budget en ROI." },
    ],
  },
  "/app/integrations": {
    pageTitle: "Integraties",
    pageDescription: "Koppel externe platforms en tools aan uw marketing ecosystem.",
    features: [
      { icon: Globe, title: "Platform koppelingen", description: "Verbind social media, e-mail, CRM en meer" },
      { icon: RefreshCw, title: "Auto-sync", description: "Data wordt automatisch gesynchroniseerd" },
      { icon: Shield, title: "Veilige verbinding", description: "OAuth 2.0 en versleutelde data-uitwisseling" },
      { icon: Activity, title: "Sync status", description: "Monitor de status van al uw koppelingen" },
    ],
    howTos: [
      { title: "Integratie toevoegen", steps: ["Ga naar Integraties", "Klik op het gewenste platform", "Autoriseer de koppeling", "Configureer synchronisatie-instellingen"] },
    ],
    tips: [
      "Koppel eerst uw belangrijkste social media kanalen.",
      "Controleer periodiek of koppelingen actief zijn.",
      "Google Analytics koppeling geeft u de beste ROI-inzichten.",
    ],
    tourSteps: [
      { title: "Integraties", description: "Hier verbindt u externe platforms met uw marketing suite." },
    ],
  },
  "/app/opportunity-feed": {
    pageTitle: "Opportunity Feed",
    pageDescription: "AI-gestuurde feed met marketing kansen en trends voor uw bedrijf.",
    features: [
      { icon: Lightbulb, title: "AI Kansdetectie", description: "AI identificeert marketing kansen automatisch" },
      { icon: TrendingUp, title: "Trending topics", description: "Relevante trends in uw branche" },
      { icon: Target, title: "Geprioritiseerd", description: "Kansen gesorteerd op impact en relevantie" },
      { icon: Zap, title: "Quick actions", description: "Direct actie ondernemen op gedetecteerde kansen" },
    ],
    howTos: [
      { title: "Kansen benutten", steps: ["Bekijk de Opportunity Feed", "Klik op een kans voor details", "Beoordeel de potentiële impact", "Klik op 'Actie ondernemen' om direct te starten"] },
    ],
    tips: [
      "Check de feed dagelijks voor tijdgevoelige kansen.",
      "Filter op uw branche voor de meest relevante suggesties.",
      "Markeer kansen als 'bewaard' om ze later op te pakken.",
    ],
    tourSteps: [
      { title: "Opportunity Feed", description: "Hier ontdekt u AI-gedetecteerde marketing kansen." },
    ],
  },
  "/app/setup": {
    pageTitle: "Configuratie",
    pageDescription: "Stel uw merk, doelgroep, doelen en concurrentieanalyse in.",
    features: [
      { icon: Palette, title: "Brand Setup", description: "Configureer uw merkidentiteit en huisstijl" },
      { icon: Users, title: "Doelgroep", description: "Definieer uw ideale klantprofielen" },
      { icon: Target, title: "Doelen & KPI's", description: "Stel marketing doelen en KPI's in" },
      { icon: Search, title: "Concurrentie", description: "Analyseer uw concurrenten" },
    ],
    howTos: [
      { title: "Setup doorlopen", steps: ["Start met Brand Setup (logo, kleuren, tone of voice)", "Definieer uw doelgroep en persona's", "Stel meetbare doelen en KPI's in", "Voeg concurrenten toe voor analyse"] },
    ],
    tips: [
      "Een complete setup maakt alle AI-functies nauwkeuriger.",
      "Update uw doelen elk kwartaal.",
      "Voeg minimaal 3 concurrenten toe voor goede benchmarks.",
    ],
    tourSteps: [
      { title: "Configuratie", description: "Hier configureert u de basis van uw marketing strategie." },
    ],
  },
  "/app/growth-blueprint": {
    pageTitle: "Growth Blueprint",
    pageDescription: "AI-gegenereerd groeiplan op maat van uw bedrijf en doelen.",
    features: [
      { icon: Brain, title: "AI Groeiplan", description: "Gepersonaliseerd strategieplan door AI" },
      { icon: Target, title: "Actie items", description: "Concrete stappen om te groeien" },
      { icon: BarChart3, title: "Impactanalyse", description: "Verwachte impact per actie" },
      { icon: Calendar, title: "Timeline", description: "Tijdlijn met milestones" },
    ],
    howTos: [
      { title: "Blueprint genereren", steps: ["Zorg dat uw Setup compleet is", "Open Growth Blueprint", "AI analyseert uw data en genereert een plan", "Review de aanbevelingen en prioriteer"] },
    ],
    tips: [
      "Hoe completer uw setup, hoe beter het groeiplan.",
      "Focus op de top 3 aanbevelingen voor maximale impact.",
      "Genereer elk kwartaal een nieuw blueprint.",
    ],
    tourSteps: [
      { title: "Growth Blueprint", description: "Hier vindt u uw AI-gegenereerde groeiplan." },
    ],
  },
  "/app/intelligence": {
    pageTitle: "Intelligence Suite",
    pageDescription: "Marktinzichten, merkanalyse en concurrentiemonitoring op één plek.",
    features: [
      { icon: Brain, title: "Brand Memory", description: "AI-geheugen van uw merkidentiteit en -waarden" },
      { icon: Globe, title: "Market Insights", description: "Realtime markttrends en -ontwikkelingen" },
      { icon: Search, title: "Competitor Analysis", description: "Gedetailleerde analyse van concurrenten" },
      { icon: Sparkles, title: "Content Studio", description: "AI-gestuurde content werkplaats" },
    ],
    howTos: [
      { title: "Marktanalyse bekijken", steps: ["Ga naar Intelligence → Market Insights", "Selecteer uw branche of zoekterm", "Bekijk trends, volumes en sentimenten", "Exporteer inzichten naar uw strategie"] },
    ],
    tips: [
      "Check Market Insights wekelijks voor nieuwe trends.",
      "Gebruik Brand Memory om consistente content te creëren.",
      "Monitor minstens 3 concurrenten actief.",
    ],
    tourSteps: [
      { title: "Intelligence Suite", description: "Hier vindt u diepgaande markt- en concurrentie-inzichten." },
    ],
  },
  "/app/campaigns": {
    pageTitle: "Campagnes",
    pageDescription: "Beheer al uw marketing campagnes: e-mail, social media en landing pages.",
    features: [
      { icon: Rocket, title: "Campagne Manager", description: "Maak en beheer multichannel campagnes" },
      { icon: Mail, title: "E-mail Marketing", description: "Ontwerp en verstuur e-mail campagnes" },
      { icon: Megaphone, title: "Social Media", description: "Plan en publiceer social media posts" },
      { icon: Layout, title: "Landing Pages", description: "Bouw conversiegerichte landing pages" },
    ],
    howTos: [
      { title: "Campagne aanmaken", steps: ["Klik op '+ Nieuwe Campagne'", "Selecteer het type (email, social, multi-channel)", "Definieer uw doelgroep en boodschap", "Stel het schema en budget in", "Activeer de campagne"] },
      { title: "E-mail campagne", steps: ["Ga naar Campagnes → E-mail Marketing", "Kies een template of begin blanco", "Ontwerp uw e-mail met de drag & drop editor", "Selecteer de ontvangerlijst", "Plan of verstuur direct"] },
    ],
    tips: [
      "Test altijd met een A/B test voor onderwerpsregels.",
      "Plan social posts minstens een week vooruit.",
      "Gebruik UTM-parameters voor nauwkeurige campagne tracking.",
    ],
    tourSteps: [
      { title: "Campagnes", description: "Hier beheert u al uw marketing campagnes over alle kanalen." },
    ],
  },
  "/app/content-hub": {
    pageTitle: "Content Hub",
    pageDescription: "Uw centrale content werkplaats: schrijf, ontwerp, plan en publiceer.",
    features: [
      { icon: PenTool, title: "AI Writer", description: "Schrijf content met AI-hulp in uw merkstem" },
      { icon: Image, title: "Image Generator", description: "Genereer afbeeldingen met AI" },
      { icon: Video, title: "Video Creator", description: "Maak marketing video's" },
      { icon: Calendar, title: "Content Calendar", description: "Plan uw content op een visuele kalender" },
    ],
    howTos: [
      { title: "Content maken met AI", steps: ["Ga naar Content Hub → AI Writer", "Selecteer het content type (blog, social, email)", "Geef een onderwerp of prompt", "AI genereert content in uw merkstem", "Bewerk, goedkeur en publiceer"] },
      { title: "Content plannen", steps: ["Open de Content Calendar", "Klik op een datum", "Selecteer het kanaal en content type", "Wijs toe aan een teamlid", "Stel de publicatiedatum in"] },
    ],
    tips: [
      "Gebruik de AI Writer voor eerste drafts en bewerk daarna zelf.",
      "Plan content minstens 2 weken vooruit.",
      "Gebruik de Media Library voor consistent beeldmateriaal.",
    ],
    tourSteps: [
      { title: "Content Hub", description: "Hier creëert, plant en publiceert u al uw marketing content." },
    ],
  },
  "/app/automation": {
    pageTitle: "Automatisering",
    pageDescription: "Automatiseer uw marketing met workflows, customer journeys en AI agents.",
    features: [
      { icon: Workflow, title: "Workflows", description: "Bouw visuele automatiseringsworkflows" },
      { icon: Users, title: "Customer Journey", description: "Ontwerp gepersonaliseerde klantreizenr" },
      { icon: Brain, title: "Multi-Agent System", description: "AI agents die samenwerken aan taken" },
      { icon: Zap, title: "Smart Triggers", description: "Automatische acties op basis van events" },
    ],
    howTos: [
      { title: "Workflow bouwen", steps: ["Ga naar Automatisering → Workflows", "Klik op '+ Nieuwe Workflow'", "Stel de trigger in (bijv. 'nieuwe lead')", "Voeg acties toe (email, tag, notificatie)", "Activeer de workflow"] },
      { title: "Customer Journey maken", steps: ["Ga naar Customer Journey", "Kies een template of begin blanco", "Definieer touchpoints en kanalen", "Stel timing en condities in", "Publiceer de journey"] },
    ],
    tips: [
      "Begin met een simpele welkomst-workflow voor nieuwe leads.",
      "Test workflows altijd met een testcontact.",
      "Gebruik tags om leads te segmenteren in workflows.",
    ],
    tourSteps: [
      { title: "Automatisering", description: "Hier bouwt u geautomatiseerde marketing workflows en customer journeys." },
    ],
  },
  "/app/analytics": {
    pageTitle: "Analytics",
    pageDescription: "Analyseer uw marketing prestaties met gedetailleerde rapportages en dashboards.",
    features: [
      { icon: BarChart3, title: "Prestatie dashboard", description: "Overzicht van alle marketing KPI's" },
      { icon: FileText, title: "Rapporten", description: "Gedetailleerde rapportages per kanaal" },
      { icon: Users, title: "Contacten", description: "Beheer en analyseer uw contactdatabase" },
      { icon: Target, title: "Lead Scoring", description: "AI-gebaseerde lead kwalificatie" },
    ],
    howTos: [
      { title: "Rapport genereren", steps: ["Ga naar Analytics → Reports", "Selecteer het rapporttype", "Kies de periode en kanalen", "Klik op 'Genereer Rapport'", "Exporteer als PDF of Excel"] },
    ],
    tips: [
      "Review uw analytics wekelijks voor tijdige bijsturing.",
      "Gebruik Lead Scoring om uw beste leads te identificeren.",
      "Vergelijk periodes om seizoenseffecten te herkennen.",
    ],
    tourSteps: [
      { title: "Analytics", description: "Hier analyseert u uw marketing prestaties en genereert rapportages." },
    ],
  },
  "/app/networking": {
    pageTitle: "Networking Engine",
    pageDescription: "Ontdek en benut netwerkmogelijkheden met AI-gestuurde suggesties.",
    features: [
      { icon: Network, title: "Netwerk overzicht", description: "Visueel overzicht van uw professionele netwerk" },
      { icon: Lightbulb, title: "AI Suggesties", description: "AI identificeert waardevolle connecties" },
      { icon: Users, title: "Contact matching", description: "Match contacten met uw ideale klantprofiel" },
      { icon: Calendar, title: "Event planning", description: "Plan netwerk events en meetings" },
    ],
    howTos: [
      { title: "Netwerk benutten", steps: ["Open de Networking Engine", "Bekijk AI-gesuggereerde connecties", "Filter op branche, rol of locatie", "Stuur een connectieverzoek of bericht"] },
    ],
    tips: [
      "Reageer snel op AI-gesuggereerde kansen.",
      "Houd uw contactgegevens up-to-date.",
      "Gebruik events om uw netwerk te vergroten.",
    ],
    tourSteps: [
      { title: "Networking Engine", description: "Hier ontdekt en benut u netwerkmogelijkheden." },
    ],
  },
  "/app/content/writer": {
    pageTitle: "AI Writer",
    pageDescription: "Schrijf professionele marketing content met AI in uw merkstem.",
    features: [
      { icon: PenTool, title: "AI Content generatie", description: "Blogs, emails, social posts en meer" },
      { icon: Palette, title: "Merkstem", description: "Content in uw unieke tone of voice" },
      { icon: FileText, title: "Templates", description: "Vooraf gedefinieerde content templates" },
      { icon: RefreshCw, title: "Herschrijf & optimaliseer", description: "Verbeter bestaande teksten met AI" },
    ],
    howTos: [
      { title: "Content schrijven", steps: ["Open AI Writer", "Selecteer het content type", "Geef een onderwerp, context of prompt", "AI genereert een draft in uw merkstem", "Bewerk, kopieer of publiceer direct"] },
    ],
    tips: [
      "Geef specifieke instructies voor betere AI output.",
      "Gebruik Brand Memory voor consistente merkberichten.",
      "Laat AI meerdere varianten genereren en kies de beste.",
    ],
    tourSteps: [
      { title: "AI Writer", description: "Hier schrijft u marketing content met behulp van AI." },
    ],
  },
  "/app/content/images": {
    pageTitle: "Image Generator",
    pageDescription: "Genereer professionele marketing afbeeldingen met AI.",
    features: [
      { icon: Image, title: "AI Afbeeldingen", description: "Genereer unieke afbeeldingen met AI" },
      { icon: Palette, title: "Stijl opties", description: "Kies uit diverse visuele stijlen" },
      { icon: Layers, title: "Formaten", description: "Automatisch in alle social media formaten" },
      { icon: Upload, title: "Media Library", description: "Sla op en organiseer uw afbeeldingen" },
    ],
    howTos: [
      { title: "Afbeelding genereren", steps: ["Open Image Generator", "Beschrijf wat u wilt zien", "Kies de stijl en het formaat", "AI genereert varianten", "Selecteer en download de beste"] },
    ],
    tips: [
      "Wees specifiek in uw beschrijving voor betere resultaten.",
      "Genereer afbeeldingen in meerdere formaten voor cross-channel gebruik.",
      "Sla goede resultaten op in uw Media Library.",
    ],
    tourSteps: [
      { title: "Image Generator", description: "Hier genereert u marketing afbeeldingen met AI." },
    ],
  },
  "/app/content/video": {
    pageTitle: "Video Creator",
    pageDescription: "Maak professionele marketing video's met AI-ondersteuning.",
    features: [
      { icon: Video, title: "Video maker", description: "Maak video's met templates en AI" },
      { icon: Sparkles, title: "Auto-editing", description: "AI bewerkt en optimaliseert uw video's" },
      { icon: FileText, title: "Script generator", description: "AI schrijft video scripts voor u" },
      { icon: Upload, title: "Export", description: "Exporteer in alle gangbare formaten" },
    ],
    howTos: [
      { title: "Video maken", steps: ["Open Video Creator", "Kies een template of begin blanco", "Upload beeldmateriaal of gebruik stock", "Voeg tekst, muziek en effecten toe", "Exporteer in het gewenste formaat"] },
    ],
    tips: [
      "Korte video's (15-60 sec) presteren het best op social media.",
      "Voeg altijd ondertiteling toe — 85% kijkt zonder geluid.",
      "Gebruik uw merkkleuren en logo consistent.",
    ],
    tourSteps: [
      { title: "Video Creator", description: "Hier maakt u marketing video's met AI-ondersteuning." },
    ],
  },
  "/app/content/calendar": {
    pageTitle: "Content Calendar",
    pageDescription: "Plan en organiseer al uw content op een visuele kalender.",
    features: [
      { icon: Calendar, title: "Visuele planning", description: "Drag & drop content op de kalender" },
      { icon: Users, title: "Team samenwerking", description: "Wijs content toe aan teamleden" },
      { icon: Megaphone, title: "Multi-channel", description: "Plan voor alle kanalen tegelijk" },
      { icon: CheckCircle2, title: "Goedkeuringsflow", description: "Content review en goedkeuring" },
    ],
    howTos: [
      { title: "Content plannen", steps: ["Open de Content Calendar", "Klik op een datum om content toe te voegen", "Selecteer kanaal en content type", "Voeg de content toe of wijs toe aan een teamlid", "Stel de publicatietijd in"] },
    ],
    tips: [
      "Plan minstens 2 weken vooruit voor consistente output.",
      "Gebruik kleurcodes per kanaal voor overzicht.",
      "Review elke maandag de planning voor de komende week.",
    ],
    tourSteps: [
      { title: "Content Calendar", description: "Hier plant u al uw content op een overzichtelijke kalender." },
    ],
  },
  "/app/lead-scoring": {
    pageTitle: "Lead Scoring",
    pageDescription: "AI-gebaseerde lead kwalificatie en prioritering.",
    features: [
      { icon: Target, title: "Automatisch scoren", description: "AI scoort leads op basis van gedrag en profiel" },
      { icon: TrendingUp, title: "Score trends", description: "Volg hoe lead scores zich ontwikkelen" },
      { icon: Users, title: "Segmentatie", description: "Groepeer leads op kwaliteit" },
      { icon: Zap, title: "Triggers", description: "Automatische acties bij score-drempels" },
    ],
    howTos: [
      { title: "Lead Scoring instellen", steps: ["Ga naar Analytics → Lead Scoring", "Definieer scoring criteria (website bezoek, email opens, etc.)", "Stel gewichten in per actie", "Configureer drempels voor MQL en SQL", "Activeer automatische notificaties"] },
    ],
    tips: [
      "Stem uw scoring model af met het sales team.",
      "Review en pas scoring criteria elk kwartaal aan.",
      "Focus op behavioral scoring naast demografische data.",
    ],
    tourSteps: [
      { title: "Lead Scoring", description: "Hier configureert en monitort u uw AI-gestuurde lead scoring." },
    ],
  },
  "/app/publish": {
    pageTitle: "Publication Engine",
    pageDescription: "Publiceer content naar al uw kanalen vanuit één plek.",
    features: [
      { icon: Upload, title: "Multi-channel publicatie", description: "Publiceer naar social, web, email tegelijk" },
      { icon: Calendar, title: "Scheduling", description: "Plan publicaties voor optimale tijden" },
      { icon: RefreshCw, title: "Cross-posting", description: "Automatisch aanpassen per platform" },
      { icon: BarChart3, title: "Publicatie analytics", description: "Track prestaties per publicatie" },
    ],
    howTos: [
      { title: "Content publiceren", steps: ["Open de Publication Engine", "Selecteer de content om te publiceren", "Kies de doelkanalen", "Pas aan per platform indien nodig", "Plan of publiceer direct"] },
    ],
    tips: [
      "Gebruik de optimale posttijden per platform.",
      "Pas content altijd aan per kanaal — geen copy-paste.",
      "Bekijk publicatie analytics om de beste tijden te vinden.",
    ],
    tourSteps: [
      { title: "Publication Engine", description: "Hier publiceert u content naar al uw kanalen." },
    ],
  },
  "/app/settings": {
    pageTitle: "Instellingen",
    pageDescription: "Configureer uw account, team en systeemvoorkeuren.",
    features: [
      { icon: Settings, title: "Account instellingen", description: "Profiel, wachtwoord en voorkeuren" },
      { icon: Users, title: "Team beheer", description: "Teamleden uitnodigen en rollen toewijzen" },
      { icon: Globe, title: "Taal & regio", description: "Taal, tijdzone en valuta instellen" },
      { icon: Shield, title: "Beveiliging", description: "Twee-factor authenticatie en API keys" },
    ],
    howTos: [
      { title: "Instellingen aanpassen", steps: ["Open Instellingen via het menu", "Navigeer naar de gewenste sectie", "Pas de instellingen aan", "Klik op Opslaan"] },
    ],
    tips: [
      "Stel twee-factor authenticatie in voor extra beveiliging.",
      "Nodig teamleden uit met de juiste rollen voor samenwerking.",
      "Check uw notificatie-instellingen voor relevante alerts.",
    ],
    tourSteps: [
      { title: "Instellingen", description: "Hier configureert u uw account en systeemvoorkeuren." },
    ],
  },
  "/app/campaign-triggering": {
    pageTitle: "Campaign Triggering",
    pageDescription: "AI-gestuurde triggers die automatisch campagnes activeren op het juiste moment.",
    features: [
      { icon: Zap, title: "Smart Triggers", description: "AI bepaalt het optimale moment voor campagnes" },
      { icon: Brain, title: "Gedragsanalyse", description: "Triggers op basis van klantgedrag" },
      { icon: Target, title: "Condities", description: "Stel complexe trigger-condities in" },
      { icon: BarChart3, title: "Performance", description: "Meet de effectiviteit van triggers" },
    ],
    howTos: [
      { title: "Trigger instellen", steps: ["Open Campaign Triggering", "Klik op '+ Nieuwe Trigger'", "Definieer de conditie (bijv. website bezoek, abandoned cart)", "Koppel een campagne of actie", "Activeer en monitor de resultaten"] },
    ],
    tips: [
      "Abandoned cart triggers hebben de hoogste conversie.",
      "Stel een cooldown periode in om klanten niet te overspoelen.",
      "Test triggers met een kleine groep vóór breed uitrollen.",
    ],
    tourSteps: [
      { title: "Campaign Triggering", description: "Hier configureert u AI-gestuurde campagne triggers." },
    ],
  },
  "/app/media-library": {
    pageTitle: "Media Library",
    pageDescription: "Beheer al uw marketing assets: afbeeldingen, video's, documenten en meer.",
    features: [
      { icon: Image, title: "Asset beheer", description: "Organiseer alle marketing bestanden" },
      { icon: Search, title: "AI Zoeken", description: "Zoek assets met AI-gestuurde tags" },
      { icon: Layers, title: "Collecties", description: "Groepeer assets in collecties" },
      { icon: Upload, title: "Bulk upload", description: "Upload meerdere bestanden tegelijk" },
    ],
    howTos: [
      { title: "Assets beheren", steps: ["Open de Media Library", "Upload bestanden via drag & drop of de upload knop", "AI voegt automatisch tags toe", "Organiseer in collecties voor overzicht", "Gebruik assets direct in content en campagnes"] },
    ],
    tips: [
      "Gebruik een consistente naamgevingsconventie.",
      "Maak collecties per campagne of seizoen.",
      "Verwijder ongebruikte assets periodiek.",
    ],
    tourSteps: [
      { title: "Media Library", description: "Hier beheert u al uw marketing assets en bestanden." },
    ],
  },
  "/app/content-studio": {
    pageTitle: "Content Studio",
    pageDescription: "AI-gestuurde werkplaats voor het creëren van professionele marketing content.",
    features: [
      { icon: Sparkles, title: "AI Content creatie", description: "Genereer content met geavanceerde AI" },
      { icon: Palette, title: "Merkidentiteit", description: "Content automatisch in uw huisstijl" },
      { icon: Layers, title: "Multi-format", description: "Eén content item in meerdere formaten" },
      { icon: CheckCircle2, title: "Review flow", description: "Team review en goedkeuring" },
    ],
    howTos: [
      { title: "Content Studio gebruiken", steps: ["Open Content Studio", "Kies het type content dat u wilt maken", "Geef AI instructies en context", "Review en bewerk het resultaat", "Publiceer of exporteer"] },
    ],
    tips: [
      "Brand Memory maakt uw content consistenter.",
      "Genereer content in meerdere varianten en kies de beste.",
      "Hergebruik content door het om te zetten naar andere formaten.",
    ],
    tourSteps: [
      { title: "Content Studio", description: "Hier creëert u professionele content met AI." },
    ],
  },
  "/app/reports": {
    pageTitle: "Rapportages",
    pageDescription: "Gedetailleerde marketing rapportages en exportmogelijkheden.",
    features: [
      { icon: FileText, title: "Rapport templates", description: "Voorgedefinieerde rapport templates" },
      { icon: BarChart3, title: "Custom dashboards", description: "Maak uw eigen rapportage dashboards" },
      { icon: Calendar, title: "Periodiek", description: "Automatische periodieke rapporten" },
      { icon: Upload, title: "Export", description: "Exporteer naar PDF, Excel of presentatie" },
    ],
    howTos: [
      { title: "Rapport genereren", steps: ["Ga naar Analytics → Reports", "Selecteer een template of maak custom", "Kies periode en kanalen", "Genereer het rapport", "Download of deel met uw team"] },
    ],
    tips: [
      "Maak een maandelijks rapport template voor consistente reporting.",
      "Stel automatische rapporten in voor stakeholders.",
      "Focus op actionable insights, niet alleen data.",
    ],
    tourSteps: [
      { title: "Rapportages", description: "Hier genereert en deelt u marketing rapportages." },
    ],
  },
};

const DEFAULT_GUIDE: GuideContent = {
  pageTitle: "Inclufy Marketing",
  pageDescription: "Uw complete AI-gestuurde marketing platform. Ontdek hieronder alle modules.",
  features: [
    { icon: BarChart3, title: "Dashboard", description: "Centraal overzicht van al uw marketing metrics" },
    { icon: Brain, title: "AI Marketing", description: "Laat AI autonoom marketing taken uitvoeren" },
    { icon: Rocket, title: "Campagnes", description: "Multichannel campagnes beheren" },
    { icon: PenTool, title: "Content Hub", description: "Content creëren, plannen en publiceren" },
  ],
  howTos: [
    { title: "Aan de slag met Inclufy Marketing", steps: ["Configureer uw merk via Setup (Brand, Doelgroep, Doelen)", "Koppel uw social media en tools (Integraties)", "Maak uw eerste campagne of content item", "Bekijk prestaties in het Dashboard en Analytics"] },
    { title: "Navigeren in de applicatie", steps: ["Gebruik de zijbalk links om naar modules te navigeren", "Open de AI Copilot (rechts) voor hulp op elke pagina", "Klik op 'Gids' voor pagina-specifieke handleidingen", "Gebruik de zoekbalk bovenin om snel te zoeken"] },
  ],
  tips: [
    "Gebruik de AI Copilot om snel antwoorden te vinden over elke module.",
    "Een complete Setup maakt alle AI-functies nauwkeuriger.",
    "Klik op 'Gids' op elke pagina voor context-specifieke handleidingen.",
  ],
  tourSteps: [
    { title: "Welkom bij Inclufy Marketing", description: "Dit is uw complete AI marketing platform. Laten we een rondleiding doen." },
  ],
};

/* ─── CheckCircle2 import fix ─── */
const CheckCircle2 = Check; // Reuse Check icon

/* ─── Related pages navigation map ─── */
interface NavLink {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  links: NavLink[];
}

const RELATED_PAGES: Record<string, NavLink[]> = {
  "/app/dashboard":          [{ label: "Analytics", path: "/app/analytics", icon: BarChart3 }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }, { label: "Growth Blueprint", path: "/app/growth-blueprint", icon: Brain }],
  "/app/autonomous":         [{ label: "AI Workflows", path: "/app/automation/workflows", icon: Workflow }, { label: "Content Studio", path: "/app/content-studio", icon: Sparkles }, { label: "Campaign Triggering", path: "/app/campaign-triggering", icon: Zap }],
  "/app/marketing-budget":   [{ label: "Analytics", path: "/app/analytics", icon: BarChart3 }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }, { label: "Dashboard", path: "/app/dashboard", icon: Layout }],
  "/app/integrations":       [{ label: "Instellingen", path: "/app/settings", icon: Settings }, { label: "Automatisering", path: "/app/automation/workflows", icon: Workflow }, { label: "Analytics", path: "/app/analytics", icon: BarChart3 }],
  "/app/opportunity-feed":   [{ label: "Growth Blueprint", path: "/app/growth-blueprint", icon: Brain }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }, { label: "Content Hub", path: "/app/content-hub", icon: PenTool }],
  "/app/campaigns":          [{ label: "Content Hub", path: "/app/content-hub", icon: PenTool }, { label: "Analytics", path: "/app/analytics", icon: BarChart3 }, { label: "Automatisering", path: "/app/automation/workflows", icon: Workflow }],
  "/app/content-hub":        [{ label: "AI Writer", path: "/app/content/writer", icon: PenTool }, { label: "Calendar", path: "/app/content/calendar", icon: Calendar }, { label: "Media Library", path: "/app/media-library", icon: Image }],
  "/app/automation":         [{ label: "Campaign Triggering", path: "/app/campaign-triggering", icon: Zap }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }, { label: "Lead Scoring", path: "/app/lead-scoring", icon: Target }],
  "/app/analytics":          [{ label: "Rapportages", path: "/app/reports", icon: FileText }, { label: "Lead Scoring", path: "/app/lead-scoring", icon: Target }, { label: "Dashboard", path: "/app/dashboard", icon: Layout }],
  "/app/networking":         [{ label: "Contacten", path: "/app/contacts", icon: Users }, { label: "Opportunity Feed", path: "/app/opportunity-feed", icon: Lightbulb }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }],
  "/app/settings":           [{ label: "Integraties", path: "/app/integrations", icon: Globe }, { label: "Configuratie", path: "/app/setup/brand", icon: Palette }, { label: "Dashboard", path: "/app/dashboard", icon: Layout }],
  "/app/content/writer":     [{ label: "Content Studio", path: "/app/content-studio", icon: Sparkles }, { label: "Calendar", path: "/app/content/calendar", icon: Calendar }, { label: "Publication Engine", path: "/app/publish", icon: Upload }],
  "/app/content/images":     [{ label: "Media Library", path: "/app/media-library", icon: Image }, { label: "Content Hub", path: "/app/content-hub", icon: PenTool }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }],
  "/app/content/video":      [{ label: "Media Library", path: "/app/media-library", icon: Image }, { label: "Content Hub", path: "/app/content-hub", icon: PenTool }, { label: "Publication Engine", path: "/app/publish", icon: Upload }],
  "/app/content/calendar":   [{ label: "Content Hub", path: "/app/content-hub", icon: PenTool }, { label: "Publication Engine", path: "/app/publish", icon: Upload }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }],
  "/app/lead-scoring":       [{ label: "Analytics", path: "/app/analytics", icon: BarChart3 }, { label: "Contacten", path: "/app/contacts", icon: Users }, { label: "Automatisering", path: "/app/automation/workflows", icon: Workflow }],
  "/app/publish":            [{ label: "Content Calendar", path: "/app/content/calendar", icon: Calendar }, { label: "Content Hub", path: "/app/content-hub", icon: PenTool }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }],
  "/app/growth-blueprint":   [{ label: "Dashboard", path: "/app/dashboard", icon: Layout }, { label: "Opportunity Feed", path: "/app/opportunity-feed", icon: Lightbulb }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }],
  "/app/campaign-triggering":[{ label: "Automatisering", path: "/app/automation/workflows", icon: Workflow }, { label: "Campagnes", path: "/app/campaigns", icon: Rocket }, { label: "Lead Scoring", path: "/app/lead-scoring", icon: Target }],
  "/app/media-library":      [{ label: "Image Generator", path: "/app/content/images", icon: Image }, { label: "Content Hub", path: "/app/content-hub", icon: PenTool }, { label: "Video Creator", path: "/app/content/video", icon: Video }],
  "/app/content-studio":     [{ label: "AI Writer", path: "/app/content/writer", icon: PenTool }, { label: "Brand Memory", path: "/app/intelligence/brand", icon: Brain }, { label: "Content Hub", path: "/app/content-hub", icon: PenTool }],
  "/app/reports":            [{ label: "Analytics", path: "/app/analytics", icon: BarChart3 }, { label: "Dashboard", path: "/app/dashboard", icon: Layout }, { label: "Lead Scoring", path: "/app/lead-scoring", icon: Target }],
};

const APP_SITEMAP: NavSection[] = [
  { title: "Overzicht", links: [
    { label: "Dashboard", path: "/app/dashboard", icon: Layout },
    { label: "AI Marketing", path: "/app/autonomous", icon: Brain },
    { label: "Marketing Budget", path: "/app/marketing-budget", icon: Target },
  ]},
  { title: "Configuratie", links: [
    { label: "Brand Setup", path: "/app/setup/brand", icon: Palette },
    { label: "Doelgroep", path: "/app/setup/audience", icon: Users },
    { label: "Doelen & KPI's", path: "/app/setup/goals", icon: Target },
    { label: "Concurrentie", path: "/app/setup/competition", icon: Search },
  ]},
  { title: "Intelligence", links: [
    { label: "Growth Blueprint", path: "/app/growth-blueprint", icon: Brain },
    { label: "Brand Memory", path: "/app/intelligence/brand", icon: Brain },
    { label: "Market Insights", path: "/app/intelligence/market", icon: Globe },
    { label: "Competitor Analysis", path: "/app/intelligence/competitors", icon: Search },
    { label: "Content Studio", path: "/app/content-studio", icon: Sparkles },
  ]},
  { title: "Campagnes", links: [
    { label: "Campagne Manager", path: "/app/campaigns", icon: Rocket },
    { label: "E-mail Marketing", path: "/app/campaigns/email", icon: Mail },
    { label: "Social Media", path: "/app/campaigns/social", icon: Megaphone },
    { label: "Landing Pages", path: "/app/campaigns/landing", icon: Layout },
  ]},
  { title: "Content", links: [
    { label: "Content Hub", path: "/app/content-hub", icon: PenTool },
    { label: "AI Writer", path: "/app/content/writer", icon: PenTool },
    { label: "Image Generator", path: "/app/content/images", icon: Image },
    { label: "Video Creator", path: "/app/content/video", icon: Video },
    { label: "Calendar", path: "/app/content/calendar", icon: Calendar },
    { label: "Media Library", path: "/app/media-library", icon: Image },
    { label: "Publication Engine", path: "/app/publish", icon: Upload },
  ]},
  { title: "Automatisering", links: [
    { label: "Workflows", path: "/app/automation/workflows", icon: Workflow },
    { label: "Customer Journey", path: "/app/automation/journeys", icon: Users },
    { label: "Smart Triggers", path: "/app/automation/triggers", icon: Zap },
    { label: "Campaign Triggering", path: "/app/campaign-triggering", icon: Zap },
  ]},
  { title: "Analytics & Overig", links: [
    { label: "Analytics", path: "/app/analytics", icon: BarChart3 },
    { label: "Rapportages", path: "/app/reports", icon: FileText },
    { label: "Lead Scoring", path: "/app/lead-scoring", icon: Target },
    { label: "Networking", path: "/app/networking", icon: Network },
    { label: "Integraties", path: "/app/integrations", icon: Globe },
    { label: "Instellingen", path: "/app/settings", icon: Settings },
  ]},
];

/* ═══════════════════════════════════════════════════════════════════
   QUICK PROMPTS & SUGGESTIONS (Chat tab)
   ═══════════════════════════════════════════════════════════════════ */

const QUICK_PROMPTS = [
  { icon: Lightbulb, label: 'Campagne idee', prompt: 'Geef me 3 creatieve campagne-ideeën voor mijn bedrijf' },
  { icon: Mail, label: 'E-mail schrijven', prompt: 'Schrijf een professionele marketing e-mail voor een product lancering' },
  { icon: TrendingUp, label: 'SEO tips', prompt: 'Geef me 5 SEO tips om mijn website hoger te laten ranken' },
  { icon: FileText, label: 'Social post', prompt: 'Maak een pakkende social media post voor Instagram en LinkedIn' },
];

const SUGGESTIONS = [
  { icon: BarChart3, title: 'Campagne analyse', desc: 'Bekijk de prestaties van je actieve campagnes' },
  { icon: PenTool, title: 'Content calendar', desc: 'Plan je content voor de komende week' },
  { icon: Zap, title: 'Groei tips', desc: 'Ontdek kansen om je bereik te vergroten' },
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function AICopilot({ isOpen, onClose, initialContext, onContextConsumed, requestedTab }: AICopilotProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CopilotTab>('chat');
  const [isTourOpen, setIsTourOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextProcessedRef = useRef<string | null>(null);

  // Resolve current page path for guide lookup
  const currentPath = location.pathname;
  // Try exact match first, then try progressively shorter paths
  const guide = GUIDE_MAP[currentPath]
    || GUIDE_MAP["/" + currentPath.split("/").filter(Boolean).slice(0, 2).join("/")]
    || GUIDE_MAP["/" + currentPath.split("/").filter(Boolean).slice(0, 3).join("/")]
    || DEFAULT_GUIDE;

  // Sync with requested tab from parent
  useEffect(() => {
    if (requestedTab) setActiveTab(requestedTab);
  }, [requestedTab]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, activeTab]);

  // Handle initialContext: auto-send first message when copilot opens with context
  useEffect(() => {
    if (!isOpen || !initialContext || isLoading) return;
    const contextKey = `${initialContext.systemPrompt}:${initialContext.firstMessage || ''}`;
    if (contextProcessedRef.current === contextKey) return;
    contextProcessedRef.current = contextKey;
    setCustomSystemPrompt(initialContext.systemPrompt);
    setMessages([]);
    if (initialContext.firstMessage) {
      setTimeout(() => {
        sendMessageWithPrompt(initialContext.firstMessage!, initialContext.systemPrompt);
      }, 400);
    }
    onContextConsumed?.();
  }, [isOpen, initialContext]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const DEFAULT_SYSTEM_PROMPT = 'Je bent een behulpzame AI Marketing Co-pilot voor het Inclufy Marketing platform. Antwoord altijd in het Nederlands. Je helpt met marketing strategie, content creatie, campagne planning, SEO, social media, en e-mail marketing. Geef praktische, actiegerichte adviezen. Gebruik markdown formatting voor duidelijke structuur.';

  const sendMessageWithPrompt = async (text: string, systemPrompt?: string) => {
    if (!text || isLoading) return;
    const userMessage: Message = { id: generateId(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const history = [...messages, userMessage].filter(m => m.role !== 'system').slice(-10).map(m => ({ role: m.role, content: m.content }));
      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: { messages: history, system_prompt: systemPrompt || customSystemPrompt || DEFAULT_SYSTEM_PROMPT },
      });
      const assistantMessage: Message = {
        id: generateId(), role: 'assistant',
        content: fnError ? 'AI is tijdelijk niet beschikbaar. Probeer het later opnieuw.' : (fnData?.response || fnData?.content || 'Sorry, ik kon geen antwoord genereren.'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('[AICopilot] Error:', err);
      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: getFallbackResponse(text), timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;
    await sendMessageWithPrompt(messageText);
  };

  const clearChat = () => {
    setMessages([]);
    setCustomSystemPrompt(null);
    contextProcessedRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (rendered.startsWith('• ') || rendered.startsWith('- ')) return <p key={i} className="ml-2 text-[13px]" dangerouslySetInnerHTML={{ __html: rendered }} />;
      if (rendered.startsWith('### ')) return <p key={i} className="font-bold text-xs mt-2" dangerouslySetInnerHTML={{ __html: rendered.slice(4) }} />;
      if (rendered.startsWith('## ')) return <p key={i} className="font-bold text-sm mt-2" dangerouslySetInnerHTML={{ __html: rendered.slice(3) }} />;
      if (rendered.trim() === '') return <br key={i} />;
      return <p key={i} className="text-[13px]" dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  const hasMessages = messages.length > 0;

  if (!isOpen) return null;

  /* ─── Guide Tab Content ─── */
  const renderGuideTab = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {/* Page header */}
      <div className="rounded-lg bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-200 dark:border-purple-800/50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Info className="h-4 w-4 text-purple-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{guide.pageTitle}</h4>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{guide.pageDescription}</p>
        {guide.tourSteps.length > 0 && (
          <Button
            size="sm"
            className="mt-3 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            onClick={() => setIsTourOpen(true)}
          >
            <Play className="h-3 w-3 mr-1.5" />
            Start Rondleiding
          </Button>
        )}
      </div>

      {/* Features */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">Functies</p>
        <div className="grid grid-cols-1 gap-1.5">
          {guide.features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{feature.title}</p>
                  <p className="text-[10px] text-gray-500 leading-snug">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* How-To's */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">Hoe werkt het?</p>
        {guide.howTos.map((howTo, i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3 text-purple-500" />
              <p className="text-xs font-semibold text-gray-900 dark:text-white">{howTo.title}</p>
            </div>
            <ol className="space-y-1 ml-4">
              {howTo.steps.map((step, j) => (
                <li key={j} className="flex items-start gap-2 text-[10px] text-gray-500">
                  <span className="w-4 h-4 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">{j + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Tips */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">Tips & Best Practices</p>
        {guide.tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>

      {/* Ask AI button */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            setActiveTab('chat');
            sendMessage(`Hoe gebruik ik ${guide.pageTitle}? Geef me een overzicht.`);
          }}
        >
          <MessageSquare className="h-3 w-3 mr-1.5" />
          Vraag de AI Copilot over {guide.pageTitle}
        </Button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Related pages navigation */}
      {RELATED_PAGES[currentPath] && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1 flex items-center gap-1">
            <Compass className="h-3 w-3" />
            Gerelateerde pagina&apos;s
          </p>
          <div className="grid grid-cols-1 gap-1">
            {RELATED_PAGES[currentPath].map((link, i) => {
              const LinkIcon = link.icon;
              return (
                <button
                  key={i}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-purple-300 transition-all text-left group cursor-pointer w-full"
                  onClick={() => navigate(link.path)}
                >
                  <div className="w-6 h-6 rounded-md bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center shrink-0 transition-colors">
                    <LinkIcon className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 transition-colors">{link.label}</span>
                  <ExternalLink className="h-2.5 w-2.5 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Full app sitemap */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1 flex items-center gap-1">
          <Map className="h-3 w-3" />
          Alle modules
        </p>
        <div className="space-y-2">
          {APP_SITEMAP.map((section, si) => (
            <div key={si} className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{section.title}</p>
              <div className="grid grid-cols-2 gap-1">
                {section.links.map((link, li) => {
                  const SitemapIcon = link.icon;
                  const isCurrentPage = currentPath === link.path || currentPath.startsWith(link.path + "/");
                  return (
                    <button
                      key={li}
                      className={cn(
                        "flex items-center gap-1.5 p-1.5 rounded-md text-left transition-all cursor-pointer text-[10px]",
                        isCurrentPage
                          ? "bg-purple-500/10 text-purple-700 font-semibold border border-purple-200 dark:border-purple-800/50"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                      )}
                      onClick={() => !isCurrentPage && navigate(link.path)}
                    >
                      <SitemapIcon className={cn("h-3 w-3 shrink-0", isCurrentPage ? "text-purple-600" : "text-gray-400")} />
                      <span className="truncate">{link.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed right-0 top-0 bottom-0 z-40 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden"
            style={{ width: 320 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Copilot</h3>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Online
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {hasMessages && activeTab === 'chat' && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600" onClick={clearChat} title="Chat wissen">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600" onClick={onClose} title="Sluiten">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <button
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2",
                  activeTab === 'chat'
                    ? "border-purple-600 text-purple-700 dark:text-purple-400"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                )}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
              <button
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2",
                  activeTab === 'guide'
                    ? "border-purple-600 text-purple-700 dark:text-purple-400"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                )}
                onClick={() => setActiveTab('guide')}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Gids
              </button>
            </div>

            {/* Content */}
            {activeTab === 'guide' ? (
              renderGuideTab()
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  {!hasMessages ? (
                    <div className="p-4 space-y-5">
                      <div className="flex flex-col items-center text-center pt-4 pb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Hallo! Ik ben uw AI Copilot</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-[220px]">Ik help u met marketing strategie, content & inzichten</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Suggesties</p>
                        <div className="space-y-2">
                          {SUGGESTIONS.map((sug) => (
                            <button key={sug.title} onClick={() => sendMessage(sug.desc)} className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                <sug.icon className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">{sug.title}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{sug.desc}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 mt-0.5 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Snelle Acties</p>
                        <div className="space-y-1">
                          {QUICK_PROMPTS.map((qp) => (
                            <button key={qp.label} onClick={() => sendMessage(qp.prompt)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                              <qp.icon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{qp.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3 space-y-3">
                      {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-2.5", msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                          {msg.role === 'assistant' && (
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Sparkles className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                          <div className={cn("max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed group relative", msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm')}>
                            <div className="space-y-0.5">{renderContent(msg.content)}</div>
                            {msg.role === 'assistant' && (
                              <button onClick={() => copyMessage(msg.id, msg.content)} className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                                {copiedId === msg.id ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                                {copiedId === msg.id ? 'Gekopieerd' : 'Kopiëren'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl rounded-bl-sm px-3 py-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Aan het nadenken...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                {/* Input Area */}
                <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Stel een vraag..."
                      className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400"
                    />
                    <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} size="sm" className="h-9 w-9 p-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1.5 text-center">Inclufy AI Copilot &middot; Powered by gespecialiseerde agents</p>
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Guided Tour overlay */}
      {isTourOpen && guide.tourSteps.length > 0 && (
        <GuidedTour steps={guide.tourSteps} onClose={() => setIsTourOpen(false)} />
      )}
    </>
  );
}

// Fallback responses when API is not available
function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes('campagne') || lower.includes('campaign')) {
    return `Hier zijn 3 campagne-ideeën:\n\n**1. Seizoensgebonden Promotie**\nMaak een tijdgebonden aanbieding gekoppeld aan het huidige seizoen.\n\n**2. User-Generated Content Campagne**\nVraag klanten om hun ervaring te delen op social media.\n\n**3. Educational Content Series**\nCreëer een serie van 5 waardevolle tips in uw vakgebied.`;
  }
  if (lower.includes('email') || lower.includes('e-mail')) {
    return `Tips voor een effectieve marketing e-mail:\n\n**Onderwerpregel:** kort (max 50 tekens), persoonlijk\n**Inhoud:** belangrijkste boodschap eerst, één CTA\n**Timing:** dinsdag-donderdag, 10:00 of 14:00`;
  }
  if (lower.includes('seo') || lower.includes('google')) {
    return `Top 5 SEO tips:\n\n**1.** Keyword Research\n**2.** On-Page Optimalisatie\n**3.** Kwalitatieve content (1500+ woorden)\n**4.** Technische SEO (snelle laadtijden)\n**5.** Linkbuilding via partnerships`;
  }
  return `Ik kan u helpen met:\n\n• **Campagne-ideeën** — Creatieve marketing campagnes\n• **E-mail schrijven** — Professionele marketing e-mails\n• **SEO tips** — Zoekmachineoptimalisatie advies\n• **Social posts** — Social media content\n\nProbeer een van deze suggesties! 🚀`;
}
