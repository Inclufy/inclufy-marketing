import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';
import * as WebBrowser from 'expo-web-browser';
import type { PlatformKey, ConnectionStatus } from '../../hooks/useSocialWizard';

const PLATFORM_META: Record<PlatformKey, { label: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; color: string }> = {
  facebook:  { label: 'Facebook',  icon: 'logo-facebook',  color: '#1877F2' },
  instagram: { label: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  linkedin:  { label: 'LinkedIn',  icon: 'logo-linkedin',  color: '#0077B5' },
  tiktok:    { label: 'TikTok',    icon: 'musical-notes',  color: '#FE2C55' },
  snapchat:  { label: 'Snapchat',  icon: 'logo-snapchat',  color: '#FFFC00' },
};

const SCOPE_LIST: Record<PlatformKey, string[]> = {
  facebook: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish', 'public_profile'],
  instagram: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish', 'public_profile'],
  linkedin: ['openid', 'profile', 'email', 'w_member_social'],
  tiktok: ['user.info.basic', 'video.publish', 'video.list'],
  snapchat: [],
};

type SocialAccount = {
  id: string;
  platform: string;
  account_name: string | null;
  account_type: string;
  status: string;
};

type Props = {
  selectedPlatforms: PlatformKey[];
  socialAccounts: SocialAccount[];
  connectionStatuses: Record<string, ConnectionStatus>;
  setPlatformStatus: (p: PlatformKey, s: ConnectionStatus) => void;
  fetchPrerequisiteExplain: (p: PlatformKey, lang?: string) => Promise<string>;
  fetchScopeExplain: (p: PlatformKey, scope: string, lang?: string) => Promise<string>;
  fetchErrorTroubleshoot: (p: PlatformKey, err: string, lang?: string) => Promise<string>;
  refetchAccounts: () => Promise<unknown>;
  goNext: () => void;
  goBack: () => void;
};

export default function StepConnect({
  selectedPlatforms,
  socialAccounts,
  connectionStatuses,
  setPlatformStatus,
  fetchPrerequisiteExplain,
  fetchScopeExplain,
  fetchErrorTroubleshoot,
  refetchAccounts,
  goNext,
  goBack,
}: Props) {
  const { colors } = useTheme();
  const [prereqs, setPrereqs] = useState<Record<string, string>>({});
  const [scopeModal, setScopeModal] = useState<{ platform: PlatformKey; scope: string; explanation: string } | null>(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [busyPlatform, setBusyPlatform] = useState<PlatformKey | null>(null);

  // Fetch prerequisite explanations on mount
  useEffect(() => {
    (async () => {
      for (const p of selectedPlatforms) {
        if (p === 'snapchat') continue;
        const explanation = await fetchPrerequisiteExplain(p, 'nl');
        setPrereqs(prev => ({ ...prev, [p]: explanation }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatforms.join(',')]);

  const isConnected = (p: PlatformKey) => {
    const accs = socialAccounts.filter(a => a.platform === p && a.status === 'active');
    if (p === 'facebook') return accs.some(a => a.account_type === 'page');
    if (p === 'instagram') return accs.some(a => a.account_type === 'business');
    if (p === 'linkedin') return accs.some(a => a.account_type === 'personal');
    return accs.length > 0;
  };

  const startOAuth = async (platformKey: PlatformKey) => {
    setBusyPlatform(platformKey);
    setPlatformStatus(platformKey, 'connecting');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mpxkugfqzmxydxnlxqoj.supabase.co';
      const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
      let orgIdForState = user.id;
      try {
        const { data: goOrg } = await supabase.from('go_organizations').select('id').limit(1).maybeSingle();
        if (goOrg?.id) orgIdForState = goOrg.id;
      } catch { /* ignore */ }

      const state = `${user.id}:${orgIdForState}:${platformKey}`;
      let authUrl = '';

      if (platformKey === 'linkedin') {
        const clientId = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '78sy9roeoz1143';
        const lmdpEnabled = process.env.EXPO_PUBLIC_LINKEDIN_LMDP === 'true';
        const basicScopes = 'openid profile email w_member_social';
        const lmdpScopes = ' r_organization_social w_organization_social rw_organization_admin';
        const scopes = basicScopes + (lmdpEnabled ? lmdpScopes : '');
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;
      } else if (platformKey === 'facebook' || platformKey === 'instagram') {
        const metaAppId = process.env.EXPO_PUBLIC_META_APP_ID || '947950264797942';
        const scope = 'pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,public_profile';
        authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${encodeURIComponent(state)}`;
      } else if (platformKey === 'tiktok') {
        const tiktokClientKey = process.env.EXPO_PUBLIC_TIKTOK_CLIENT_KEY || 'sbaw0n7p637do602ql';
        authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${tiktokClientKey}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('user.info.basic,video.publish,video.list')}&response_type=code&state=${encodeURIComponent(state)}`;
      }

      if (!authUrl) throw new Error('OAuth niet beschikbaar voor dit platform');

      await WebBrowser.openBrowserAsync(authUrl, {
        dismissButtonStyle: 'done',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });

      // After dismiss: refetch accounts to detect new rows
      await new Promise(r => setTimeout(r, 1500));
      await refetchAccounts();
      setPlatformStatus(platformKey, 'connected');
    } catch (err: any) {
      setPlatformStatus(platformKey, 'failed');
      const friendlyMsg = await fetchErrorTroubleshoot(platformKey, err?.message ?? 'Unknown error', 'nl');
      Alert.alert('Verbinding mislukt', friendlyMsg);
    } finally {
      setBusyPlatform(null);
    }
  };

  const performDisconnect = async (platformKey: PlatformKey) => {
    setBusyPlatform(platformKey);
    try {
      const accIds = socialAccounts.filter(a => a.platform === platformKey).map(a => a.id);
      if (accIds.length === 0) return;
      const { error } = await supabase.from('social_accounts').delete().in('id', accIds);
      if (error) throw error;
      await refetchAccounts();
      setPlatformStatus(platformKey, 'pending');
      Alert.alert('✅ Ontkoppeld', `${PLATFORM_META[platformKey].label} is ontkoppeld. OAuth-tokens zijn verwijderd.`);
    } catch (err: any) {
      Alert.alert('Fout', err?.message ?? 'Kon niet ontkoppelen');
    } finally {
      setBusyPlatform(null);
    }
  };

  const showScopeExplain = async (platform: PlatformKey, scope: string) => {
    setScopeLoading(true);
    setScopeModal({ platform, scope, explanation: '' });
    const explanation = await fetchScopeExplain(platform, scope, 'nl');
    setScopeModal({ platform, scope, explanation });
    setScopeLoading(false);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm }}>
        Verbind je accounts
      </Text>
      <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg }}>
        Per platform tik op "Verbinden". We openen een veilige OAuth-flow waarin jij toestemming geeft.
      </Text>

      <View style={{ gap: spacing.md }}>
        {selectedPlatforms.map((p) => {
          if (p === 'snapchat') return null;
          const meta = PLATFORM_META[p];
          const connected = isConnected(p);
          const busy = busyPlatform === p;
          const scopes = SCOPE_LIST[p] ?? [];

          return (
            <View
              key={p}
              style={{
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: connected ? colors.success : colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: meta.color + '20',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: spacing.md,
                }}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <Text style={{ flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text }}>
                  {meta.label}
                </Text>
                {connected ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={{ color: colors.success, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>Verbonden</Text>
                  </View>
                ) : null}
              </View>

              {/* Prerequisites */}
              {prereqs[p] && !connected ? (
                <View style={{ backgroundColor: colors.background, padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                    <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.semibold }}>
                      Vooraf nodig:
                    </Text>
                  </View>
                  <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 }}>
                    {prereqs[p]}
                  </Text>
                </View>
              ) : null}

              {/* Scopes */}
              {scopes.length > 0 && !connected ? (
                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: 4 }}>
                    We vragen deze toegang (tik voor uitleg):
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {scopes.map(scope => (
                      <TouchableOpacity
                        key={scope}
                        onPress={() => showScopeExplain(p, scope)}
                        style={{
                          paddingHorizontal: 8, paddingVertical: 4,
                          backgroundColor: meta.color + '12',
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: meta.color, fontFamily: 'Menlo' }}>{scope}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Action button */}
              {connected ? (
                <TouchableOpacity
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      `${meta.label} ontkoppelen`,
                      'OAuth-tokens worden verwijderd. Je kunt later opnieuw verbinden.',
                      [
                        { text: 'Annuleren', style: 'cancel' },
                        { text: 'Ontkoppelen', style: 'destructive', onPress: () => performDisconnect(p) },
                      ],
                    )
                  }
                  style={{
                    padding: spacing.sm,
                    borderRadius: borderRadius.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                  }}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={{ color: colors.text, fontSize: fontSize.sm }}>🔌 Ontkoppelen</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => startOAuth(p)}
                  style={{
                    padding: spacing.md,
                    borderRadius: borderRadius.sm,
                    backgroundColor: meta.color,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: spacing.sm,
                  }}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="link" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>
                        Verbind {meta.label}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Navigation */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.7}
          style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
        >
          <Text style={{ color: colors.text, fontSize: fontSize.md }}>Terug</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.7}
          style={{ flex: 2, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}
        >
          <Text style={{ color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>Verder</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scope explain modal */}
      <Modal visible={!!scopeModal} transparent animationType="fade" onRequestClose={() => setScopeModal(null)}>
        <View style={{ flex: 1, backgroundColor: '#00000080', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.background, padding: spacing.lg, borderRadius: borderRadius.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm }}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text }}>
                AMOS legt uit
              </Text>
            </View>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontFamily: 'Menlo' }}>
              {scopeModal?.scope}
            </Text>
            {scopeLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : (
              <Text style={{ fontSize: fontSize.md, color: colors.text, lineHeight: 22, marginBottom: spacing.lg }}>
                {scopeModal?.explanation || 'Geen uitleg beschikbaar.'}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => setScopeModal(null)}
              style={{ padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>Ok, duidelijk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
