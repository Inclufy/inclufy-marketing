// src/screens/QAManualScreen.tsx
// In-app manual: every screen, its functions, linked issues, and applied fixes.

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { KNOWN_ISSUES, FIX_HISTORY, APP_MANUAL } from '../services/scanning-agent.service';

// ─── Colour maps ─────────────────────────────────────────────────────────────

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

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'manual' | 'issues';
type SevFilter = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'fixed' | 'open';

// ─── Small helpers ────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: color + '25' }}>
      <Text style={{ fontSize: 9, color, fontWeight: '700' }}>{label.toUpperCase()}</Text>
    </View>
  );
}

function SectionHeader({ title, icon, color }: { title: string; icon: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={{ fontSize: 11, fontWeight: '600' as any, color }}>{title}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function QAManualScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [tab, setTab] = useState<Tab>('manual');
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState<SevFilter>('all');
  const [expandedScreens, setExpandedScreens] = useState<Record<string, boolean>>({});
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});

  // Pre-build fix map and issue map for O(1) lookups
  const fixMap = useMemo(() => {
    const m: Record<string, string> = {};
    FIX_HISTORY.forEach(f => { m[f.id] = f.fix; });
    return m;
  }, []);

  const issueMap = useMemo(() => {
    const m: Record<string, typeof KNOWN_ISSUES[0]> = {};
    KNOWN_ISSUES.forEach(i => { m[i.id] = i; });
    return m;
  }, []);

  // Summary stats
  const stats = useMemo(() => ({
    total: KNOWN_ISSUES.length,
    fixed: KNOWN_ISSUES.filter(i => i.status === 'fixed').length,
    open: KNOWN_ISSUES.filter(i => i.status === 'open').length,
    screens: APP_MANUAL.length,
    functions: APP_MANUAL.reduce((s, m) => s + m.functions.length, 0),
  }), []);

  // ── Manual tab: filtered screens ──────────────────────────────────────────
  const filteredManual = useMemo(() => {
    if (!search.trim()) return APP_MANUAL;
    const q = search.toLowerCase();
    return APP_MANUAL.filter(m =>
      m.screen.toLowerCase().includes(q) ||
      m.purpose.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.functions.some(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
    );
  }, [search]);

  const manualCategories = useMemo(() => [...new Set(filteredManual.map(m => m.category))], [filteredManual]);

  // ── Issues tab: filtered issues ───────────────────────────────────────────
  const filteredIssues = useMemo(() => {
    let items = [...KNOWN_ISSUES];
    if (sevFilter === 'fixed') items = items.filter(i => i.status === 'fixed');
    else if (sevFilter === 'open') items = items.filter(i => i.status === 'open');
    else if (['critical', 'high', 'medium', 'low'].includes(sevFilter)) {
      items = items.filter(i => i.severity === sevFilter);
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
  }, [sevFilter, search]);

  const toggleScreen = (key: string) =>
    setExpandedScreens(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleIssue = (id: string) =>
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.xs }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: colors.text }}>
          App Function Manual
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* ── Stats bar ── */}
      <View style={{
        flexDirection: 'row', backgroundColor: colors.surface,
        paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md,
      }}>
        {[
          { label: 'Screens', value: stats.screens, color: colors.primary },
          { label: 'Functions', value: stats.functions, color: '#6366F1' },
          { label: 'Issues', value: stats.total, color: colors.text },
          { label: 'Fixed', value: stats.fixed, color: '#10B981' },
          { label: 'Open', value: stats.open, color: stats.open > 0 ? '#EF4444' : '#10B981' },
        ].map(s => (
          <View key={s.label} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: s.color }}>{s.value}</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Tab switcher ── */}
      <View style={{
        flexDirection: 'row', backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        {([['manual', 'book-outline', 'Functie Manual'], ['issues', 'bug-outline', 'Issue Tracker']] as const).map(([key, icon, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTab(key)}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 6, paddingVertical: spacing.sm,
              borderBottomWidth: 2,
              borderBottomColor: tab === key ? colors.primary : 'transparent',
            }}
          >
            <Ionicons name={icon} size={15} color={tab === key ? colors.primary : colors.textSecondary} />
            <Text style={{ fontSize: fontSize.sm, color: tab === key ? colors.primary : colors.textSecondary, fontWeight: (tab === key ? fontWeight.semibold : fontWeight.regular) as any }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Search ── */}
      <View style={{
        margin: spacing.sm, flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: borderRadius.md,
        borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm,
      }}>
        <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
        <TextInput
          style={{ flex: 1, color: colors.text, fontSize: fontSize.sm, paddingVertical: 8, marginLeft: 6 }}
          placeholder={tab === 'manual' ? 'Zoek scherm, functie, categorie...' : 'Zoek op ID, scherm of titel...'}
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

      {/* ── Issue filter chips (issues tab only) ── */}
      {tab === 'issues' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.sm, gap: spacing.xs, paddingBottom: spacing.xs }}>
          {(['all', 'fixed', 'open', 'critical', 'high', 'medium', 'low'] as SevFilter[]).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setSevFilter(f)}
              style={{
                paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 20,
                backgroundColor: sevFilter === f ? colors.primary : colors.surface,
                borderWidth: 1, borderColor: sevFilter === f ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 12, color: sevFilter === f ? '#fff' : colors.textSecondary, fontWeight: fontWeight.medium as any }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Content ── */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.sm, gap: spacing.sm }}>

        {/* ════ MANUAL TAB ════ */}
        {tab === 'manual' && (
          <>
            {manualCategories.map(cat => {
              const screens = filteredManual.filter(m => m.category === cat);
              return (
                <View key={cat} style={{ gap: spacing.xs }}>
                  {/* Category header */}
                  <Text style={{
                    fontSize: 11, fontWeight: fontWeight.bold as any,
                    color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6,
                    paddingLeft: 2, marginTop: spacing.xs,
                  }}>
                    {cat}
                  </Text>

                  {screens.map(entry => {
                    const isOpen = !!expandedScreens[entry.route];
                    const affectedCount = entry.functions.filter(f => f.issueIds && f.issueIds.length > 0).length;

                    return (
                      <View key={entry.route} style={{
                        backgroundColor: colors.surface, borderRadius: borderRadius.md,
                        borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
                      }}>
                        {/* Screen row */}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => toggleScreen(entry.route)}
                          style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm }}
                        >
                          <View style={{
                            width: 34, height: 34, borderRadius: 9,
                            backgroundColor: colors.primary + '18',
                            justifyContent: 'center', alignItems: 'center',
                          }}>
                            <Ionicons name="phone-portrait-outline" size={17} color={colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold as any, color: colors.text }}>
                                {entry.screen}
                              </Text>
                              {affectedCount > 0 && (
                                <Badge label={`${affectedCount} fix${affectedCount > 1 ? 'es' : ''}`} color="#10B981" />
                              )}
                            </View>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={isOpen ? undefined : 1}>
                              {entry.purpose}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>{entry.functions.length}</Text>
                          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Expanded function list */}
                        {isOpen && (
                          <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
                            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: spacing.sm }} />
                            {entry.functions.map((fn, i) => {
                              const linkedIssues = (fn.issueIds || []).map(id => issueMap[id]).filter(Boolean);
                              return (
                                <View key={i} style={{
                                  paddingVertical: 8,
                                  borderBottomWidth: i < entry.functions.length - 1 ? 1 : 0,
                                  borderBottomColor: colors.border,
                                  gap: 5,
                                }}>
                                  {/* Function name */}
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold as any, color: colors.primary, fontFamily: 'monospace' }}>
                                      {fn.name}
                                    </Text>
                                    {linkedIssues.map(issue => (
                                      <Badge key={issue.id} label={issue.id} color={SEV_COLOR[issue.severity]} />
                                    ))}
                                  </View>

                                  {/* Description */}
                                  <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18, paddingLeft: 4 }}>
                                    {fn.description}
                                  </Text>

                                  {/* Linked issue resolutions */}
                                  {linkedIssues.map(issue => {
                                    const fix = fixMap[issue.id];
                                    return (
                                      <View key={issue.id} style={{
                                        marginLeft: 4, marginTop: 3,
                                        padding: 7, borderRadius: 7,
                                        backgroundColor: STATUS_COLOR[issue.status] + '12',
                                        borderLeftWidth: 2, borderLeftColor: STATUS_COLOR[issue.status],
                                        gap: 3,
                                      }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                          <Ionicons
                                            name={issue.status === 'fixed' ? 'checkmark-circle' : 'alert-circle'}
                                            size={11}
                                            color={STATUS_COLOR[issue.status]}
                                          />
                                          <Text style={{ fontSize: 10, fontWeight: '700' as any, color: STATUS_COLOR[issue.status] }}>
                                            {issue.id} · {issue.status.toUpperCase()} · {issue.severity.toUpperCase()}
                                          </Text>
                                        </View>
                                        <Text style={{ fontSize: 10, color: colors.text, lineHeight: 15 }}>
                                          <Text style={{ fontWeight: '600' as any }}>Probleem: </Text>
                                          {issue.title}
                                        </Text>
                                        {fix && (
                                          <Text style={{ fontSize: 10, color: colors.text, lineHeight: 15 }}>
                                            <Text style={{ fontWeight: '600' as any }}>Oplossing: </Text>
                                            {fix}
                                          </Text>
                                        )}
                                      </View>
                                    );
                                  })}
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
            {filteredManual.length === 0 && (
              <Text style={{ textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.xl }}>
                Geen resultaten voor "{search}"
              </Text>
            )}
          </>
        )}

        {/* ════ ISSUES TAB ════ */}
        {tab === 'issues' && (
          <>
            <Text style={{ fontSize: 11, color: colors.textSecondary, paddingHorizontal: 2 }}>
              {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
            </Text>
            {filteredIssues.map(issue => {
              const isOpen = !!expandedIssues[issue.id];
              const fix = fixMap[issue.id];
              return (
                <View key={issue.id} style={{
                  backgroundColor: colors.surface, borderRadius: borderRadius.md,
                  borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
                }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleIssue(issue.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR[issue.status] ?? '#6B7280' }} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: 11, fontWeight: fontWeight.bold as any, color: SEV_COLOR[issue.severity] }}>{issue.id}</Text>
                        <Badge label={issue.severity} color={SEV_COLOR[issue.severity]} />
                        <Badge label={issue.status} color={STATUS_COLOR[issue.status] ?? '#6B7280'} />
                      </View>
                      <Text style={{ fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium as any }} numberOfLines={isOpen ? undefined : 2}>
                        {issue.title}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>{issue.screen}</Text>
                    </View>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, gap: 10 }}>
                      <View style={{ height: 1, backgroundColor: colors.border }} />

                      <View style={{ gap: 4 }}>
                        <SectionHeader title="Stappen om te reproduceren" icon="list-outline" color="#3B82F6" />
                        <View style={{ paddingLeft: 16, gap: 2 }}>
                          {issue.stepsToReproduce.map((step, i) => (
                            <Text key={i} style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{step}</Text>
                          ))}
                        </View>
                      </View>

                      <View style={{ gap: 4 }}>
                        <SectionHeader title="Verwacht gedrag" icon="checkmark-circle-outline" color="#10B981" />
                        <Text style={{ paddingLeft: 16, fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>
                          {issue.expectedBehavior}
                        </Text>
                      </View>

                      {issue.status !== 'fixed' && (
                        <View style={{ gap: 4 }}>
                          <SectionHeader title="Huidig gedrag (bug)" icon="alert-circle-outline" color="#EF4444" />
                          <Text style={{ paddingLeft: 16, fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>
                            {issue.actualBehavior}
                          </Text>
                        </View>
                      )}

                      {fix && (
                        <View style={{ gap: 4 }}>
                          <SectionHeader title="Toegepaste fix" icon="construct-outline" color="#10B981" />
                          <Text style={{ paddingLeft: 16, fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{fix}</Text>
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Ionicons name="document-outline" size={11} color={colors.textSecondary} />
                        <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                          {issue.affectedFile}  ·  lines {issue.affectedLines}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
