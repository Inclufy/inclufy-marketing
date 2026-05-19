// src/components/wizard/Step4PerChannel.tsx
// Step 4: per-channel tweaks — text variants + auto-resize info.
// Optional step: user can skip directly to step 5 if defaults are fine.
//
// 307: AI caption auto-generation restored. On entry we call
// `aiService.generateAllChannelPosts(...)` for every platform that doesn't
// yet have a text variant — the OLD LiveCapture/PostReview flow did this
// silently after capture. Per-platform "✨ Regenereer" button replaces the
// "binnenkort" stub.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import {
  ArrowRight, Sparkle, PencilSimple, Crop, ArrowsClockwise,
  FacebookLogo, InstagramLogo, LinkedinLogo, TiktokLogo, PinterestLogo, SnapchatLogo, ShareNetwork,
} from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight, brandGradient } from '../../theme';
import { useWizardState } from '../../hooks/useWizardState';
import { aiService } from '../../services/ai.service';
import type { Channel } from '../../types';

const PLATFORM_ICON: Record<string, React.ComponentType<any>> = {
  facebook: FacebookLogo, instagram: InstagramLogo, linkedin: LinkedinLogo,
  tiktok: TiktokLogo, pinterest: PinterestLogo, snapchat: SnapchatLogo,
};
const PLATFORM_COLOR: Record<string, string> = {
  facebook: '#1877F2', instagram: '#E1306C', linkedin: '#0A66C2',
  tiktok: '#000000',   pinterest: '#E60023', snapchat: '#FFFC00',
};
// Best practice aspect-ratios per platform — informational only for now.
const PLATFORM_RATIO: Record<string, string> = {
  facebook: '1:1 of 1.91:1',
  instagram: '1:1 (feed) of 9:16 (story/reel)',
  linkedin: '1.91:1 (LinkedIn share)',
  tiktok: '9:16 (vertical)',
  pinterest: '2:3 (pin)',
  snapchat: '9:16 (snap)',
};

async function readImageBase64(uri: string | null | undefined): Promise<string | undefined> {
  if (!uri) return undefined;
  try {
    // Skip remote URLs — generate works without base64 (event_context only).
    if (/^https?:/i.test(uri)) return undefined;
    return await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
  } catch {
    return undefined;
  }
}

export default function Step4PerChannel() {
  const { colors } = useTheme();
  const wiz = useWizardState();

  const selected = wiz.channels.availableAccounts.filter(a =>
    wiz.channels.selectedAccountIds.has(a.id)
  );

  // Group accounts by platform (since text variants are per-platform, not per-account)
  const platforms = Array.from(new Set(selected.map(a => a.platform)));

  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [perPlatformLoading, setPerPlatformLoading] = useState<Record<string, boolean>>({});
  // Track whether we've auto-generated for this set already — prevents loop
  // if API returns blank for some platform.
  const autoRanForRef = useRef<string>('');

  async function generateForPlatforms(targets: string[], overwrite: boolean) {
    if (targets.length === 0) return;
    // Use baked image if uploaded, else local preview, else raw capture URI.
    const sourceUri =
      (wiz.edit.brandedImageUrl && /^https?:/i.test(wiz.edit.brandedImageUrl) ? null : wiz.edit.brandedImageUrl) ||
      wiz.edit.livePreviewUri ||
      wiz.capture.mediaUri;
    const imageBase64 = await readImageBase64(sourceUri);

    try {
      const results = await aiService.generateAllChannelPosts(
        targets,
        imageBase64,
        undefined,
        {
          name: '',
          description: wiz.edit.overlayText ?? '',
          hashtags: [],
          location: '',
        },
        wiz.edit.overlayText ?? '',
        [],
      );
      const merged = { ...wiz.perChannel.textVariants };
      for (const p of targets) {
        const text = results[p]?.text?.trim();
        if (!text) continue;
        if (overwrite || !merged[p]) merged[p] = text;
      }
      wiz.setPerChannel({ textVariants: merged });
    } catch (err) {
      console.warn('[Step4] generate failed', err);
    }
  }

  // Auto-generate on mount (or when platforms change). Only fills empty
  // variants — won't overwrite anything the user already typed.
  useEffect(() => {
    const key = platforms.slice().sort().join(',');
    if (!key || autoRanForRef.current === key) return;
    autoRanForRef.current = key;
    const missing = platforms.filter(p => !wiz.perChannel.textVariants[p]?.trim());
    if (missing.length === 0) return;
    (async () => {
      setBulkGenerating(true);
      await generateForPlatforms(missing, false);
      setBulkGenerating(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms.join(',')]);

  async function regenerateOne(p: string) {
    setPerPlatformLoading(s => ({ ...s, [p]: true }));
    await generateForPlatforms([p], true);
    setPerPlatformLoading(s => ({ ...s, [p]: false }));
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text }}>
        Tweak per kanaal
      </Text>
      <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
        AI heeft per platform een caption gegenereerd op basis van je foto en overlay-tekst. Pas vrij aan of regenereer.
      </Text>

      {/* Bulk-generate banner (top — visible while in-flight or when all empty) */}
      {bulkGenerating && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          padding: spacing.md, borderRadius: borderRadius.md,
          backgroundColor: colors.primary + '12', borderWidth: 1, borderColor: colors.primary + '30',
        }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ flex: 1, fontSize: fontSize.xs, color: colors.text }}>
            AI schrijft captions voor {platforms.length} platforms… (~{platforms.length * 2}s)
          </Text>
        </View>
      )}

      {platforms.map((p) => {
        const Icon = PLATFORM_ICON[p] ?? ShareNetwork;
        const color = PLATFORM_COLOR[p] ?? colors.primary;
        const current = wiz.perChannel.textVariants[p] ?? '';
        const loading = perPlatformLoading[p];
        return (
          <View
            key={p}
            style={{
              borderRadius: borderRadius.lg,
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.border,
              padding: spacing.md,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color + '20', justifyContent: 'center', alignItems: 'center' }}>
                <Icon size={16} color={color === '#000000' ? colors.text : color} weight="duotone" />
              </View>
              <Text style={{ flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, textTransform: 'capitalize' }}>
                {p}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Crop size={12} color={colors.textTertiary} weight="bold" />
                <Text style={{ fontSize: 10, color: colors.textTertiary }}>{PLATFORM_RATIO[p] ?? 'auto'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <PencilSimple size={14} color={colors.textSecondary} weight="bold" />
              <Text style={{ flex: 1, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary, textTransform: 'uppercase' }}>
                {current ? 'Caption' : (bulkGenerating ? 'AI genereert…' : 'Caption (leeg — tap regenereer)')}
              </Text>
              {/* Per-platform regenerate button */}
              <TouchableOpacity
                onPress={() => regenerateOne(p)}
                disabled={loading || bulkGenerating}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 8, paddingVertical: 4,
                  borderRadius: 999, borderWidth: 1,
                  borderColor: color + '60', backgroundColor: color + '10',
                  opacity: (loading || bulkGenerating) ? 0.5 : 1,
                }}
                testID={`regenerate-${p}`}
              >
                {loading
                  ? <ActivityIndicator color={color} size="small" />
                  : <ArrowsClockwise size={12} color={color} weight="bold" />}
                <Text style={{ fontSize: 10, fontWeight: '700', color: color === '#000000' ? colors.text : color }}>
                  {loading ? 'Bezig…' : '✨ Regenereer'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={current}
              onChangeText={(v) => wiz.setPerChannel({ textVariants: { ...wiz.perChannel.textVariants, [p]: v } })}
              placeholder={bulkGenerating ? 'AI schrijft…' : `Schrijf je eigen ${p}-caption of tap ✨ Regenereer`}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.background,
                borderWidth: 1, borderColor: colors.border,
                borderRadius: borderRadius.md,
                paddingHorizontal: 12, paddingVertical: 10,
                fontSize: fontSize.sm, color: colors.text,
                minHeight: 64, textAlignVertical: 'top',
              }}
            />
          </View>
        );
      })}

      {/* Bulk regenerate-all button */}
      <TouchableOpacity
        onPress={async () => {
          setBulkGenerating(true);
          await generateForPlatforms(platforms, true);
          setBulkGenerating(false);
        }}
        disabled={bulkGenerating || platforms.length === 0}
        activeOpacity={0.85}
        style={{
          marginTop: spacing.xs,
          paddingVertical: 12, paddingHorizontal: spacing.md,
          borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.primary + '40',
          backgroundColor: colors.primary + '08',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: bulkGenerating ? 0.5 : 1,
        }}
      >
        <Sparkle size={16} color={colors.primary} weight="duotone" />
        <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>
          {bulkGenerating ? 'AI bezig…' : 'Regenereer alles met AI'}
        </Text>
      </TouchableOpacity>

      {/* Next */}
      <TouchableOpacity
        onPress={() => wiz.next()}
        activeOpacity={0.85}
        style={{ marginTop: spacing.md, borderRadius: borderRadius.lg, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={brandGradient.deep as unknown as [string, string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{
            paddingVertical: 14, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md }}>
            Naar publish-overzicht
          </Text>
          <ArrowRight size={16} color="#fff" weight="bold" />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
