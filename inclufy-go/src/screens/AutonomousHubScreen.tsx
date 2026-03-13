import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';

interface Decision {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  status: string;
  created_at: string;
}

interface ActiveCampaign {
  id: string;
  name: string;
  status: string;
  ai_generated: boolean;
}

function formatDate(iso: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

export default function AutonomousHubScreen() {
  const navigation = useNavigation<any>();
  const [systemActive, setSystemActive] = useState(true);
  const [autonomyLevel, setAutonomyLevel] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  // Fetch real data from Supabase
  const { data: campaigns = [], isLoading: loadingCampaigns, refetch } = useQuery({
    queryKey: ['autonomous_campaigns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status, ai_generated')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) return [];
      return (data || []) as ActiveCampaign[];
    },
  });

  const { data: feedItems = [] } = useQuery({
    queryKey: ['feed_items_hub'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('feed_items')
        .select('id, type, title, description, urgency, estimated_value, is_actioned, timestamp')
        .eq('user_id', user.id)
        .eq('urgency', 'immediate')
        .eq('is_actioned', false)
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  const actionedCount = feedItems.filter((f: any) => f.is_actioned).length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  const AUTONOMY_OPTIONS = [
    { key: 'conservative', label: 'Conservatief', desc: 'Altijd goedkeuring', color: '#10B981' },
    { key: 'balanced', label: 'Balanced', desc: 'AI binnen grenzen', color: '#3B82F6' },
    { key: 'aggressive', label: 'Agressief', desc: 'Volledig autonoom', color: '#9333EA' },
  ] as const;

  const AI_MODULES = [
    { icon: 'trending-up', label: 'Trend Monitoring', desc: 'Monitort 24/7 trending topics', active: true, color: '#EC4899', lib: 'ion' as const },
    { icon: 'megaphone', label: 'Campaign Engine', desc: `${activeCampaigns} actieve campagnes`, active: activeCampaigns > 0, color: '#3B82F6', lib: 'ion' as const },
    { icon: 'people', label: 'Lead Scoring', desc: 'Scoort leads automatisch', active: true, color: '#8B5CF6', lib: 'ion' as const },
    { icon: 'calendar', label: 'Event Intelligence', desc: 'Scant events in regio', active: true, color: '#10B981', lib: 'ion' as const },
    { icon: 'robot-outline', label: 'Content AI', desc: 'Genereert content 24/7', active: true, color: '#F59E0B', lib: 'mci' as const },
    { icon: 'bar-chart', label: 'Budget Optimizer', desc: 'Optimaliseert ROI', active: false, color: '#06B6D4', lib: 'ion' as const },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loadingCampaigns} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={['#1E0A4E', '#4C1D95', '#7C3AED']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="brain" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Autonoom Marketing Hub</Text>
            <Text style={styles.headerSub}>Je AI marketing brein — 24/7</Text>
          </View>
          <View style={styles.systemToggle}>
            <Text style={styles.systemLabel}>{systemActive ? 'Actief' : 'Uit'}</Text>
            <Switch
              value={systemActive}
              onValueChange={setSystemActive}
              trackColor={{ true: '#10B981', false: '#374151' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>89%</Text>
            <Text style={styles.statLabel}>Systeemgezondheid</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{feedItems.length}</Text>
            <Text style={styles.statLabel}>Wachtende Acties</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeCampaigns}</Text>
            <Text style={styles.statLabel}>AI Campagnes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>60%</Text>
            <Text style={styles.statLabel}>Slagingspercentage</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Autonomy Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autonomie Niveau</Text>
          <View style={styles.autonomyRow}>
            {AUTONOMY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.autonomyBtn, autonomyLevel === opt.key && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
                onPress={() => setAutonomyLevel(opt.key)}
              >
                <Text style={[styles.autonomyLabel, autonomyLevel === opt.key && { color: opt.color }]}>{opt.label}</Text>
                <Text style={styles.autonomyDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pending Actions */}
        {feedItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Wachtende Acties</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OpportunityFeed')}>
                <Text style={styles.seeAll}>Alle →</Text>
              </TouchableOpacity>
            </View>
            {feedItems.map((item: any) => (
              <View key={item.id} style={styles.decisionCard}>
                <View style={styles.decisionLeft}>
                  <View style={[styles.urgencyDot, { backgroundColor: '#EF4444' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.decisionTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.decisionDesc} numberOfLines={1}>{item.description}</Text>
                  </View>
                </View>
                {(item.estimated_value || 0) > 0 && (
                  <Text style={styles.decisionValue}>€{Math.round(item.estimated_value / 1000)}K</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Active Campaigns */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actieve AI Campagnes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CampaignsTab')}>
              <Text style={styles.seeAll}>Alle →</Text>
            </TouchableOpacity>
          </View>
          {loadingCampaigns ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : campaigns.length === 0 ? (
            <View style={styles.emptySmall}>
              <Text style={styles.emptySmallText}>Nog geen campagnes. Maak je eerste AI campagne.</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CampaignCreate')}
              >
                <Text style={styles.createBtnText}>+ Campagne Starten</Text>
              </TouchableOpacity>
            </View>
          ) : (
            campaigns.map(c => (
              <View key={c.id} style={styles.campaignRow}>
                <View style={[styles.campaignStatus, { backgroundColor: c.status === 'active' ? '#10B981' : '#6B7280' }]} />
                <Text style={styles.campaignName} numberOfLines={1}>{c.name}</Text>
                <View style={styles.campaignBadges}>
                  {c.ai_generated && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                  <Text style={styles.campaignStatusText}>{c.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* AI Module Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Module Status</Text>
          <View style={styles.modulesGrid}>
            {AI_MODULES.map((mod, i) => {
              const IconComp = mod.lib === 'mci' ? MaterialCommunityIcons : Ionicons;
              return (
                <View key={i} style={[styles.moduleCard, !mod.active && styles.moduleInactive]}>
                  <View style={[styles.moduleIcon, { backgroundColor: mod.color + '20' }]}>
                    <IconComp name={mod.icon as any} size={20} color={mod.active ? mod.color : colors.textTertiary} />
                  </View>
                  <Text style={[styles.moduleName, !mod.active && styles.moduleNameInactive]}>{mod.label}</Text>
                  <Text style={styles.moduleDesc} numberOfLines={1}>{mod.desc}</Text>
                  <View style={[styles.moduleStatus, { backgroundColor: mod.active ? '#10B98120' : '#6B728020' }]}>
                    <View style={[styles.moduleDot, { backgroundColor: mod.active ? '#10B981' : '#6B7280' }]} />
                    <Text style={[styles.moduleStatusText, { color: mod.active ? '#10B981' : '#6B7280' }]}>
                      {mod.active ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Snelle Acties</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('ContentCreator')}>
              <Ionicons name="create" size={20} color={colors.primary} />
              <Text style={styles.quickBtnText}>Content Genereren</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('EventIntelligence')}>
              <MaterialCommunityIcons name="radar" size={20} color={colors.primary} />
              <Text style={styles.quickBtnText}>Events Scannen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('OpportunityFeed')}>
              <Ionicons name="radio" size={20} color={colors.primary} />
              <Text style={styles.quickBtnText}>Opportunity Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('CampaignCreate')}>
              <Ionicons name="megaphone" size={20} color={colors.primary} />
              <Text style={styles.quickBtnText}>Campagne Starten</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, gap: spacing.md, paddingTop: spacing.lg },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#fff' },
  headerSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)' },
  systemToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  systemLabel: { fontSize: fontSize.xs, color: '#fff', fontWeight: fontWeight.medium },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: borderRadius.md, padding: spacing.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#fff' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2, textAlign: 'center' },
  content: { padding: spacing.md, gap: spacing.md },
  section: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, gap: spacing.sm, ...subtleShadow,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  seeAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
  autonomyRow: { flexDirection: 'row', gap: spacing.xs },
  autonomyBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', gap: 2,
  },
  autonomyLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textSecondary },
  autonomyDesc: { fontSize: 9, color: colors.textTertiary, textAlign: 'center' },
  decisionCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.background, borderRadius: borderRadius.sm, padding: spacing.sm,
  },
  decisionLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  urgencyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  decisionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, lineHeight: 18 },
  decisionDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  decisionValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.success },
  emptySmall: { alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  emptySmallText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  createBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  createBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  campaignRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.background, borderRadius: borderRadius.sm, padding: spacing.sm,
  },
  campaignStatus: { width: 8, height: 8, borderRadius: 4 },
  campaignName: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  campaignBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  aiBadge: { backgroundColor: colors.primary + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  aiBadgeText: { fontSize: 9, color: colors.primary, fontWeight: fontWeight.bold },
  campaignStatusText: { fontSize: fontSize.xs, color: colors.textSecondary },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moduleCard: {
    width: '47%', backgroundColor: colors.background,
    borderRadius: borderRadius.md, padding: spacing.sm, gap: 4,
  },
  moduleInactive: { opacity: 0.55 },
  moduleIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  moduleName: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.text },
  moduleNameInactive: { color: colors.textTertiary },
  moduleDesc: { fontSize: 10, color: colors.textSecondary },
  moduleStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  moduleDot: { width: 5, height: 5, borderRadius: 3 },
  moduleStatusText: { fontSize: 9, fontWeight: fontWeight.semibold },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickBtn: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.background, borderRadius: borderRadius.md,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  quickBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text, flex: 1 },
});
