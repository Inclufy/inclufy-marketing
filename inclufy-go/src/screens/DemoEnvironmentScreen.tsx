import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow, cardShadow } from '../utils/shadows';

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'demo_active_industry_marketing';

interface IndustryConfig {
  id: string;
  label: string;
  company: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const INDUSTRIES: IndustryConfig[] = [
  {
    id: 'healthcare',
    label: 'Healthcare',
    company: 'MedFlow Solutions',
    color: '#0EA5E9',
    icon: 'heart-outline',
  },
  {
    id: 'construction',
    label: 'Construction',
    company: 'BuildRight Group',
    color: '#F59E0B',
    icon: 'construct-outline',
  },
  {
    id: 'it',
    label: 'IT / SaaS',
    company: 'CloudNexus Technologies',
    color: '#8B5CF6',
    icon: 'cloud-outline',
  },
  {
    id: 'real-estate',
    label: 'Real Estate',
    company: 'Prestige Properties',
    color: '#10B981',
    icon: 'business-outline',
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    company: 'Apex Industries',
    color: '#EF4444',
    icon: 'cog-outline',
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function DemoEnvironmentScreen() {
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'seed' | 'switch' | 'reset' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ─── Load persisted state ───────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const [storedIndustry, { data }] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          supabase.auth.getUser(),
        ]);

        if (storedIndustry) {
          setActiveIndustry(storedIndustry);
          setSelectedIndustry(storedIndustry);
        }

        if (data?.user?.id) {
          setUserId(data.user.id);
        }
      } catch (err) {
        console.warn('DemoEnvironmentScreen: init error', err);
      }
    };

    init();
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────

  const getActiveConfig = (): IndustryConfig | undefined =>
    INDUSTRIES.find((i) => i.id === activeIndustry);

  const isProcessing = loading || loadingAction !== null;

  // ─── Actions ────────────────────────────────────────────────────────────

  const handleSeedDemo = async () => {
    if (!selectedIndustry) {
      Alert.alert('Selecteer een branche', 'Kies eerst een branche voordat je de demo genereert.');
      return;
    }

    if (!userId) {
      Alert.alert('Niet ingelogd', 'Log eerst in om de demo-omgeving te genereren.');
      return;
    }

    if (activeIndustry) {
      Alert.alert(
        'Demo al actief',
        `Er is al een demo actief voor ${getActiveConfig()?.company ?? activeIndustry}. Gebruik "Demo Wisselen" om van branche te veranderen.`,
      );
      return;
    }

    setLoading(true);
    setLoadingAction('seed');

    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-data', {
        body: { userId, industry: selectedIndustry },
      });

      if (error) throw error;

      await AsyncStorage.setItem(STORAGE_KEY, selectedIndustry);
      setActiveIndustry(selectedIndustry);

      const config = INDUSTRIES.find((i) => i.id === selectedIndustry);
      Alert.alert(
        'Demo Gegenereerd',
        `De demo-omgeving voor ${config?.company ?? selectedIndustry} is succesvol aangemaakt.`,
      );
    } catch (err: any) {
      console.error('Seed demo error:', err);
      Alert.alert(
        'Fout bij genereren',
        err?.message ?? 'Er is een fout opgetreden bij het genereren van de demo-data.',
      );
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleSwitchDemo = () => {
    if (!selectedIndustry) {
      Alert.alert('Selecteer een branche', 'Kies eerst een nieuwe branche om naar te wisselen.');
      return;
    }

    if (selectedIndustry === activeIndustry) {
      Alert.alert('Zelfde branche', 'Je hebt dezelfde branche geselecteerd die al actief is.');
      return;
    }

    const targetConfig = INDUSTRIES.find((i) => i.id === selectedIndustry);

    Alert.alert(
      'Demo Wisselen',
      `Weet je zeker dat je wilt wisselen naar ${targetConfig?.company ?? selectedIndustry}? De huidige demo-data wordt eerst gereset.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Wisselen',
          onPress: async () => {
            setLoading(true);
            setLoadingAction('switch');

            try {
              // Reset current demo
              const { error: resetError } = await supabase.functions.invoke('seed-demo-data', {
                body: { userId, industry: activeIndustry, action: 'reset' },
              });

              if (resetError) throw resetError;

              // Seed new industry
              const { error: seedError } = await supabase.functions.invoke('seed-demo-data', {
                body: { userId, industry: selectedIndustry },
              });

              if (seedError) throw seedError;

              await AsyncStorage.setItem(STORAGE_KEY, selectedIndustry);
              setActiveIndustry(selectedIndustry);

              Alert.alert(
                'Demo Gewisseld',
                `De demo-omgeving is gewisseld naar ${targetConfig?.company ?? selectedIndustry}.`,
              );
            } catch (err: any) {
              console.error('Switch demo error:', err);
              Alert.alert(
                'Fout bij wisselen',
                err?.message ?? 'Er is een fout opgetreden bij het wisselen van de demo.',
              );
            } finally {
              setLoading(false);
              setLoadingAction(null);
            }
          },
        },
      ],
    );
  };

  const handleResetDemo = () => {
    if (!activeIndustry) {
      Alert.alert('Geen demo actief', 'Er is momenteel geen demo actief om te resetten.');
      return;
    }

    const activeConfig = getActiveConfig();

    Alert.alert(
      'Demo Resetten',
      `Weet je zeker dat je de demo voor ${activeConfig?.company ?? activeIndustry} wilt resetten? Alle demo-data wordt verwijderd.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Resetten',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setLoadingAction('reset');

            try {
              const { error } = await supabase.functions.invoke('seed-demo-data', {
                body: { userId, industry: activeIndustry, action: 'reset' },
              });

              if (error) throw error;

              await AsyncStorage.removeItem(STORAGE_KEY);
              setActiveIndustry(null);
              setSelectedIndustry(null);

              Alert.alert(
                'Demo Gereset',
                'De demo-omgeving is succesvol gereset. Alle demo-data is verwijderd.',
              );
            } catch (err: any) {
              console.error('Reset demo error:', err);
              Alert.alert(
                'Fout bij resetten',
                err?.message ?? 'Er is een fout opgetreden bij het resetten van de demo.',
              );
            } finally {
              setLoading(false);
              setLoadingAction(null);
            }
          },
        },
      ],
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  const activeConfig = getActiveConfig();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Demo Omgeving</Text>
        <Text style={styles.headerSubtitle}>
          Genereer realistische demo-data voor je branche
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Card ────────────────────────────────────────────── */}
        <View style={[styles.statusCard, activeConfig && { borderLeftColor: activeConfig.color }]}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: activeConfig ? colors.success : colors.textTertiary },
              ]}
            />
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>
                {activeConfig ? 'Demo Actief' : 'Geen demo actief'}
              </Text>
              {activeConfig ? (
                <Text style={styles.statusValue}>
                  {activeConfig.company} ({activeConfig.label})
                </Text>
              ) : (
                <Text style={styles.statusHint}>
                  Selecteer een branche hieronder om te beginnen
                </Text>
              )}
            </View>
            {activeConfig && (
              <View style={[styles.statusIconWrap, { backgroundColor: activeConfig.color + '15' }]}>
                <Ionicons name={activeConfig.icon} size={22} color={activeConfig.color} />
              </View>
            )}
          </View>
        </View>

        {/* ── Loading Overlay ─────────────────────────────────────────── */}
        {isProcessing && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>
              {loadingAction === 'seed' && 'Demo-data wordt gegenereerd...'}
              {loadingAction === 'switch' && 'Demo wordt gewisseld...'}
              {loadingAction === 'reset' && 'Demo wordt gereset...'}
              {!loadingAction && 'Bezig...'}
            </Text>
          </View>
        )}

        {/* ── Industry Cards ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>KIES EEN BRANCHE</Text>

        {INDUSTRIES.map((industry) => {
          const isActive = activeIndustry === industry.id;
          const isSelected = selectedIndustry === industry.id;

          return (
            <TouchableOpacity
              key={industry.id}
              style={[
                styles.industryCard,
                isSelected && { borderColor: industry.color, borderWidth: 2 },
                isActive && styles.industryCardActive,
              ]}
              activeOpacity={0.7}
              onPress={() => !isProcessing && setSelectedIndustry(industry.id)}
              disabled={isProcessing}
            >
              <View style={styles.industryRow}>
                {/* Icon */}
                <View style={[styles.industryIconWrap, { backgroundColor: industry.color + '15' }]}>
                  <Ionicons name={industry.icon} size={26} color={industry.color} />
                </View>

                {/* Text */}
                <View style={styles.industryContent}>
                  <Text style={styles.industryCompany}>{industry.company}</Text>
                  <Text style={styles.industryLabel}>{industry.label}</Text>
                </View>

                {/* Status indicators */}
                <View style={styles.industryBadges}>
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.success + '15' }]}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={[styles.badgeText, { color: colors.success }]}>Actief</Text>
                    </View>
                  )}
                  {isSelected && !isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: industry.color + '15' }]}>
                      <Ionicons name="radio-button-on" size={14} color={industry.color} />
                    </View>
                  )}
                </View>
              </View>

              {/* Color accent bar */}
              <View style={[styles.industryAccent, { backgroundColor: industry.color }]} />
            </TouchableOpacity>
          );
        })}

        {/* ── Action Buttons ──────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ACTIES</Text>

        <View style={styles.actionsCard}>
          {/* Generate Demo */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonPrimary,
              (isProcessing || !selectedIndustry || activeIndustry) && styles.actionButtonDisabled,
            ]}
            onPress={handleSeedDemo}
            activeOpacity={0.7}
            disabled={isProcessing || !selectedIndustry || !!activeIndustry}
          >
            {loadingAction === 'seed' ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Ionicons name="sparkles-outline" size={20} color={colors.textOnPrimary} />
            )}
            <Text style={styles.actionButtonPrimaryText}>Demo Genereren</Text>
          </TouchableOpacity>

          {/* Switch Demo */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonSecondary,
              (isProcessing || !activeIndustry || selectedIndustry === activeIndustry) &&
                styles.actionButtonDisabledOutline,
            ]}
            onPress={handleSwitchDemo}
            activeOpacity={0.7}
            disabled={isProcessing || !activeIndustry || selectedIndustry === activeIndustry}
          >
            {loadingAction === 'switch' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
            )}
            <Text style={styles.actionButtonSecondaryText}>Demo Wisselen</Text>
          </TouchableOpacity>

          {/* Reset Demo */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonDanger,
              (isProcessing || !activeIndustry) && styles.actionButtonDisabledOutline,
            ]}
            onPress={handleResetDemo}
            activeOpacity={0.7}
            disabled={isProcessing || !activeIndustry}
          >
            {loadingAction === 'reset' ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            )}
            <Text style={styles.actionButtonDangerText}>Demo Resetten</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info Card ───────────────────────────────────────────────── */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            De demo genereert realistische data voor de geselecteerde branche, inclusief campagnes,
            leads, content en analytics. Je kunt op elk moment wisselen of resetten.
          </Text>
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

  // Header
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
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  // Section label
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // Status Card
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.textTertiary,
    ...cardShadow,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  statusValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusHint: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading Card
  loadingCard: {
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  loadingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
    flex: 1,
  },

  // Industry Cards
  industryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...subtleShadow,
  },
  industryCardActive: {
    borderColor: colors.success,
    borderWidth: 2,
  },
  industryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  industryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  industryContent: {
    flex: 1,
  },
  industryCompany: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  industryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  industryBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  industryAccent: {
    height: 3,
    width: '100%',
  },

  // Actions Card
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...subtleShadow,
  },

  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonPrimaryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
  },
  actionButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  actionButtonSecondaryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  actionButtonDanger: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  actionButtonDangerText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.error,
  },
  actionButtonDisabled: {
    backgroundColor: colors.textTertiary,
    opacity: 0.5,
  },
  actionButtonDisabledOutline: {
    opacity: 0.4,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.info + '08',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
