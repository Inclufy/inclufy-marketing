import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation, LOCALE_LABELS, type Locale } from '../i18n';
import type { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';

// ─── Component ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { t, locale, setLocale } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { scheme, setScheme, isDark, colors: themeColors } = useTheme();
  const [email, setEmail] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleThemeSwitch = () => {
    Alert.alert(
      'Weergave',
      'Kies een thema',
      [
        { text: '☀️  Licht', onPress: () => setScheme('light') },
        { text: '🌙  Donker', onPress: () => setScheme('dark') },
        { text: '⚙️  Systeem', onPress: () => setScheme('system') },
        { text: 'Annuleren', style: 'cancel' },
      ]
    );
  };

  const themeLabel = scheme === 'light' ? 'Licht ☀️' : scheme === 'dark' ? 'Donker 🌙' : 'Systeem ⚙️';

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data?.user?.email ?? null);
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      t.settings.logout,
      t.settings.logoutConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.logout,
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ],
    );
  };

  const handleComingSoon = () => {
    Alert.alert(t.common.comingSoon, t.common.comingSoonMsg);
  };

  const handleLanguageSwitch = () => {
    const locales: Locale[] = ['nl', 'en', 'fr'];
    Alert.alert(
      t.settings.language,
      undefined,
      [
        ...locales.map((loc) => ({
          text: `${LOCALE_LABELS[loc]}${loc === locale ? ' ✓' : ''}`,
          onPress: () => setLocale(loc),
        })),
        { text: t.common.cancel, style: 'cancel' as const },
      ],
    );
  };

  // ─── Row Components ───────────────────────────────────────────────────

  const SettingsRow = ({
    icon,
    iconColor = colors.text,
    label,
    value,
    onPress,
    showChevron = true,
    rightElement,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {rightElement ?? (
        showChevron && (
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        )
      )}
    </TouchableOpacity>
  );

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          <SettingsRow
            icon="notifications-outline"
            iconColor={colors.info}
            label={t.settings.notificationsLabel}
            showChevron={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="finger-print-outline"
            iconColor={colors.secondary}
            label={t.settings.biometricLogin}
            showChevron={false}
            rightElement={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={biometricEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
          <View style={styles.separator} />
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

        {/* ── App ───────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t.settings.app}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="color-palette-outline"
            iconColor={colors.primary}
            label={t.settings.brandKitManage}
            onPress={handleComingSoon}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="push-outline"
            iconColor={colors.info}
            label={t.settings.pushNotifications}
            onPress={handleComingSoon}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="download-outline"
            iconColor={colors.success}
            label={t.settings.dataExport}
            onPress={handleComingSoon}
          />
        </View>

        {/* ── Demo ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t.settings.demo ?? 'DEMO'}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="sparkles-outline"
            iconColor={colors.accent}
            label={t.settings.demoEnvironment ?? 'Demo Omgeving'}
            value={t.settings.demoEnvironmentDesc ?? 'Beheer demo data'}
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
            value="1.0.0"
            showChevron={false}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="sparkles-outline"
            iconColor={colors.primary}
            label={t.settings.inclufy}
            value={t.settings.inclufyDesc}
            showChevron={false}
          />
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  // Section labels
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...subtleShadow,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  rowValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.md + 36 + spacing.md, // icon offset
  },
});
