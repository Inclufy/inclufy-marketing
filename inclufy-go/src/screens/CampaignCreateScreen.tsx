import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCreateCampaign, type CampaignCreateInput } from '../hooks/useCampaigns';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CAMPAIGN_TYPES: Array<{ key: CampaignCreateInput['type']; icon: string }> = [
  { key: 'email', icon: 'mail-outline' },
  { key: 'sms', icon: 'chatbubble-outline' },
  { key: 'push', icon: 'notifications-outline' },
  { key: 'multi-channel', icon: 'layers-outline' },
];

export default function CampaignCreateScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const createCampaign = useCreateCampaign();

  const TYPE_LABELS: Record<string, string> = {
    email: t.campaignCreate.typeEmail,
    sms: t.campaignCreate.typeSms,
    push: t.campaignCreate.typePush,
    'multi-channel': t.campaignCreate.typeMultiChannel,
  };

  const [name, setName] = useState('');
  const [type, setType] = useState<CampaignCreateInput['type'] | null>(null);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t.campaignCreate.fillName);
      return;
    }
    if (!type) {
      Alert.alert(t.campaignCreate.selectType);
      return;
    }

    const input: CampaignCreateInput = {
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      starts_at: startDate.trim() || null,
      ends_at: endDate.trim() || null,
      budget_amount: budget ? parseFloat(budget) : null,
    };

    try {
      await createCampaign.mutateAsync(input);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || t.campaignCreate.saveError);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Campaign Name */}
      <Text style={styles.label}>{t.campaignCreate.campaignName}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t.campaignCreate.campaignNamePlaceholder}
        placeholderTextColor={colors.textTertiary}
        autoFocus
      />

      {/* Type */}
      <Text style={styles.label}>{t.campaignCreate.type}</Text>
      <View style={styles.chipRow}>
        {CAMPAIGN_TYPES.map((ct) => {
          const selected = type === ct.key;
          return (
            <TouchableOpacity
              key={ct.key}
              style={[styles.typeChip, selected && styles.typeChipSelected]}
              onPress={() => setType(ct.key)}
            >
              <Ionicons
                name={ct.icon as any}
                size={18}
                color={selected ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                {TYPE_LABELS[ct.key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Description */}
      <Text style={styles.label}>{t.campaignCreate.description}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder={t.campaignCreate.descriptionPlaceholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        numberOfLines={3}
      />

      {/* Start Date */}
      <Text style={styles.label}>{t.campaignCreate.startDate}</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="2026-04-01"
        placeholderTextColor={colors.textTertiary}
      />

      {/* End Date */}
      <Text style={styles.label}>{t.campaignCreate.endDate}</Text>
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={setEndDate}
        placeholder="2026-04-30"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Budget */}
      <Text style={styles.label}>{t.campaignCreate.budget}</Text>
      <TextInput
        style={styles.input}
        value={budget}
        onChangeText={setBudget}
        placeholder={t.campaignCreate.budgetPlaceholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType="numeric"
      />

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, createCampaign.isPending && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={createCampaign.isPending}
      >
        {createCampaign.isPending ? (
          <ActivityIndicator color={colors.textOnPrimary} size="small" />
        ) : (
          <Text style={styles.createButtonText}>{t.campaignCreate.createCampaign}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 60 },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  typeChipTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  createButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
