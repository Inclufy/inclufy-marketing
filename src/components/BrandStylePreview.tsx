// src/components/BrandStylePreview.tsx
// Reusable brand style preview — shows mockup social posts, email header, and style guide

import { Building2, Heart, MessageCircle, Share2, Bookmark, Send, ThumbsUp, MoreHorizontal, Globe, Mail, Palette } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a2e' : '#ffffff';
}

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
  compact = false,
}: BrandStylePreviewProps) {
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const toneLabel = TONE_LABELS[tone]?.[lang] || tone;
  const samplePost = SAMPLE_POSTS[tone]?.[lang] || SAMPLE_POSTS.professional[lang];
  const textOnPrimary = getContrastColor(primaryColor);

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {/* ── Section Title ───────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-lg">
          {nl ? 'Merkprofiel Preview' : fr ? 'Aperçu du profil de marque' : 'Brand Profile Preview'}
        </h3>
      </div>

      {/* ── Color Palette ───────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border border-white/20 shadow-sm" style={{ backgroundColor: primaryColor }} />
          <div className="text-xs">
            <p className="font-medium">{nl ? 'Primair' : fr ? 'Primaire' : 'Primary'}</p>
            <p className="text-muted-foreground font-mono">{primaryColor}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border border-white/20 shadow-sm" style={{ backgroundColor: secondaryColor }} />
          <div className="text-xs">
            <p className="font-medium">{nl ? 'Secundair' : fr ? 'Secondaire' : 'Secondary'}</p>
            <p className="text-muted-foreground font-mono">{secondaryColor}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg border border-white/20 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          />
          <div className="text-xs">
            <p className="font-medium">Gradient</p>
            <p className="text-muted-foreground">{nl ? 'Gecombineerd' : fr ? 'Combiné' : 'Combined'}</p>
          </div>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">
          {toneLabel}
        </Badge>
      </div>

      {/* ── Brand Banner Preview ────────────────────────── */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div
          className="p-6 text-center"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-10 mx-auto mb-2 object-contain" />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: `${textOnPrimary}22` }}
            >
              <Building2 className="w-6 h-6" style={{ color: textOnPrimary }} />
            </div>
          )}
          <h2 className="text-xl font-bold" style={{ color: textOnPrimary }}>
            {brandName || 'Your Brand'}
          </h2>
          {tagline && (
            <p className="text-sm mt-1 opacity-80" style={{ color: textOnPrimary }}>
              {tagline}
            </p>
          )}
        </div>
      </Card>

      <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
        {/* ── LinkedIn Post Mockup ────────────────────── */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-3 border-b flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5" />
                LinkedIn {nl ? 'Post' : fr ? 'Publication' : 'Post'}
              </div>
            </div>
            <div className="p-4">
              {/* Post header */}
              <div className="flex items-start gap-3 mb-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-10 h-10 rounded-full object-cover border" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <span className="text-sm font-bold" style={{ color: textOnPrimary }}>
                      {(brandName || 'B')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{brandName || 'Your Brand'}</p>
                  <p className="text-xs text-muted-foreground">{tagline || 'Company tagline'}</p>
                  <p className="text-xs text-muted-foreground">2h &middot; <Globe className="w-3 h-3 inline" /></p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
              {/* Post body */}
              <p className="text-sm leading-relaxed mb-3">{samplePost}</p>
              {/* Post CTA banner */}
              <div
                className="rounded-lg p-3 mb-3"
                style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)` }}
              >
                <p className="text-xs font-semibold" style={{ color: primaryColor }}>
                  {brandName} &middot; {nl ? 'Meer weten?' : fr ? 'En savoir plus ?' : 'Learn more?'}
                </p>
                {usps[0] && <p className="text-xs text-muted-foreground mt-0.5">{usps[0]}</p>}
              </div>
              {/* Post actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <ThumbsUp className="w-3.5 h-3.5" /> {nl ? 'Vind ik leuk' : fr ? 'J\'aime' : 'Like'}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <MessageCircle className="w-3.5 h-3.5" /> {nl ? 'Reageren' : fr ? 'Commenter' : 'Comment'}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Share2 className="w-3.5 h-3.5" /> {nl ? 'Delen' : fr ? 'Partager' : 'Share'}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Send className="w-3.5 h-3.5" /> {nl ? 'Verzenden' : fr ? 'Envoyer' : 'Send'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Instagram Post Mockup ──────────────────── */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-3 border-b flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Heart className="w-3.5 h-3.5" />
                Instagram {nl ? 'Post' : fr ? 'Publication' : 'Post'}
              </div>
            </div>
            <div>
              {/* IG header */}
              <div className="flex items-center gap-2 p-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-pink-500" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-pink-500 shrink-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <span className="text-xs font-bold" style={{ color: textOnPrimary }}>
                      {(brandName || 'B')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs font-semibold flex-1">{(brandName || 'yourbrand').toLowerCase().replace(/\s+/g, '')}</span>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </div>
              {/* IG image area */}
              <div
                className="aspect-square flex flex-col items-center justify-center p-6 text-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-12 mb-3 object-contain" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${textOnPrimary}22` }}
                  >
                    <Building2 className="w-7 h-7" style={{ color: textOnPrimary }} />
                  </div>
                )}
                <p className="text-lg font-bold leading-tight" style={{ color: textOnPrimary }}>
                  {mission || tagline || (nl ? 'Jouw merkverhaal hier' : fr ? 'Votre histoire de marque ici' : 'Your brand story here')}
                </p>
                {usps[0] && (
                  <p className="text-xs mt-2 opacity-80" style={{ color: textOnPrimary }}>
                    {usps[0]}
                  </p>
                )}
              </div>
              {/* IG actions */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5" />
                    <MessageCircle className="w-5 h-5" />
                    <Send className="w-5 h-5" />
                  </div>
                  <Bookmark className="w-5 h-5" />
                </div>
                <p className="text-xs"><span className="font-semibold">142 likes</span></p>
                <p className="text-xs mt-1">
                  <span className="font-semibold">{(brandName || 'yourbrand').toLowerCase().replace(/\s+/g, '')}</span>{' '}
                  {samplePost.slice(0, 80)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Email Header Mockup ─────────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-3 border-b flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3.5 h-3.5" />
              {nl ? 'E-mail Header' : fr ? 'En-tête d\'e-mail' : 'Email Header'}
            </div>
          </div>
          <div className="p-4">
            {/* Email preview */}
            <div className="border rounded-lg overflow-hidden">
              <div
                className="p-6 text-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-8 mx-auto mb-2 object-contain" />
                ) : (
                  <p className="text-lg font-bold" style={{ color: textOnPrimary }}>
                    {brandName || 'Your Brand'}
                  </p>
                )}
                <p className="text-sm font-medium mt-1" style={{ color: textOnPrimary }}>
                  {nl ? 'Ontdek onze nieuwste updates' : fr ? 'Découvrez nos dernières mises à jour' : 'Discover our latest updates'}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-950">
                <p className="text-sm text-muted-foreground mb-3">
                  {nl ? 'Beste klant,' : fr ? 'Cher client,' : 'Dear customer,'}
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {samplePost.slice(0, 120)}...
                </p>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: primaryColor, color: textOnPrimary }}
                >
                  {nl ? 'Meer weten' : fr ? 'En savoir plus' : 'Learn more'}
                </button>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 text-center border-t">
                <p className="text-xs text-muted-foreground">
                  {brandName} &middot; {tagline || (nl ? 'Uw vertrouwde partner' : fr ? 'Votre partenaire de confiance' : 'Your trusted partner')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
