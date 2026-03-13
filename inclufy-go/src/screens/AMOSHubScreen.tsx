import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Module Definitions ──────────────────────────────────────────────────────

interface AMOSModule {
  id: string;
  name: string;
  nameNl: string;
  nameFr: string;
  description: string;
  descriptionNl: string;
  descriptionFr: string;
  icon: string;
  iconLib: 'ionicons' | 'mci';
  color: string;
  status: 'active' | 'beta' | 'coming';
  route: keyof RootStackParamList | string | null;
  routeParams?: Record<string, unknown>;
}

const AMOS_MODULES: AMOSModule[] = [
  {
    id: 'event',
    name: 'Event Intelligence',
    nameNl: 'Event Intelligence',
    nameFr: 'Intelligence Événement',
    description: 'Capture, AI-post & publish from live events',
    descriptionNl: 'Capture, AI-post & publiceer live op events',
    descriptionFr: 'Capturez et publiez depuis vos événements',
    icon: 'calendar',
    iconLib: 'ionicons',
    color: '#9333EA',
    status: 'active',
    route: 'EventsTab',
  },
  {
    id: 'campaign',
    name: 'Campaign Engine',
    nameNl: 'Campaign Engine',
    nameFr: 'Moteur de Campagne',
    description: 'Create & manage multi-channel campaigns',
    descriptionNl: 'Maak & beheer multi-channel campagnes',
    descriptionFr: 'Créez et gérez des campagnes multicanaux',
    icon: 'megaphone',
    iconLib: 'ionicons',
    color: '#3B82F6',
    status: 'active',
    route: 'CampaignsTab',
  },
  {
    id: 'ai',
    name: 'AI Copilot',
    nameNl: 'AI Copiloot',
    nameFr: 'Copilote IA',
    description: 'Your AI-powered marketing assistant',
    descriptionNl: 'Jouw AI marketing-assistent',
    descriptionFr: 'Votre assistant marketing IA',
    icon: 'robot-outline',
    iconLib: 'mci',
    color: '#8B5CF6',
    status: 'active',
    route: 'AICommand',
  },
  {
    id: 'content',
    name: 'Content Intelligence',
    nameNl: 'Content Intelligence',
    nameFr: 'Intelligence Contenu',
    description: 'AI-powered content creation & strategy',
    descriptionNl: 'AI-gestuurde contentcreatie & strategie',
    descriptionFr: 'Création de contenu et stratégie IA',
    icon: 'create',
    iconLib: 'ionicons',
    color: '#EC4899',
    status: 'active',
    route: 'ContentCreator',
  },
  {
    id: 'lead',
    name: 'Lead Intelligence',
    nameNl: 'Lead Intelligence',
    nameFr: 'Intelligence Prospects',
    description: 'Capture & qualify leads with AI',
    descriptionNl: 'Leg leads vast & kwalificeer met AI',
    descriptionFr: 'Capturez et qualifiez vos prospects avec l\'IA',
    icon: 'people',
    iconLib: 'ionicons',
    color: '#10B981',
    status: 'active',
    route: 'SmartLead',
  },
  {
    id: 'opportunity',
    name: 'Opportunity Radar',
    nameNl: 'Kansen Radar',
    nameFr: 'Radar d\'Opportunités',
    description: 'AI-detected market opportunities',
    descriptionNl: 'AI-gedetecteerde marktkansen',
    descriptionFr: 'Opportunités de marché détectées par IA',
    icon: 'radio',
    iconLib: 'ionicons',
    color: '#F59E0B',
    status: 'active',
    route: 'OpportunityRadar',
  },
  {
    id: 'automation',
    name: 'Marketing Automation',
    nameNl: 'Marketing Automatisering',
    nameFr: 'Automatisation Marketing',
    description: 'Trigger-based automation workflows',
    descriptionNl: 'Trigger-gebaseerde automatiseringsflows',
    descriptionFr: 'Workflows d\'automatisation basés sur des déclencheurs',
    icon: 'rocket',
    iconLib: 'ionicons',
    color: '#6366F1',
    status: 'active',
    route: 'MarketingAutomation',
  },
  {
    id: 'budget',
    name: 'Budget Monitor',
    nameNl: 'Budget Monitor',
    nameFr: 'Moniteur Budget',
    description: 'Track & optimize marketing spend',
    descriptionNl: 'Beheer & optimaliseer marketingbudget',
    descriptionFr: 'Suivez et optimisez vos dépenses marketing',
    icon: 'card',
    iconLib: 'ionicons',
    color: '#EF4444',
    status: 'active',
    route: 'BudgetMonitor',
  },
  {
    id: 'publication',
    name: 'Publication Engine',
    nameNl: 'Publicatie Engine',
    nameFr: 'Moteur de Publication',
    description: 'Approval, scheduling & multi-channel publish',
    descriptionNl: 'Goedkeuring, planning & multi-channel publicatie',
    descriptionFr: 'Approbation, planification et publication multicanaux',
    icon: 'send',
    iconLib: 'ionicons',
    color: '#06B6D4',
    status: 'coming',
    route: null,
  },
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    nameNl: 'Analytics & Rapportage',
    nameFr: 'Analyses & Rapports',
    description: 'Deep insights & ROI tracking',
    descriptionNl: 'Diepgaande inzichten & ROI-tracking',
    descriptionFr: 'Analyses approfondies et suivi du ROI',
    icon: 'bar-chart',
    iconLib: 'ionicons',
    color: '#84CC16',
    status: 'coming',
    route: null,
  },
  {
    id: 'multiagent',
    name: 'Multi-Agent System',
    nameNl: 'Multi-Agent Systeem',
    nameFr: 'Système Multi-Agents',
    description: 'Autonomous AI agent network & orchestration',
    descriptionNl: 'Autonoom AI-agentennetwerk & orkestratie',
    descriptionFr: 'Réseau d\'agents IA autonomes',
    icon: 'git-network',
    iconLib: 'ionicons',
    color: '#A855F7',
    status: 'coming',
    route: null,
  },
  {
    id: 'integrations',
    name: 'Integrations',
    nameNl: 'Integraties',
    nameFr: 'Intégrations',
    description: 'Connect your tools & platforms',
    descriptionNl: 'Verbind je tools & platformen',
    descriptionFr: 'Connectez vos outils et plateformes',
    icon: 'link',
    iconLib: 'ionicons',
    color: '#64748B',
    status: 'coming',
    route: null,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AMOSHubScreen() {
  const navigation = useNavigation<Nav>();
  const { locale } = useTranslation();

  const getName = (m: AMOSModule) =>
    locale === 'nl' ? m.nameNl : locale === 'fr' ? m.nameFr : m.name;
  const getDesc = (m: AMOSModule) =>
    locale === 'nl' ? m.descriptionNl : locale === 'fr' ? m.descriptionFr : m.description;

  const navigate = (m: AMOSModule) => {
    if (!m.route || m.status === 'coming') return;
    navigation.navigate(m.route as any, m.routeParams as any);
  };

  const activeModules = AMOS_MODULES.filter((m) => m.status === 'active' || m.status === 'beta');
  const comingModules = AMOS_MODULES.filter((m) => m.status === 'coming');

  const renderModule = (module: AMOSModule, index: number) => {
    const isComingSoon = module.status === 'coming';
    const isBeta = module.status === 'beta';

    return (
      <TouchableOpacity
        key={module.id}
        style={[styles.moduleCard, isComingSoon && styles.moduleCardDimmed]}
        onPress={() => navigate(module)}
        activeOpacity={isComingSoon ? 1 : 0.75}
      >
        {/* Icon */}
        <View style={[styles.moduleIconWrap, { backgroundColor: module.color + '18' }]}>
          {module.iconLib === 'mci' ? (
            <MaterialCommunityIcons
              name={module.icon as any}
              size={26}
              color={isComingSoon ? colors.textTertiary : module.color}
            />
          ) : (
            <Ionicons
              name={(module.icon + '-outline') as any}
              size={26}
              color={isComingSoon ? colors.textTertiary : module.color}
            />
          )}
        </View>

        {/* Text */}
        <Text
          style={[styles.moduleName, isComingSoon && styles.moduleNameDimmed]}
          numberOfLines={2}
        >
          {getName(module)}
        </Text>
        <Text style={styles.moduleDesc} numberOfLines={2}>
          {getDesc(module)}
        </Text>

        {/* Status badge */}
        <View style={styles.moduleBadgeRow}>
          {isComingSoon ? (
            <View style={[styles.badge, styles.badgeComing]}>
              <Text style={styles.badgeComingText}>Binnenkort</Text>
            </View>
          ) : isBeta ? (
            <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.warning }]}>Beta</Text>
            </View>
          ) : (
            <View style={styles.moduleArrow}>
              <Ionicons name="arrow-forward" size={14} color={module.color} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#1E0A4E', '#4C1D95', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.amosLogoRow}>
            <View style={styles.amosLogoCircle}>
              <MaterialCommunityIcons name="robot" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.amosTitle}>AMOS</Text>
              <Text style={styles.amosSubtitle}>AI Marketing Operating System</Text>
            </View>
          </View>

          {/* Active modules count */}
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{activeModules.length}</Text>
              <Text style={styles.headerStatLabel}>Actief</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{comingModules.length}</Text>
              <Text style={styles.headerStatLabel}>Binnenkort</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{AMOS_MODULES.length}</Text>
              <Text style={styles.headerStatLabel}>Totaal</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Active Modules ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ACTIEVE MODULES</Text>
        <View style={styles.grid}>
          {activeModules.map((m, i) => renderModule(m, i))}
        </View>

        {/* ── Coming Soon ────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>BINNENKORT</Text>
        <View style={styles.grid}>
          {comingModules.map((m, i) => renderModule(m, i))}
        </View>

        {/* ── AI Engine Status ───────────────────────────────────────── */}
        <View style={styles.engineCard}>
          <View style={styles.engineHeader}>
            <View style={styles.engineDot} />
            <Text style={styles.engineTitle}>AMOS Engine · Online</Text>
          </View>
          <Text style={styles.engineSub}>
            GPT-4o Vision · Whisper · Brand Memory · Auto-publish
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    paddingTop: 58,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: { gap: spacing.md },
  amosLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  amosLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  amosTitle: {
    fontSize: 26,
    fontWeight: fontWeight.bold,
    color: '#fff',
    letterSpacing: 2,
  },
  amosSubtitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  headerStatLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },

  // Section label
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // Module grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moduleCard: {
    width: '48.5%' as any,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...subtleShadow,
  },
  moduleCardDimmed: {
    opacity: 0.55,
  },
  moduleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: 18,
  },
  moduleNameDimmed: {
    color: colors.textSecondary,
  },
  moduleDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  moduleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeComing: {
    backgroundColor: colors.borderLight,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  badgeComingText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
  },
  moduleArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // AI Engine status
  engineCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...subtleShadow,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  engineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  engineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  engineTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  engineSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 8 + spacing.sm,
  },
});
