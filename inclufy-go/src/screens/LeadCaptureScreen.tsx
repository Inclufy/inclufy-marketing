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
import { useCreateContact } from '../hooks/useContacts';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation } from '../i18n';

export default function LeadCaptureScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const createContact = useCreateContact();

  const SOURCE_OPTIONS = [
    { key: 'event', label: t.sources.event },
    { key: 'website', label: t.sources.website },
    { key: 'referral', label: t.sources.referral },
    { key: 'linkedin', label: t.sources.linkedin },
    { key: 'cold', label: t.sources.cold },
  ] as const;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('');
  const [tags, setTags] = useState('');
  const [source, setSource] = useState<string>('event');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setCity('');
    setTags('');
    setSource('event');
    setNotes('');
    setSaved(false);
  };

  const handleSave = async () => {
    if (!firstName.trim() && !email.trim()) {
      Alert.alert(t.common.required, t.leadCapture.requiredMsg);
      return;
    }

    const tagList = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      await createContact.mutateAsync({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        email: email.trim().toLowerCase() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        source,
        tags: tagList,
        attributes: {
          company: company.trim() || undefined,
          notes: notes.trim() || undefined,
          captured_via: 'inclufy_go',
        },
      });

      setSaved(true);
    } catch (error: any) {
      const detail = error?.response?.data?.detail || t.leadCapture.saveError;
      Alert.alert(t.common.error, detail);
    }
  };

  const handleFollowUp = () => {
    Alert.alert(
      t.leadCapture.followUpTitle,
      t.leadCapture.followUpMsg,
      [
        { text: t.leadCapture.later, style: 'cancel' },
        {
          text: t.leadCapture.startCampaign,
          onPress: () => {
            Alert.alert(t.common.comingSoon, t.leadCapture.followUpComingSoon);
          },
        },
      ],
    );
  };

  // Success state
  if (saved) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>{'\u2713'}</Text>
          </View>
          <Text style={styles.successTitle}>{t.leadCapture.leadSaved}</Text>
          <Text style={styles.successSubtitle}>
            {firstName} {lastName} {t.leadCapture.addedToContacts}
          </Text>

          <View style={styles.successActions}>
            <TouchableOpacity style={styles.followUpBtn} onPress={handleFollowUp}>
              <Text style={styles.followUpBtnText}>{t.leadCapture.startFollowUp}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newLeadBtn} onPress={resetForm}>
              <Text style={styles.newLeadBtnText}>{t.leadCapture.newLead}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backBtnText}>{t.leadCapture.backToOverview}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.leadCapture.title}</Text>
        <Text style={styles.subtitle}>{t.leadCapture.subtitle}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.leadCapture.personalInfo}</Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t.leadCapture.firstName}</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t.leadCapture.firstNamePlaceholder}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t.leadCapture.lastName}</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t.leadCapture.lastNamePlaceholder}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.leadCapture.email}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t.leadCapture.emailPlaceholder}
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.leadCapture.phone}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t.leadCapture.phonePlaceholder}
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.leadCapture.companyInfo}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t.leadCapture.company}</Text>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder={t.leadCapture.companyPlaceholder}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.leadCapture.city}</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder={t.leadCapture.cityPlaceholder}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.leadCapture.tags}</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder={t.leadCapture.tagsPlaceholder}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Source */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.leadCapture.source}</Text>
          <View style={styles.chipRow}>
            {SOURCE_OPTIONS.map((opt) => {
              const isSelected = source === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setSource(opt.key)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.leadCapture.notes}</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t.leadCapture.notesPlaceholder}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, createContact.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={createContact.isPending}
          activeOpacity={0.8}
        >
          {createContact.isPending ? (
            <ActivityIndicator color={colors.textOnPrimary} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{t.common.save}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...subtleShadow,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  field: {},
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },

  // Success state
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successIconText: {
    fontSize: 36,
    color: colors.success,
    fontWeight: fontWeight.bold,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  successActions: {
    width: '100%',
    gap: spacing.sm,
  },
  followUpBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  followUpBtnText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  newLeadBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.primary + '08',
  },
  newLeadBtnText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  backBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
