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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
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
  { key: 'linkedin',  label: 'LinkedIn',    icon: 'logo-linkedin',  color: '#0077B5', appScheme: 'linkedin://' },
  { key: 'instagram', label: 'Instagram',   icon: 'logo-instagram', color: '#E4405F', appScheme: 'instagram://' },
  { key: 'x',         label: 'X / Twitter', icon: 'logo-twitter',   color: '#1a1a1a', appScheme: 'twitter://' },
  { key: 'facebook',  label: 'Facebook',    icon: 'logo-facebook',  color: '#1877F2', appScheme: 'fb://' },
  { key: 'tiktok',    label: 'TikTok',      icon: 'musical-notes',  color: '#010101', appScheme: 'snssdk1233://' },
  { key: 'snapchat',  label: 'Snapchat',    icon: 'camera',         color: '#FFFC00', appScheme: 'snapchat://' },
] as const;

// ─── PKCE helpers — pure JS, no crypto.subtle dependency ────────────────────
function randomStr(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
async function generatePKCE(): Promise<{ verifier: string; challenge: string; method: string }> {
  const verifier = randomStr(64);
  try {
    // Try crypto.subtle (React Native 0.73+ / Hermes)
    const enc     = new TextEncoder();
    const digest  = await (globalThis as any).crypto.subtle.digest('SHA-256', enc.encode(verifier));
    const bytes   = new Uint8Array(digest);
    let raw = '';
    bytes.forEach(b => { raw += String.fromCharCode(b); });
    const challenge = btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return { verifier, challenge, method: 'S256' };
  } catch {
    // Fallback: plain PKCE (challenge === verifier). Supported by LinkedIn & X.
    return { verifier, challenge: verifier, method: 'plain' };
  }
}

// ─── OAuth config per platform ───────────────────────────────────────────────
const OAUTH_CONFIG: Record<string, {
  authUrl:      string;
  tokenUrl:     string;
  scope:        string;
  clientId:     string;
  clientSecret: string;
}> = {
  linkedin: {
    authUrl:      'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl:     'https://www.linkedin.com/oauth/v2/accessToken',
    scope:        'openid profile email w_member_social',
    clientId:     process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID ?? '',
    clientSecret: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET ?? '',
  },
  instagram: {
    authUrl:      'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl:     'https://graph.facebook.com/v18.0/oauth/access_token',
    scope:        'pages_manage_posts,instagram_basic,instagram_content_publish',
    clientId:     process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
    clientSecret: process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET ?? '',
  },
  facebook: {
    authUrl:      'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl:     'https://graph.facebook.com/v18.0/oauth/access_token',
    scope:        'pages_manage_posts,pages_read_engagement',
    clientId:     process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
    clientSecret: process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET ?? '',
  },
  x: {
    authUrl:      'https://twitter.com/i/oauth2/authorize',
    tokenUrl:     'https://api.twitter.com/2/oauth2/token',
    scope:        'tweet.read tweet.write users.read offline.access',
    clientId:     process.env.EXPO_PUBLIC_X_CLIENT_ID ?? '',
    clientSecret: process.env.EXPO_PUBLIC_X_CLIENT_SECRET ?? '',
  },
  tiktok: {
    authUrl:      'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl:     'https://open.tiktokapis.com/v2/oauth/token/',
    scope:        'user.info.basic,video.publish,video.upload',
    clientId:     process.env.EXPO_PUBLIC_TIKTOK_CLIENT_ID ?? '',
    clientSecret: process.env.EXPO_PUBLIC_TIKTOK_CLIENT_SECRET ?? '',
  },
  snapchat: {
    authUrl:      'https://accounts.snapchat.com/login/oauth2/authorize',
    tokenUrl:     'https://accounts.snapchat.com/login/oauth2/access_token',
    scope:        'snapchat-marketing-api',
    clientId:     process.env.EXPO_PUBLIC_SNAPCHAT_CLIENT_ID ?? '',
    clientSecret: process.env.EXPO_PUBLIC_SNAPCHAT_CLIENT_SECRET ?? '',
  },
};

const ACCOUNT_TYPES = [
  { key: 'personal',     label: 'Persoonlijk',      icon: 'person-outline' },
  { key: 'business',     label: 'Zakelijk',         icon: 'briefcase-outline' },
  { key: 'company_page', label: 'Bedrijfspagina',   icon: 'business-outline' },
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
  // Social connect modal state
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [appInstalled, setAppInstalled]           = useState<Record<string, boolean>>({});
  // 'choose' | 'token' | 'oauth' — which step of the connect flow
  const [connectStep, setConnectStep]             = useState<'choose' | 'token' | 'oauth'>('choose');
  const [tokenInput, setTokenInput]               = useState('');
  const [tokenAccountType, setTokenAccountType]   = useState<string>('personal');
  const [savingToken, setSavingToken]             = useState(false);

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

  // Detect which social apps are installed on this device
  useEffect(() => {
    const check = async () => {
      const results: Record<string, boolean> = {};
      for (const p of SOCIAL_PLATFORMS) {
        try { results[p.key] = await Linking.canOpenURL(p.appScheme); }
        catch { results[p.key] = false; }
      }
      setAppInstalled(results);
    };
    check();
  }, []);

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

  // Opens the account-type picker sheet, then proceeds to connect flow
  const handleConnectSocial = (platform: string) => {
    setConnectStep('choose');
    setTokenInput('');
    setTokenAccountType('personal');
    setConnectingPlatform(platform);
  };

  // Save API access token directly to Supabase social_accounts table
  const handleSaveToken = async () => {
    if (!connectingPlatform || !tokenInput.trim()) return;
    setSavingToken(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error('Niet ingelogd');

      const pf = SOCIAL_PLATFORMS.find(p => p.key === connectingPlatform);
      const { error } = await supabase.from('social_accounts').upsert({
        user_id:             user.id,
        platform:            connectingPlatform,
        account_type:        tokenAccountType,
        platform_account_id: `${connectingPlatform}_${user.id}`,
        access_token:        tokenInput.trim(),
        is_active:           true,
        display_name:        pf?.label ?? connectingPlatform,
        connected_at:        new Date().toISOString(),
      }, { onConflict: 'user_id,platform,account_type' });

      if (error) throw error;

      await refetchSocial();
      setConnectingPlatform(null);
      setTokenInput('');
      Alert.alert('✅ Verbonden', `${pf?.label ?? connectingPlatform} succesvol gekoppeld met jouw token.`);
    } catch (err: any) {
      Alert.alert('Fout', err?.message ?? 'Opslaan mislukt. Controleer je token.');
    } finally {
      setSavingToken(false);
    }
  };

  const doOAuth = async (platform: string, accountType: string) => {
    const pf    = SOCIAL_PLATFORMS.find(p => p.key === platform);
    const label = pf?.label ?? platform;
    const cfg   = OAUTH_CONFIG[platform];
    // Supabase Edge Function as OAuth redirect proxy.
    // Platforms require HTTPS redirect URIs — the Edge Function receives
    // the callback and redirects to inclufy-go://oauth/callback so the app
    // intercepts it via openAuthSessionAsync (custom scheme ✓).
    // Register this URL in every platform's developer portal.
    const redirectUri = 'https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/oauth-callback';

    if (!cfg?.clientId) {
      // Close modal first so it doesn't look stuck
      setConnectingPlatform(null);
      setConnectStep('choose');
      setTimeout(() => {
        Alert.alert(
          `${label} app-koppeling`,
          `Verbinden via ${label} vereist een eenmalige app-registratie door Inclufy.\n\n` +
          `Gebruik voorlopig de "API Token invoeren" optie — plak je access token uit de ${label} Developer Portal.`,
          [{ text: 'Begrepen' }],
        );
      }, 300);
      return;
    }

    try {
      // ── PKCE: generate verifier + challenge ──────────────────────────────
      // Note: Hermes (React Native) does not support crypto.subtle, so PKCE
      // falls back to 'plain'. Most platforms (LinkedIn, Meta) only accept S256.
      // For confidential apps (those with a client_secret), PKCE is optional —
      // we skip it entirely when S256 is unavailable to avoid rejections.
      const { verifier, challenge, method } = await generatePKCE();
      const usePKCE = method === 'S256';
      const state = randomStr(24);

      const baseParams: Record<string, string> = {
        response_type: 'code',
        client_id:     cfg.clientId,
        redirect_uri:  redirectUri,
        scope:         cfg.scope,
        state,
      };
      if (usePKCE) {
        baseParams.code_challenge        = challenge;
        baseParams.code_challenge_method = method;
      }
      const params = new URLSearchParams(baseParams);
      const oauthUrl = `${cfg.authUrl}?${params.toString()}`;

      // ── Open platform's own login / consent screen ───────────────────────
      // The Supabase Edge Function (redirectUri) receives the HTTPS callback
      // and redirects to inclufy-go://oauth/callback. We pass the custom
      // scheme as the intercept URL so ASWebAuthenticationSession catches it.
      const result = await WebBrowser.openAuthSessionAsync(oauthUrl, 'inclufy-go://oauth/callback', {
        preferEphemeralSession: false, // keep session so user stays logged in
      });

      if (result.type !== 'success' || !result.url) return; // user cancelled

      // Parse redirect URL manually (avoids URL constructor issues in some RN versions)
      const queryStr = result.url.split('?')[1] ?? '';
      const qp: Record<string, string> = {};
      queryStr.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) qp[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
      });
      const code     = qp['code'];
      const retState = qp['state'];

      if (!code || retState !== state) {
        Alert.alert('Koppeling mislukt', 'Ongeldige autorisatie. Probeer opnieuw.');
        return;
      }

      // ── Exchange code + PKCE verifier directly with the platform ─────────
      const tokenParams: Record<string, string> = {
        grant_type:   'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id:    cfg.clientId,
      };
      // Only include code_verifier if PKCE (S256) was used in the auth request
      if (usePKCE) tokenParams.code_verifier = verifier;
      // LinkedIn and other confidential apps require client_secret in token exchange
      if (cfg.clientSecret) tokenParams.client_secret = cfg.clientSecret;
      const body = new URLSearchParams(tokenParams);

      const tokenRes = await fetch(cfg.tokenUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
      });
      const tokenData = await tokenRes.json();

      if (!tokenData?.access_token) {
        const errMsg = tokenData?.error_description ?? tokenData?.message ?? 'Token ophalen mislukt';
        Alert.alert('Verbinding mislukt', errMsg);
        return;
      }

      // ── Fetch display name + platform account ID ──────────────────────────
      let displayName = label;
      let platformAccountId: string | null = null;
      try {
        if (platform === 'linkedin') {
          const me = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          }).then(r => r.json());
          displayName       = me.name ?? me.email ?? label;
          platformAccountId = me.sub ?? null;
        } else if (platform === 'instagram' || platform === 'facebook') {
          const me = await fetch('https://graph.facebook.com/me?fields=id,name', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          }).then(r => r.json());
          displayName       = me.name ?? label;
          platformAccountId = me.id ?? null;
        } else if (platform === 'tiktok') {
          const me = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          }).then(r => r.json());
          displayName       = me.data?.user?.display_name ?? label;
          platformAccountId = me.data?.user?.open_id ?? null;
        } else if (platform === 'x') {
          const me = await fetch('https://api.twitter.com/2/users/me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          }).then(r => r.json());
          displayName       = me.data?.name ?? me.data?.username ?? label;
          platformAccountId = me.data?.id ?? null;
        }
      } catch { /* display name / id is optional */ }

      // ── Store token in Supabase ───────────────────────────────────────────
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) { Alert.alert('Fout', 'Niet ingelogd.'); return; }

      const { error: upsertErr } = await supabase.from('social_accounts').upsert({
        user_id:             user.id,
        platform,
        account_type:        accountType,
        platform_account_id: platformAccountId ?? `${platform}_${user.id}`,
        access_token:        tokenData.access_token,
        refresh_token:       tokenData.refresh_token ?? null,
        is_active:           true,
        display_name:        displayName,
        connected_at:        new Date().toISOString(),
      }, { onConflict: 'user_id,platform,account_type' });

      if (upsertErr) throw upsertErr;

      await refetchSocial();
      setConnectingPlatform(null);
      const typeLabel = ACCOUNT_TYPES.find(t => t.key === accountType)?.label ?? accountType;
      Alert.alert('✅ Verbonden', `${label} (${typeLabel}) is succesvol verbonden met AMOS.`);

    } catch (err: any) {
      Alert.alert('Fout', err?.message ?? 'OAuth verbinding mislukt.');
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
            // All accounts connected for this platform (supports multiple)
            const accounts = socialAccounts.filter((a) => a.platform === platform.key && a.is_active);
            const isInstalled = appInstalled[platform.key];
            return (
              <React.Fragment key={platform.key}>
                {index > 0 && <View style={styles.separator} />}
                {/* Platform header row */}
                <View style={[styles.row, { paddingBottom: accounts.length > 0 ? 6 : undefined }]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: platform.color + '18' }]}>
                    <Ionicons name={platform.icon as any} size={20} color={platform.color} />
                  </View>
                  <View style={[styles.rowContent, { flex: 1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.rowLabel}>{platform.label}</Text>
                      {/* "App geïnstalleerd" badge */}
                      {isInstalled && (
                        <View style={{ backgroundColor: platform.color + '18', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 9, color: platform.color, fontWeight: fontWeight.semibold }}>App ✓</Text>
                        </View>
                      )}
                    </View>
                    {/* Connected accounts list */}
                    {accounts.map((acc) => {
                      const typeLabel = ACCOUNT_TYPES.find(t => t.key === acc.account_type)?.label;
                      return (
                        <View key={acc.id ?? acc.platform_username} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
                          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                            {acc.platform_username ? `@${acc.platform_username}` : 'Verbonden'}
                            {typeLabel ? ` · ${typeLabel}` : ''}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  {/* Connect / Add button */}
                  <TouchableOpacity
                    onPress={() => handleConnectSocial(platform.key)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      backgroundColor: accounts.length > 0 ? platform.color + '12' : colors.error + '12',
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
                    }}
                  >
                    <Ionicons
                      name={accounts.length > 0 ? 'add-circle-outline' : 'link-outline'}
                      size={14}
                      color={accounts.length > 0 ? platform.color : colors.error}
                    />
                    <Text style={{
                      fontSize: fontSize.xs, fontWeight: fontWeight.semibold,
                      color: accounts.length > 0 ? platform.color : colors.error,
                    }}>
                      {accounts.length > 0 ? 'Account toev.' : 'Verbinden'}
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

        {/* ── Social Connect Modal (multi-step) ──────────────────────── */}
        <Modal
          visible={!!connectingPlatform}
          transparent
          animationType="slide"
          onRequestClose={() => setConnectingPlatform(null)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
            activeOpacity={1}
            onPress={() => setConnectingPlatform(null)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: 24, paddingBottom: 48,
              }}
            >
              {connectingPlatform && (() => {
                const pf = SOCIAL_PLATFORMS.find(p => p.key === connectingPlatform)!;
                const pfColor = pf?.color ?? colors.primary;

                return (
                  <>
                    {/* ── Header ── */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {connectStep !== 'choose' && (
                          <TouchableOpacity onPress={() => setConnectStep('choose')} style={{ marginRight: 2 }}>
                            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                          </TouchableOpacity>
                        )}
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: pfColor + '18', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name={pf?.icon as any} size={18} color={pfColor} />
                        </View>
                        <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text }}>
                          {pf?.label ?? connectingPlatform} koppelen
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setConnectingPlatform(null)}>
                        <Ionicons name="close" size={22} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    {/* ── Step: choose method ── */}
                    {connectStep === 'choose' && (
                      <View style={{ gap: 12 }}>
                        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 4 }}>
                          Kies hoe je jouw {pf?.label} account wilt koppelen:
                        </Text>

                        {/* Option 1 — API Token */}
                        <TouchableOpacity
                          onPress={() => setConnectStep('token')}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 14,
                            backgroundColor: colors.background, borderRadius: 16,
                            paddingVertical: 16, paddingHorizontal: 16,
                            borderWidth: 1.5, borderColor: pfColor + '50',
                          }}
                        >
                          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: pfColor + '15', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="key-outline" size={22} color={pfColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text }}>
                              API Token invoeren
                            </Text>
                            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 3, lineHeight: 16 }}>
                              Plak je access token uit {pf?.label} Developer Portal. Direct en betrouwbaar.
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>

                        {/* Option 2 — OAuth via platform */}
                        <TouchableOpacity
                          onPress={() => {
                            doOAuth(connectingPlatform, tokenAccountType).catch((e: any) => {
                              Alert.alert('Fout', e?.message ?? 'Verbinding mislukt.');
                            });
                          }}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 14,
                            backgroundColor: colors.background, borderRadius: 16,
                            paddingVertical: 16, paddingHorizontal: 16,
                            borderWidth: 1.5, borderColor: pfColor + '30',
                          }}
                        >
                          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: pfColor + '15', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name={pf?.icon as any} size={22} color={pfColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text }}>
                              Inloggen via {pf?.label}
                            </Text>
                            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 3, lineHeight: 16 }}>
                              {pf?.label} opent — log in met je eigen account en tik "Toestaan".
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>

                        {/* Token help link */}
                        <TouchableOpacity
                          onPress={() => {
                            const helpUrls: Record<string, string> = {
                              linkedin:  'https://www.linkedin.com/developers/apps',
                              instagram: 'https://developers.facebook.com/apps',
                              x:         'https://developer.twitter.com/en/portal/dashboard',
                              facebook:  'https://developers.facebook.com/apps',
                            };
                            Linking.openURL(helpUrls[connectingPlatform] ?? 'https://inclufy.com').catch(() => {});
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 4 }}
                        >
                          <Ionicons name="help-circle-outline" size={15} color={colors.textSecondary} />
                          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                            Waar vind ik mijn API token?
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* ── Step: enter token ── */}
                    {connectStep === 'token' && (
                      <View style={{ gap: 14 }}>
                        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
                          Plak je {pf?.label} access token hieronder. Je vindt deze in de Developer Portal van {pf?.label}.
                        </Text>

                        {/* Account type selector */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {ACCOUNT_TYPES.map((type) => (
                            <TouchableOpacity
                              key={type.key}
                              onPress={() => setTokenAccountType(type.key)}
                              style={{
                                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                                backgroundColor: tokenAccountType === type.key ? pfColor + '18' : colors.background,
                                borderWidth: 1.5,
                                borderColor: tokenAccountType === type.key ? pfColor : colors.border,
                              }}
                            >
                              <Ionicons name={type.icon as any} size={16} color={tokenAccountType === type.key ? pfColor : colors.textSecondary} />
                              <Text style={{ fontSize: 10, marginTop: 3, color: tokenAccountType === type.key ? pfColor : colors.textSecondary, fontWeight: fontWeight.medium }}>
                                {type.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Token input */}
                        <TextInput
                          value={tokenInput}
                          onChangeText={setTokenInput}
                          placeholder="Plak je access token hier..."
                          placeholderTextColor={colors.textTertiary}
                          multiline
                          numberOfLines={4}
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={{
                            backgroundColor: colors.background,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: tokenInput ? pfColor + '60' : colors.border,
                            padding: 14,
                            fontSize: fontSize.sm,
                            color: colors.text,
                            fontFamily: 'monospace',
                            minHeight: 90,
                            textAlignVertical: 'top',
                          }}
                        />

                        {/* Save button */}
                        <TouchableOpacity
                          onPress={handleSaveToken}
                          disabled={!tokenInput.trim() || savingToken}
                          style={{
                            backgroundColor: tokenInput.trim() ? pfColor : colors.border,
                            borderRadius: 14, paddingVertical: 15,
                            alignItems: 'center', opacity: savingToken ? 0.7 : 1,
                          }}
                        >
                          <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md }}>
                            {savingToken ? 'Opslaan...' : `${pf?.label} koppelen`}
                          </Text>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 10, color: colors.textTertiary, textAlign: 'center', lineHeight: 14 }}>
                          Je token wordt versleuteld opgeslagen en alleen gebruikt om posts te publiceren namens jou.
                        </Text>
                      </View>
                    )}

                  </>
                );
              })()}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

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
