// src/components/wizard/Step3Channels.tsx
// Step 3: select which social accounts to publish to.
// - Quick "Alle ingestelde channels" toggle that bulk-selects everything
// - Multi-select per account with avatar + platform icon + name + type
// - Disabled state for accounts whose tokens are expired

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  ShareNetwork, CheckCircle, CircleDashed, ArrowRight, WarningCircle,
  FacebookLogo, InstagramLogo, LinkedinLogo, TiktokLogo, PinterestLogo, SnapchatLogo,
} from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight, brandGradient } from '../../theme';
import { useWizardState, type WizardSelectedAccount } from '../../hooks/useWizardState';
import { supabase } from '../../services/supabase';

const PLATFORM_ICON: Record<string, React.ComponentType<any>> = {
  facebook: FacebookLogo,
  instagram: InstagramLogo,
  linkedin: LinkedinLogo,
  tiktok: TiktokLogo,
  pinterest: PinterestLogo,
  snapchat: SnapchatLogo,
};
const PLATFORM_COLOR: Record<string, string> = {
  facebook: '#1877F2', instagram: '#E1306C', linkedin: '#0A66C2',
  tiktok: '#000000',   pinterest: '#E60023', snapchat: '#FFFC00',
};

export default function Step3Channels() {
  const { colors } = useTheme();
  const wiz = useWizardState();

  // Pull all connected social accounts for the current user.
  // Status filter matches what useConnectedChannels.ts uses — both legacy
  // 'active' and current 'connected' rows are valid. Initially this query
  // used only 'connected', which silently hid all existing accounts (the
  // 22:18 "Geen verbonden accounts" bug on build 301).
  const { data: accounts = [], isLoading } = useQuery<WizardSelectedAccount[]>({
    queryKey: ['wizard-social-accounts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      const { data } = await supabase
        .from('social_accounts')
        .select('id, platform, account_name, account_type, status, profile_image_url, is_active')
        .eq('user_id', user.id)
        .order('platform', { ascending: true });
      // Filter client-side to keep the query simple and to also accept
      // rows where is_active=true (some legacy rows have neither status nor
      // status='connected' but is_active=true).
      const filtered = (data ?? []).filter((a: any) => {
        const s = (a.status ?? '').toString().toLowerCase();
        return s === 'active' || s === 'connected' || a.is_active === true;
      });
      return filtered.map((a: any) => {
        // Some platforms (Pinterest, TikTok) save open_id / username UUIDs in
        // account_name. Those render as a 24-char hex string in the list — not
        // useful. Detect ID-shaped names (no spaces, no @, long alphanumeric)
        // and fall back to "Pinterest account (xxxxxx)" style label.
        const raw = (a.account_name ?? '').toString().trim();
        const looksLikeId = raw.length >= 20 && !/[\s@.]/.test(raw) && /^[a-z0-9_-]+$/i.test(raw);
        const displayName = !raw
          ? a.platform
          : looksLikeId
            ? `${a.platform[0].toUpperCase() + a.platform.slice(1)} account (${raw.slice(0, 6)}…)`
            : raw;
        return {
          id: a.id,
          platform: a.platform,
          accountName: displayName,
          accountType: a.account_type,
          profileImageUrl: a.profile_image_url,
        };
      });
    },
    staleTime: 60_000,
  });

  // Sync available list into wizard state
  useEffect(() => {
    if (accounts.length > 0) {
      wiz.setChannels({ availableAccounts: accounts });
      // Auto-select all on first arrival
      if (wiz.channels.selectedAccountIds.size === 0 && wiz.channels.applyToAll) {
        wiz.setChannels({ selectedAccountIds: new Set(accounts.map(a => a.id)) });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  function toggleAll() {
    const allSelected = accounts.every(a => wiz.channels.selectedAccountIds.has(a.id));
    if (allSelected) {
      wiz.setChannels({ selectedAccountIds: new Set(), applyToAll: false });
    } else {
      wiz.setChannels({ selectedAccountIds: new Set(accounts.map(a => a.id)), applyToAll: true });
    }
  }

  const selectedCount = wiz.channels.selectedAccountIds.size;
  const allSelected = accounts.length > 0 && accounts.every(a => wiz.channels.selectedAccountIds.has(a.id));

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text }}>
        Waar plaatsen?
      </Text>
      <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
        Selecteer één of meer accounts. We posten naar elke geselecteerde channel.
      </Text>

      {/* All toggle */}
      <TouchableOpacity
        onPress={toggleAll}
        disabled={accounts.length === 0}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          padding: spacing.md, borderRadius: borderRadius.lg,
          backgroundColor: allSelected ? colors.primary + '15' : colors.surface,
          borderWidth: 1, borderColor: allSelected ? colors.primary + '40' : colors.border,
        }}
      >
        {allSelected
          ? <CheckCircle size={22} color={colors.primary} weight="fill" />
          : <CircleDashed size={22} color={colors.textTertiary} weight="regular" />}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text }}>
            Alle ingestelde channels
          </Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
            {accounts.length} accounts beschikbaar
          </Text>
        </View>
        <ShareNetwork size={18} color={colors.textSecondary} weight="duotone" />
      </TouchableOpacity>

      {/* Account list */}
      {isLoading ? (
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : accounts.length === 0 ? (
        <View
          style={{
            padding: spacing.lg, borderRadius: borderRadius.lg,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
            alignItems: 'center', gap: 8,
          }}
        >
          <WarningCircle size={28} color={colors.warning ?? '#F59E0B'} weight="duotone" />
          <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, textAlign: 'center' }}>
            Geen verbonden accounts
          </Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' }}>
            Ga naar Instellingen → Social Media om te koppelen.
          </Text>
        </View>
      ) : (
        accounts.map((a) => {
          const Icon = PLATFORM_ICON[a.platform] ?? ShareNetwork;
          const color = PLATFORM_COLOR[a.platform] ?? colors.primary;
          const isSelected = wiz.channels.selectedAccountIds.has(a.id);
          return (
            <TouchableOpacity
              key={a.id}
              onPress={() => wiz.toggleAccount(a.id)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                padding: spacing.md, borderRadius: borderRadius.lg,
                backgroundColor: isSelected ? color + '10' : colors.surface,
                borderWidth: 1, borderColor: isSelected ? color + '40' : colors.border,
              }}
            >
              {isSelected
                ? <CheckCircle size={22} color={color} weight="fill" />
                : <CircleDashed size={22} color={colors.textTertiary} weight="regular" />}

              {a.profileImageUrl ? (
                <Image source={{ uri: a.profileImageUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
              ) : (
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color + '20', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon size={18} color={color === '#000000' ? colors.text : color} weight="duotone" />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text }}>
                  {a.accountName}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1, textTransform: 'capitalize' }}>
                  {a.platform} · {a.accountType ?? 'account'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* Next */}
      <TouchableOpacity
        onPress={() => wiz.next()}
        disabled={selectedCount === 0}
        activeOpacity={0.85}
        style={{ marginTop: spacing.md, borderRadius: borderRadius.lg, overflow: 'hidden', opacity: selectedCount === 0 ? 0.4 : 1 }}
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
            {selectedCount === 0 ? 'Kies eerst minstens 1 channel' : `Volgende — ${selectedCount} geselecteerd`}
          </Text>
          {selectedCount > 0 && <ArrowRight size={16} color="#fff" weight="bold" />}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}
