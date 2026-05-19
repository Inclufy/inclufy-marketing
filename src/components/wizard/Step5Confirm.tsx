// src/components/wizard/Step5Confirm.tsx
// Step 5: confirm + publish.
// - Shows the BAKED branded_image_url per channel (proving overlay is included)
// - Per-channel publish status tracking (pending/in_flight/ok/error)
// - Big gradient "Publiceer nu" CTA
//
// On tap: creates a go_posts row per channel (or reuses one if existing),
// calls publish-social per account with the baked image_url. Each call's
// status updates the per-channel chip in real-time.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import {
  Rocket, CheckCircle, XCircle, CircleNotch, Clock, Sparkle,
  FacebookLogo, InstagramLogo, LinkedinLogo, TiktokLogo, PinterestLogo, SnapchatLogo, ShareNetwork,
} from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight, brandGradient } from '../../theme';
import { useWizardState, type PublishStatus } from '../../hooks/useWizardState';
import { supabase } from '../../services/supabase';

const PLATFORM_ICON: Record<string, React.ComponentType<any>> = {
  facebook: FacebookLogo, instagram: InstagramLogo, linkedin: LinkedinLogo,
  tiktok: TiktokLogo, pinterest: PinterestLogo, snapchat: SnapchatLogo,
};
const PLATFORM_COLOR: Record<string, string> = {
  facebook: '#1877F2', instagram: '#E1306C', linkedin: '#0A66C2',
  tiktok: '#000000',   pinterest: '#E60023', snapchat: '#FFFC00',
};

export default function Step5Confirm() {
  const { colors } = useTheme();
  const wiz = useWizardState();
  const [done, setDone] = useState(false);

  const selected = wiz.channels.availableAccounts.filter(a =>
    wiz.channels.selectedAccountIds.has(a.id)
  );

  const previewUri = wiz.edit.brandedImageUrl ?? wiz.edit.livePreviewUri ?? wiz.capture.mediaUri;

  async function publishAll() {
    if (selected.length === 0) return;
    wiz.setConfirm({ isPublishing: true, results: {}, errors: {} });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      Alert.alert('Niet ingelogd', 'Log opnieuw in.');
      wiz.setConfirm({ isPublishing: false });
      return;
    }

    // Per-account status tracker — written directly here and mirrored to
    // wiz.confirm at the end of each iteration. The old code spread
    // `wiz.confirm.results` (a closed-over value), which captured a stale
    // snapshot in the for-loop and caused intermediate flicker for 3+
    // accounts (caught by static QA agent).
    const liveResults: Record<string, PublishStatus> = {};
    const liveErrors:  Record<string, string>        = {};

    // Create one go_posts row per channel so each has its own publish state.
    // This keeps the existing publish-social contract intact and lets
    // partial-failures be retried later from PostReview.
    for (const acc of selected) {
      const channel = acc.platform;
      const text = wiz.perChannel.textVariants[channel] ?? wiz.edit.overlayText ?? '';

      liveResults[acc.id] = 'in_flight';
      wiz.setConfirm({ results: { ...liveResults }, errors: { ...liveErrors } });

      try {
        // 1. Create the post row
        const { data: postRow, error: insertErr } = await supabase
          .from('go_posts')
          .insert({
            user_id: user.id,
            event_id: wiz.capture.eventId ?? null,
            channel,
            text_content: text,
            branded_image_url: wiz.edit.brandedImageUrl,
            status: 'draft',
          })
          .select('id')
          .single();

        if (insertErr || !postRow) throw new Error(insertErr?.message ?? 'Kon post niet aanmaken');
        const postId = (postRow as any).id as string;

        // 2. Invoke publish-social
        const { data: result, error: pubErr } = await supabase.functions.invoke('publish-social', {
          body: {
            post_id: postId,
            user_id: user.id,
            channel,
            text,
            image_url: wiz.edit.brandedImageUrl ?? undefined,
            account_id: acc.id,
            ig_format: 'feed',
            media_type: 'photo',
          },
        });

        if (pubErr) {
          throw new Error((pubErr as any)?.message ?? 'Edge function error');
        }
        if (result && !result.success && result.error) {
          throw new Error(String(result.error));
        }

        liveResults[acc.id] = 'ok';
        wiz.setConfirm({ results: { ...liveResults }, errors: { ...liveErrors } });
      } catch (err: any) {
        liveResults[acc.id] = 'error';
        liveErrors[acc.id]  = err?.message ?? 'fout';
        wiz.setConfirm({ results: { ...liveResults }, errors: { ...liveErrors } });
      }
    }

    wiz.setConfirm({ isPublishing: false });
    setDone(true);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text }}>
        Klaar om te publiceren
      </Text>
      <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
        {selected.length} {selected.length === 1 ? 'channel' : 'channels'} · 1 capture · met overlay + watermerk
      </Text>

      {/* Master preview (the actual baked image) */}
      {previewUri && (
        <View style={{ marginTop: spacing.xs, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: '#000' }}>
          <Image source={{ uri: previewUri }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="cover" />
          {!wiz.edit.brandedImageUrl && (
            <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(245,158,11,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Niet gebaked</Text>
            </View>
          )}
          {wiz.edit.brandedImageUrl && (
            <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(16,185,129,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={12} color="#fff" weight="fill" />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Met overlay</Text>
            </View>
          )}
        </View>
      )}

      {/* Per-channel status chips — with caption preview so user sees exactly
          what gets published per platform. Falls back to overlay text if no
          per-channel variant exists (Step 4 was skipped without AI generation). */}
      <View style={{ marginTop: spacing.sm, gap: 8 }}>
        {selected.map((acc) => {
          const Icon = PLATFORM_ICON[acc.platform] ?? ShareNetwork;
          const color = PLATFORM_COLOR[acc.platform] ?? colors.primary;
          const status: PublishStatus = (wiz.confirm.results[acc.id] as PublishStatus) ?? 'pending';
          const err = wiz.confirm.errors[acc.id];
          const caption = (wiz.perChannel.textVariants[acc.platform] ?? wiz.edit.overlayText ?? '').trim();
          return (
            <View
              key={acc.id}
              style={{
                padding: spacing.md, borderRadius: borderRadius.md,
                backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color + '20', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon size={18} color={color === '#000000' ? colors.text : color} weight="duotone" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text }}>
                    {acc.accountName}
                  </Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1, textTransform: 'capitalize' }}>
                    {acc.platform}{err ? ` · ${err.slice(0, 40)}` : ''}
                  </Text>
                </View>
                <StatusBadge status={status} colors={colors} />
              </View>
              {/* Caption preview — what will actually publish */}
              {caption ? (
                <View
                  style={{
                    paddingHorizontal: 10, paddingVertical: 8,
                    borderRadius: borderRadius.sm,
                    backgroundColor: colors.background, borderLeftWidth: 3, borderLeftColor: color,
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '600', marginBottom: 2, letterSpacing: 0.4 }}>
                    PUBLICEERT ALS
                  </Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }} numberOfLines={4}>
                    {caption}
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    paddingHorizontal: 10, paddingVertical: 8,
                    borderRadius: borderRadius.sm,
                    backgroundColor: '#FEF3C7', borderLeftWidth: 3, borderLeftColor: '#F59E0B',
                  }}
                >
                  <Text style={{ fontSize: fontSize.xs, color: '#92400E', fontWeight: '600' }}>
                    ⚠️ Geen caption — wordt zonder tekst gepubliceerd. Ga terug naar Stap 4 om er een te schrijven.
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* CTA */}
      {!done ? (
        <TouchableOpacity
          onPress={publishAll}
          disabled={wiz.confirm.isPublishing || selected.length === 0}
          activeOpacity={0.85}
          style={{ marginTop: spacing.lg, borderRadius: borderRadius.lg, overflow: 'hidden', opacity: wiz.confirm.isPublishing ? 0.6 : 1 }}
        >
          <LinearGradient
            colors={brandGradient.deep as unknown as [string, string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: 16, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 10,
            }}
          >
            {wiz.confirm.isPublishing
              ? <CircleNotch size={20} color="#fff" weight="bold" />
              : <Rocket size={20} color="#fff" weight="duotone" />}
            <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.lg }}>
              {wiz.confirm.isPublishing ? 'Bezig met publiceren…' : `Publiceer nu — ${selected.length} channels`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={{ marginTop: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '30', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Sparkle size={22} color={colors.primary} weight="duotone" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text }}>Klaar! 🎉</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
              Volg de resultaten in PostReview / Analytics.
            </Text>
          </View>
          <TouchableOpacity onPress={() => wiz.exit()} style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: borderRadius.md }}>
            <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.xs }}>Sluiten</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={{ fontSize: 10, color: colors.textTertiary, textAlign: 'center', marginTop: 4 }}>
        Geschatte tijd: ~{Math.max(3, selected.length * 3)} seconden
      </Text>
    </ScrollView>
  );
}

function StatusBadge({ status, colors }: { status: PublishStatus; colors: any }) {
  switch (status) {
    case 'in_flight': return <CircleNotch size={18} color={colors.primary} weight="bold" />;
    case 'ok':        return <CheckCircle size={20} color="#10B981" weight="fill" />;
    case 'error':     return <XCircle size={20} color="#EF4444" weight="fill" />;
    case 'pending':
    default:          return <Clock size={18} color={colors.textTertiary} weight="regular" />;
  }
}
