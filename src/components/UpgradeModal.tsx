// src/components/UpgradeModal.tsx
// ──────────────────────────────────────────────────────────────────────────
// Engaging upgrade prompt shown when a free-tier policy gate is hit.
//
// Triggered from:
//   - PostReviewScreen catch block when publish-social returns
//     reason='free_daily_cap' or 'free_channels_per_post_cap' (HTTP 429).
//   - Client-side pre-flight cap check before showing the publish confirm.
//
// Replaces the generic Alert.alert('Mislukt', 'free_daily_cap') with a
// branded bottom-sheet modal: gradient hero, benefit bullets, a primary
// "Upgrade naar Pro" CTA that opens marketing.inclufy.com/pricing with
// UTM-friendly source params, and a secondary "Misschien later" dismiss.
//
// Pure presentation — caller controls visibility + URL params via props.
// ──────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { brandGradient } from '../theme';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';
import { track } from '../services/analytics';

import { Check, Clock, Sparkle } from 'phosphor-react-native';
export type UpgradeReason =
  | 'free_daily_cap'
  | 'free_channels_per_post_cap'
  | 'free_watermark_required'
  | 'generic';

export interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  /** Which policy gate triggered this. Drives title + body copy. */
  reason?: UpgradeReason;
  /** Numeric limit (e.g. 1 post/day, 3 channels). Optional, defaults reasonable. */
  limit?: number;
  /** Seconds until retry — shows "Beschikbaar over Xu" countdown helper. */
  retryAfter?: number;
  /** Tracking source for the pricing-page UTM. Default: 'amos-postreview'. */
  source?: string;
}

// ── A/B variant assignment ────────────────────────────────────────────────
// Picks a stable variant ('a' | 'b') for the duration of an app session so
// the user doesn't see different copy on a re-open. Deterministic over the
// session via a module-level cache. Server-side stats can then split funnel
// by event_props.variant. Currently variants only diverge on primaryCta.
//
// To kill a variant: hardcode `getVariant = () => 'a'` and let the existing
// rows age out of dashboards.
type Variant = 'a' | 'b';
let _cachedVariant: Variant | null = null;
function getVariant(): Variant {
  if (_cachedVariant) return _cachedVariant;
  _cachedVariant = Math.random() < 0.5 ? 'a' : 'b';
  return _cachedVariant;
}

const CTA_VARIANTS: Record<'nl' | 'en', Record<Variant, string>> = {
  nl: { a: 'Upgrade naar Pro', b: 'Probeer Pro — 7 dagen gratis' },
  en: { a: 'Upgrade to Pro', b: 'Try Pro — 7 days free' },
};

// ── IAP-readiness flag ────────────────────────────────────────────────────
// App-Store guidelines (3.1.1) require digital subscriptions to use IAP.
// When `expo-in-app-purchases` or `react-native-iap` is wired up, flip this
// to true — the modal will then route the primary CTA through a native
// purchase sheet instead of opening the web pricing page. Web fallback is
// still used on Android until Play Billing is integrated.
const IAP_READY = false;

// ── Copy bank ─────────────────────────────────────────────────────────────
// Dutch-first (primary AMOS locale); English fallback for non-NL users.
type Copy = {
  emoji: string;
  title: string;
  subtitle: (limit?: number) => string;
  benefits: string[];
  primaryCta: string;
  secondaryCta: string;
  retryHint: (hours: number) => string;
};

const COPY: Record<'nl' | 'en', Record<UpgradeReason, Copy>> = {
  nl: {
    free_daily_cap: {
      emoji: '🚀',
      title: 'Klaar voor meer impact?',
      subtitle: (limit = 1) =>
        `Je hebt vandaag al ${limit} post gepubliceerd — het maximum op het gratis abonnement. Upgrade naar Pro en blijf publiceren wanneer jij wilt.`,
      benefits: [
        'Onbeperkt posts per dag',
        'Alle kanalen tegelijk (Facebook, IG, LinkedIn, Pinterest, Snapchat)',
        'Geen AMOS-watermerk op je content',
        'Geavanceerde AI-tools + analytics',
      ],
      primaryCta: 'Upgrade naar Pro',
      secondaryCta: 'Misschien later',
      retryHint: (h) => `Of wacht ${h}u — dan kun je gratis weer publiceren.`,
    },
    free_channels_per_post_cap: {
      emoji: '📣',
      title: 'Bereik meer kanalen',
      subtitle: (limit = 3) =>
        `Free-tier staat publicatie naar ${limit} kanalen per post toe. Upgrade en deel één post naar al je accounts in één tap.`,
      benefits: [
        'Onbeperkt cross-channel publiceren',
        'Multi-account per platform',
        'Bedrijfspagina\'s + persoonlijke profielen',
        'Geen AMOS-watermerk',
      ],
      primaryCta: 'Upgrade naar Pro',
      secondaryCta: 'Misschien later',
      retryHint: () => '',
    },
    free_watermark_required: {
      emoji: '✨',
      title: 'Schone, on-brand posts',
      subtitle: () =>
        'Op Pro verdwijnt het AMOS-watermerk en kun je je eigen logo of overlay toevoegen.',
      benefits: [
        'Geen AMOS-watermerk',
        'Eigen logo als overlay',
        'Custom brand-kleuren',
        'Onbeperkt publiceren',
      ],
      primaryCta: 'Upgrade naar Pro',
      secondaryCta: 'Misschien later',
      retryHint: () => '',
    },
    generic: {
      emoji: '💎',
      title: 'Ontgrendel Pro',
      subtitle: () =>
        'Deze functie is onderdeel van Pro. Upgrade en haal alles uit AMOS.',
      benefits: [
        'Onbeperkt publiceren',
        'Alle channels + multi-account',
        'Geen watermerk',
        'Premium AI + analytics',
      ],
      primaryCta: 'Upgrade naar Pro',
      secondaryCta: 'Misschien later',
      retryHint: () => '',
    },
  },
  en: {
    free_daily_cap: {
      emoji: '🚀',
      title: 'Ready for more reach?',
      subtitle: (limit = 1) =>
        `You've published ${limit} post today — the free-plan max. Upgrade to Pro and keep publishing whenever you want.`,
      benefits: [
        'Unlimited posts per day',
        'All channels in one tap (Facebook, IG, LinkedIn, Pinterest, Snapchat)',
        'No AMOS watermark on your content',
        'Advanced AI tools + analytics',
      ],
      primaryCta: 'Upgrade to Pro',
      secondaryCta: 'Maybe later',
      retryHint: (h) => `Or wait ${h}h — then you can publish for free again.`,
    },
    free_channels_per_post_cap: {
      emoji: '📣',
      title: 'Reach more channels',
      subtitle: (limit = 3) =>
        `Free plan allows publishing to ${limit} channels per post. Upgrade and share one post to all your accounts at once.`,
      benefits: [
        'Unlimited cross-channel publishing',
        'Multi-account per platform',
        'Business pages + personal profiles',
        'No AMOS watermark',
      ],
      primaryCta: 'Upgrade to Pro',
      secondaryCta: 'Maybe later',
      retryHint: () => '',
    },
    free_watermark_required: {
      emoji: '✨',
      title: 'Clean, on-brand posts',
      subtitle: () =>
        'On Pro the AMOS watermark disappears and you can add your own logo or overlay.',
      benefits: [
        'No AMOS watermark',
        'Your own logo as overlay',
        'Custom brand colors',
        'Unlimited publishing',
      ],
      primaryCta: 'Upgrade to Pro',
      secondaryCta: 'Maybe later',
      retryHint: () => '',
    },
    generic: {
      emoji: '💎',
      title: 'Unlock Pro',
      subtitle: () =>
        'This feature is part of Pro. Upgrade and get the most out of AMOS.',
      benefits: [
        'Unlimited publishing',
        'All channels + multi-account',
        'No watermark',
        'Premium AI + analytics',
      ],
      primaryCta: 'Upgrade to Pro',
      secondaryCta: 'Maybe later',
      retryHint: () => '',
    },
  },
};

// ── Component ─────────────────────────────────────────────────────────────

export default function UpgradeModal({
  visible,
  onClose,
  reason = 'generic',
  limit,
  retryAfter,
  source = 'amos-postreview',
}: UpgradeModalProps) {
  const { colors } = useTheme();
  const { locale } = useTranslation();
  const lang: 'nl' | 'en' = locale === 'en' ? 'en' : 'nl';
  const copy = COPY[lang][reason] ?? COPY[lang].generic;
  const variant = getVariant();
  const primaryCtaText = CTA_VARIANTS[lang][variant];

  // Dwell-time timer so the dismiss event captures "how long did they look
  // at it before bailing?" — useful to detect if the copy is too long or
  // if the CTA isn't compelling. Reset on each open.
  const shownAtRef = useRef<number>(0);

  const retryHours =
    typeof retryAfter === 'number' && retryAfter > 0
      ? Math.max(1, Math.round(retryAfter / 3600))
      : 0;
  const retryHint = retryHours > 0 ? copy.retryHint(retryHours) : '';

  // ── Funnel: emit `upgrade_modal_shown` exactly once per open ─────────────
  useEffect(() => {
    if (!visible) return;
    shownAtRef.current = Date.now();
    track('upgrade_modal_shown', {
      reason,
      source,
      limit,
      retry_after: retryAfter,
      variant,
      lang,
    });
  }, [visible, reason, source, limit, retryAfter, variant, lang]);

  const handleUpgrade = () => {
    const url =
      `https://marketing.inclufy.com/pricing` +
      `?upgrade=${encodeURIComponent(reason)}` +
      `&source=${encodeURIComponent(source)}` +
      `&variant=${encodeURIComponent(variant)}` +
      `&utm_source=amos-app&utm_medium=upgrade-modal&utm_campaign=${encodeURIComponent(reason)}`;

    // Funnel: CTA tap. Fire BEFORE the navigation so a slow Linking call
    // can't delay/lose the event if the user backgrounds the app.
    track('upgrade_modal_cta_tap', {
      reason,
      source,
      variant,
      lang,
      url,
      iap_ready: IAP_READY,
      dwell_ms: shownAtRef.current ? Date.now() - shownAtRef.current : null,
    });

    if (IAP_READY) {
      // TODO: when expo-in-app-purchases is wired, open the native sheet here.
      // For now this branch is unreachable (IAP_READY=false) but the call site
      // is in place so the future migration is a single-file diff.
      // openNativePurchaseSheet({ reason, source, variant });
      // onClose(); return;
    }

    Linking.openURL(url).catch(() => {
      /* swallow — Linking errors aren't user-actionable here */
    });
    onClose();
  };

  const handleDismiss = () => {
    track('upgrade_modal_dismissed', {
      reason,
      source,
      variant,
      lang,
      dwell_ms: shownAtRef.current ? Date.now() - shownAtRef.current : null,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-end',
        }}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => { /* eat tap-through */ }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              overflow: 'hidden',
            }}
          >
            {/* drag handle */}
            <View
              style={{
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
              }}
            />

            {/* ── Gradient hero ─────────────────────────────────────────── */}
            <LinearGradient
              colors={brandGradient.deep as unknown as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing.lg,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ fontSize: 34 }}>{copy.emoji}</Text>
              </View>
              <Text
                style={{
                  color: '#fff',
                  fontSize: fontSize.xl,
                  fontWeight: fontWeight.bold,
                  textAlign: 'center',
                  marginBottom: spacing.xs,
                }}
              >
                {copy.title}
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.92)',
                  fontSize: fontSize.sm,
                  textAlign: 'center',
                  lineHeight: 20,
                  paddingHorizontal: spacing.sm,
                }}
              >
                {copy.subtitle(limit)}
              </Text>
            </LinearGradient>

            {/* ── Benefits ─────────────────────────────────────────────── */}
            <ScrollView
              style={{ maxHeight: 280 }}
              contentContainerStyle={{
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.md,
              }}
            >
              {copy.benefits.map((b, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: spacing.sm,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: colors.primary + '22',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 1,
                    }}
                  >
                    <Check size={14} color={colors.primary} weight="bold" />
                  </View>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: fontSize.md,
                      lineHeight: 22,
                      flex: 1,
                    }}
                  >
                    {b}
                  </Text>
                </View>
              ))}

              {retryHint ? (
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    marginTop: spacing.xs,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Clock size={16} color={colors.textSecondary} weight="duotone" />
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: fontSize.xs,
                      flex: 1,
                    }}
                  >
                    {retryHint}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* ── CTAs ─────────────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
              <TouchableOpacity
                onPress={handleUpgrade}
                activeOpacity={0.85}
                style={{ borderRadius: borderRadius.lg, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={brandGradient.light as unknown as [string, string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Sparkle size={18} color="#fff" weight="fill" />
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: fontSize.md,
                      fontWeight: fontWeight.bold,
                    }}
                  >
                    {primaryCtaText}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDismiss}
                style={{
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  marginTop: spacing.xs,
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.medium,
                  }}
                >
                  {copy.secondaryCta}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
