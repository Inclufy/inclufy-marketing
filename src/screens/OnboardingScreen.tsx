// src/screens/OnboardingScreen.tsx
// Onboarding Wizard — step-by-step setup for new users

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';
import { supabase } from '../services/supabase';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  fields: Array<{ key: string; label: string; placeholder: string; multiline?: boolean }>;
  table: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'organization',
    title: 'Je Organisatie',
    subtitle: 'Vertel ons over je bedrijf',
    icon: 'office-building',
    fields: [
      { key: 'name', label: 'Bedrijfsnaam', placeholder: 'Inclufy' },
      { key: 'industry', label: 'Industrie', placeholder: 'SaaS / Marketing Tech' },
      { key: 'website', label: 'Website', placeholder: 'https://inclufy.com' },
      { key: 'description', label: 'Beschrijving', placeholder: 'Wat doet je bedrijf?', multiline: true },
      { key: 'pitch', label: 'Elevator Pitch', placeholder: '30 seconden pitch...', multiline: true },
    ],
    table: 'go_organization',
  },
  {
    id: 'product',
    title: 'Je Product/Dienst',
    subtitle: 'Voeg je belangrijkste product toe',
    icon: 'package-variant',
    fields: [
      { key: 'name', label: 'Product naam', placeholder: 'AMOS Marketing Platform' },
      { key: 'description', label: 'Beschrijving', placeholder: 'Wat doet het product?', multiline: true },
      { key: 'category', label: 'Categorie', placeholder: 'SaaS / Service / Product' },
    ],
    table: 'go_products',
  },
  {
    id: 'team',
    title: 'Je Team',
    subtitle: 'Voeg een teamlid toe (optioneel)',
    icon: 'account-group',
    fields: [
      { key: 'name', label: 'Naam', placeholder: 'Sami Loukile' },
      { key: 'role', label: 'Functie', placeholder: 'CEO / Marketing Manager' },
    ],
    table: 'go_team_directory',
  },
  {
    id: 'strategy',
    title: 'Marketing Strategie',
    subtitle: 'Basis instellingen',
    icon: 'target',
    fields: [
      { key: 'primary_goal', label: 'Belangrijkste doel', placeholder: 'Brand awareness / Lead generation' },
    ],
    table: 'go_marketing_strategy',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [step.id]: { ...(prev[step.id] || {}), [key]: value },
    }));
  };

  const saveStep = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = formData[step.id] || {};
      if (Object.values(data).every(v => !v.trim())) {
        // Skip empty steps
        goNext();
        return;
      }

      if (step.id === 'strategy') {
        // Strategy has special structure
        const existing = await supabase.from('go_marketing_strategy').select('id').eq('user_id', user.id).maybeSingle();
        if (existing.data) {
          await supabase.from('go_marketing_strategy').update({
            goals: [data.primary_goal].filter(Boolean),
            channels: { linkedin: { active: true, priority: 1 } },
            posts_per_week: 3,
            posting_days: ['ma', 'wo', 'vr'],
            autonomy_level: 'balanced',
            content_mix: { educational: 30, promotional: 20, behind_scenes: 20, thought_leadership: 20, user_generated: 10 },
          }).eq('id', existing.data.id);
        } else {
          await supabase.from('go_marketing_strategy').insert({
            user_id: user.id,
            goals: [data.primary_goal].filter(Boolean),
            channels: { linkedin: { active: true, priority: 1 } },
            posts_per_week: 3,
            posting_days: ['ma', 'wo', 'vr'],
            autonomy_level: 'balanced',
            content_mix: { educational: 30, promotional: 20, behind_scenes: 20, thought_leadership: 20, user_generated: 10 },
          });
        }
      } else if (step.id === 'team') {
        await supabase.from(step.table).insert({
          ...data,
          expertise: [],
          user_id: user.id,
        });
      } else {
        // Check if record exists
        const existing = await supabase.from(step.table).select('id').eq('user_id', user.id).maybeSingle();
        if (existing.data) {
          await supabase.from(step.table).update(data).eq('id', existing.data.id);
        } else {
          await supabase.from(step.table).insert({ ...data, user_id: user.id });
        }
      }
      goNext();
    } catch (err) {
      console.warn('Onboarding save error:', err);
      goNext(); // Still advance
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981' + '20',
            justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
          }}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
          </View>
          <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold as any, color: colors.text, textAlign: 'center' }}>
            Platform Klaar!
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 }}>
            Je organisatie, product en strategie zijn ingesteld. AMOS kan nu gepersonaliseerde content genereren.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Main')}
            style={{
              marginTop: spacing.xl, backgroundColor: colors.primary,
              paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
              borderRadius: borderRadius.lg,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: fontWeight.semibold as any, fontSize: fontSize.md }}>
              Naar Dashboard →
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <TouchableOpacity onPress={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
            Stap {currentStep + 1} van {STEPS.length}
          </Text>
          <TouchableOpacity onPress={goNext}>
            <Text style={{ fontSize: fontSize.sm, color: colors.primary }}>Overslaan</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.lg }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: `${progress}%` }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
        {/* Step Icon + Title */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '15',
            justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
          }}>
            <MaterialCommunityIcons name={step.icon as any} size={32} color={colors.primary} />
          </View>
          <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold as any, color: colors.text }}>{step.title}</Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 }}>{step.subtitle}</Text>
        </View>

        {/* Fields */}
        {step.fields.map(field => (
          <View key={field.key} style={{ marginBottom: spacing.md }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.medium as any, color: colors.text, marginBottom: spacing.xs }}>
              {field.label}
            </Text>
            <TextInput
              value={formData[step.id]?.[field.key] || ''}
              onChangeText={v => updateField(field.key, v)}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textSecondary + '80'}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 3 : 1}
              style={{
                backgroundColor: colors.surface, borderRadius: borderRadius.md,
                borderWidth: 1, borderColor: colors.border,
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                fontSize: fontSize.md, color: colors.text,
                minHeight: field.multiline ? 80 : undefined,
                textAlignVertical: field.multiline ? 'top' : 'center',
              }}
            />
          </View>
        ))}
      </ScrollView>

      {/* Bottom Button */}
      <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <TouchableOpacity
          onPress={saveStep}
          disabled={saving}
          style={{
            backgroundColor: colors.primary, borderRadius: borderRadius.lg,
            paddingVertical: spacing.md, alignItems: 'center',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: fontWeight.semibold as any, fontSize: fontSize.md }}>
            {saving ? 'Opslaan...' : currentStep < STEPS.length - 1 ? 'Volgende →' : 'Afronden ✓'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
