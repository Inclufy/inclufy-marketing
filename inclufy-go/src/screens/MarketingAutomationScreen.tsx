import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';

type AutopilotMode = 'manual' | 'assisted' | 'autopilot';
type TriggerType = 'new_lead' | 'event' | 'engagement' | 'budget' | 'campaign';

interface Automation {
  id: string;
  trigger: TriggerType;
  triggerLabel: string;
  action: string;
  enabled: boolean;
  runsCount: number;
  lastRun?: string;
}

const TRIGGER_ICONS: Record<TriggerType, { icon: string; color: string; bg: string; lib: string }> = {
  new_lead: { icon: 'person-add-outline', color: '#10b981', bg: '#D1FAE5', lib: 'Ionicons' },
  event: { icon: 'calendar-outline', color: '#DB2777', bg: '#FCE7F3', lib: 'Ionicons' },
  engagement: { icon: 'trending-up-outline', color: '#9333EA', bg: '#F3E8FF', lib: 'Ionicons' },
  budget: { icon: 'cash-outline', color: '#D97706', bg: '#FEF3C7', lib: 'Ionicons' },
  campaign: { icon: 'megaphone-outline', color: '#3b82f6', bg: '#EFF6FF', lib: 'Ionicons' },
};

const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: '1',
    trigger: 'new_lead',
    triggerLabel: 'New lead captured',
    action: 'Send welcome email + LinkedIn connect suggestion',
    enabled: true,
    runsCount: 47,
    lastRun: '2h ago',
  },
  {
    id: '2',
    trigger: 'event',
    triggerLabel: 'Event starts in 24h',
    action: 'Post reminder on LinkedIn + Instagram',
    enabled: true,
    runsCount: 12,
    lastRun: '1d ago',
  },
  {
    id: '3',
    trigger: 'engagement',
    triggerLabel: 'Engagement spike detected',
    action: 'Notify team + suggest follow-up content',
    enabled: false,
    runsCount: 8,
    lastRun: '3d ago',
  },
  {
    id: '4',
    trigger: 'budget',
    triggerLabel: 'Budget threshold reached (80%)',
    action: 'Pause lowest ROI campaign + alert',
    enabled: true,
    runsCount: 3,
    lastRun: '1w ago',
  },
  {
    id: '5',
    trigger: 'campaign',
    triggerLabel: 'Campaign ends',
    action: 'Generate performance report + AI recap',
    enabled: false,
    runsCount: 19,
    lastRun: '5d ago',
  },
];

const AUTOPILOT_OPTIONS: Array<{ mode: AutopilotMode; label: string; desc: string; icon: string }> = [
  { mode: 'manual', label: 'Manual', desc: 'You control everything', icon: 'hand-left-outline' },
  { mode: 'assisted', label: 'Assisted', desc: 'AI suggests, you approve', icon: 'sparkles-outline' },
  { mode: 'autopilot', label: 'Autopilot', desc: 'AI acts automatically', icon: 'rocket-outline' },
];

export default function MarketingAutomationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [autopilot, setAutopilot] = useState<AutopilotMode>('assisted');
  const [automations, setAutomations] = useState<Automation[]>(MOCK_AUTOMATIONS);

  const toggleAutomation = (id: string) => {
    setAutomations(prev =>
      prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
    );
  };

  const handleAddAutomation = () => {
    Alert.alert(
      'New Automation',
      'Custom automation builder coming soon. For now, enable/disable the pre-built automations above.',
      [{ text: 'OK' }]
    );
  };

  const activeCount = automations.filter(a => a.enabled).length;
  const totalRuns = automations.reduce((sum, a) => sum + a.runsCount, 0);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Autopilot Mode Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AUTOPILOT MODE</Text>
          <View style={styles.modeRow}>
            {AUTOPILOT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.mode}
                style={[styles.modeCard, autopilot === opt.mode && styles.modeCardActive]}
                onPress={() => setAutopilot(opt.mode)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={22}
                  color={autopilot === opt.mode ? '#fff' : colors.textSecondary}
                />
                <Text style={[styles.modeLabel, autopilot === opt.mode && styles.modeLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={[styles.modeDesc, autopilot === opt.mode && styles.modeDescActive]}>
                  {opt.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{activeCount}</Text>
            <Text style={styles.statLbl}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalRuns}</Text>
            <Text style={styles.statLbl}>Total runs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>2.4h</Text>
            <Text style={styles.statLbl}>Time saved</Text>
          </View>
        </View>

        {/* Automations List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>AUTOMATIONS</Text>
            <TouchableOpacity onPress={handleAddAutomation} style={styles.addBtn}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {automations.map(auto => {
            const cfg = TRIGGER_ICONS[auto.trigger];
            return (
              <View key={auto.id} style={[styles.autoCard, !auto.enabled && styles.autoCardDisabled]}>
                <View style={styles.autoTop}>
                  <View style={[styles.autoIcon, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
                  </View>
                  <View style={styles.autoInfo}>
                    <Text style={styles.autoTrigger}>{auto.triggerLabel}</Text>
                    <Text style={styles.autoAction} numberOfLines={2}>{auto.action}</Text>
                  </View>
                  <Switch
                    value={auto.enabled}
                    onValueChange={() => toggleAutomation(auto.id)}
                    trackColor={{ false: colors.border, true: colors.primary + '60' }}
                    thumbColor={auto.enabled ? colors.primary : '#f4f3f4'}
                  />
                </View>
                {auto.enabled && auto.lastRun && (
                  <View style={styles.autoMeta}>
                    <Text style={styles.autoMetaText}>
                      {auto.runsCount} runs · Last: {auto.lastRun}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Activity Log placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
          {[
            { time: '2h ago', msg: 'Welcome email sent to Thomas Bakker (new lead)' },
            { time: '1d ago', msg: 'LinkedIn reminder posted for Iftar Event 2026' },
            { time: '1d ago', msg: 'Budget alert: Email campaign at 83% of budget' },
          ].map((log, i) => (
            <View key={i} style={styles.logRow}>
              <View style={styles.logDot} />
              <View style={styles.logInfo}>
                <Text style={styles.logMsg}>{log.msg}</Text>
                <Text style={styles.logTime}>{log.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  modeRow: { flexDirection: 'row', gap: spacing.xs },
  modeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
  },
  modeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.text },
  modeLabelActive: { color: '#fff' },
  modeDesc: { fontSize: 10, color: colors.textTertiary, textAlign: 'center' },
  modeDescActive: { color: 'rgba(255,255,255,0.75)' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  statLbl: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addBtnText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
  autoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  autoCardDisabled: { opacity: 0.55 },
  autoTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  autoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  autoInfo: { flex: 1 },
  autoTrigger: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary, marginBottom: 3 },
  autoAction: { fontSize: fontSize.sm, color: colors.text, lineHeight: 18 },
  autoMeta: { marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderLight },
  autoMetaText: { fontSize: fontSize.xs, color: colors.textTertiary },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5, flexShrink: 0 },
  logInfo: { flex: 1 },
  logMsg: { fontSize: fontSize.sm, color: colors.text, lineHeight: 18 },
  logTime: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
});
