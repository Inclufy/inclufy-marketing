// src/screens/SocialMediaAgentScreen.tsx
// Social Media Agent — per-platform publishing rules, content specs, and AMOS capability map.
// Accessible from Settings. Helps AMOS AI avoid hallucinating valid publishing flows.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import {
  SOCIAL_PLATFORMS,
  type SocialPlatform,
  type ContentSpec,
} from '../services/social-media-agent.service';

// ─── Filter types ─────────────────────────────────────────────────────────────

type FilterChip = 'all' | 'api' | 'business' | 'scheduling';

// ─── Small helpers ────────────────────────────────────────────────────────────

function Badge({ label, color, small }: { label: string; color: string; small?: boolean }) {
  return (
    <View style={{
      paddingHorizontal: small ? 5 : 7,
      paddingVertical: small ? 1 : 2,
      borderRadius: 6,
      backgroundColor: color + '20',
    }}>
      <Text style={{
        fontSize: small ? 9 : 10,
        color,
        fontWeight: '700',
      }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function SectionLabel({ title, color, icon }: { title: string; color: string; icon: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: spacing.xs }}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={{ fontSize: 11, fontWeight: '600', color }}>{title}</Text>
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.xs }} />;
}

// ─── Content Type Row ─────────────────────────────────────────────────────────

function ContentTypeRow({ spec }: { spec: ContentSpec }) {
  const { colors } = useTheme();
  const supported = spec.supported;
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <Ionicons
        name={supported ? 'checkmark-circle' : 'close-circle'}
        size={15}
        color={supported ? '#10B981' : '#EF4444'}
        style={{ marginTop: 1 }}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.text }}>
            {spec.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
          {spec.maxFileSizeMB !== undefined && (
            <Badge label={`${spec.maxFileSizeMB} MB`} color="#6366F1" small />
          )}
          {spec.maxDurationSec !== undefined && (
            <Badge label={`${spec.maxDurationSec}s`} color="#F59E0B" small />
          )}
          {spec.aspectRatios?.map(r => (
            <Badge key={r} label={r} color="#6B7280" small />
          ))}
        </View>
        {spec.formats && (
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
            {spec.formats.join(' · ')}
          </Text>
        )}
        {spec.notes && (
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, lineHeight: 14 }}>
            {spec.notes}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Expanded Platform Detail ─────────────────────────────────────────────────

function PlatformDetail({ platform }: { platform: SocialPlatform }) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>

      {/* Publishing Rules */}
      <View style={{
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <SectionLabel title="Publishing Rules" color="#6366F1" icon="settings-outline" />

        <View style={{ gap: 4 }}>
          {/* API type */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>API Type</Text>
            <Badge
              label={platform.publishing.apiAvailable ? (platform.publishing.apiType ?? 'official') : 'none'}
              color={platform.publishing.apiAvailable ? '#10B981' : '#EF4444'}
            />
          </View>

          {/* Publish method */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Publish Method</Text>
            <Badge label={platform.publishing.publishMethod.replace(/_/g, ' ')} color="#3B82F6" />
          </View>

          {/* Business required */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Business Account Required</Text>
            <Badge
              label={platform.publishing.requiresBusinessAccount ? 'Yes' : 'No'}
              color={platform.publishing.requiresBusinessAccount ? '#F59E0B' : '#10B981'}
            />
          </View>

          {/* Scheduling */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Scheduling via API</Text>
            <Badge
              label={platform.publishing.schedulingSupported ? 'Yes' : 'No'}
              color={platform.publishing.schedulingSupported ? '#10B981' : '#EF4444'}
            />
          </View>

          {/* Max posts / day */}
          {platform.publishing.maxPostsPerDay !== undefined && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Max Posts / Day</Text>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.text }}>
                {platform.publishing.maxPostsPerDay.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Rate limit note */}
          {platform.publishing.apiRateLimitNote && (
            <>
              <Divider />
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
                <Ionicons name="alert-circle-outline" size={12} color="#F59E0B" style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 10, color: colors.textSecondary, lineHeight: 14 }}>
                  {platform.publishing.apiRateLimitNote}
                </Text>
              </View>
            </>
          )}

          {/* OAuth scopes */}
          {platform.publishing.oauthScopes && platform.publishing.oauthScopes.length > 0 && (
            <>
              <Divider />
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 3 }}>OAuth Scopes Required:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {platform.publishing.oauthScopes.map(scope => (
                  <View key={scope} style={{
                    paddingHorizontal: 5, paddingVertical: 2,
                    borderRadius: 4, backgroundColor: colors.surface,
                    borderWidth: 1, borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 9, color: colors.textSecondary, fontFamily: 'monospace' }}>{scope}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </View>

      {/* Character Limits */}
      <View style={{
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <SectionLabel title="Character Limits" color="#8B5CF6" icon="text-outline" />
        <View style={{ gap: 4 }}>
          {Object.entries(platform.characterLimits).map(([key, value]) => value !== undefined ? (
            <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.text }}>
                {value.toLocaleString()} chars
              </Text>
            </View>
          ) : null)}
        </View>
      </View>

      {/* Content Types */}
      <View style={{
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <SectionLabel title="Supported Content Types" color="#0EA5E9" icon="images-outline" />
        <View>
          {platform.content.map((spec, i) => (
            <ContentTypeRow key={`${spec.type}-${i}`} spec={spec} />
          ))}
        </View>
      </View>

      {/* Do's and Don'ts */}
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{
          flex: 1, backgroundColor: '#10B98108',
          borderRadius: borderRadius.sm, padding: spacing.sm,
          borderWidth: 1, borderColor: '#10B98130',
        }}>
          <SectionLabel title="Do's" color="#10B981" icon="checkmark-circle-outline" />
          <View style={{ gap: 5 }}>
            {platform.dos.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
                <Ionicons name="checkmark" size={11} color="#10B981" style={{ marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 10, color: '#10B981', lineHeight: 14 }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{
          flex: 1, backgroundColor: '#EF444408',
          borderRadius: borderRadius.sm, padding: spacing.sm,
          borderWidth: 1, borderColor: '#EF444430',
        }}>
          <SectionLabel title="Don'ts" color="#EF4444" icon="close-circle-outline" />
          <View style={{ gap: 5 }}>
            {platform.donts.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
                <Ionicons name="close" size={11} color="#EF4444" style={{ marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 10, color: '#EF4444', lineHeight: 14 }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* AMOS Capabilities vs Limitations */}
      <View style={{
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <SectionLabel title="AMOS Capabilities" color={colors.primary ?? '#E8317A'} icon="sparkles-outline" />
        <View style={{ gap: 4, marginBottom: spacing.sm }}>
          {platform.amosCapabilities.map((cap, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
              <Ionicons name="flash" size={11} color={colors.primary ?? '#E8317A'} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 10, color: colors.text, lineHeight: 14 }}>{cap}</Text>
            </View>
          ))}
        </View>

        <Divider />

        <View style={{ marginTop: spacing.xs, gap: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: '#F59E0B', marginBottom: 3 }}>AMOS Limitations</Text>
          {platform.amosLimitations.map((lim, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
              <Ionicons name="warning-outline" size={11} color="#F59E0B" style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 10, color: colors.textSecondary, lineHeight: 14 }}>{lim}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Best Posting Times */}
      {platform.bestPostingTimes && (
        <View style={{
          flexDirection: 'row', alignItems: 'flex-start', gap: 8,
          backgroundColor: colors.background, borderRadius: borderRadius.sm,
          padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
        }}>
          <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', marginBottom: 2 }}>Best Posting Times</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 16 }}>
              {platform.bestPostingTimes}
            </Text>
          </View>
        </View>
      )}

    </View>
  );
}

// ─── Platform Card ────────────────────────────────────────────────────────────

function PlatformCard({
  platform,
  expanded,
  onToggle,
}: {
  platform: SocialPlatform;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();

  const supportedCount = platform.content.filter(c => c.supported).length;
  const totalCount = platform.content.length;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.xs,
    }}>
      {/* Card header */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.sm,
          gap: spacing.sm,
        }}
      >
        {/* Platform icon */}
        <View style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: platform.color + '20',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name={platform.icon as any} size={22} color={platform.color} />
        </View>

        {/* Name + meta */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.bold as any,
              color: colors.text,
            }}>
              {platform.name}
            </Text>
            {platform.publishing.requiresBusinessAccount && (
              <Badge label="Business Required" color="#F59E0B" small />
            )}
            {platform.publishing.schedulingSupported && (
              <Badge label="Scheduling" color="#10B981" small />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>
              {supportedCount}/{totalCount} content types
            </Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>·</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>
              {platform.publishing.publishMethod.replace(/_/g, ' ')}
            </Text>
            {platform.publishing.apiAvailable && (
              <>
                <Text style={{ fontSize: 10, color: colors.textSecondary }}>·</Text>
                <Badge label="API" color="#6366F1" small />
              </>
            )}
          </View>
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={{
          paddingHorizontal: spacing.sm,
          paddingBottom: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: spacing.sm,
        }}>
          <PlatformDetail platform={platform} />
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SocialMediaAgentScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterChip>('all');
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});

  const togglePlatform = (id: string) =>
    setExpandedPlatforms(prev => ({ ...prev, [id]: !prev[id] }));

  // Filter + search logic
  const filteredPlatforms = useMemo(() => {
    let items = [...SOCIAL_PLATFORMS];

    // Apply filter chip
    if (filter === 'api') {
      items = items.filter(p => p.publishing.apiAvailable);
    } else if (filter === 'business') {
      items = items.filter(p => p.publishing.requiresBusinessAccount);
    } else if (filter === 'scheduling') {
      items = items.filter(p => p.publishing.schedulingSupported);
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.dos.some(d => d.toLowerCase().includes(q)) ||
        p.donts.some(d => d.toLowerCase().includes(q)) ||
        p.amosCapabilities.some(c => c.toLowerCase().includes(q)) ||
        p.amosLimitations.some(l => l.toLowerCase().includes(q)) ||
        p.content.some(c => c.type.includes(q))
      );
    }

    return items;
  }, [filter, search]);

  // Summary stats
  const stats = useMemo(() => ({
    total: SOCIAL_PLATFORMS.length,
    businessRequired: SOCIAL_PLATFORMS.filter(p => p.publishing.requiresBusinessAccount).length,
    apiAvailable: SOCIAL_PLATFORMS.filter(p => p.publishing.apiAvailable).length,
    schedulingSupported: SOCIAL_PLATFORMS.filter(p => p.publishing.schedulingSupported).length,
  }), []);

  const FILTER_CHIPS: { key: FilterChip; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'api', label: 'API Available' },
    { key: 'business', label: 'Business Required' },
    { key: 'scheduling', label: 'Scheduling' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.xs }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          textAlign: 'center',
          fontSize: fontSize.lg,
          fontWeight: fontWeight.bold as any,
          color: colors.text,
        }}>
          Social Media Agent
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* ── Stats bar ── */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.md,
      }}>
        {[
          { label: 'Platforms', value: stats.total, color: colors.primary ?? '#E8317A' },
          { label: 'API Ready', value: stats.apiAvailable, color: '#10B981' },
          { label: 'Biz Req', value: stats.businessRequired, color: '#F59E0B' },
          { label: 'Scheduling', value: stats.schedulingSupported, color: '#6366F1' },
        ].map(s => (
          <View key={s.label} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: s.color }}>
              {s.value}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Info banner ── */}
      <View style={{
        margin: spacing.sm,
        padding: spacing.sm,
        backgroundColor: (colors.primary ?? '#E8317A') + '10',
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: (colors.primary ?? '#E8317A') + '30',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <Ionicons name="information-circle-outline" size={16} color={colors.primary ?? '#E8317A'} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
          This reference documents every platform's API rules, content specs, and publishing constraints. AMOS uses this data to avoid attempting unsupported operations.
        </Text>
      </View>

      {/* ── Search ── */}
      <View style={{
        marginHorizontal: spacing.sm,
        marginBottom: spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.sm,
      }}>
        <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
        <TextInput
          style={{
            flex: 1,
            color: colors.text,
            fontSize: fontSize.sm,
            paddingVertical: 8,
            marginLeft: 6,
          }}
          placeholder="Search platforms, content types, capabilities..."
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

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.sm,
          gap: spacing.xs,
          paddingBottom: spacing.xs,
        }}
      >
        {FILTER_CHIPS.map(chip => (
          <TouchableOpacity
            key={chip.key}
            onPress={() => setFilter(chip.key)}
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: filter === chip.key ? (colors.primary ?? '#E8317A') : colors.surface,
              borderWidth: 1,
              borderColor: filter === chip.key ? (colors.primary ?? '#E8317A') : colors.border,
            }}
          >
            <Text style={{
              fontSize: 12,
              color: filter === chip.key ? '#fff' : colors.textSecondary,
              fontWeight: fontWeight.medium as any,
            }}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Platform list ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.sm, paddingBottom: spacing.xl }}
      >
        {filteredPlatforms.length === 0 ? (
          <Text style={{
            textAlign: 'center',
            color: colors.textSecondary,
            paddingVertical: spacing.xl,
          }}>
            No platforms match "{search}"
          </Text>
        ) : (
          filteredPlatforms.map(platform => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              expanded={!!expandedPlatforms[platform.id]}
              onToggle={() => togglePlatform(platform.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
