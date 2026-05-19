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
import { useNavigation } from '@react-navigation/native';
import {
  Rocket, CheckCircle, XCircle, CircleNotch, Clock, Sparkle, ArrowsClockwise, Eye, Confetti,
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
  const navigation = useNavigation<any>();
  const [done, setDone] = useState(false);

  const selected = wiz.channels.availableAccounts.filter(a =>
    wiz.channels.selectedAccountIds.has(a.id)
  );

  // Tallies for the post-publish report
  const okIds = selected.filter(a => wiz.confirm.results[a.id] === 'ok');
  const errIds = selected.filter(a => wiz.confirm.results[a.id] === 'error');

  const previewUri = wiz.edit.brandedImageUrl ?? wiz.edit.livePreviewUri ?? wiz.capture.mediaUri;

  async function publishAll(only?: typeof selected) {
    const targets = only ?? selected;
    if (targets.length === 0) return;

    // Preserve previous results when retrying — only reset entries for the
    // targets we're about to re-run. Full publish (no `only`) starts fresh.
    const initialResults: Record<string, PublishStatus> = only
      ? { ...wiz.confirm.results, ...Object.fromEntries(only.map(a => [a.id, 'pending' as PublishStatus])) }
      : {};
    const initialErrors: Record<string, string> = only
      ? Object.fromEntries(Object.entries(wiz.confirm.errors).filter(([id]) => !only.find(a => a.id === id)))
      : {};
    wiz.setConfirm({ isPublishing: true, results: initialResults, errors: initialErrors });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      Alert.alert('Niet ingelogd', 'Log opnieuw in.');
      wiz.setConfirm({ isPublishing: false });
      return;
    }

    // 312 fix: go_posts.capture_id is NOT NULL. The wizard didn't create a
    // capture row before Step 5 (only LiveCapture flow did). Lazy-create one
    // here so the foreign key is satisfied. Persisted into wiz.capture.captureId
    // so a retry reuses the same row.
    let captureId: string | null = wiz.capture.captureId ?? null;
    if (!captureId) {
      try {
        const { data: capRow, error: capErr } = await supabase
          .from('go_captures')
          .insert({
            user_id: user.id,
            event_id: wiz.capture.eventId ?? null,
            media_type: wiz.capture.mediaType ?? 'photo',
            media_url: wiz.edit.brandedImageUrl ?? wiz.capture.mediaUri ?? '',
            storage_path: '',
            thumbnail_url: wiz.edit.brandedImageUrl ?? wiz.capture.mediaUri ?? null,
            tags: [],
            note: wiz.edit.overlayText ?? '',
            ai_status: 'completed',
            captured_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (capErr || !capRow) {
          throw new Error(`Kon capture niet aanmaken: ${capErr?.message ?? 'unknown'}`);
        }
        captureId = (capRow as any).id as string;
        wiz.setCapture({ captureId });
        console.log(`[Step5.publish] created capture ${captureId}`);
      } catch (err: any) {
        Alert.alert('Capture-fout', err?.message ?? 'Kon capture-record niet aanmaken.');
        wiz.setConfirm({ isPublishing: false });
        return;
      }
    }

    // Per-account status tracker — written directly here and mirrored to
    // wiz.confirm at the end of each iteration. The old code spread
    // `wiz.confirm.results` (a closed-over value), which captured a stale
    // snapshot in the for-loop and caused intermediate flicker for 3+
    // accounts (caught by static QA agent).
    const liveResults: Record<string, PublishStatus> = { ...initialResults };
    const liveErrors:  Record<string, string>        = { ...initialErrors };

    // Create one go_posts row per channel so each has its own publish state.
    // This keeps the existing publish-social contract intact and lets
    // partial-failures be retried later from PostReview.
    for (const acc of targets) {
      const channel = acc.platform;
      const text = wiz.perChannel.textVariants[channel] ?? wiz.edit.overlayText ?? '';

      liveResults[acc.id] = 'in_flight';
      wiz.setConfirm({ results: { ...liveResults }, errors: { ...liveErrors } });

      try {
        // 1. Create the post row (capture_id is NOT NULL → must include)
        const { data: postRow, error: insertErr } = await supabase
          .from('go_posts')
          .insert({
            user_id: user.id,
            capture_id: captureId,
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

        // 2. Invoke publish-social with a 90s timeout (some channels — IG video,
        // TikTok upload — legitimately take 30-60s; >90s is broken). Without
        // this, supabase-js await hangs forever on edge function 504 / network
        // drop, blocking the entire sequential publish loop (313 bug: 6 channels
        // stuck on "Bezig met publiceren…").
        console.log(`[Step5.publish] → ${channel} acc=${acc.id} postId=${postId} text=${text?.slice(0, 40)}…`);
        const invokePromise = supabase.functions.invoke('publish-social', {
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
        const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: 'Timeout — publish-social geen response binnen 90s' } }), 90_000),
        );
        const { data: result, error: pubErr } = await Promise.race([invokePromise, timeoutPromise]) as any;
        console.log(`[Step5.publish] ← ${channel} pubErr=${pubErr ? JSON.stringify(pubErr) : 'none'} result=${result ? JSON.stringify(result).slice(0, 200) : 'null'}`);

        // Strict validation:
        // 1. transport error → throw
        // 2. no response at all → throw (silent failure; previously fell through to 'ok')
        // 3. result.success !== true → throw with whatever detail we can find
        if (pubErr) {
          // 315: extract the real edge-function response body. supabase-js wraps
          // 4xx/5xx responses in FunctionsHttpError with context = Response object.
          // Without this, MISLUKT rows just say "Edge Function returned a non-2xx
          // status code" — useless for diagnosing TikTok URL-properties / token /
          // sandbox issues.
          let detail = (pubErr as any)?.message ?? 'Edge function transport error (geen response)';
          try {
            const ctx = (pubErr as any)?.context;
            if (ctx && typeof ctx.json === 'function') {
              const body = await ctx.clone().json().catch(() => null) ?? await ctx.clone().text().catch(() => null);
              if (body) {
                const errMsg = typeof body === 'string' ? body : (body.error ?? body.message ?? JSON.stringify(body));
                detail = `${detail}: ${String(errMsg).slice(0, 200)}`;
              }
            } else if (ctx && typeof ctx.text === 'function') {
              const text = await ctx.clone().text().catch(() => null);
              if (text) detail = `${detail}: ${text.slice(0, 200)}`;
            }
          } catch { /* extraction is best-effort */ }
          throw new Error(detail);
        }
        if (!result) {
          throw new Error('Geen response van publish-social (timeout of CORS?)');
        }
        if (result.success !== true) {
          const detail = result.error ?? result.message ?? JSON.stringify(result).slice(0, 160);
          throw new Error(`publish-social failed: ${detail}`);
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
              {/* Result-specific row after publish: status detail + full error if any */}
              {done && status === 'error' && err ? (
                <View
                  style={{
                    paddingHorizontal: 10, paddingVertical: 8,
                    borderRadius: borderRadius.sm,
                    backgroundColor: '#FEE2E2', borderLeftWidth: 3, borderLeftColor: '#DC2626',
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#7F1D1D', fontWeight: '700', marginBottom: 2, letterSpacing: 0.4 }}>
                    MISLUKT
                  </Text>
                  <Text style={{ fontSize: fontSize.xs, color: '#7F1D1D', lineHeight: 18 }}>
                    {err}
                  </Text>
                </View>
              ) : done && status === 'ok' ? (
                <View
                  style={{
                    paddingHorizontal: 10, paddingVertical: 8,
                    borderRadius: borderRadius.sm,
                    backgroundColor: '#D1FAE5', borderLeftWidth: 3, borderLeftColor: '#10B981',
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#065F46', fontWeight: '700', letterSpacing: 0.4 }}>
                    ✓ GEPUBLICEERD NAAR {acc.platform.toUpperCase()}
                  </Text>
                </View>
              ) : caption ? (
                <View
                  style={{
                    paddingHorizontal: 10, paddingVertical: 8,
                    borderRadius: borderRadius.sm,
                    backgroundColor: colors.background, borderLeftWidth: 3, borderLeftColor: color,
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '600', marginBottom: 2, letterSpacing: 0.4 }}>
                    {wiz.confirm.isPublishing && status === 'in_flight' ? 'PUBLICEREN…' : 'PUBLICEERT ALS'}
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
          onPress={() => publishAll()}
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
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {/* Publish-rapport — explicit summary block */}
          <View
            style={{
              padding: spacing.md, borderRadius: borderRadius.lg,
              backgroundColor: errIds.length > 0 ? '#FEF3C7' : '#D1FAE5',
              borderWidth: 1, borderColor: errIds.length > 0 ? '#F59E0B' : '#10B981',
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}
          >
            {errIds.length === 0
              ? <Confetti size={26} color="#10B981" weight="fill" />
              : <Sparkle size={26} color="#F59E0B" weight="fill" />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: errIds.length > 0 ? '#92400E' : '#065F46' }}>
                {errIds.length === 0
                  ? `Alle ${okIds.length} posts gepubliceerd 🎉`
                  : `${okIds.length} gelukt · ${errIds.length} mislukt`}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: errIds.length > 0 ? '#92400E' : '#065F46', marginTop: 2 }}>
                {errIds.length === 0
                  ? 'Bekijk per channel hierboven of in PostReview voor analytics.'
                  : `${errIds.map(a => a.platform).join(', ')} hierboven met foutmelding.`}
              </Text>
            </View>
          </View>

          {/* Quick-action row: retry failed + open PostReview + close */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {errIds.length > 0 && (
              <TouchableOpacity
                onPress={() => { setDone(false); publishAll(errIds); }}
                disabled={wiz.confirm.isPublishing}
                activeOpacity={0.85}
                style={{
                  flex: 1, paddingVertical: 12, paddingHorizontal: spacing.sm,
                  borderRadius: borderRadius.md,
                  backgroundColor: '#DC2626',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: wiz.confirm.isPublishing ? 0.5 : 1,
                }}
                testID="retry-failed"
              >
                <ArrowsClockwise size={15} color="#fff" weight="bold" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.xs }}>
                  Retry {errIds.length} mislukt{errIds.length === 1 ? 'e' : 'en'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                // Navigate to PostReview without closing the wizard (in case user
                // wants to come back). Caller of WizardProvider decides exit policy.
                try { navigation.navigate('PostReview' as any, { captureId: wiz.capture.captureId, eventId: wiz.capture.eventId }); } catch { /* route may not be in stack */ }
              }}
              activeOpacity={0.85}
              style={{
                flex: 1, paddingVertical: 12, paddingHorizontal: spacing.sm,
                borderRadius: borderRadius.md,
                borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Eye size={15} color={colors.text} weight="duotone" />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.xs }}>PostReview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => wiz.exit()}
              activeOpacity={0.85}
              style={{
                flex: 1, paddingVertical: 12, paddingHorizontal: spacing.sm,
                borderRadius: borderRadius.md,
                backgroundColor: colors.primary,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.xs }}>Sluiten</Text>
            </TouchableOpacity>
          </View>
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
