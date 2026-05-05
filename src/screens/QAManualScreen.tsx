// src/screens/QAManualScreen.tsx
// QA Validation Manual — in-app testing checklist for all 77 scanned issues

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { KNOWN_ISSUES, FIX_HISTORY } from '../services/scanning-agent.service';

const SEV_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
};

const STATUS_COLOR: Record<string, string> = {
  fixed: '#10B981',
  open: '#EF4444',
  'in-progress': '#F59E0B',
  'wont-fix': '#6B7280',
};

type Filter = 'all' | 'fixed' | 'open' | 'critical' | 'high' | 'medium' | 'low';

export default function QAManualScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fixMap = useMemo(() => {
    const m: Record<string, string> = {};
    FIX_HISTORY.forEach(f => { m[f.id] = f.fix; });
    return m;
  }, []);

  const filtered = useMemo(() => {
    let items = [...KNOWN_ISSUES];
    if (filter === 'fixed') items = items.filter(i => i.status === 'fixed');
    else if (filter === 'open') items = items.filter(i => i.status === 'open');
    else if (['critical', 'high', 'medium', 'low'].includes(filter)) {
      items = items.filter(i => i.severity === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.screen.toLowerCase().includes(q)
      );
    }
    return items;
  }, [filter, search]);

  const stats = useMemo(() => ({
    total: KNOWN_ISSUES.length,
    fixed: KNOWN_ISSUES.filter(i => i.status === 'fixed').length,
    open: KNOWN_ISSUES.filter(i => i.status === 'open').length,
    critical: KNOWN_ISSUES.filter(i => i.severity === 'critical' && i.status !== 'fixed').length,
    high: KNOWN_ISSUES.filter(i => i.severity === 'high' && i.status !== 'fixed').length,
  }), []);

  const FILTERS: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: 'Alle' },
    { key: 'fixed', label: 'Fixed' },
    { key: 'open', label: 'Open' },
    { key: 'critical', label: 'Critical' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.xs }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: colors.text }}>
          QA Validatie Manual
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Summary bar */}
      <View style={{
        flexDirection: 'row', backgroundColor: colors.surface,
        paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        gap: spacing.md,
      }}>
        {[
          { label: 'Totaal', value: stats.total, color: colors.text },
          { label: 'Fixed', value: stats.fixed, color: '#10B981' },
          { label: 'Open', value: stats.open, color: '#EF4444' },
          { label: 'Critical', value: stats.critical, color: '#EF4444' },
          { label: 'High', value: stats.high, color: '#F59E0B' },
        ].map(s => (
          <View key={s.label} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: s.color }}>{s.value}</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={{
        margin: spacing.sm, flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: borderRadius.md,
        borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm,
      }}>
        <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
        <TextInput
          style={{ flex: 1, color: colors.text, fontSize: fontSize.sm, paddingVertical: 8, marginLeft: 6 }}
          placeholder="Zoek op ID, scherm of titel..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.sm, gap: spacing.xs, paddingBottom: spacing.xs }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 20,
              backgroundColor: filter === f.key ? colors.primary : colors.surface,
              borderWidth: 1, borderColor: filter === f.key ? colors.primary : colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: filter === f.key ? '#fff' : colors.textSecondary, fontWeight: fontWeight.medium as any }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xs, fontSize: 11, color: colors.textSecondary }}>
        {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
      </Text>

      {/* Issue list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.sm, gap: spacing.sm }}>
        {filtered.map(issue => {
          const isOpen = expanded[issue.id];
          const fixNote = fixMap[issue.id];
          return (
            <View key={issue.id} style={{
              backgroundColor: colors.surface, borderRadius: borderRadius.md,
              borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
            }}>
              {/* Row header */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpanded(prev => ({ ...prev, [issue.id]: !isOpen }))}
                style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm }}
              >
                {/* Status dot */}
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: STATUS_COLOR[issue.status] ?? '#6B7280',
                }} />

                {/* ID + title */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: fontWeight.bold as any, color: SEV_COLOR[issue.severity] }}>
                      {issue.id}
                    </Text>
                    <View style={{
                      paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6,
                      backgroundColor: SEV_COLOR[issue.severity] + '20',
                    }}>
                      <Text style={{ fontSize: 9, color: SEV_COLOR[issue.severity], fontWeight: fontWeight.semibold as any }}>
                        {issue.severity.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6,
                      backgroundColor: STATUS_COLOR[issue.status] + '20',
                    }}>
                      <Text style={{ fontSize: 9, color: STATUS_COLOR[issue.status], fontWeight: fontWeight.semibold as any }}>
                        {issue.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium as any }} numberOfLines={isOpen ? undefined : 2}>
                    {issue.title}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>{issue.screen}</Text>
                </View>

                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Expanded detail */}
              {isOpen && (
                <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, gap: 10 }}>
                  <View style={{ height: 1, backgroundColor: colors.border }} />

                  {/* Steps to reproduce */}
                  <Section title="Stappen om te reproduceren" icon="list-outline" color="#3B82F6">
                    {issue.stepsToReproduce.map((step, i) => (
                      <Text key={i} style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{step}</Text>
                    ))}
                  </Section>

                  {/* Expected */}
                  <Section title="Verwacht gedrag" icon="checkmark-circle-outline" color="#10B981">
                    <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{issue.expectedBehavior}</Text>
                  </Section>

                  {/* Actual (only show if not fixed) */}
                  {issue.status !== 'fixed' && (
                    <Section title="Huidig gedrag (bug)" icon="alert-circle-outline" color="#EF4444">
                      <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{issue.actualBehavior}</Text>
                    </Section>
                  )}

                  {/* Fix applied */}
                  {fixNote && (
                    <Section title="Toegepaste fix" icon="construct-outline" color="#10B981">
                      <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{fixNote}</Text>
                    </Section>
                  )}

                  {/* Affected file */}
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="document-outline" size={12} color={colors.textSecondary} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                      {issue.affectedFile}  ·  lines {issue.affectedLines}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name={icon as any} size={12} color={color} />
        <Text style={{ fontSize: 11, fontWeight: fontWeight.semibold as any, color }}>{title}</Text>
      </View>
      <View style={{ paddingLeft: 16 }}>{children}</View>
    </View>
  );
}
