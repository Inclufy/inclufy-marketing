// src/components/BrandStylePreview.tsx
// Reusable brand style preview — social posts, ads, stories, website hero, email, per-audience variants

import { useState } from 'react';
import {
  Building2, Heart, MessageCircle, Share2, Bookmark, Send, ThumbsUp, MoreHorizontal,
  Globe, Mail, Palette, Smartphone, Monitor, ChevronUp, Target, Users,
  Megaphone, ArrowRight, Play, ExternalLink, MousePointer
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface AudienceInfo {
  audienceType: 'B2B' | 'B2C' | '';
  idealCustomer?: string;
  occupation?: string;
  ageGroup?: string;
  companySize?: string;
  customerSector?: string;
  painPoints?: string;
}

interface BrandStylePreviewProps {
  brandName: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor: string;
  tone?: string;
  mission?: string;
  logoUrl?: string | null;
  lang?: 'nl' | 'en' | 'fr';
  usps?: string[];
  audiences?: AudienceInfo[];
  compact?: boolean;
}

const TONE_LABELS: Record<string, { nl: string; fr: string; en: string }> = {
  professional: { nl: 'Professioneel', fr: 'Professionnel', en: 'Professional' },
  friendly: { nl: 'Vriendelijk', fr: 'Amical', en: 'Friendly' },
  innovative: { nl: 'Innovatief', fr: 'Innovant', en: 'Innovative' },
  playful: { nl: 'Creatief', fr: 'Créatif', en: 'Creative' },
  authoritative: { nl: 'Autoritair', fr: 'Autoritaire', en: 'Authoritative' },
  casual: { nl: 'Casual', fr: 'Décontracté', en: 'Casual' },
  luxury: { nl: 'Premium', fr: 'Premium', en: 'Premium' },
};

const SAMPLE_POSTS: Record<string, { nl: string; fr: string; en: string }> = {
  professional: {
    nl: 'Ontdek hoe onze oplossingen uw bedrijf naar een hoger niveau tillen. Resultaatgericht, betrouwbaar en data-gedreven.',
    fr: 'Découvrez comment nos solutions propulsent votre entreprise. Axé sur les résultats, fiable et piloté par les données.',
    en: 'Discover how our solutions elevate your business. Results-driven, reliable, and data-powered.',
  },
  friendly: {
    nl: 'Hey! Wist je dat we je graag helpen groeien? Samen maken we het verschil — stap voor stap.',
    fr: 'Salut ! Saviez-vous que nous adorons vous aider à grandir ? Ensemble, faisons la différence — pas à pas.',
    en: 'Hey! Did you know we love helping you grow? Together we make the difference — step by step.',
  },
  innovative: {
    nl: 'De toekomst van marketing begint hier. AI-gestuurd, radicaal anders, en ontworpen voor groei.',
    fr: 'L\'avenir du marketing commence ici. Piloté par l\'IA, radicalement différent, conçu pour la croissance.',
    en: 'The future of marketing starts here. AI-powered, radically different, and built for growth.',
  },
  playful: {
    nl: 'Klaar om je creativiteit de vrije loop te laten? Wij zorgen voor de vonk — jij voor het vuur!',
    fr: 'Prêt à libérer votre créativité ? Nous apportons l\'étincelle — vous apportez le feu !',
    en: 'Ready to unleash your creativity? We bring the spark — you bring the fire!',
  },
  authoritative: {
    nl: 'Met meer dan 10 jaar ervaring leveren we bewezen strategieën die meetbaar resultaat opleveren.',
    fr: 'Avec plus de 10 ans d\'expérience, nous livrons des stratégies éprouvées avec des résultats mesurables.',
    en: 'With 10+ years of expertise, we deliver proven strategies with measurable results.',
  },
  casual: {
    nl: 'Geen gedoe, gewoon resultaat. Zo simpel kan marketing zijn — check het zelf!',
    fr: 'Pas de tracas, juste des résultats. Le marketing peut être aussi simple — voyez par vous-même !',
    en: 'No fuss, just results. Marketing can be this simple — see for yourself!',
  },
};

// Ad headlines per tone
const AD_HEADLINES: Record<string, { nl: string; fr: string; en: string }> = {
  professional: { nl: 'Groei met bewezen resultaten', fr: 'Croissez avec des résultats prouvés', en: 'Grow with proven results' },
  friendly: { nl: 'Samen groeien, samen winnen!', fr: 'Grandir ensemble, gagner ensemble !', en: 'Grow together, win together!' },
  innovative: { nl: 'De toekomst begint nu', fr: 'Le futur commence maintenant', en: 'The future starts now' },
  playful: { nl: 'Klaar voor iets nieuws?', fr: 'Prêt pour du nouveau ?', en: 'Ready for something new?' },
  authoritative: { nl: 'De standaard in onze branche', fr: 'La référence de notre secteur', en: 'The industry standard' },
  casual: { nl: 'Check dit eens uit!', fr: 'Jetez un œil !', en: 'Check this out!' },
};

// Story headlines per tone
const STORY_HEADLINES: Record<string, { nl: string; fr: string; en: string }> = {
  professional: { nl: 'Ontdek de mogelijkheden', fr: 'Découvrez les possibilités', en: 'Discover the possibilities' },
  friendly: { nl: 'We hebben nieuws voor je!', fr: 'On a des nouvelles pour vous !', en: 'We\'ve got news for you!' },
  innovative: { nl: 'Iets baanbrekends', fr: 'Quelque chose de révolutionnaire', en: 'Something groundbreaking' },
  playful: { nl: 'Swipe voor de verrassing', fr: 'Swipez pour la surprise', en: 'Swipe for the surprise' },
  authoritative: { nl: 'Inzichten die tellen', fr: 'Des insights qui comptent', en: 'Insights that matter' },
  casual: { nl: 'Psst... nieuw ding!', fr: 'Psst... du nouveau !', en: 'Psst... new thing!' },
};

// Audience-specific messaging
function getAudienceMessage(a: AudienceInfo, lang: string): { headline: string; body: string; cta: string } {
  const nl = lang === 'nl'; const fr = lang === 'fr';
  if (a.audienceType === 'B2B') {
    return {
      headline: nl ? `Oplossingen voor ${a.customerSector || 'uw branche'}` : fr ? `Solutions pour ${a.customerSector || 'votre secteur'}` : `Solutions for ${a.customerSector || 'your industry'}`,
      body: nl ? `Speciaal voor ${a.companySize || 'bedrijven'} die willen groeien. ${a.painPoints ? `We lossen op: ${a.painPoints.slice(0, 60)}` : 'Resultaatgericht en schaalbaar.'}` : fr ? `Spécialement pour les ${a.companySize || 'entreprises'} qui veulent croître. ${a.painPoints ? `Nous résolvons : ${a.painPoints.slice(0, 60)}` : 'Axé sur les résultats et évolutif.'}` : `Built for ${a.companySize || 'businesses'} that want to grow. ${a.painPoints ? `We solve: ${a.painPoints.slice(0, 60)}` : 'Results-driven and scalable.'}`,
      cta: nl ? 'Plan een demo' : fr ? 'Planifier une démo' : 'Book a demo',
    };
  }
  return {
    headline: nl ? `Perfect voor ${a.occupation || a.ageGroup || 'jou'}` : fr ? `Parfait pour ${a.occupation || a.ageGroup || 'vous'}` : `Perfect for ${a.occupation || a.ageGroup || 'you'}`,
    body: nl ? `${a.painPoints ? `${a.painPoints.slice(0, 60)}? Wij helpen je.` : 'Ontdek wat we voor je kunnen betekenen.'}` : fr ? `${a.painPoints ? `${a.painPoints.slice(0, 60)} ? Nous vous aidons.` : 'Découvrez ce que nous pouvons faire pour vous.'}` : `${a.painPoints ? `${a.painPoints.slice(0, 60)}? We can help.` : 'Discover what we can do for you.'}`,
    cta: nl ? 'Probeer gratis' : fr ? 'Essai gratuit' : 'Try free',
  };
}

function getContrastColor(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a2e' : '#ffffff';
  } catch { return '#ffffff'; }
}

// ─── Logo/Avatar helper ──────────────────────────────────────────
function BrandAvatar({ logoUrl, brandName, primaryColor, secondaryColor, textOnPrimary, size = 'md' }: {
  logoUrl?: string | null; brandName: string; primaryColor: string; secondaryColor: string; textOnPrimary: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-xl' };
  if (logoUrl) return <img src={logoUrl} alt="" className={cn(sizes[size], 'rounded-full object-cover')} />;
  return (
    <div className={cn(sizes[size], 'rounded-full flex items-center justify-center shrink-0')} style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
      <span className={cn(textSizes[size], 'font-bold')} style={{ color: textOnPrimary }}>{(brandName || 'B')[0].toUpperCase()}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
export default function BrandStylePreview({
  brandName,
  tagline,
  primaryColor = '#7c3aed',
  secondaryColor = '#ec4899',
  tone = 'professional',
  mission,
  logoUrl,
  lang = 'nl',
  usps = [],
  audiences = [],
  compact = false,
}: BrandStylePreviewProps) {
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const toneLabel = TONE_LABELS[tone]?.[lang] || tone;
  const samplePost = SAMPLE_POSTS[tone]?.[lang] || SAMPLE_POSTS.professional[lang];
  const adHeadline = AD_HEADLINES[tone]?.[lang] || AD_HEADLINES.professional[lang];
  const storyHeadline = STORY_HEADLINES[tone]?.[lang] || STORY_HEADLINES.professional[lang];
  const textOnPrimary = getContrastColor(primaryColor);
  const handle = (brandName || 'yourbrand').toLowerCase().replace(/\s+/g, '');
  const [previewTab, setPreviewTab] = useState('social');

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {/* ── Section Title + Color Palette ─────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-lg">
            {nl ? 'Merkprofiel Preview' : fr ? 'Aperçu du profil de marque' : 'Brand Profile Preview'}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: primaryColor }} />
            <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: secondaryColor }} />
            <div className="w-6 h-6 rounded border border-white/20" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
          </div>
          <Badge variant="outline" className="text-xs">{toneLabel}</Badge>
        </div>
      </div>

      {/* ── Preview Tabs ──────────────────────────────────── */}
      <Tabs value={previewTab} onValueChange={setPreviewTab}>
        <TabsList className={cn('w-full', audiences.length > 0 ? 'grid-cols-5' : 'grid-cols-4', 'grid')}>
          <TabsTrigger value="social" className="text-xs gap-1"><Globe className="w-3 h-3" /> {nl ? 'Social' : 'Social'}</TabsTrigger>
          <TabsTrigger value="ads" className="text-xs gap-1"><Megaphone className="w-3 h-3" /> Ads</TabsTrigger>
          <TabsTrigger value="stories" className="text-xs gap-1"><Smartphone className="w-3 h-3" /> Stories</TabsTrigger>
          <TabsTrigger value="website" className="text-xs gap-1"><Monitor className="w-3 h-3" /> Website</TabsTrigger>
          {audiences.length > 0 && (
            <TabsTrigger value="audiences" className="text-xs gap-1"><Target className="w-3 h-3" /> {nl ? 'Doelgroep' : fr ? 'Cibles' : 'Audiences'}</TabsTrigger>
          )}
        </TabsList>

        {/* ═══ TAB: Social Posts ════════════════════════════ */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
            {/* ── LinkedIn Post ─────────────────────────── */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-2.5 border-b flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-muted-foreground">LinkedIn</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <BrandAvatar {...{ logoUrl, brandName, primaryColor, secondaryColor, textOnPrimary }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{brandName || 'Your Brand'}</p>
                      <p className="text-xs text-muted-foreground">{tagline || 'Company tagline'}</p>
                      <p className="text-xs text-muted-foreground">2h &middot; <Globe className="w-3 h-3 inline" /></p>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-sm leading-relaxed mb-3">{samplePost}</p>
                  <div className="rounded-lg p-3 mb-3" style={{ background: `linear-gradient(135deg, ${primaryColor}12, ${secondaryColor}12)` }}>
                    <p className="text-xs font-semibold" style={{ color: primaryColor }}>{brandName} &middot; {nl ? 'Meer weten?' : fr ? 'En savoir plus ?' : 'Learn more?'}</p>
                    {usps[0] && <p className="text-xs text-muted-foreground mt-0.5">{usps[0]}</p>}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
                    <span className="flex items-center gap-1 text-xs"><ThumbsUp className="w-3.5 h-3.5" /> {nl ? 'Like' : 'Like'}</span>
                    <span className="flex items-center gap-1 text-xs"><MessageCircle className="w-3.5 h-3.5" /> {nl ? 'Reageren' : fr ? 'Commenter' : 'Comment'}</span>
                    <span className="flex items-center gap-1 text-xs"><Share2 className="w-3.5 h-3.5" /> {nl ? 'Delen' : fr ? 'Partager' : 'Share'}</span>
                    <span className="flex items-center gap-1 text-xs"><Send className="w-3.5 h-3.5" /> {nl ? 'Verzenden' : fr ? 'Envoyer' : 'Send'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Instagram Post ────────────────────────── */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-2.5 border-b flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-pink-500" />
                  <span className="text-xs font-medium text-muted-foreground">Instagram</span>
                </div>
                <div className="flex items-center gap-2 p-3">
                  <BrandAvatar size="sm" {...{ logoUrl, brandName, primaryColor, secondaryColor, textOnPrimary }} />
                  <span className="text-xs font-semibold flex-1">{handle}</span>
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="aspect-square flex flex-col items-center justify-center p-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                  {logoUrl ? <img src={logoUrl} alt="" className="h-12 mb-3 object-contain" /> : (
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${textOnPrimary}22` }}>
                      <Building2 className="w-7 h-7" style={{ color: textOnPrimary }} />
                    </div>
                  )}
                  <p className="text-lg font-bold leading-tight" style={{ color: textOnPrimary }}>
                    {mission || tagline || (nl ? 'Jouw merkverhaal' : fr ? 'Votre histoire' : 'Your brand story')}
                  </p>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3"><Heart className="w-5 h-5" /><MessageCircle className="w-5 h-5" /><Send className="w-5 h-5" /></div>
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <p className="text-xs"><span className="font-semibold">142 likes</span></p>
                  <p className="text-xs mt-1"><span className="font-semibold">{handle}</span> {samplePost.slice(0, 60)}...</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Email Header ─────────────────────────────── */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-2.5 border-b flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{nl ? 'E-mail Nieuwsbrief' : fr ? 'Newsletter E-mail' : 'Email Newsletter'}</span>
              </div>
              <div className="p-4">
                <div className="border rounded-lg overflow-hidden max-w-md mx-auto">
                  <div className="p-5 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                    {logoUrl ? <img src={logoUrl} alt="" className="h-8 mx-auto mb-2 object-contain" /> : (
                      <p className="text-lg font-bold" style={{ color: textOnPrimary }}>{brandName || 'Your Brand'}</p>
                    )}
                    <p className="text-sm font-medium mt-1" style={{ color: textOnPrimary }}>
                      {nl ? 'Ontdek onze nieuwste updates' : fr ? 'Découvrez nos dernières mises à jour' : 'Discover our latest updates'}
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-950">
                    <p className="text-sm text-muted-foreground mb-2">{nl ? 'Beste klant,' : fr ? 'Cher client,' : 'Dear customer,'}</p>
                    <p className="text-sm text-muted-foreground mb-3">{samplePost.slice(0, 100)}...</p>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: primaryColor, color: textOnPrimary }}>
                      {nl ? 'Meer weten' : fr ? 'En savoir plus' : 'Learn more'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-900 text-center border-t">
                    <p className="text-xs text-muted-foreground">{brandName} &middot; {tagline || ''}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: Social Media Ads ═══════════════════════ */}
        <TabsContent value="ads" className="space-y-4 mt-4">
          <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
            {/* ── Facebook / Instagram Ad ───────────────── */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-2.5 border-b flex items-center gap-2">
                  <Megaphone className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">Facebook / Instagram Ad</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">Sponsored</Badge>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BrandAvatar size="sm" {...{ logoUrl, brandName, primaryColor, secondaryColor, textOnPrimary }} />
                    <div>
                      <p className="text-xs font-semibold">{brandName}</p>
                      <p className="text-[10px] text-muted-foreground">Sponsored &middot; <Globe className="w-2.5 h-2.5 inline" /></p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{samplePost.slice(0, 90)}...</p>
                </div>
                {/* Ad visual */}
                <div className="aspect-video flex flex-col items-center justify-center p-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                  {logoUrl ? <img src={logoUrl} alt="" className="h-10 mb-2 object-contain" /> : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${textOnPrimary}22` }}>
                      <Building2 className="w-6 h-6" style={{ color: textOnPrimary }} />
                    </div>
                  )}
                  <p className="text-xl font-bold" style={{ color: textOnPrimary }}>{adHeadline}</p>
                  {usps[0] && <p className="text-xs mt-1.5 opacity-80" style={{ color: textOnPrimary }}>{usps[0]}</p>}
                </div>
                {/* Ad CTA strip */}
                <div className="p-3 border-t flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">{brandName}</p>
                    <p className="text-[10px] text-muted-foreground">{tagline || (nl ? 'Bezoek onze website' : fr ? 'Visitez notre site' : 'Visit our website')}</p>
                  </div>
                  <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: primaryColor, color: textOnPrimary }}>
                    {nl ? 'Meer info' : fr ? 'En savoir plus' : 'Learn More'}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* ── LinkedIn Ad ──────────────────────────── */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-2.5 border-b flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-700" />
                  <span className="text-xs font-medium text-muted-foreground">LinkedIn Ad</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">Promoted</Badge>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BrandAvatar size="sm" {...{ logoUrl, brandName, primaryColor, secondaryColor, textOnPrimary }} />
                    <div>
                      <p className="text-xs font-semibold">{brandName}</p>
                      <p className="text-[10px] text-muted-foreground">Promoted</p>
                    </div>
                  </div>
                  <p className="text-xs mb-2">{nl ? 'Klaar om te groeien? Ontdek hoe wij bedrijven helpen hun potentieel waar te maken.' : fr ? 'Prêt à grandir ? Découvrez comment nous aidons les entreprises à atteindre leur potentiel.' : 'Ready to grow? Discover how we help businesses reach their potential.'}</p>
                </div>
                <div className="aspect-[1.91/1] flex flex-col items-center justify-center p-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}ee, ${secondaryColor}ee)` }}>
                  <p className="text-lg font-bold mb-1" style={{ color: textOnPrimary }}>{adHeadline}</p>
                  <p className="text-xs opacity-80" style={{ color: textOnPrimary }}>{brandName}</p>
                </div>
                <div className="p-3 border-t flex items-center gap-3">
                  <button className="flex-1 py-1.5 rounded border text-xs font-medium text-center" style={{ borderColor: primaryColor, color: primaryColor }}>
                    {nl ? 'Bezoek website' : fr ? 'Visiter le site' : 'Visit website'}
                  </button>
                  <button className="flex-1 py-1.5 rounded text-xs font-medium text-center" style={{ backgroundColor: primaryColor, color: textOnPrimary }}>
                    {nl ? 'Neem contact op' : fr ? 'Contactez-nous' : 'Contact us'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB: Stories / Reels ═════════════════════════ */}
        <TabsContent value="stories" className="mt-4">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {/* ── Instagram Story ───────────────────────── */}
            <Card className="overflow-hidden shrink-0 w-[220px]">
              <CardContent className="p-0">
                <div className="p-2 border-b flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-pink-500" />
                  <span className="text-[10px] font-medium text-muted-foreground">Instagram Story</span>
                </div>
                <div className="aspect-[9/16] relative flex flex-col items-center justify-between p-4" style={{ background: `linear-gradient(180deg, ${primaryColor}, ${secondaryColor})` }}>
                  {/* Top bar */}
                  <div className="w-full flex items-center gap-2">
                    <BrandAvatar size="sm" {...{ logoUrl, brandName, primaryColor: '#fff', secondaryColor: '#fff', textOnPrimary: primaryColor }} />
                    <span className="text-[10px] font-semibold" style={{ color: textOnPrimary }}>{handle}</span>
                  </div>
                  {/* Center content */}
                  <div className="text-center">
                    {logoUrl ? <img src={logoUrl} alt="" className="h-10 mx-auto mb-3 object-contain" /> : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${textOnPrimary}22` }}>
                        <Building2 className="w-6 h-6" style={{ color: textOnPrimary }} />
                      </div>
                    )}
                    <p className="text-base font-bold leading-tight mb-1" style={{ color: textOnPrimary }}>{storyHeadline}</p>
                    <p className="text-[10px] opacity-80" style={{ color: textOnPrimary }}>{tagline || brandName}</p>
                  </div>
                  {/* Swipe up */}
                  <div className="flex flex-col items-center" style={{ color: textOnPrimary }}>
                    <ChevronUp className="w-5 h-5 animate-bounce" />
                    <span className="text-[10px] font-medium">{nl ? 'Omhoog swipen' : fr ? 'Swiper vers le haut' : 'Swipe up'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Reel Cover ───────────────────────────── */}
            <Card className="overflow-hidden shrink-0 w-[220px]">
              <CardContent className="p-0">
                <div className="p-2 border-b flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-pink-500" />
                  <span className="text-[10px] font-medium text-muted-foreground">Reel</span>
                </div>
                <div className="aspect-[9/16] relative flex flex-col items-center justify-center p-4" style={{ background: `linear-gradient(180deg, ${secondaryColor}, ${primaryColor})` }}>
                  {/* Play icon overlay */}
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${textOnPrimary}33` }}>
                    <Play className="w-7 h-7 ml-1" style={{ color: textOnPrimary }} />
                  </div>
                  <p className="text-sm font-bold text-center leading-tight mb-2" style={{ color: textOnPrimary }}>
                    {nl ? '3 tips om meer klanten te bereiken' : fr ? '3 astuces pour atteindre plus de clients' : '3 tips to reach more customers'}
                  </p>
                  <Badge className="text-[10px]" style={{ backgroundColor: `${textOnPrimary}22`, color: textOnPrimary }}>{brandName}</Badge>
                  {/* Bottom actions */}
                  <div className="absolute bottom-3 right-3 flex flex-col items-center gap-3" style={{ color: textOnPrimary }}>
                    <Heart className="w-5 h-5" />
                    <MessageCircle className="w-5 h-5" />
                    <Send className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Facebook Story ────────────────────────── */}
            <Card className="overflow-hidden shrink-0 w-[220px]">
              <CardContent className="p-0">
                <div className="p-2 border-b flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] font-medium text-muted-foreground">Facebook Story</span>
                </div>
                <div className="aspect-[9/16] relative flex flex-col items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}88)` }}>
                  <div className="text-center">
                    <p className="text-lg font-bold leading-tight mb-2" style={{ color: textOnPrimary }}>{adHeadline}</p>
                    <p className="text-[10px] opacity-80 mb-4" style={{ color: textOnPrimary }}>{samplePost.slice(0, 50)}...</p>
                    <button className="px-4 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: textOnPrimary, color: primaryColor }}>
                      {nl ? 'Meer weten' : fr ? 'En savoir plus' : 'Learn more'} <ArrowRight className="w-3 h-3 inline ml-1" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB: Website Hero Banner ════════════════════ */}
        <TabsContent value="website" className="space-y-4 mt-4">
          {/* ── Desktop Hero ─────────────────────────────── */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-2.5 border-b flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{nl ? 'Desktop Hero Banner' : fr ? 'Bannière Hero Desktop' : 'Desktop Hero Banner'}</span>
              </div>
              <div className="aspect-[21/9] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                {/* Fake nav bar */}
                <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {logoUrl ? <img src={logoUrl} alt="" className="h-5 object-contain" /> : (
                      <span className="text-sm font-bold" style={{ color: textOnPrimary }}>{brandName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {['Home', nl ? 'Over Ons' : fr ? 'À propos' : 'About', nl ? 'Diensten' : fr ? 'Services' : 'Services', 'Contact'].map(item => (
                      <span key={item} className="text-[10px] opacity-70" style={{ color: textOnPrimary }}>{item}</span>
                    ))}
                  </div>
                </div>
                {/* Hero content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-8">
                    <h1 className="text-2xl font-bold mb-2" style={{ color: textOnPrimary }}>
                      {mission || tagline || (nl ? 'Welkom bij ' : fr ? 'Bienvenue chez ' : 'Welcome to ') + brandName}
                    </h1>
                    <p className="text-sm opacity-80 mb-4 max-w-md mx-auto" style={{ color: textOnPrimary }}>
                      {samplePost.slice(0, 80)}...
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button className="px-5 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: textOnPrimary, color: primaryColor }}>
                        {nl ? 'Aan de slag' : fr ? 'Commencer' : 'Get Started'} <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                      </button>
                      <button className="px-5 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: `${textOnPrimary}66`, color: textOnPrimary }}>
                        {nl ? 'Meer weten' : fr ? 'En savoir plus' : 'Learn More'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Mobile Hero ──────────────────────────────── */}
          <div className="flex justify-center">
            <Card className="overflow-hidden w-[280px]">
              <CardContent className="p-0">
                <div className="p-2.5 border-b flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{nl ? 'Mobiele Weergave' : fr ? 'Vue Mobile' : 'Mobile View'}</span>
                </div>
                {/* Phone frame */}
                <div className="bg-gray-950 p-2 pb-0">
                  <div className="rounded-t-xl overflow-hidden border border-gray-700">
                    {/* Status bar */}
                    <div className="bg-gray-900 px-3 py-1 flex items-center justify-between">
                      <span className="text-[8px] text-gray-400">9:41</span>
                      <div className="w-16 h-1 bg-gray-700 rounded-full" />
                      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /></div>
                    </div>
                    {/* Mobile nav */}
                    <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
                      {logoUrl ? <img src={logoUrl} alt="" className="h-4 object-contain" /> : (
                        <span className="text-xs font-bold" style={{ color: textOnPrimary }}>{brandName}</span>
                      )}
                      <div className="flex flex-col gap-0.5"><div className="w-3 h-[1.5px] rounded" style={{ backgroundColor: textOnPrimary }} /><div className="w-3 h-[1.5px] rounded" style={{ backgroundColor: textOnPrimary }} /><div className="w-3 h-[1.5px] rounded" style={{ backgroundColor: textOnPrimary }} /></div>
                    </div>
                    {/* Mobile hero */}
                    <div className="px-4 py-8 text-center" style={{ background: `linear-gradient(180deg, ${primaryColor}, ${secondaryColor})` }}>
                      <h2 className="text-lg font-bold mb-2 leading-tight" style={{ color: textOnPrimary }}>
                        {adHeadline}
                      </h2>
                      <p className="text-[10px] opacity-80 mb-3" style={{ color: textOnPrimary }}>{samplePost.slice(0, 60)}...</p>
                      <button className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: textOnPrimary, color: primaryColor }}>
                        {nl ? 'Aan de slag' : fr ? 'Commencer' : 'Get Started'}
                      </button>
                    </div>
                    {/* Fake content below */}
                    <div className="px-4 py-4 bg-white dark:bg-gray-950 space-y-2">
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB: Per-Audience Targeted Previews ═════════ */}
        {audiences.length > 0 && (
          <TabsContent value="audiences" className="space-y-6 mt-4">
            {audiences.filter(a => a.audienceType || a.idealCustomer).map((audience, aidx) => {
              const msg = getAudienceMessage(audience, lang);
              const audienceLabel = audience.audienceType === 'B2B'
                ? `B2B${audience.customerSector ? ` — ${audience.customerSector}` : ''}${audience.companySize ? ` (${audience.companySize})` : ''}`
                : `B2C${audience.ageGroup ? ` — ${audience.ageGroup}` : ''}${audience.occupation ? ` (${audience.occupation})` : ''}`;

              return (
                <div key={aidx} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: primaryColor, color: textOnPrimary }}>
                      {aidx + 1}
                    </div>
                    <h4 className="font-semibold text-sm">{nl ? 'Doelgroep' : fr ? 'Public cible' : 'Audience'} {aidx + 1}: {audienceLabel}</h4>
                    {audience.idealCustomer && (
                      <span className="text-xs text-muted-foreground ml-auto">{audience.idealCustomer.slice(0, 40)}{audience.idealCustomer.length > 40 ? '...' : ''}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Targeted LinkedIn Ad */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-2 border-b flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-blue-700" />
                          <span className="text-[10px] font-medium text-muted-foreground">LinkedIn Ad</span>
                        </div>
                        <div className="aspect-video flex flex-col items-center justify-center p-4 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                          <p className="text-sm font-bold leading-tight" style={{ color: textOnPrimary }}>{msg.headline}</p>
                          <p className="text-[10px] mt-1 opacity-80" style={{ color: textOnPrimary }}>{brandName}</p>
                        </div>
                        <div className="p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-2">{msg.body.slice(0, 80)}</p>
                          <button className="w-full py-1 rounded text-[10px] font-medium" style={{ backgroundColor: primaryColor, color: textOnPrimary }}>
                            {msg.cta}
                          </button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Targeted Instagram Ad */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-2 border-b flex items-center gap-1.5">
                          <Heart className="w-3 h-3 text-pink-500" />
                          <span className="text-[10px] font-medium text-muted-foreground">Instagram Ad</span>
                        </div>
                        <div className="aspect-square flex flex-col items-center justify-center p-4 text-center" style={{ background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})` }}>
                          {logoUrl ? <img src={logoUrl} alt="" className="h-8 mb-2 object-contain" /> : null}
                          <p className="text-sm font-bold leading-tight mb-1" style={{ color: textOnPrimary }}>{msg.headline}</p>
                          <p className="text-[10px] opacity-80 mb-2" style={{ color: textOnPrimary }}>{msg.body.slice(0, 50)}</p>
                          <button className="px-3 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: textOnPrimary, color: primaryColor }}>
                            {msg.cta} <ArrowRight className="w-2.5 h-2.5 inline ml-0.5" />
                          </button>
                        </div>
                        <div className="p-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold">{handle}</span>
                          <span className="text-[10px] text-muted-foreground">Sponsored</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Targeted Email */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-2 border-b flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-medium text-muted-foreground">Email</span>
                        </div>
                        <div className="p-3">
                          <div className="border rounded overflow-hidden">
                            <div className="p-3 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                              <p className="text-xs font-bold" style={{ color: textOnPrimary }}>{msg.headline}</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-gray-950">
                              <p className="text-[10px] text-muted-foreground mb-2">{msg.body}</p>
                              <button className="px-3 py-1 rounded text-[10px] font-medium" style={{ backgroundColor: primaryColor, color: textOnPrimary }}>
                                {msg.cta}
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}

            {audiences.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{nl ? 'Voeg doelgroepen toe om gerichte previews te zien' : fr ? 'Ajoutez des publics cibles pour voir des aperçus ciblés' : 'Add target audiences to see targeted previews'}</p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
