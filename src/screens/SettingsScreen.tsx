import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
  Modal,
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
  { key: 'tiktok',    label: 'TikTok',      icon: 'musical-notes'  as keyof typeof Ionicons.glyphMap, color: '#000000', supported: true },
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

  // ─── QR Card Profile ──────────────────────────────────────────────
  const [qrProfile, setQrProfile] = useState({
    full_name: '', email: '', phone: '', company: '', title: '', website: '',
    linkedin: '', instagram: '', twitter: '', facebook: '', whatsapp: '',
  });
  const [qrFields, setQrFields] = useState<Record<string, boolean>>({
    share_email: true, share_phone: true, share_company: true, share_title: true,
    share_website: true, share_linkedin: true, share_instagram: true,
    share_twitter: true, share_facebook: true, share_whatsapp: true,
  });
  const [showQrEditor, setShowQrEditor] = useState(false);
  const [qrSaving, setQrSaving] = useState(false);

  const loadQrProfile = useCallback(async () => {
    try {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, email, phone, company, title, website, linkedin, instagram, twitter, facebook, whatsapp, qr_fields')
        .eq('id', user.id)
        .maybeSingle();
      if (p) {
        setQrProfile({
          full_name: p.full_name ?? '', email: p.email ?? user.email ?? '',
          phone: p.phone ?? '', company: p.company ?? '', title: p.title ?? '',
          website: p.website ?? '', linkedin: p.linkedin ?? '', instagram: p.instagram ?? '',
          twitter: p.twitter ?? '', facebook: p.facebook ?? '', whatsapp: p.whatsapp ?? '',
        });
        if (p.qr_fields && typeof p.qr_fields === 'object') {
          setQrFields(prev => ({ ...prev, ...(p.qr_fields as Record<string, boolean>) }));
        }
      } else {
        // No profile row yet — use auth email
        setQrProfile(prev => ({ ...prev, email: user.email ?? '' }));
      }
    } catch {}
  }, []);

  useEffect(() => { loadQrProfile(); }, [loadQrProfile]);

  const handleSaveQrProfile = async () => {
    setQrSaving(true);
    try {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const profileData = {
        full_name: qrProfile.full_name,
        email: qrProfile.email,
        phone: qrProfile.phone,
        company: qrProfile.company,
        title: qrProfile.title,
        website: qrProfile.website,
        linkedin: qrProfile.linkedin,
        instagram: qrProfile.instagram,
        twitter: qrProfile.twitter,
        facebook: qrProfile.facebook,
        whatsapp: qrProfile.whatsapp,
        qr_fields: qrFields,
      };

      // Try update first (existing profile row)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing row
        ({ error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id));
      } else {
        // Insert new row
        ({ error } = await supabase
          .from('profiles')
          .insert({ id: user.id, ...profileData }));
      }

      if (error) throw error;
      setShowQrEditor(false);
      Alert.alert('✅ Opgeslagen', 'Je QR-kaart profiel is bijgewerkt.');
    } catch (err: any) {
      Alert.alert('Fout', err?.message ?? 'Kon profiel niet opslaan.');
    } finally {
      setQrSaving(false);
    }
  };

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
        .select('id, platform, account_name, platform_account_id, status, profile_image_url');
      return (data || []) as Array<{
        id: string;
        platform: string;
        account_name: string | null;
        platform_account_id: string | null;
        status: string;
        profile_image_url: string | null;
        is_active?: boolean;
      }>;
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

  // Connect social media via OAuth (direct URL → Supabase edge function callback)
  const handleConnectSocial = async (platformKey: string) => {
    const pf = SOCIAL_PLATFORMS.find(p => p.key === platformKey);
    const label = pf?.label ?? platformKey;

    if (!pf?.supported) {
      Alert.alert(t.common?.comingSoon ?? 'Binnenkort beschikbaar', `${label} wordt binnenkort ondersteund.`);
      return;
    }

    const alreadyConnected = (socialAccounts as any[]).some(
      (a: any) => a.platform === platformKey && (a.is_active || a.status === 'active'),
    );
    if (alreadyConnected) {
      Alert.alert('Verbonden', `${label} is al verbonden.`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'Je bent niet ingelogd.');
      return;
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mpxkugfqzmxydxnlxqoj.supabase.co';
    const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
    const state = `${user.id}:${user.id}:${platformKey}`;

    let authUrl = '';

    if (platformKey === 'linkedin') {
      const clientId = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '789493c65q6j5e';
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid profile email w_member_social',
        state,
      });
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
    } else if (platformKey === 'facebook' || platformKey === 'instagram') {
      const metaAppId = process.env.EXPO_PUBLIC_META_APP_ID;
      if (!metaAppId) {
        Alert.alert(
          `${label} koppeling`,
          `Om ${label} te verbinden heb je een Meta (Facebook) App ID nodig.\n\nGa naar developers.facebook.com om een app aan te maken en voeg EXPO_PUBLIC_META_APP_ID toe aan je .env bestand.`,
          [{ text: 'Begrepen' }],
        );
        return;
      }
      const scope = platformKey === 'instagram'
        ? 'instagram_basic,instagram_content_publish,pages_show_list'
        : 'pages_show_list,pages_read_engagement,pages_manage_posts';
      const params = new URLSearchParams({
        client_id: metaAppId,
        redirect_uri: redirectUri,
        scope,
        response_type: 'code',
        state,
      });
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
    } else if (platformKey === 'tiktok') {
      const tiktokClientKey = process.env.EXPO_PUBLIC_TIKTOK_CLIENT_KEY;
      if (!tiktokClientKey) {
        Alert.alert(
          'TikTok koppeling',
          'Om TikTok te verbinden heb je een TikTok Client Key nodig.\n\nVoeg EXPO_PUBLIC_TIKTOK_CLIENT_KEY toe aan je .env bestand.',
          [{ text: 'Begrepen' }],
        );
        return;
      }
      const params = new URLSearchParams({
        client_key: tiktokClientKey,
        redirect_uri: redirectUri,
        scope: 'user.info.basic,video.publish,video.list',
        response_type: 'code',
        state,
      });
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params}`;
    }

    if (authUrl) {
      try {
        await Linking.openURL(authUrl);
      } catch (err: any) {
        Alert.alert('Error', err?.message ?? 'Kon de browser niet openen.');
      }
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

        {/* ── Mijn QR-kaart ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Mijn QR-kaart</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="qr-code-outline"
            iconColor={colors.primary}
            label="Profiel bewerken"
            value={qrProfile.full_name || 'Vul je gegevens in'}
            onPress={() => setShowQrEditor(true)}
          />
          <View style={styles.separator} />
          <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary }}>
              Deze gegevens worden gedeeld via je QR-code en digitale visitekaart.
            </Text>
          </View>
        </View>

        {/* QR Profile Editor Modal */}
        <Modal visible={showQrEditor} animationType="slide" presentationStyle="pageSheet">
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
              <TouchableOpacity onPress={() => setShowQrEditor(false)}>
                <Text style={{ fontSize: fontSize.md, color: colors.textSecondary }}>Annuleren</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text }}>QR Profiel</Text>
              <TouchableOpacity onPress={handleSaveQrProfile} disabled={qrSaving}>
                {qrSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary }}>Opslaan</Text>
                )}
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
              {/* Contact fields */}
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>Contactgegevens</Text>
              <View style={{ backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg }}>
                {[
                  { key: 'full_name', label: 'Volledige naam', placeholder: 'Jan Jansen', icon: 'person-outline' },
                  { key: 'email', label: 'E-mail', placeholder: 'jan@bedrijf.nl', icon: 'mail-outline' },
                  { key: 'phone', label: 'Telefoon', placeholder: '+31 6 12345678', icon: 'call-outline' },
                  { key: 'company', label: 'Bedrijf', placeholder: 'Inclufy', icon: 'business-outline' },
                  { key: 'title', label: 'Functie', placeholder: 'Marketing Manager', icon: 'briefcase-outline' },
                  { key: 'website', label: 'Website', placeholder: 'https://inclufy.com', icon: 'globe-outline' },
                ].map((field, i) => (
                  <View key={field.key} style={{ marginBottom: i < 5 ? spacing.sm : 0 }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: 4 }}>{field.label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm }}>
                      <Ionicons name={field.icon as any} size={16} color={colors.textTertiary} />
                      <TextInput
                        style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: fontSize.sm, color: colors.text }}
                        value={(qrProfile as any)[field.key]}
                        onChangeText={(v) => setQrProfile(p => ({ ...p, [field.key]: v }))}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize={field.key === 'email' || field.key === 'website' ? 'none' : 'words'}
                        keyboardType={field.key === 'email' ? 'email-address' : field.key === 'phone' ? 'phone-pad' : field.key === 'website' ? 'url' : 'default'}
                      />
                    </View>
                  </View>
                ))}
              </View>

              {/* Social Media */}
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>Social Media</Text>
              <View style={{ backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg }}>
                {[
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/janjansen', icon: 'logo-linkedin', color: '#0077B5' },
                  { key: 'instagram', label: 'Instagram', placeholder: '@janjansen', icon: 'logo-instagram', color: '#E4405F' },
                  { key: 'twitter', label: 'X / Twitter', placeholder: '@janjansen', icon: 'logo-twitter', color: '#1DA1F2' },
                  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/janjansen', icon: 'logo-facebook', color: '#1877F2' },
                  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+31 6 12345678', icon: 'logo-whatsapp', color: '#25D366' },
                ].map((field, i) => (
                  <View key={field.key} style={{ marginBottom: i < 4 ? spacing.sm : 0 }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: 4 }}>{field.label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm }}>
                      <Ionicons name={field.icon as any} size={16} color={field.color} />
                      <TextInput
                        style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: fontSize.sm, color: colors.text }}
                        value={(qrProfile as any)[field.key]}
                        onChangeText={(v) => setQrProfile(p => ({ ...p, [field.key]: v }))}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                ))}
              </View>

              {/* Sharing toggles */}
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>Delen via QR-code</Text>
              <View style={{ backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.lg }}>
                {[
                  { key: 'share_email', label: 'E-mail' },
                  { key: 'share_phone', label: 'Telefoon' },
                  { key: 'share_company', label: 'Bedrijf' },
                  { key: 'share_title', label: 'Functie' },
                  { key: 'share_website', label: 'Website' },
                  { key: 'share_linkedin', label: 'LinkedIn' },
                  { key: 'share_instagram', label: 'Instagram' },
                  { key: 'share_twitter', label: 'X / Twitter' },
                  { key: 'share_facebook', label: 'Facebook' },
                  { key: 'share_whatsapp', label: 'WhatsApp' },
                ].map((toggle, i, arr) => (
                  <React.Fragment key={toggle.key}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12 }}>
                      <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{toggle.label}</Text>
                      <Switch
                        value={qrFields[toggle.key] !== false}
                        onValueChange={(v) => setQrFields(prev => ({ ...prev, [toggle.key]: v }))}
                        trackColor={{ false: colors.border, true: colors.primaryLight }}
                        thumbColor={qrFields[toggle.key] !== false ? colors.primary : colors.textTertiary}
                      />
                    </View>
                    {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: colors.borderLight, marginLeft: spacing.md }} />}
                  </React.Fragment>
                ))}
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Modal>

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
            const connectedAccount = (socialAccounts as any[]).find(
              (a: any) => a.platform === platform.key && (a.status === 'active' || a.is_active),
            );
            const isConnected = !!connectedAccount;
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
                        <Text style={{ fontSize: fontSize.xs, color: colors.success }}>
                          {connectedAccount?.account_name ? `Verbonden als ${connectedAccount.account_name}` : 'Verbonden'}
                        </Text>
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
