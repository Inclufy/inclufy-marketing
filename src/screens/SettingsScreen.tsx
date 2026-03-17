import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../services/supabase';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation, LOCALE_LABELS, type Locale } from '../i18n';
import type { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';
import { useLocation, formatRegion, type RegionData } from '../hooks/useLocation';

const BIOMETRIC_KEY = 'amos_biometric_enabled';

const SOCIAL_PLATFORMS = [
  { key: 'linkedin',  label: 'LinkedIn',    icon: 'logo-linkedin'  as keyof typeof Ionicons.glyphMap, color: '#0077B5', supported: true },
  { key: 'instagram', label: 'Instagram',   icon: 'logo-instagram' as keyof typeof Ionicons.glyphMap, color: '#E4405F', supported: true },
  { key: 'x',         label: 'X / Twitter', icon: 'logo-twitter'   as keyof typeof Ionicons.glyphMap, color: '#1DA1F2', supported: false },
  { key: 'facebook',  label: 'Facebook',    icon: 'logo-facebook'  as keyof typeof Ionicons.glyphMap, color: '#1877F2', supported: true },
  { key: 'tiktok',    label: 'TikTok',      icon: 'musical-notes'  as keyof typeof Ionicons.glyphMap, color: '#000000', supported: false },
  { key: 'snapchat',  label: 'Snapchat',    icon: 'eye-outline'    as keyof typeof Ionicons.glyphMap, color: '#FFFC00', supported: false },
] as const;


// ─── Component ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { t, locale, setLocale } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { scheme, setScheme, colors } = useTheme();

  const [email, setEmail]                         = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled]   = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [exportLoading, setExportLoading]         = useState(false);

  // ─── Location ──────────────────────────────────────────────────────
  const gpsLocation = useLocation(false); // Don't auto-detect on mount
  const [savedLocation, setSavedLocation] = useState<RegionData | null>(null);

  // Load saved location from user metadata
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } = {} as any } = await supabase.auth.getUser();
        const meta = user?.user_metadata;
        if (meta?.location_city || meta?.location_country) {
          setSavedLocation({
            city: meta.location_city || '',
            province: meta.location_province || '',
            country: meta.location_country || '',
            countryCode: meta.location_country_code || '',
            continent: meta.location_continent || '',
          });
        }
      } catch {}
    })();
  }, []);

  const handleDetectLocation = async () => {
    await gpsLocation.refresh();
  };

  useEffect(() => {
    if (gpsLocation.region) {
      setSavedLocation(gpsLocation.region);
      // Persist to Supabase user metadata
      supabase.auth.updateUser({
        data: {
          location_city: gpsLocation.region.city,
          location_province: gpsLocation.region.province,
          location_country: gpsLocation.region.country,
          location_country_code: gpsLocation.region.countryCode,
          location_continent: gpsLocation.region.continent,
        },
      }).catch(() => {});
    }
  }, [gpsLocation.region]);

  // ── Styles ──────────────────────────────────────────────────────────────
  const styles = useThemedStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      backgroundColor: c.surface,
      paddingTop: 60,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.text },
    scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    card: { backgroundColor: c.surface, borderRadius: borderRadius.lg, ...subtleShadow },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    rowIconWrap: {
      width: 36, height: 36, borderRadius: borderRadius.md,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    rowValue: { fontSize: fontSize.sm, color: c.textSecondary, marginTop: 2 },
    separator: {
      height: 1,
      backgroundColor: c.borderLight,
      marginLeft: spacing.md + 36 + spacing.md,
    },
  }));

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Load user email
      const { data } = await supabase.auth.getUser();
      setEmail(data?.user?.email ?? null);

      // Check biometric hardware + stored preference
      const [hasBio, storedBio] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        AsyncStorage.getItem(BIOMETRIC_KEY),
      ]);
      setBiometricAvailable(hasBio);
      if (storedBio === 'true') setBiometricEnabled(true);

      // Check notification permission (iOS)
      const { status } = await Linking.canOpenURL('app-settings:')
        .then(() => ({ status: 'granted' }))
        .catch(() => ({ status: 'denied' }));
      // We'll just reflect user's saved preference
      const savedNotif = await AsyncStorage.getItem('amos_notifications_enabled');
      setNotificationsEnabled(savedNotif !== 'false'); // default ON
    };
    init();
  }, []);

  // ── Social accounts ──────────────────────────────────────────────────────
  const { data: socialAccounts = [], refetch: refetchSocial } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('social_accounts')
        .select('id, platform, platform_username, account_type, is_active');
      return (data || []) as Array<{ id?: string; platform: string; platform_username: string | null; account_type?: string | null; is_active: boolean }>;
    },
    staleTime: 30_000,
  });


  // ── Brand Kit ────────────────────────────────────────────────────────────
  const { data: brandKits = [], refetch: refetchBrandKits } = useQuery({
    queryKey: ['brand-kits-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brand_kits')
        .select('id, name, is_active')
        .order('is_active', { ascending: false });
      return data || [];
    },
    staleTime: 0,
  });

  const activeBrandKit = (brandKits as any[]).find((bk: any) => bk.is_active);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert(
      t.settings.logout,
      t.settings.logoutConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.settings.logout, style: 'destructive', onPress: async () => supabase.auth.signOut() },
      ],
    );
  };

  const handleThemeSwitch = () => {
    Alert.alert('Weergave', 'Kies een thema', [
      { text: '☀️  Licht',   onPress: () => setScheme('light') },
      { text: '🌙  Donker',  onPress: () => setScheme('dark') },
      { text: '⚙️  Systeem', onPress: () => setScheme('system') },
      { text: 'Annuleren', style: 'cancel' },
    ]);
  };

  const handleLanguageSwitch = () => {
    const locales: Locale[] = ['nl', 'en', 'fr'];
    Alert.alert(t.settings.language, undefined, [
      ...locales.map((loc) => ({
        text: `${LOCALE_LABELS[loc]}${loc === locale ? ' ✓' : ''}`,
        onPress: () => setLocale(loc),
      })),
      { text: t.common.cancel, style: 'cancel' as const },
    ]);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('amos_notifications_enabled', value ? 'true' : 'false');
    if (!value) return;
    // Open iOS notification settings so user can enable system-level permission
    Alert.alert(
      '🔔 Meldingen',
      'Zorg dat meldingen zijn ingeschakeld in je iPhone Instellingen voor AMOS.',
      [
        { text: 'Open Instellingen', onPress: () => Linking.openURL('app-settings:') },
        { text: 'Later', style: 'cancel' },
      ],
    );
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      // Authenticate first before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Bevestig je identiteit om biometrische login in te schakelen',
        fallbackLabel: 'Gebruik wachtwoord',
        cancelLabel: 'Annuleren',
      });
      if (!result.success) {
        Alert.alert('Authenticatie mislukt', 'Biometrische login niet ingeschakeld.');
        return;
      }
    }
    setBiometricEnabled(value);
    await AsyncStorage.setItem(BIOMETRIC_KEY, value ? 'true' : 'false');
  };

  const handleBrandKit = () => {
    navigation.navigate('BrandKit' as any);
  };

  const handlePushNotifications = async () => {
    // Open the app's specific settings page in iOS Settings so the user
    // can enable / disable notifications and other per-app permissions.
    const canOpen = await Linking.canOpenURL('app-settings:');
    if (canOpen) {
      Alert.alert(
        '🔔 Push Notificaties',
        'Beheer push-notificaties voor AMOS in iPhone Instellingen → Meldingen.',
        [
          { text: 'Open Instellingen', onPress: () => Linking.openURL('app-settings:') },
          { text: 'Sluiten', style: 'cancel' },
        ],
      );
    } else {
      Alert.alert(
        '🔔 Push Notificaties',
        'Ga naar Instellingen → AMOS → Meldingen om push-notificaties in te schakelen.',
        [{ text: 'OK' }],
      );
    }
  };

  const handleDataExport = async () => {
    setExportLoading(true);
    try {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // Fetch all user data in parallel
      const [eventsRes, capturesRes, postsRes, brandKitsRes] = await Promise.all([
        supabase.from('go_events').select('*').eq('user_id', user.id),
        supabase.from('go_captures').select('*').eq('user_id', user.id),
        supabase.from('go_posts').select('*').eq('user_id', user.id),
        supabase.from('brand_kits').select('id, name, is_active').eq('user_id', user.id),
      ]);

      // Log any query errors (non-fatal: still export what we have)
      if (eventsRes.error)   console.warn('Export events error:', eventsRes.error.message);
      if (capturesRes.error) console.warn('Export captures error:', capturesRes.error.message);
      if (postsRes.error)    console.warn('Export posts error:', postsRes.error.message);

      const exportData = {
        exported_at: new Date().toISOString(),
        app_version: '1.0.0 (Build 31)',
        user_email:  user.email,
        brand_kits:  brandKitsRes.data  || [],
        events:      eventsRes.data     || [],
        captures:    capturesRes.data   || [],
        posts:       postsRes.data      || [],
      };

      const json = JSON.stringify(exportData, null, 2);
      const summary =
        `✅ Export klaar\n\n` +
        `• ${exportData.events.length} event(s)\n` +
        `• ${exportData.captures.length} capture(s)\n` +
        `• ${exportData.posts.length} post(s)\n` +
        `• ${exportData.brand_kits.length} brand kit(s)`;

      const result = await Share.share({
        message: json,
        title: `AMOS export — ${new Date().toLocaleDateString('nl-NL')}`,
      });

      if (result.action !== Share.dismissedAction) {
        Alert.alert('Export', summary);
      }
    } catch (err: any) {
      Alert.alert('Fout bij export', err?.message ?? 'Onbekende fout. Probeer opnieuw.');
    } finally {
      setExportLoading(false);
    }
  };

  // Connect social media via backend API (OAuth handled server-side)
  const handleConnectSocial = async (platformKey: string) => {
    const pf = SOCIAL_PLATFORMS.find(p => p.key === platformKey);
    const label = pf?.label ?? platformKey;

    // Check if platform is supported
    if (!pf?.supported) {
      Alert.alert(t.common?.comingSoon ?? 'Binnenkort beschikbaar', `${label} wordt binnenkort ondersteund.`);
      return;
    }

    // Check if already connected
    const alreadyConnected = (socialAccounts as any[]).some(
      (a: any) => a.platform === platformKey && a.is_active,
    );
    if (alreadyConnected) {
      Alert.alert('Verbonden', `${label} is al verbonden.`);
      return;
    }

    // Open OAuth flow via backend
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      Alert.alert('Error', 'Je bent niet ingelogd.');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/social-auth/connect/${platformKey}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.authorization_url) {
        await Linking.openURL(json.authorization_url);
      } else if (json.detail) {
        Alert.alert('Error', json.detail);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Verbinding mislukt.');
    }
  };

  const handleOpenMediaPermissions = async () => {
    const canOpen = await Linking.canOpenURL('app-settings:');
    if (canOpen) {
      Linking.openURL('app-settings:');
    } else {
      Alert.alert(
        'Toestemmingen',
        'Open Instellingen → Privacy & Beveiliging → Foto\'s om AMOS toegang te geven tot je fotobibliotheek.',
        [{ text: 'OK' }],
      );
    }
  };

  // ── Row Component ────────────────────────────────────────────────────────
  const themeLabel = scheme === 'light' ? 'Licht ☀️' : scheme === 'dark' ? 'Donker 🌙' : 'Systeem ⚙️';

  const SettingsRow = ({
    icon, iconColor = colors.text, label, value, onPress, showChevron = true, rightElement,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.rowIconWrap, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {rightElement ?? (showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      ) : null)}
    </TouchableOpacity>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Account ───────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t.settings.account}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="person-outline"
            iconColor={colors.primary}
            label={t.settings.loggedInAs}
            value={email ?? t.common.loading}
            showChevron={false}
          />
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.rowIconWrap, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.error }]}>{t.settings.logout}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* ── Voorkeuren ────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t.settings.preferences}</Text>
        <View style={styles.card}>
          {/* Photo library & camera access shortcuts */}
          <SettingsRow
            icon="images-outline"
            iconColor="#E4405F"
            label="Fotobibliotheek toegang"
            value="Open Instellingen → AMOS → Foto's"
            onPress={handleOpenMediaPermissions}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="camera-outline"
            iconColor="#0077B5"
            label="Camera toegang"
            value="Open Instellingen → AMOS → Camera"
            onPress={() => Linking.openURL('app-settings:')}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="notifications-outline"
            iconColor={colors.info}
            label={t.settings.notificationsLabel}
            showChevron={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
          {biometricAvailable && (
            <>
              <View style={styles.separator} />
              <SettingsRow
                icon="finger-print-outline"
                iconColor={colors.secondary}
                label={t.settings.biometricLogin}
                showChevron={false}
                rightElement={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleToggleBiometric}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={biometricEnabled ? colors.primary : colors.textTertiary}
                  />
                }
              />
            </>
          )}
          <View style={styles.separator} />
          <SettingsRow
            icon="moon-outline"
            iconColor="#8B5CF6"
            label="Weergave / Thema"
            value={themeLabel}
            onPress={handleThemeSwitch}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="language-outline"
            iconColor={colors.accent}
            label={t.settings.language}
            value={LOCALE_LABELS[locale]}
            onPress={handleLanguageSwitch}
          />
        </View>

        {/* ── My Location ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t.regionScanner?.myLocation ?? 'Mijn locatie'}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="location-outline"
            iconColor={colors.primary}
            label={t.regionScanner?.currentLocation ?? 'Huidige locatie'}
            value={savedLocation ? formatRegion(savedLocation, 'short') : (t.regionScanner?.noLocationAvailable ?? 'Geen locatie beschikbaar')}
            onPress={handleDetectLocation}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="navigate-outline"
            iconColor={colors.success}
            label={t.regionScanner?.autoDetect ?? 'Auto-detectie'}
            onPress={handleDetectLocation}
            rightElement={
              gpsLocation.loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : undefined
            }
          />
          {savedLocation && (
            <>
              <View style={styles.separator} />
              <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary }}>
                  {formatRegion(savedLocation, 'full')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── App ───────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t.settings.app}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="color-palette-outline"
            iconColor={colors.primary}
            label={t.settings.brandKitManage}
            onPress={() => navigation.navigate('BrandKit')}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="notifications-circle-outline"
            iconColor={colors.info}
            label={t.settings.pushNotifications}
            value="iPhone Instellingen"
            onPress={handlePushNotifications}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="download-outline"
            iconColor={colors.success}
            label={t.settings.dataExport}
            value={exportLoading ? 'Exporteren...' : 'Events, captures & posts'}
            onPress={exportLoading ? undefined : handleDataExport}
          />
        </View>

        {/* ── Social Media ──────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Social Media</Text>
        <View style={styles.card}>
          {SOCIAL_PLATFORMS.map((platform, index) => {
            const isConnected = (socialAccounts as any[]).some(
              (a: any) => a.platform === platform.key && a.is_active,
            );
            return (
              <React.Fragment key={platform.key}>
                {index > 0 && <View style={styles.separator} />}
                <View style={styles.row}>
                  <View style={[styles.rowIconWrap, { backgroundColor: platform.color + '18' }]}>
                    <Ionicons name={platform.icon as any} size={20} color={platform.color} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>{platform.label}</Text>
                    {isConnected && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
                        <Text style={{ fontSize: fontSize.xs, color: colors.success }}>Verbonden</Text>
                      </View>
                    )}
                    {!platform.supported && !isConnected && (
                      <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 }}>Binnenkort</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleConnectSocial(platform.key)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      backgroundColor: isConnected ? colors.success + '12' : colors.error + '12',
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
                    }}
                  >
                    <Ionicons
                      name={isConnected ? 'checkmark-circle-outline' : 'link-outline'}
                      size={14}
                      color={isConnected ? colors.success : colors.error}
                    />
                    <Text style={{
                      fontSize: fontSize.xs, fontWeight: fontWeight.semibold,
                      color: isConnected ? colors.success : colors.error,
                    }}>
                      {isConnected ? 'Verbonden' : 'Verbinden'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            );
          })}
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={() => refetchSocial()} activeOpacity={0.7}>
            <View style={[styles.rowIconWrap, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="refresh-outline" size={20} color={colors.info} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Status vernieuwen</Text>
              <Text style={styles.rowValue}>Laad verbindingen opnieuw</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Demo ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t.settings.demo ?? 'DEMO'}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="sparkles-outline"
            iconColor={colors.accent}
            label={t.settings.demoEnvironment ?? 'Demo Omgeving'}
            value={t.settings.demoEnvironmentDesc ?? 'Genereer demo-events'}
            onPress={() => navigation.navigate('DemoEnvironment')}
          />
        </View>

        {/* ── Over ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t.settings.about}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="information-circle-outline"
            iconColor={colors.textSecondary}
            label={t.settings.appVersion}
            value="1.0.0 (Build 32)"
            showChevron={false}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="globe-outline"
            iconColor={colors.primary}
            label="inclufy.com"
            value="Open web dashboard"
            onPress={() => Linking.openURL('https://inclufy.com')}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
