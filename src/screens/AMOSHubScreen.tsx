import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Module Definitions ──────────────────────────────────────────────────────

interface AMOSModule {
  id: string;
  name: string;
  nameNl: string;
  description: string;
  descriptionNl: string;
  icon: string;
  iconLib: 'ionicons' | 'mci';
  color: string;
  gradientColors: [string, string];
  status: 'active' | 'beta' | 'coming';
  route: keyof RootStackParamList | string | null;
}

// ── Grouped for layout ────────────────────────────────────────────────────────
// Hero row (wide cards), Groups 1–3 shown as 2-col grid sections

const HERO_MODULES: AMOSModule[] = [
  {
    id: 'event',
    name: 'Event Intelligence',
    nameNl: 'Event Intelligence',
    description: 'Capture, AI-generate & publish live from events',
    descriptionNl: 'Capture, AI-post & publiceer live op events',
    icon: 'calendar',
    iconLib: 'ionicons',
    color: '#9333EA',
    gradientColors: ['#6D28D9', '#9333EA'],
    status: 'active',
    route: 'EventIntelligence',
  },
  {
    id: 'opportunity',
    name: 'Opportunity Feed',
    nameNl: 'Kansen Feed',
    description: 'AI-detected market opportunities & signals',
    descriptionNl: 'AI-gedetecteerde marktkansen',
    icon: 'radio',
    iconLib: 'ionicons',
    color: '#F59E0B',
    gradientColors: ['#D97706', '#F59E0B'],
    status: 'active',
    route: 'OpportunityFeed',
  },
];

const GROUP_1: { label: string; modules: AMOSModule[] } = {
  label: 'Creëren & Automatiseren',
  modules: [
    {
      id: 'campaign',
      name: 'Campaign Engine',
      nameNl: 'Campaign Engine',
      description: 'Multi-channel campaigns',
      descriptionNl: 'Multi-channel campagnes',
      icon: 'megaphone',
      iconLib: 'ionicons',
      color: '#3B82F6',
      gradientColors: ['#2563EB', '#3B82F6'],
      status: 'active',
      route: 'CampaignList',
    },
    {
      id: 'content',
      name: 'Content Intelligence',
      nameNl: 'Content Intelligence',
      description: 'AI content creation & strategy',
      descriptionNl: 'AI contentcreatie & strategie',
      icon: 'create',
      iconLib: 'ionicons',
      color: '#EC4899',
      gradientColors: ['#DB2777', '#EC4899'],
      status: 'active',
      route: 'ContentCreator',
    },
    {
      id: 'proposals',
      name: 'Content Proposals',
      nameNl: 'Content Voorstellen',
      description: 'Review & approve AI content',
      descriptionNl: 'Beoordeel & keur AI content goed',
      icon: 'file-document-check-outline',
      iconLib: 'mci',
      color: '#F59E0B',
      gradientColors: ['#D97706', '#F59E0B'],
      status: 'active',
      route: 'ContentProposals',
    },
    {
      id: 'calendar',
      name: 'Content Calendar',
      nameNl: 'Content Kalender',
      description: 'Week & month planning view',
      descriptionNl: 'Week- & maandplanning',
      icon: 'calendar-month',
      iconLib: 'mci',
      color: '#9333EA',
      gradientColors: ['#7C3AED', '#9333EA'],
      status: 'active',
      route: 'ContentCalendar',
    },
    {
      id: 'ai',
      name: 'AI Copilot',
      nameNl: 'AI Copiloot',
      description: 'Your AI marketing assistant',
      descriptionNl: 'Jouw AI marketing-assistent',
      icon: 'robot-outline',
      iconLib: 'mci',
      color: '#8B5CF6',
      gradientColors: ['#7C3AED', '#8B5CF6'],
      status: 'active',
      route: 'AICommand',
    },
    {
      id: 'automation',
      name: 'Marketing Automation',
      nameNl: 'Automatisering',
      description: 'Trigger-based workflows',
      descriptionNl: 'Trigger-gebaseerde flows',
      icon: 'rocket',
      iconLib: 'ionicons',
      color: '#6366F1',
      gradientColors: ['#4F46E5', '#6366F1'],
      status: 'active',
      route: 'MarketingAutomation',
    },
  ],
};

const GROUP_2: { label: string; modules: AMOSModule[] } = {
  label: 'Netwerk & Leads',
  modules: [
    {
      id: 'networking',
      name: 'Networking Engine',
      nameNl: 'Networking Engine',
      description: 'Contacts via QR/NFC',
      descriptionNl: 'Contacten via QR/NFC',
      icon: 'account-network',
      iconLib: 'mci',
      color: '#10B981',
      gradientColors: ['#059669', '#10B981'],
      status: 'active',
      route: 'NetworkingEngine',
    },
    {
      id: 'lead',
      name: 'Lead Intelligence',
      nameNl: 'Lead Intelligence',
      description: 'Capture & qualify leads with AI',
      descriptionNl: 'AI-kwalificatie van leads',
      icon: 'people',
      iconLib: 'ionicons',
      color: '#14B8A6',
      gradientColors: ['#0D9488', '#14B8A6'],
      status: 'active',
      route: 'SmartLead',
    },
  ],
};

const GROUP_CONTENT: { label: string; modules: AMOSModule[] } = {
  label: '📂 Content Hub',
  modules: [
    {
      id: 'products',
      name: 'Products',
      nameNl: 'Producten',
      description: 'Manage products & services catalog',
      descriptionNl: 'Beheer producten & diensten catalogus',
      icon: 'package-variant-closed',
      iconLib: 'mci',
      color: '#3B82F6',
      gradientColors: ['#2563EB', '#3B82F6'],
      status: 'active',
      route: 'Products',
    },
    {
      id: 'team',
      name: 'Team Directory',
      nameNl: 'Team',
      description: 'Team members & expertise',
      descriptionNl: 'Teamleden & expertise',
      icon: 'account-group',
      iconLib: 'mci',
      color: '#8B5CF6',
      gradientColors: ['#7C3AED', '#8B5CF6'],
      status: 'active',
      route: 'TeamDirectory',
    },
    {
      id: 'organization',
      name: 'Organization',
      nameNl: 'Organisatie',
      description: 'Company profile, pitch & boilerplate',
      descriptionNl: 'Bedrijfsprofiel, pitch & boilerplate',
      icon: 'office-building',
      iconLib: 'mci',
      color: '#F97316',
      gradientColors: ['#EA580C', '#F97316'],
      status: 'active',
      route: 'Organization',
    },
    {
      id: 'library',
      name: 'Content Library',
      nameNl: 'Content Library',
      description: 'Pre-designed product posts (LinkedIn/IG/FB)',
      descriptionNl: 'Vooraf ontworpen productposts (LinkedIn/IG/FB)',
      icon: 'images',
      iconLib: 'ionicons',
      color: '#10B981',
      gradientColors: ['#059669', '#10B981'],
      status: 'active',
      route: 'Library',
    },
  ],
};

const GROUP_3: { label: string; modules: AMOSModule[] } = {
  label: 'Beheer & Optimalisatie',
  modules: [
    {
      id: 'autonomous',
      name: 'Autonomous Hub',
      nameNl: 'Autonoom Hub',
      description: 'AI autonomous marketing ops',
      descriptionNl: 'Autonome AI marketingoperaties',
      icon: 'brain',
      iconLib: 'mci',
      color: '#7C3AED',
      gradientColors: ['#6D28D9', '#7C3AED'],
      status: 'active',
      route: 'AutonomousHub',
    },
    {
      id: 'strategy',
      name: 'Marketing Strategy',
      nameNl: 'Marketing Strategie',
      description: 'Plan goals, budget & content strategy',
      descriptionNl: 'Plan doelen, budget & contentstrategie',
      icon: 'chart-timeline-variant-shimmer',
      iconLib: 'mci',
      color: '#059669',
      gradientColors: ['#047857', '#059669'],
      status: 'active',
      route: 'MarketingStrategy',
    },
    {
      id: 'budget',
      name: 'Budget Monitor',
      nameNl: 'Budget Monitor',
      description: 'Track & optimize marketing spend',
      descriptionNl: 'Beheer marketingbudget',
      icon: 'card',
      iconLib: 'ionicons',
      color: '#EF4444',
      gradientColors: ['#DC2626', '#EF4444'],
      status: 'active',
      route: 'BudgetMonitor',
    },
  ],
};

const COMING_MODULES: AMOSModule[] = [
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    nameNl: 'Analytics & Rapportage',
    description: 'Deep insights & ROI tracking',
    descriptionNl: 'Diepgaande inzichten',
    icon: 'bar-chart',
    iconLib: 'ionicons',
    color: '#84CC16',
    gradientColors: ['#65A30D', '#84CC16'],
    status: 'active',
    route: 'Analytics',
  },
  {
    id: 'multiagent',
    name: 'Multi-Agent System',
    nameNl: 'Multi-Agent Systeem',
    description: 'Autonomous AI agent network',
    descriptionNl: 'AI-agentennetwerk',
    icon: 'git-network',
    iconLib: 'ionicons',
    color: '#A855F7',
    gradientColors: ['#9333EA', '#A855F7'],
    status: 'active',
    route: 'MultiAgent',
  },
  {
    id: 'integrations',
    name: 'Integrations',
    nameNl: 'Integraties',
    description: 'Connect your tools & platforms',
    descriptionNl: 'Verbind je tools & platformen',
    icon: 'link',
    iconLib: 'ionicons',
    color: '#64748B',
    gradientColors: ['#475569', '#64748B'],
    status: 'active',
    route: 'Integrations',
  },
  {
    id: 'onboarding',
    name: 'Onboarding Wizard',
    nameNl: 'Installatie Wizard',
    description: 'Setup your marketing platform',
    descriptionNl: 'Stel je platform in',
    icon: 'rocket-launch',
    iconLib: 'mci',
    color: '#EC4899',
    gradientColors: ['#DB2777', '#EC4899'],
    status: 'active',
    route: 'Onboarding',
  },
];

const ALL_ACTIVE_COUNT = HERO_MODULES.length + GROUP_1.modules.length + GROUP_2.modules.length + GROUP_CONTENT.modules.length + GROUP_3.modules.length;
const ALL_TOTAL = ALL_ACTIVE_COUNT + COMING_MODULES.length;

// ─── Component ───────────────────────────────────────────────────────────────

export default function AMOSHubScreen() {
  const navigation = useNavigation<Nav>();
  const { locale, t } = useTranslation();
  const { colors, isDark } = useTheme();

  const styles = useThemedStyles((c) => ({
    container: { flex: 1 },

    // Header
    header: {
      paddingTop: Platform.OS === 'ios' ? 56 : 36,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    headerWithBack: {
      paddingTop: Platform.OS === 'ios' ? 106 : 72,
    },
    amosLogoRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    amosLogoCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    amosTitle: {
      fontSize: 24,
      fontWeight: fontWeight.bold as any,
      color: '#fff',
      letterSpacing: 2,
    },
    amosSubtitle: {
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: 0.3,
    },
    statsPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    statItem: { flex: 1, alignItems: 'center' as const },
    statValue: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold as any,
      color: '#fff',
    },
    statLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.55)',
      marginTop: 1,
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginHorizontal: spacing.sm,
    },

    // Scroll
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      gap: spacing.sm,
    },

    // Section header
    sectionRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginTop: spacing.md,
      marginBottom: 6,
    },
    sectionLine: { flex: 1, height: 1 },
    sectionLabel: {
      fontSize: 10,
      fontWeight: fontWeight.bold as any,
      letterSpacing: 1.2,
    },

    // Hero cards (full-width)
    heroRow: { gap: spacing.sm },
    heroCard: {
      borderRadius: borderRadius.xl,
      overflow: 'hidden' as const,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    heroGradient: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md + 2,
      gap: spacing.md,
    },
    heroLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      flex: 1,
    },
    heroIconWrap: {
      width: 52,
      height: 52,
      borderRadius: borderRadius.lg,
      backgroundColor: 'rgba(255,255,255,0.18)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    heroName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold as any,
      color: '#fff',
      marginBottom: 2,
    },
    heroDesc: {
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.75)',
      lineHeight: 16,
    },
    heroArrow: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255,255,255,0.18)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },

    // Grid cards (2-col)
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    gridCard: {
      width: '48.5%' as any,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      overflow: 'hidden' as const,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },
    gridAccent: {
      height: 3,
      width: '100%',
    },
    gridBody: {
      padding: spacing.md,
      gap: spacing.xs,
    },
    gridIconWrap: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.md,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.xs,
    },
    gridName: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold as any,
      lineHeight: 18,
    },
    gridDesc: {
      fontSize: fontSize.xs,
      lineHeight: 15,
      flex: 1,
    },
    gridFooter: {
      marginTop: spacing.sm,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: fontWeight.semibold as any,
    },
    arrowChip: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },

    // Engine status
    engineCard: {
      marginTop: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderLeftWidth: 3,
      borderLeftColor: '#10D9A0',
      padding: spacing.md,
      gap: 4,
    },
    engineRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    engineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10D9A0',
    },
    engineTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold as any,
    },
    engineSub: {
      fontSize: fontSize.xs,
      marginLeft: 8 + spacing.sm,
      lineHeight: 16,
    },
  }));

  const getName = (m: AMOSModule) => locale === 'nl' ? m.nameNl : m.name;
  const getDesc = (m: AMOSModule) => locale === 'nl' ? m.descriptionNl : m.description;

  const navigate = (m: AMOSModule) => {
    if (!m.route || m.status === 'coming') return;
    try {
      navigation.navigate(m.route as any);
    } catch (e) {
      // Try parent navigator if not found in current stack
      try { (navigation as any).getParent()?.navigate(m.route); } catch {}
    }
  };

  // ── Hero card (wide, full-row) ─────────────────────────────────────────────
  const renderHeroCard = (m: AMOSModule) => (
    <TouchableOpacity
      key={m.id}
      style={[styles.heroCard, { shadowColor: m.color }]}
      onPress={() => navigate(m)}
      activeOpacity={0.82}
    >
      <LinearGradient
        colors={m.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroLeft}>
          <View style={styles.heroIconWrap}>
            {m.iconLib === 'mci' ? (
              <MaterialCommunityIcons name={m.icon as any} size={28} color="#fff" />
            ) : (
              <Ionicons name={(m.icon) as any} size={28} color="#fff" />
            )}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.heroName}>{getName(m)}</Text>
            <Text style={styles.heroDesc} numberOfLines={2}>{getDesc(m)}</Text>
          </View>
        </View>
        <View style={styles.heroArrow}>
          <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // ── Grid card (half-width) ─────────────────────────────────────────────────
  const renderGridCard = (m: AMOSModule) => {
    const isComingSoon = m.status === 'coming';
    return (
      <TouchableOpacity
        key={m.id}
        style={[
          styles.gridCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: m.color,
            opacity: isComingSoon ? 0.55 : 1,
          },
        ]}
        onPress={() => navigate(m)}
        activeOpacity={isComingSoon ? 1 : 0.78}
      >
        {/* Color accent bar */}
        <View style={[styles.gridAccent, { backgroundColor: m.color }]} />

        <View style={styles.gridBody}>
          {/* Icon */}
          <View style={[styles.gridIconWrap, { backgroundColor: m.color + '18' }]}>
            {m.iconLib === 'mci' ? (
              <MaterialCommunityIcons
                name={m.icon as any}
                size={22}
                color={isComingSoon ? colors.textTertiary : m.color}
              />
            ) : (
              <Ionicons
                name={(m.icon + (m.iconLib === 'ionicons' ? '-outline' : '')) as any}
                size={22}
                color={isComingSoon ? colors.textTertiary : m.color}
              />
            )}
          </View>

          <Text
            style={[styles.gridName, { color: isComingSoon ? colors.textSecondary : colors.text }]}
            numberOfLines={2}
          >
            {getName(m)}
          </Text>
          <Text style={[styles.gridDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {getDesc(m)}
          </Text>

          {/* Footer */}
          <View style={styles.gridFooter}>
            {isComingSoon ? (
              <View style={[styles.badge, { backgroundColor: colors.borderLight }]}>
                <Text style={[styles.badgeText, { color: colors.textTertiary }]}>{t.amosHub.comingSoon}</Text>
              </View>
            ) : (
              <View style={[styles.arrowChip, { backgroundColor: m.color + '18' }]}>
                <Ionicons name="arrow-forward" size={12} color={m.color} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Section header ─────────────────────────────────────────────────────────
  const renderSectionHeader = (label: string) => (
    <View style={styles.sectionRow}>
      <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
        {label.toUpperCase()}
      </Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ─── Gradient Header ─────────────────────────────────────────── */}
      <LinearGradient
        colors={['#C01D60', '#E8317A', '#F7941D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, navigation.canGoBack() && styles.headerWithBack]}
      >
        {/* Back button — only when navigated from stack (not as tab) */}
        {navigation.canGoBack() && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute' as const, top: Platform.OS === 'ios' ? 54 : 16, left: 16, zIndex: 10, padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Logo row */}
        <View style={styles.amosLogoRow}>
          <View style={styles.amosLogoCircle}>
            <MaterialCommunityIcons name="robot" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.amosTitle}>AMOS</Text>
            <Text style={styles.amosSubtitle}>{t.amosHub.subtitle}</Text>
          </View>
        </View>

        {/* Stats pill */}
        <View style={styles.statsPill}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ALL_ACTIVE_COUNT}</Text>
            <Text style={styles.statLabel}>{t.amosHub.statActive}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{COMING_MODULES.length}</Text>
            <Text style={styles.statLabel}>{t.amosHub.statComing}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ALL_TOTAL}</Text>
            <Text style={styles.statLabel}>{t.amosHub.statTotal}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ─── Scroll ──────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero row: Event Intelligence + Opportunity Feed ─────────── */}
        {renderSectionHeader(t.amosHub.sectionLiveIntelligence)}
        <View style={styles.heroRow}>
          {HERO_MODULES.map(renderHeroCard)}
        </View>

        {/* ── Group 1: Create & Automate ──────────────────────────────── */}
        {renderSectionHeader(t.amosHub.sectionCreate)}
        <View style={styles.grid}>
          {GROUP_1.modules.map(renderGridCard)}
        </View>

        {/* ── Group 2: Network & Leads ────────────────────────────────── */}
        {renderSectionHeader(t.amosHub.sectionNetwork)}
        <View style={styles.grid}>
          {GROUP_2.modules.map(renderGridCard)}
        </View>

        {/* ── Content Hub ────────────────────────────────────────────── */}
        {renderSectionHeader('📂 Content Hub')}
        <View style={styles.grid}>
          {GROUP_CONTENT.modules.map(renderGridCard)}
        </View>

        {/* ── Group 3: Manage & Optimize ──────────────────────────────── */}
        {renderSectionHeader(t.amosHub.sectionManage)}
        <View style={styles.grid}>
          {GROUP_3.modules.map(renderGridCard)}
        </View>

        {/* ── Coming Soon ─────────────────────────────────────────────── */}
        {renderSectionHeader(t.amosHub.sectionComing)}
        <View style={styles.grid}>
          {COMING_MODULES.map(renderGridCard)}
        </View>

        {/* ── AMOS Engine status ──────────────────────────────────────── */}
        <View style={[styles.engineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.engineRow}>
            <View style={styles.engineDot} />
            <Text style={[styles.engineTitle, { color: colors.text }]}>{t.amosHub.engineOnline}</Text>
          </View>
          <Text style={[styles.engineSub, { color: colors.textSecondary }]}>
            {t.amosHub.engineStack}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
