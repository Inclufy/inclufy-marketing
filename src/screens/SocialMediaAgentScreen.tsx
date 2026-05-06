// src/screens/SocialMediaAgentScreen.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  TextInput, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import {
  SOCIAL_PLATFORMS,
  validatePublishRequest,
  type SocialPlatform,
  type ContentSpec,
} from '../services/social-media-agent.service';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterChip = 'all' | 'api' | 'business' | 'scheduling';
type ActiveTab = 'platforms' | 'validator' | 'readiness';

// ─── Implementation readiness data ───────────────────────────────────────────
// Compiled from actual codebase audit:
//   oauth-callback/index.ts  — platforms with token exchange
//   publish-social/index.ts  — platforms with active publish case
//   SettingsScreen.tsx       — platforms shown in Connect UI
// Updated: 2026-05-06

type ReadinessStatus = 'live' | 'partial' | 'missing';

interface PlatformReadiness {
  platformId: string;         // matches SOCIAL_PLATFORMS id
  name: string;
  icon: string;
  color: string;
  oauthFlow: ReadinessStatus;
  publishAPI: ReadinessStatus;
  connectUI: ReadinessStatus;
  envVars: { key: string; present: boolean; note?: string }[];
  gaps: string[];             // concrete steps needed to go live
  docs?: string;              // developer docs URL
}

const READINESS: PlatformReadiness[] = [
  {
    platformId: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    oauthFlow: 'live',       // oauth-callback: Meta/FB flow → IG Business extraction
    publishAPI: 'live',      // publish-social: case 'instagram' fully implemented
    connectUI: 'live',       // SettingsScreen: supported: true
    envVars: [
      { key: 'META_APP_ID',        present: true,  note: 'Edge Function + EXPO_PUBLIC_META_APP_ID' },
      { key: 'META_APP_SECRET',    present: true,  note: 'Edge Function secret' },
      { key: 'EXPO_PUBLIC_META_APP_ID', present: true, note: 'Client-side app ID' },
    ],
    gaps: [
      'Business or Creator account required — personal Instagram cannot publish via API.',
      'Facebook Page must be linked to the Instagram account in Meta Business Suite.',
      'App must be approved for instagram_basic + instagram_content_publish scopes.',
      'Media container workflow: create container → wait for FINISHED status → publish. Max 50 API posts/day.',
    ],
    docs: 'https://developers.facebook.com/docs/instagram-api/content-publishing',
  },
  {
    platformId: 'facebook',
    name: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877F2',
    oauthFlow: 'live',       // oauth-callback: Meta flow → Page token extraction
    publishAPI: 'live',      // publish-social: case 'facebook' fully implemented
    connectUI: 'live',       // SettingsScreen: supported: true
    envVars: [
      { key: 'META_APP_ID',     present: true },
      { key: 'META_APP_SECRET', present: true },
    ],
    gaps: [
      'User must be a Page admin — the connected account must administer the target Page.',
      'App needs pages_manage_posts + pages_read_engagement scopes (require App Review for production).',
      'Token refresh: long-lived Page tokens expire after 60 days — app auto-refreshes, monitor for 401s.',
    ],
    docs: 'https://developers.facebook.com/docs/pages-api',
  },
  {
    platformId: 'linkedin',
    name: 'LinkedIn',
    icon: 'logo-linkedin',
    color: '#0077B5',
    oauthFlow: 'live',       // oauth-callback: LinkedIn token exchange + profile fetch
    publishAPI: 'live',      // publish-social: case 'linkedin' fully implemented
    connectUI: 'live',       // SettingsScreen: supported: true
    envVars: [
      { key: 'LINKEDIN_CLIENT_ID',     present: true },
      { key: 'LINKEDIN_CLIENT_SECRET', present: true },
      { key: 'EXPO_PUBLIC_LINKEDIN_CLIENT_ID', present: true },
      { key: 'EXPO_PUBLIC_LINKEDIN_LMDP',      present: false, note: 'Set to "true" to unlock Company Page publishing (requires LinkedIn Marketing Developer Platform approval)' },
    ],
    gaps: [
      'Personal posts use w_member_social scope — works today for member profiles.',
      'Company Page posts require LMDP approval from LinkedIn. Set EXPO_PUBLIC_LINKEDIN_LMDP=true + request access at linkedin.com/developers.',
      'No native scheduling via API — scheduled posts are handled by the app\'s scheduled-publisher cron only.',
      'LinkedIn token refresh handled by Edge Function (refresh_token stored in social_accounts).',
    ],
    docs: 'https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/ugc-post-api',
  },
  {
    platformId: 'tiktok',
    name: 'TikTok',
    icon: 'musical-notes',
    color: '#010101',
    oauthFlow: 'live',       // oauth-callback: TikTok token exchange + profile fetch complete
    publishAPI: 'missing',   // publish-social: NO case 'tiktok' — falls through to default error
    connectUI: 'live',       // SettingsScreen: supported: true
    envVars: [
      { key: 'TIKTOK_CLIENT_KEY',    present: true },
      { key: 'TIKTOK_CLIENT_SECRET', present: true },
      { key: 'EXPO_PUBLIC_TIKTOK_CLIENT_KEY', present: true },
    ],
    gaps: [
      'OAuth works — tokens are stored — but publish-social has NO TikTok publish case.',
      'Add case \'tiktok\' to publish-social/index.ts using TikTok Content Posting API v2.',
      'TikTok Content Posting API requires Business Account and app approval from TikTok.',
      'Direct Post API (video upload): POST https://open.tiktokapis.com/v2/post/publish/video/init/',
      'Photo Post API: POST https://open.tiktokapis.com/v2/post/publish/content/init/ (images, max 35).',
      'No scheduling support — AMOS must publish immediately or queue manually.',
    ],
    docs: 'https://developers.tiktok.com/doc/content-posting-api-get-started/',
  },
  {
    platformId: 'whatsapp',
    name: 'WhatsApp Business',
    icon: 'logo-whatsapp',
    color: '#25D366',
    oauthFlow: 'partial',    // WhatsApp uses WABA credentials, not OAuth — stored via WhatsAppSettingsScreen
    publishAPI: 'partial',   // publish-social: case 'whatsapp' exists but returns error — not yet active
    connectUI: 'partial',    // WhatsAppSettingsScreen handles WABA config separately from SettingsScreen
    envVars: [
      { key: 'WABA_ID',         present: false, note: 'User provides via WhatsApp Settings screen' },
      { key: 'PHONE_NUMBER_ID', present: false, note: 'User provides via WhatsApp Settings screen' },
      { key: 'ACCESS_TOKEN',    present: false, note: 'User provides via WhatsApp Settings screen' },
    ],
    gaps: [
      'WhatsApp Cloud API does not use standard OAuth — requires a Meta WABA account.',
      'publish-social case \'whatsapp\' returns error stub — full implementation needed.',
      'Message templates must be pre-approved by Meta before sending; AMOS cannot send ad-hoc messages.',
      'Only contacts who have messaged the business in the last 24h can receive free-form messages.',
      'Implement: read WABA credentials from go_settings → POST to graph.facebook.com/v17.0/{phone_number_id}/messages',
      'Status updates (stories equivalent) are not available via Cloud API.',
    ],
    docs: 'https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages',
  },
  {
    platformId: 'twitter',
    name: 'Twitter / X',
    icon: 'logo-twitter',
    color: '#1DA1F2',
    oauthFlow: 'missing',    // oauth-callback: no Twitter case
    publishAPI: 'missing',   // publish-social: no Twitter case
    connectUI: 'missing',    // SettingsScreen: supported: false
    envVars: [
      { key: 'TWITTER_CLIENT_ID',     present: false },
      { key: 'TWITTER_CLIENT_SECRET', present: false },
      { key: 'EXPO_PUBLIC_TWITTER_CLIENT_ID', present: false },
    ],
    gaps: [
      'Completely unimplemented — SettingsScreen marks Twitter as supported: false.',
      'Add Twitter OAuth 2.0 PKCE flow to oauth-callback (POST https://api.twitter.com/2/oauth2/token).',
      'Add case \'x\' to publish-social using Twitter API v2: POST https://api.twitter.com/2/tweets.',
      'Enable Twitter in SettingsScreen SOCIAL_PLATFORMS (supported: true).',
      'Free API tier: 1,500 write requests/month. Basic tier ($100/mo): 3,000 tweets/month.',
      'Requires Twitter Developer Portal app with OAuth 2.0 enabled and tweet.write scope.',
    ],
    docs: 'https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets',
  },
  {
    platformId: 'pinterest',
    name: 'Pinterest',
    icon: 'logo-pinterest',
    color: '#E60023',
    oauthFlow: 'missing',
    publishAPI: 'missing',
    connectUI: 'missing',    // Not in SettingsScreen SOCIAL_PLATFORMS
    envVars: [
      { key: 'PINTEREST_APP_ID',     present: false },
      { key: 'PINTEREST_APP_SECRET', present: false },
    ],
    gaps: [
      'Not in scope — no implementation exists anywhere in the codebase.',
      'Requires Pinterest Business account and app approval.',
      'Add to SettingsScreen SOCIAL_PLATFORMS, oauth-callback, and publish-social.',
      'Pinterest API v5: POST https://api.pinterest.com/v5/pins',
      'Supports image pins and video pins. Idea Pins (Stories) NOT available via API.',
      'Requires boards/read + pins:write scopes.',
    ],
    docs: 'https://developers.pinterest.com/docs/api/v5/',
  },
  {
    platformId: 'youtube',
    name: 'YouTube',
    icon: 'logo-youtube',
    color: '#FF0000',
    oauthFlow: 'missing',
    publishAPI: 'missing',
    connectUI: 'missing',    // Not in SettingsScreen SOCIAL_PLATFORMS
    envVars: [
      { key: 'GOOGLE_CLIENT_ID',     present: false },
      { key: 'GOOGLE_CLIENT_SECRET', present: false },
    ],
    gaps: [
      'Not in scope — no implementation exists anywhere in the codebase.',
      'Requires Google OAuth 2.0 with youtube.upload scope.',
      'Add to SettingsScreen SOCIAL_PLATFORMS, oauth-callback (Google token exchange), and publish-social.',
      'YouTube Data API v3: POST https://www.googleapis.com/upload/youtube/v3/videos',
      'Shorts = vertical video ≤60s, include #Shorts in description — no separate API endpoint.',
      'Unverified channels limited to 15-min videos. Verify channel to unlock longer uploads.',
      '10,000 units/day quota — each video upload costs ~1,600 units.',
    ],
    docs: 'https://developers.google.com/youtube/v3/guides/uploading_a_video',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pill(label: string, color: string, bg?: string) {
  return (
    <View style={{
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
      backgroundColor: bg ?? color + '20',
    }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color }}>{label.toUpperCase()}</Text>
    </View>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
      <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: valueColor ?? colors.text }}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, icon, color, children }: {
  title: string; icon: string; color: string; children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: borderRadius.md,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.sm,
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: spacing.sm, paddingVertical: 8,
        backgroundColor: color + '12', borderBottomWidth: 1, borderBottomColor: color + '30',
      }}>
        <Ionicons name={icon as any} size={13} color={color} />
        <Text style={{ fontSize: 11, fontWeight: '700', color }}>{title}</Text>
      </View>
      <View style={{ padding: spacing.sm }}>{children}</View>
    </View>
  );
}

// ─── Content-type grid ────────────────────────────────────────────────────────

function ContentTypeGrid({ content }: { content: ContentSpec[] }) {
  const { colors } = useTheme();
  const supported = content.filter(c => c.supported);
  const unsupported = content.filter(c => !c.supported);

  return (
    <View style={{ gap: spacing.xs }}>
      {content.map((spec, i) => {
        const isLast = i === content.length - 1;
        return (
          <View key={`${spec.type}-${i}`} style={{
            flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
            paddingBottom: isLast ? 0 : 8,
            borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.border,
          }}>
            <View style={{
              width: 26, height: 26, borderRadius: 8, marginTop: 1,
              backgroundColor: spec.supported ? '#10B98120' : '#EF444415',
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Ionicons
                name={spec.supported ? 'checkmark' : 'close'}
                size={14} color={spec.supported ? '#10B981' : '#EF4444'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.text }}>
                  {spec.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                {spec.maxFileSizeMB !== undefined && pill(`${spec.maxFileSizeMB} MB`, '#6366F1')}
                {spec.maxDurationSec !== undefined && pill(`≤${spec.maxDurationSec}s`, '#F59E0B')}
                {spec.minResolution && pill(spec.minResolution, '#8B5CF6')}
                {spec.aspectRatios?.map(r => pill(r, '#6B7280'))}
              </View>
              {spec.formats && (
                <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
                  {spec.formats.join(' · ')}
                </Text>
              )}
              {spec.notes && (
                <Text style={{ fontSize: 10, color: colors.textSecondary, lineHeight: 14, marginTop: 2 }}>
                  {spec.notes}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Platform detail (expanded) ───────────────────────────────────────────────

function PlatformDetail({ platform }: { platform: SocialPlatform }) {
  const { colors } = useTheme();
  const pub = platform.publishing;

  return (
    <View>
      {/* Publishing rules */}
      <SectionCard title="Publishing Rules" icon="settings-outline" color="#6366F1">
        <Row label="API type" value={pub.apiAvailable ? (pub.apiType ?? 'official') : 'none'} valueColor={pub.apiAvailable ? '#10B981' : '#EF4444'} />
        <Row label="Publish method" value={pub.publishMethod.replace(/_/g, ' ')} />
        <Row
          label="Business account required"
          value={pub.requiresBusinessAccount ? 'Yes' : 'No'}
          valueColor={pub.requiresBusinessAccount ? '#F59E0B' : '#10B981'}
        />
        <Row
          label="Scheduling via API"
          value={pub.schedulingSupported ? 'Yes' : 'No'}
          valueColor={pub.schedulingSupported ? '#10B981' : '#EF4444'}
        />
        {pub.maxPostsPerDay !== undefined && (
          <Row label="Max posts / day" value={pub.maxPostsPerDay.toLocaleString()} />
        )}
        {pub.apiRateLimitNote && (
          <View style={{
            marginTop: 6, flexDirection: 'row', gap: 5, alignItems: 'flex-start',
            backgroundColor: '#F59E0B12', borderRadius: 6, padding: 7,
          }}>
            <Ionicons name="alert-circle-outline" size={12} color="#F59E0B" style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 10, color: colors.textSecondary, lineHeight: 14 }}>
              {pub.apiRateLimitNote}
            </Text>
          </View>
        )}
        {pub.oauthScopes && pub.oauthScopes.length > 0 && (
          <View style={{ marginTop: 8, gap: 4 }}>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>OAuth scopes:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {pub.oauthScopes.map(s => (
                <View key={s} style={{
                  paddingHorizontal: 5, paddingVertical: 2,
                  backgroundColor: colors.background, borderRadius: 4,
                  borderWidth: 1, borderColor: colors.border,
                }}>
                  <Text style={{ fontSize: 9, color: colors.textSecondary, fontFamily: 'monospace' }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </SectionCard>

      {/* Character limits */}
      <SectionCard title="Character Limits" icon="text-outline" color="#8B5CF6">
        {Object.entries(platform.characterLimits).map(([key, val]) =>
          val !== undefined ? (
            <Row
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={val.toLocaleString() + ' chars'}
            />
          ) : null
        )}
      </SectionCard>

      {/* Content types */}
      <SectionCard title="Content Types" icon="images-outline" color="#0EA5E9">
        <ContentTypeGrid content={platform.content} />
      </SectionCard>

      {/* Do's */}
      <SectionCard title="Do's" icon="checkmark-circle-outline" color="#10B981">
        <View style={{ gap: 7 }}>
          {platform.dos.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
              <View style={{
                width: 18, height: 18, borderRadius: 9, marginTop: 1,
                backgroundColor: '#10B98120', justifyContent: 'center', alignItems: 'center',
              }}>
                <Ionicons name="checkmark" size={11} color="#10B981" />
              </View>
              <Text style={{ flex: 1, fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{item}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Don'ts */}
      <SectionCard title="Don'ts" icon="close-circle-outline" color="#EF4444">
        <View style={{ gap: 7 }}>
          {platform.donts.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
              <View style={{
                width: 18, height: 18, borderRadius: 9, marginTop: 1,
                backgroundColor: '#EF444420', justifyContent: 'center', alignItems: 'center',
              }}>
                <Ionicons name="close" size={11} color="#EF4444" />
              </View>
              <Text style={{ flex: 1, fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{item}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* AMOS capabilities & limitations */}
      <SectionCard title="AMOS" icon="sparkles-outline" color="#E8317A">
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981', marginBottom: 2 }}>Can automate</Text>
          {platform.amosCapabilities.map((cap, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <Ionicons name="flash-outline" size={11} color="#10B981" style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: fontSize.xs, color: colors.text, lineHeight: 17 }}>{cap}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#F59E0B', marginBottom: 2 }}>Requires manual action</Text>
          {platform.amosLimitations.map((lim, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <Ionicons name="warning-outline" size={11} color="#F59E0B" style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 17 }}>{lim}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Best posting times */}
      {platform.bestPostingTimes && (
        <SectionCard title="Best Posting Times" icon="time-outline" color="#6B7280">
          <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>
            {platform.bestPostingTimes}
          </Text>
        </SectionCard>
      )}
    </View>
  );
}

// ─── Platform card ────────────────────────────────────────────────────────────

function PlatformCard({ platform, expanded, onToggle }: {
  platform: SocialPlatform;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const supportedCount = platform.content.filter(c => c.supported).length;

  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: borderRadius.lg,
      borderWidth: 1, borderColor: colors.border,
      borderLeftWidth: 4, borderLeftColor: platform.color,
      overflow: 'hidden', marginBottom: spacing.sm,
    }}>
      <TouchableOpacity activeOpacity={0.75} onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm }}>
        {/* Icon */}
        <View style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: platform.color + '18',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Ionicons name={platform.icon as any} size={24} color={platform.color} />
        </View>

        {/* Name + badges */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold as any, color: colors.text }}>
              {platform.name}
            </Text>
            {platform.publishing.requiresBusinessAccount && pill('Business', '#F59E0B')}
            {!platform.publishing.apiAvailable && pill('Manual only', '#EF4444')}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            {platform.publishing.apiAvailable && pill('API', '#6366F1')}
            {platform.publishing.schedulingSupported && pill('Scheduling', '#10B981')}
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>
              {supportedCount}/{platform.content.length} content types
            </Text>
          </View>
        </View>

        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {expanded && (
        <View style={{
          borderTopWidth: 1, borderTopColor: colors.border,
          padding: spacing.sm,
        }}>
          <PlatformDetail platform={platform} />
        </View>
      )}
    </View>
  );
}

// ─── Publish Validator tab ────────────────────────────────────────────────────

function ValidatorTab() {
  const { colors } = useTheme();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [selectedContentType, setSelectedContentType] = useState<string>('image');
  const [selectedAccountType, setSelectedAccountType] = useState<string>('Business');

  const platform = useMemo(
    () => SOCIAL_PLATFORMS.find(p => p.id === selectedPlatform),
    [selectedPlatform],
  );

  const contentTypes = platform?.content.map(c => c.type) ?? [];
  const accountTypes = platform?.accountTypes ?? [];

  const result = useMemo(() => {
    if (!selectedPlatform || !selectedContentType || !selectedAccountType) return null;
    return validatePublishRequest(selectedPlatform, selectedContentType as any, selectedAccountType);
  }, [selectedPlatform, selectedContentType, selectedAccountType]);

  const PickerRow = ({
    label, options, selected, onSelect,
  }: {
    label: string;
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
  }) => (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: spacing.sm }}>
          {options.map(opt => {
            const active = selected === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => onSelect(opt)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: active ? '700' : '500',
                  color: active ? '#fff' : colors.textSecondary,
                }}>
                  {opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.sm, gap: spacing.sm }}>
      {/* Explainer */}
      <View style={{
        backgroundColor: colors.surface, borderRadius: borderRadius.md,
        padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
        flexDirection: 'row', gap: 8, alignItems: 'flex-start',
      }}>
        <Ionicons name="flask-outline" size={16} color={colors.primary} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
          Simulate a publish request to see whether AMOS can execute it, or whether it requires manual action or a different account type.
        </Text>
      </View>

      {/* Platform picker */}
      <View style={{
        backgroundColor: colors.surface, borderRadius: borderRadius.md,
        padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
      }}>
        <PickerRow
          label="1. Platform"
          options={SOCIAL_PLATFORMS.map(p => p.id)}
          selected={selectedPlatform}
          onSelect={v => {
            setSelectedPlatform(v);
            const p = SOCIAL_PLATFORMS.find(pl => pl.id === v);
            setSelectedContentType(p?.content[0]?.type ?? 'image');
            setSelectedAccountType(p?.accountTypes[0] ?? 'Personal');
          }}
        />

        {/* Content type */}
        <PickerRow
          label="2. Content Type"
          options={contentTypes}
          selected={selectedContentType}
          onSelect={setSelectedContentType}
        />

        {/* Account type */}
        <PickerRow
          label="3. Account Type"
          options={accountTypes}
          selected={selectedAccountType}
          onSelect={setSelectedAccountType}
        />
      </View>

      {/* Result */}
      {result && (
        <View style={{
          borderRadius: borderRadius.md, borderWidth: 2,
          borderColor: result.valid ? '#10B981' : '#EF4444',
          backgroundColor: result.valid ? '#10B98110' : '#EF444410',
          padding: spacing.md, gap: spacing.sm,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: result.valid ? '#10B981' : '#EF4444',
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Ionicons name={result.valid ? 'checkmark' : 'close'} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: result.valid ? '#10B981' : '#EF4444' }}>
                {result.valid ? 'AMOS Can Publish' : 'Blocked'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                {platform?.name} · {selectedContentType.replace(/_/g, ' ')} · {selectedAccountType}
              </Text>
            </View>
          </View>

          {result.reason && (
            <View style={{
              backgroundColor: colors.surface, borderRadius: borderRadius.sm,
              padding: spacing.sm, borderLeftWidth: 3,
              borderLeftColor: result.valid ? '#10B981' : '#EF4444',
            }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>
                {result.reason}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Platform quick-reference card */}
      {platform && (
        <View style={{
          backgroundColor: colors.surface, borderRadius: borderRadius.md,
          borderWidth: 1, borderColor: colors.border,
          borderLeftWidth: 4, borderLeftColor: platform.color,
          padding: spacing.sm,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm }}>
            <Ionicons name={platform.icon as any} size={18} color={platform.color} />
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>
              {platform.name} — Quick Reference
            </Text>
          </View>
          <Row label="Publish method" value={platform.publishing.publishMethod.replace(/_/g, ' ')} />
          <Row
            label="Business required"
            value={platform.publishing.requiresBusinessAccount ? 'Yes' : 'No'}
            valueColor={platform.publishing.requiresBusinessAccount ? '#F59E0B' : '#10B981'}
          />
          <Row
            label="Scheduling"
            value={platform.publishing.schedulingSupported ? 'Supported' : 'Not supported'}
            valueColor={platform.publishing.schedulingSupported ? '#10B981' : '#EF4444'}
          />
          {platform.characterLimits.caption && (
            <Row label="Caption limit" value={platform.characterLimits.caption.toLocaleString() + ' chars'} />
          )}
        </View>
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

// ─── Readiness tab ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReadinessStatus, { label: string; color: string; icon: string }> = {
  live:    { label: 'Live',    color: '#10B981', icon: 'checkmark-circle' },
  partial: { label: 'Partial', color: '#F59E0B', icon: 'alert-circle' },
  missing: { label: 'Missing', color: '#EF4444', icon: 'close-circle' },
};

function ReadinessCard({ r }: { r: PlatformReadiness }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const overallStatus: ReadinessStatus =
    r.oauthFlow === 'live' && r.publishAPI === 'live' && r.connectUI === 'live' ? 'live' :
    r.oauthFlow === 'missing' && r.publishAPI === 'missing' ? 'missing' : 'partial';

  const overall = STATUS_CONFIG[overallStatus];

  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: borderRadius.lg,
      borderWidth: 1, borderColor: colors.border,
      borderLeftWidth: 4, borderLeftColor: overall.color,
      marginBottom: spacing.sm, overflow: 'hidden',
    }}>
      {/* Header row */}
      <TouchableOpacity activeOpacity={0.75} onPress={() => setExpanded(e => !e)}
        style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm }}>
        <View style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: r.color + '18', justifyContent: 'center', alignItems: 'center',
        }}>
          <Ionicons name={r.icon as any} size={22} color={r.color} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>{r.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
              backgroundColor: overall.color + '20' }}>
              <Ionicons name={overall.icon as any} size={11} color={overall.color} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: overall.color }}>{overall.label.toUpperCase()}</Text>
            </View>
          </View>
          {/* Three status pills */}
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {([
              ['OAuth', r.oauthFlow],
              ['Publish API', r.publishAPI],
              ['Connect UI', r.connectUI],
            ] as [string, ReadinessStatus][]).map(([label, status]) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <View key={label} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 3,
                  paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
                  backgroundColor: cfg.color + '15',
                }}>
                  <Ionicons name={cfg.icon as any} size={9} color={cfg.color} />
                  <Text style={{ fontSize: 9, color: cfg.color, fontWeight: '600' }}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.sm, gap: spacing.sm }}>

          {/* Env vars */}
          <View style={{
            backgroundColor: colors.background, borderRadius: borderRadius.md,
            borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: spacing.sm, paddingVertical: 7,
              backgroundColor: '#6366F112', borderBottomWidth: 1, borderBottomColor: '#6366F130',
            }}>
              <Ionicons name="key-outline" size={12} color="#6366F1" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366F1' }}>Environment Variables</Text>
            </View>
            <View style={{ padding: spacing.sm, gap: 5 }}>
              {r.envVars.map(v => (
                <View key={v.key} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
                  <Ionicons
                    name={v.present ? 'checkmark-circle' : 'close-circle'}
                    size={14} color={v.present ? '#10B981' : '#EF4444'}
                    style={{ marginTop: 1 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'monospace', color: colors.text }}>{v.key}</Text>
                    {v.note && (
                      <Text style={{ fontSize: 10, color: colors.textSecondary, lineHeight: 14, marginTop: 1 }}>
                        {v.note}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Gaps / action items */}
          <View style={{
            backgroundColor: colors.background, borderRadius: borderRadius.md,
            borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: spacing.sm, paddingVertical: 7,
              backgroundColor: '#F59E0B12', borderBottomWidth: 1, borderBottomColor: '#F59E0B30',
            }}>
              <Ionicons name="construct-outline" size={12} color="#F59E0B" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>
                {r.gaps.length > 0 ? `${r.gaps.length} Action Item${r.gaps.length > 1 ? 's' : ''}` : 'No gaps'}
              </Text>
            </View>
            <View style={{ padding: spacing.sm, gap: 8 }}>
              {r.gaps.map((gap, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
                  <View style={{
                    width: 18, height: 18, borderRadius: 9, marginTop: 1,
                    backgroundColor: '#F59E0B15', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#F59E0B' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{gap}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Docs link */}
          {r.docs && (
            <TouchableOpacity
              onPress={() => Linking.openURL(r.docs!)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                padding: spacing.sm, borderRadius: borderRadius.md,
                backgroundColor: colors.primary + '10',
                borderWidth: 1, borderColor: colors.primary + '30',
              }}
            >
              <Ionicons name="open-outline" size={14} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: fontSize.xs, color: colors.primary }} numberOfLines={1}>
                {r.docs}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function ReadinessTab() {
  const { colors } = useTheme();

  const live    = READINESS.filter(r => r.publishAPI === 'live').length;
  const partial = READINESS.filter(r => r.publishAPI === 'partial').length;
  const missing = READINESS.filter(r => r.publishAPI === 'missing').length;

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.sm, paddingBottom: spacing.xl }}>

      {/* Summary bar */}
      <View style={{
        flexDirection: 'row', backgroundColor: colors.surface,
        borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
        padding: spacing.sm, marginBottom: spacing.sm, gap: spacing.md,
      }}>
        {[
          { label: 'Publish API live',    value: live,    color: '#10B981' },
          { label: 'Partial / stub',      value: partial, color: '#F59E0B' },
          { label: 'Not implemented',     value: missing, color: '#EF4444' },
        ].map(s => (
          <View key={s.label} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: s.color }}>{s.value}</Text>
            <Text style={{ fontSize: 9, color: colors.textSecondary, textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Info banner */}
      <View style={{
        flexDirection: 'row', gap: 8, alignItems: 'flex-start',
        backgroundColor: colors.primary + '10', borderRadius: borderRadius.md,
        padding: spacing.sm, borderWidth: 1, borderColor: colors.primary + '30',
        marginBottom: spacing.sm,
      }}>
        <Ionicons name="information-circle-outline" size={15} color={colors.primary} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
          Audited against oauth-callback, publish-social, and SettingsScreen as of {new Date().toLocaleDateString('nl-NL')}. Expand a platform to see required env vars, action items, and API docs.
        </Text>
      </View>

      {READINESS.map(r => <ReadinessCard key={r.platformId} r={r} />)}
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SocialMediaAgentScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<ActiveTab>('platforms');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterChip>('all');
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});

  const togglePlatform = useCallback(
    (id: string) => setExpandedPlatforms(prev => ({ ...prev, [id]: !prev[id] })),
    [],
  );

  const filteredPlatforms = useMemo(() => {
    let items = [...SOCIAL_PLATFORMS];
    if (filter === 'api') items = items.filter(p => p.publishing.apiAvailable);
    else if (filter === 'business') items = items.filter(p => p.publishing.requiresBusinessAccount);
    else if (filter === 'scheduling') items = items.filter(p => p.publishing.schedulingSupported);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.dos.some(d => d.toLowerCase().includes(q)) ||
        p.donts.some(d => d.toLowerCase().includes(q)) ||
        p.amosCapabilities.some(c => c.toLowerCase().includes(q)) ||
        p.amosLimitations.some(l => l.toLowerCase().includes(q)) ||
        p.content.some(c => c.type.includes(q))
      );
    }
    return items;
  }, [filter, search]);

  const stats = useMemo(() => ({
    total:     SOCIAL_PLATFORMS.length,
    api:       SOCIAL_PLATFORMS.filter(p => p.publishing.apiAvailable).length,
    business:  SOCIAL_PLATFORMS.filter(p => p.publishing.requiresBusinessAccount).length,
    scheduling:SOCIAL_PLATFORMS.filter(p => p.publishing.schedulingSupported).length,
  }), []);

  const CHIPS: { key: FilterChip; label: string }[] = [
    { key: 'all',       label: `All (${stats.total})` },
    { key: 'api',       label: `API (${stats.api})` },
    { key: 'business',  label: `Biz required (${stats.business})` },
    { key: 'scheduling',label: `Scheduling (${stats.scheduling})` },
  ];

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
        <Text style={{
          flex: 1, textAlign: 'center',
          fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: colors.text,
        }}>
          Social Media Agent
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
          { label: 'Platforms',  value: stats.total,     color: colors.primary },
          { label: 'API ready',  value: stats.api,       color: '#10B981' },
          { label: 'Biz req',    value: stats.business,  color: '#F59E0B' },
          { label: 'Scheduling', value: stats.scheduling, color: '#6366F1' },
        ].map(s => (
          <View key={s.label} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: s.color }}>
              {s.value}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Tab switcher ── */}
      <View style={{
        flexDirection: 'row', backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        {([
          ['platforms', 'layers-outline', 'Platforms'],
          ['validator', 'flask-outline', 'Validator'],
          ['readiness', 'construct-outline', 'Readiness'],
        ] as const).map(([key, icon, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setActiveTab(key)}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center', gap: 6, paddingVertical: spacing.sm,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === key ? colors.primary : 'transparent',
            }}
          >
            <Ionicons name={icon} size={15} color={activeTab === key ? colors.primary : colors.textSecondary} />
            <Text style={{
              fontSize: fontSize.sm,
              color: activeTab === key ? colors.primary : colors.textSecondary,
              fontWeight: (activeTab === key ? '700' : '400') as any,
            }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Platforms tab ── */}
      {activeTab === 'platforms' && (
        <>
          {/* Search */}
          <View style={{
            margin: spacing.sm,
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surface, borderRadius: borderRadius.md,
            borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm,
          }}>
            <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
            <TextInput
              style={{ flex: 1, color: colors.text, fontSize: fontSize.sm, paddingVertical: 8, marginLeft: 6 }}
              placeholder="Zoek platform, content type, capability..."
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
            {CHIPS.map(chip => (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setFilter(chip.key)}
                style={{
                  paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 20,
                  backgroundColor: filter === chip.key ? colors.primary : colors.surface,
                  borderWidth: 1, borderColor: filter === chip.key ? colors.primary : colors.border,
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '500',
                  color: filter === chip.key ? '#fff' : colors.textSecondary,
                }}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Platform list */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.sm, paddingBottom: spacing.xl }}>
            {filteredPlatforms.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.xl }}>
                Geen platforms gevonden voor "{search}"
              </Text>
            ) : (
              filteredPlatforms.map(p => (
                <PlatformCard
                  key={p.id}
                  platform={p}
                  expanded={!!expandedPlatforms[p.id]}
                  onToggle={() => togglePlatform(p.id)}
                />
              ))
            )}
          </ScrollView>
        </>
      )}

      {/* ── Validator tab ── */}
      {activeTab === 'validator' && <ValidatorTab />}

      {/* ── Readiness tab ── */}
      {activeTab === 'readiness' && <ReadinessTab />}

    </SafeAreaView>
  );
}
