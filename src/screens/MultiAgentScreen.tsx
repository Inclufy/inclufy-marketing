// src/screens/MultiAgentScreen.tsx
// Multi-Agent System — AI agents that work together autonomously

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';

// ─── Agent Definitions ──────────────────────────────────────────────────────

interface AgentDef {
  id: string;
  name: string;
  nameNl: string;
  description: string;
  descriptionNl: string;
  icon: string;
  iconLib: 'ion' | 'mci';
  color: string;
  status: 'active' | 'beta' | 'coming';
  capabilities: string[];
  capabilitiesNl: string[];
}

const AGENTS: AgentDef[] = [
  {
    id: 'content',
    name: 'Content Agent',
    nameNl: 'Content Agent',
    description: 'Generates and optimizes marketing content across all channels using brand voice and strategy.',
    descriptionNl: 'Genereert en optimaliseert marketingcontent op alle kanalen met merkidentiteit en strategie.',
    icon: 'create-outline',
    iconLib: 'ion',
    color: '#3B82F6',
    // Wired to event-studio-ai (single-shot copy generation). Promote to
    // 'active' only once it dispatches via the orchestrator + writes to
    // agent_runs. Until then, 'beta' is the honest signal.
    status: 'beta',
    capabilities: ['Blog writing', 'Social posts', 'Email copy', 'Ad copy'],
    capabilitiesNl: ['Blog schrijven', 'Social posts', 'E-mail copy', 'Advertentieteksten'],
  },
  {
    id: 'social',
    name: 'Social Agent',
    nameNl: 'Social Agent',
    description: 'Manages social media scheduling, engagement and community interactions automatically.',
    descriptionNl: 'Beheert social media planning, interactie en community-gesprekken automatisch.',
    icon: 'share-social-outline',
    iconLib: 'ion',
    color: '#EC4899',
    status: 'beta',
    capabilities: ['Auto-scheduling', 'Reply management', 'Trend detection', 'Hashtag strategy'],
    capabilitiesNl: ['Automatische planning', 'Reactiebeheer', 'Trenddetectie', 'Hashtag-strategie'],
  },
  {
    id: 'analytics',
    name: 'Analytics Agent',
    nameNl: 'Analytics Agent',
    description: 'Monitors performance, detects patterns and generates actionable insights in real-time.',
    descriptionNl: 'Bewaakt prestaties, detecteert patronen en genereert bruikbare inzichten in real-time.',
    icon: 'chart-line',
    iconLib: 'mci',
    color: '#10B981',
    status: 'coming',
    capabilities: ['ROI tracking', 'A/B analysis', 'Anomaly detection', 'Weekly reports'],
    capabilitiesNl: ['ROI tracking', 'A/B analyse', 'Anomaliedetectie', 'Weekrapporten'],
  },
  {
    id: 'lead',
    name: 'Lead Agent',
    nameNl: 'Lead Agent',
    description: 'Identifies, scores and nurtures leads through intelligent automation sequences.',
    descriptionNl: 'Identificeert, scoort en nurtured leads via intelligente automatiseringsreeksen.',
    icon: 'people-outline',
    iconLib: 'ion',
    color: '#F59E0B',
    status: 'coming',
    capabilities: ['Lead scoring', 'Email sequences', 'CRM sync', 'Conversion tracking'],
    capabilitiesNl: ['Lead scoring', 'E-mailreeksen', 'CRM sync', 'Conversie tracking'],
  },
  {
    id: 'ads',
    name: 'Ads Agent',
    nameNl: 'Ads Agent',
    description: 'Promotes top-performing posts, drafts campaign briefs for LinkedIn / Google / Meta, paces budgets in the Campaigns tab and reports ROAS.',
    descriptionNl: 'Promoot best presterende posts, maakt campagne briefings voor LinkedIn / Google / Meta, bewaakt budget in het Campagnes-tabblad en rapporteert ROAS.',
    icon: 'megaphone-outline',
    iconLib: 'ion',
    color: '#FF6B35',
    status: 'coming',
    capabilities: ['Post boosting', 'Audience targeting', 'Budget pacing', 'ROAS reporting'],
    capabilitiesNl: ['Post boosten', 'Doelgroep targeting', 'Budget pacing', 'ROAS rapportage'],
  },
];

// ─── Status helpers ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: { label: 'Active', labelNl: 'Actief', color: '#10B981', bg: '#10B98118' },
  beta: { label: 'Beta', labelNl: 'Beta', color: '#F59E0B', bg: '#F59E0B18' },
  coming: { label: 'Coming Soon', labelNl: 'Binnenkort', color: '#6B7280', bg: '#6B728018' },
};

export default function MultiAgentScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const isNl = locale === 'nl';

  const styles = useThemedStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 12,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    navRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.md,
    },
    backBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 2,
      padding: 8,
    },
    backLabel: { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    headerTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: '#fff',
    },
    headerSubtitle: {
      fontSize: fontSize.sm,
      color: 'rgba(255,255,255,0.7)',
      marginTop: spacing.xs,
      lineHeight: 20,
    },
    statsRow: {
      flexDirection: 'row' as const,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      marginTop: spacing.md,
    },
    statItem: { flex: 1, alignItems: 'center' as const },
    statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#fff' },
    statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2, textAlign: 'center' as const },
    content: { padding: spacing.md, gap: spacing.md },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.text,
      marginBottom: spacing.xs,
    },
    agentCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    agentHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    agentIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    agentTitleRow: {
      flex: 1,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    agentName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    agentDesc: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      lineHeight: 20,
    },
    statusBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: fontWeight.semibold },
    capabilitiesRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
    },
    capabilityChip: {
      backgroundColor: c.background,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    capabilityText: {
      fontSize: 11,
      color: c.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.xs,
    },
    orchestrationCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    orchestrationTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    orchestrationDesc: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      lineHeight: 20,
    },
    orchestrationSteps: { gap: spacing.sm, marginTop: spacing.xs },
    stepRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    stepNumberText: { fontSize: 12, fontWeight: fontWeight.bold, color: '#fff' },
    stepText: { flex: 1, fontSize: fontSize.sm, color: c.textSecondary, lineHeight: 18 },
  }));

  const activeCount = AGENTS.filter(a => a.status === 'active').length;
  const betaCount = AGENTS.filter(a => a.status === 'beta').length;
  const comingCount = AGENTS.filter(a => a.status === 'coming').length;

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}
        <LinearGradient
          colors={['#7E22CE', '#9333EA', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Nav */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
              <Text style={styles.backLabel}>{isNl ? 'Terug' : 'Back'}</Text>
            </TouchableOpacity>
            <View style={{ width: 40 }} />
          </View>

          {/* Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              justifyContent: 'center', alignItems: 'center',
            }}>
              <MaterialCommunityIcons name="robot-outline" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {isNl ? 'Multi-Agent Systeem' : 'Multi-Agent System'}
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            {isNl
              ? 'AI-agents die autonoom samenwerken aan je marketingdoelen'
              : 'AI agents that work together autonomously on your marketing goals'}
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeCount}</Text>
              <Text style={styles.statLabel}>{isNl ? 'Actief' : 'Active'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{betaCount}</Text>
              <Text style={styles.statLabel}>Beta</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{comingCount}</Text>
              <Text style={styles.statLabel}>{isNl ? 'Binnenkort' : 'Coming'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{AGENTS.length}</Text>
              <Text style={styles.statLabel}>{isNl ? 'Totaal' : 'Total'}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>
            {isNl ? 'Agent Overzicht' : 'Agent Overview'}
          </Text>

          {/* Agent Cards */}
          {AGENTS.map((agent) => {
            const Icon = agent.iconLib === 'ion' ? Ionicons : MaterialCommunityIcons;
            const statusCfg = STATUS_CONFIG[agent.status];
            const caps = isNl ? agent.capabilitiesNl : agent.capabilities;

            return (
              <TouchableOpacity
                key={agent.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AgentDetail', { agentKind: agent.id as any })}
                style={[
                  styles.agentCard,
                  agent.status === 'coming' && { opacity: 0.6 },
                ]}>
                {/* Agent Header */}
                <View style={styles.agentHeader}>
                  <View style={[styles.agentIconWrap, { backgroundColor: agent.color + '18' }]}>
                    <Icon name={agent.icon as any} size={22} color={agent.color} />
                  </View>
                  <View style={styles.agentTitleRow}>
                    <Text style={styles.agentName}>
                      {isNl ? agent.nameNl : agent.name}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
                      <Text style={[styles.statusText, { color: statusCfg.color }]}>
                        {isNl ? statusCfg.labelNl : statusCfg.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.agentDesc}>
                  {isNl ? agent.descriptionNl : agent.description}
                </Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Capabilities */}
                <View style={styles.capabilitiesRow}>
                  {caps.map((cap, i) => (
                    <View key={i} style={styles.capabilityChip}>
                      <Text style={styles.capabilityText}>{cap}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Orchestration Section */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.sm }]}>
            {isNl ? 'Agent Orchestratie' : 'Agent Orchestration'}
          </Text>

          <View style={styles.orchestrationCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: '#9333EA18',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <MaterialCommunityIcons name="sitemap-outline" size={20} color="#9333EA" />
              </View>
              <Text style={styles.orchestrationTitle}>
                {isNl ? 'Hoe agents samenwerken' : 'How agents collaborate'}
              </Text>
            </View>
            <Text style={styles.orchestrationDesc}>
              {isNl
                ? 'De agents communiceren via een centraal orkestratiesysteem dat taken verdeelt en resultaten combineert.'
                : 'Agents communicate through a central orchestration system that distributes tasks and combines results.'}
            </Text>

            <View style={styles.orchestrationSteps}>
              {[
                {
                  text: isNl
                    ? 'Analytics Agent detecteert kansen en trends'
                    : 'Analytics Agent detects opportunities and trends',
                },
                {
                  text: isNl
                    ? 'Content Agent genereert gepersonaliseerde content'
                    : 'Content Agent generates personalized content',
                },
                {
                  text: isNl
                    ? 'Social Agent plant en publiceert op optimale tijden'
                    : 'Social Agent schedules and publishes at optimal times',
                },
                {
                  text: isNl
                    ? 'Ads Agent zet best presterende content om in betaalde campagnes'
                    : 'Ads Agent turns top-performing content into paid campaigns',
                },
                {
                  text: isNl
                    ? 'Lead Agent volgt op en nurtured nieuwe leads'
                    : 'Lead Agent follows up and nurtures new leads',
                },
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNumber, { backgroundColor: '#9333EA' }]}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </View>
  );
}
