import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCreateCampaign, useConnectedChannels, type CampaignCreateInput } from '../hooks/useCampaigns';
import type { RootStackParamList } from '../types';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CAMPAIGN_TYPES: Array<{ key: CampaignCreateInput['type']; icon: string; label: string }> = [
  { key: 'email', icon: 'mail-outline', label: 'E-mail' },
  { key: 'sms', icon: 'chatbubble-outline', label: 'SMS' },
  { key: 'push', icon: 'notifications-outline', label: 'Push' },
  { key: 'multi-channel', icon: 'layers-outline', label: 'Multi-channel' },
];

const GOALS = [
  { key: 'leads', icon: 'people-outline', label: 'Meer leads' },
  { key: 'awareness', icon: 'megaphone-outline', label: 'Brand awareness' },
  { key: 'event', icon: 'calendar-outline', label: 'Event promotie' },
  { key: 'retention', icon: 'heart-outline', label: 'Klantretentie' },
  { key: 'launch', icon: 'rocket-outline', label: 'Product launch' },
];

const AUDIENCES = [
  { key: 'all', icon: 'people', label: 'Alle contacten' },
  { key: 'event_visitors', icon: 'calendar', label: 'Event bezoekers' },
  { key: 'leads', icon: 'person-add', label: 'Leads' },
  { key: 'customers', icon: 'star', label: 'Klanten' },
];

const CHANNEL_PLATFORMS = [
  { key: 'linkedin', icon: 'logo-linkedin', label: 'LinkedIn', color: '#0077B5' },
  { key: 'facebook', icon: 'logo-facebook', label: 'Facebook', color: '#1877F2' },
  { key: 'instagram', icon: 'logo-instagram', label: 'Instagram', color: '#E4405F' },
  { key: 'email', icon: 'mail-outline', label: 'E-mail', color: '#6366F1' },
  { key: 'sms', icon: 'chatbubble-outline', label: 'SMS', color: '#059669' },
];

const TOTAL_STEPS = 3;

export default function CampaignCreateScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const createCampaign = useCreateCampaign();
  const { colors } = useTheme();
  const { data: connectedChannels = [] } = useConnectedChannels();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<CampaignCreateInput['type']>('multi-channel');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [adsBudget, setAdsBudget] = useState('');
  const [eventCost, setEventCost] = useState('');
  const [audience, setAudience] = useState<string>('all');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [targetLeads, setTargetLeads] = useState('');
  const [targetRevenue, setTargetRevenue] = useState('');

  const styles = useThemedStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },
    // Progress bar
    progressContainer: {
      flexDirection: 'row' as const,
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    progressBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderLight,
    },
    progressBarActive: {
      backgroundColor: c.primary,
    },
    stepLabel: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      textAlign: 'center' as const,
      marginTop: spacing.xs,
      paddingHorizontal: spacing.lg,
    },
    // Form elements
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.text,
      marginTop: spacing.sm,
    },
    sublabel: {
      fontSize: fontSize.xs,
      color: c.textTertiary,
      marginTop: 2,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: fontSize.md,
      color: c.text,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top' as const,
    },
    chipRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipSelected: {
      backgroundColor: c.primary + '15',
      borderColor: c.primary,
    },
    chipText: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
    },
    chipTextSelected: {
      color: c.primary,
      fontWeight: fontWeight.medium,
    },
    // Channel cards
    channelCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
      marginBottom: spacing.xs,
    },
    channelCardSelected: {
      borderColor: c.primary,
      backgroundColor: c.primary + '08',
    },
    channelIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    channelInfo: { flex: 1 },
    channelName: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    channelStatus: { fontSize: fontSize.xs, marginTop: 2 },
    // Budget split
    budgetSplitRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    budgetSplitField: {
      flex: 1,
    },
    smallInput: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      fontSize: fontSize.sm,
      color: c.text,
    },
    smallLabel: {
      fontSize: fontSize.xs,
      color: c.textTertiary,
      marginBottom: 4,
    },
    // KPI preview
    kpiCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    kpiRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    kpiLabel: { fontSize: fontSize.sm, color: c.textSecondary },
    kpiValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.text },
    kpiHighlight: { color: c.success },
    // Buttons
    buttonRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    backButton: {
      flex: 1,
      borderRadius: borderRadius.md,
      paddingVertical: 16,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    backButtonText: {
      color: c.textSecondary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
    },
    nextButton: {
      flex: 2,
      backgroundColor: c.primary,
      borderRadius: borderRadius.md,
      paddingVertical: 16,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: spacing.xs,
    },
    nextButtonText: {
      color: c.textOnPrimary,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
    },
    buttonDisabled: { opacity: 0.5 },
  }));

  const toggleChannel = (key: string) => {
    setSelectedChannels(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert(t.campaignCreate?.fillName ?? 'Voer een campagnenaam in');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleCreate = async () => {
    const input: CampaignCreateInput = {
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      starts_at: startDate.trim() || null,
      ends_at: endDate.trim() || null,
      budget_amount: budget ? parseFloat(budget) : null,
      goal,
      target_leads: targetLeads ? parseInt(targetLeads) : null,
      target_revenue: targetRevenue ? parseFloat(targetRevenue) : null,
      channels: selectedChannels.length > 0 ? selectedChannels : null,
      audience_filters: { segment: audience },
      settings: {
        ads_budget: adsBudget ? parseFloat(adsBudget) : 0,
        event_cost: eventCost ? parseFloat(eventCost) : 0,
      },
    };

    try {
      await createCampaign.mutateAsync(input);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t.common?.error ?? 'Fout', error.message || 'Campagne aanmaken mislukt');
    }
  };

  // Estimated ROI calculation
  const totalBudget = parseFloat(budget) || 0;
  const estimatedRevenue = parseFloat(targetRevenue) || 0;
  const estimatedROI = totalBudget > 0 ? ((estimatedRevenue - totalBudget) / totalBudget * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[styles.progressBar, i < step && styles.progressBarActive]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        {step === 1 ? 'Stap 1/3 — Basis' : step === 2 ? 'Stap 2/3 — Budget & Kanalen' : 'Stap 3/3 — Doelgroep & KPIs'}
      </Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <>
            {/* Campaign Name */}
            <Text style={styles.label}>{t.campaignCreate?.campaignName ?? 'Campagnenaam'}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="bijv. Zomer Promo 2026"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />

            {/* Type */}
            <Text style={styles.label}>{t.campaignCreate?.type ?? 'Type'}</Text>
            <View style={styles.chipRow}>
              {CAMPAIGN_TYPES.map((ct) => {
                const selected = type === ct.key;
                return (
                  <TouchableOpacity
                    key={ct.key}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setType(ct.key)}
                  >
                    <Ionicons name={ct.icon as any} size={18} color={selected ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{ct.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Goal */}
            <Text style={styles.label}>Doel</Text>
            <Text style={styles.sublabel}>Wat wil je bereiken met deze campagne?</Text>
            <View style={styles.chipRow}>
              {GOALS.map((g) => {
                const selected = goal === g.key;
                return (
                  <TouchableOpacity
                    key={g.key}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setGoal(g.key)}
                  >
                    <Ionicons name={g.icon as any} size={16} color={selected ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{g.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Description */}
            <Text style={styles.label}>{t.campaignCreate?.description ?? 'Beschrijving'}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Wat is het doel van deze campagne?"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </>
        )}

        {step === 2 && (
          <>
            {/* Dates */}
            <Text style={styles.label}>Startdatum</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-04-01"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.label}>Einddatum</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2026-04-30"
              placeholderTextColor={colors.textTertiary}
            />

            {/* Budget */}
            <Text style={styles.label}>Totaal Budget (€)</Text>
            <TextInput
              style={styles.input}
              value={budget}
              onChangeText={setBudget}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />

            {/* Budget split */}
            <Text style={styles.label}>Kosten verdeling (optioneel)</Text>
            <Text style={styles.sublabel}>Verdeel je budget over categorieën</Text>
            <View style={styles.budgetSplitRow}>
              <View style={styles.budgetSplitField}>
                <Text style={styles.smallLabel}>📢 Ads</Text>
                <TextInput
                  style={styles.smallInput}
                  value={adsBudget}
                  onChangeText={setAdsBudget}
                  placeholder="€ 0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.budgetSplitField}>
                <Text style={styles.smallLabel}>🎪 Events</Text>
                <TextInput
                  style={styles.smallInput}
                  value={eventCost}
                  onChangeText={setEventCost}
                  placeholder="€ 0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Channels */}
            <Text style={styles.label}>Kanalen</Text>
            <Text style={styles.sublabel}>Selecteer de kanalen voor deze campagne</Text>
            {CHANNEL_PLATFORMS.map((ch) => {
              const isSelected = selectedChannels.includes(ch.key);
              const isConnected = connectedChannels.some(c => c.platform === ch.key);
              return (
                <TouchableOpacity
                  key={ch.key}
                  style={[styles.channelCard, isSelected && styles.channelCardSelected]}
                  onPress={() => toggleChannel(ch.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.channelIconWrap, { backgroundColor: ch.color + '18' }]}>
                    <Ionicons name={ch.icon as any} size={22} color={ch.color} />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelName}>{ch.label}</Text>
                    <Text style={[styles.channelStatus, { color: isConnected ? colors.success : colors.textTertiary }]}>
                      {isConnected ? '● Verbonden' : '○ Niet verbonden'}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isSelected ? colors.primary : colors.textTertiary}
                  />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {step === 3 && (
          <>
            {/* Audience */}
            <Text style={styles.label}>Doelgroep</Text>
            <Text style={styles.sublabel}>Wie wil je bereiken?</Text>
            <View style={styles.chipRow}>
              {AUDIENCES.map((a) => {
                const selected = audience === a.key;
                return (
                  <TouchableOpacity
                    key={a.key}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setAudience(a.key)}
                  >
                    <Ionicons name={a.icon as any} size={16} color={selected ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Target KPIs */}
            <Text style={styles.label}>Verwachte resultaten</Text>
            <Text style={styles.sublabel}>Stel KPI targets in</Text>

            <Text style={styles.smallLabel}>🎯 Target leads</Text>
            <TextInput
              style={styles.input}
              value={targetLeads}
              onChangeText={setTargetLeads}
              placeholder="bijv. 50"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />

            <View style={{ height: spacing.sm }} />
            <Text style={styles.smallLabel}>💰 Target revenue (€)</Text>
            <TextInput
              style={styles.input}
              value={targetRevenue}
              onChangeText={setTargetRevenue}
              placeholder="bijv. 5000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />

            {/* KPI Preview Card */}
            <View style={{ height: spacing.md }} />
            <View style={styles.kpiCard}>
              <Text style={[styles.label, { marginTop: 0 }]}>📊 Campagne Overzicht</Text>
              <View style={styles.kpiRow}>
                <Text style={styles.kpiLabel}>Budget</Text>
                <Text style={styles.kpiValue}>€{totalBudget.toLocaleString()}</Text>
              </View>
              <View style={styles.kpiRow}>
                <Text style={styles.kpiLabel}>Target revenue</Text>
                <Text style={styles.kpiValue}>€{estimatedRevenue.toLocaleString()}</Text>
              </View>
              <View style={styles.kpiRow}>
                <Text style={styles.kpiLabel}>Verwachte ROI</Text>
                <Text style={[styles.kpiValue, { color: estimatedROI > 0 ? colors.success : estimatedROI < 0 ? colors.error : colors.text }]}>
                  {estimatedROI > 0 ? '+' : ''}{estimatedROI.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.kpiRow}>
                <Text style={styles.kpiLabel}>Kanalen</Text>
                <Text style={styles.kpiValue}>{selectedChannels.length || '—'}</Text>
              </View>
              <View style={styles.kpiRow}>
                <Text style={styles.kpiLabel}>Target leads</Text>
                <Text style={styles.kpiValue}>{targetLeads || '—'}</Text>
              </View>
            </View>
          </>
        )}

        {/* Navigation buttons */}
        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
              <Text style={styles.backButtonText}>Terug</Text>
            </TouchableOpacity>
          )}
          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              style={[styles.nextButton, step === 1 && { flex: 1 }]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Volgende</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, createCampaign.isPending && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={createCampaign.isPending}
            >
              {createCampaign.isPending ? (
                <ActivityIndicator color={colors.textOnPrimary} size="small" />
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={20} color={colors.textOnPrimary} />
                  <Text style={styles.nextButtonText}>Campagne Aanmaken</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
