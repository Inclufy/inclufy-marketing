// src/components/WatermarkPreview.tsx
// ────────────────────────────────────────────────────────────────────────
// Superadmin-only dev tool: shows the most recent baked watermark image
// for the current user (output of supabase/functions/_shared/watermark.ts).
//
// Lives in Settings → DEVELOPER TOOLS card, just below the TierSwitcher.
// Workflow:
//   1. Use TierSwitcher to set yourself to 'free'
//   2. Publish a post to Snapchat (manual channel — no live API)
//   3. Switch tier back to 'enterprise'
//   4. Tap "Refresh" here → see the freshly-baked image
//
// Implementation notes:
//   - Lists `branded/<userId>/` in the `media` bucket via Storage API
//     (sorted by created_at DESC, limit 5)
//   - Generates a 5-minute signed URL for the most recent file
//   - Renders the image inline with size + timestamp metadata
//   - On error / no files: shows a friendly empty state with hint
// ────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { supabase } from '../services/supabase';

interface BakedFile {
  name: string;          // full storage path, e.g. branded/<uid>/1763123456_abc.jpg
  signedUrl: string;
  createdAt: string;     // ISO
  sizeKb: number | null;
}

const STORAGE_BUCKET = 'media';
const SIGNED_URL_TTL_SEC = 60 * 5; // 5 minutes — enough to look + share

export default function WatermarkPreview() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<BakedFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setError('Niet ingelogd.');
        setFiles([]);
        return;
      }

      // 1. List the user's branded/ folder, newest first
      const folder = `branded/${user.id}`;
      const { data: list, error: listErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(folder, {
          limit: 5,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (listErr) {
        // RLS or missing-folder — treat as empty rather than blocking error
        if (/not found|does not exist/i.test(listErr.message)) {
          setFiles([]);
          return;
        }
        throw listErr;
      }
      if (!list || list.length === 0) {
        setFiles([]);
        return;
      }

      // 2. Sign a URL for each (top 5). Parallelised for speed.
      const signed = await Promise.all(
        list.map(async (f) => {
          const path = `${folder}/${f.name}`;
          const { data: signData } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(path, SIGNED_URL_TTL_SEC);
          const sizeRaw = (f.metadata as any)?.size as number | undefined;
          return {
            name: path,
            signedUrl: signData?.signedUrl ?? '',
            createdAt: f.created_at ?? '',
            sizeKb: typeof sizeRaw === 'number' ? Math.round(sizeRaw / 102.4) / 10 : null,
          };
        }),
      );

      setFiles(signed.filter((f) => f.signedUrl));
    } catch (err: any) {
      setError(err?.message ?? 'Onbekende fout.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on first mount so the user sees something immediately.
  useEffect(() => {
    void load();
  }, [load]);

  const formatWhen = (iso: string): string => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = Date.now();
      const diffMin = Math.round((now - d.getTime()) / 60000);
      if (diffMin < 1) return 'zojuist';
      if (diffMin < 60) return `${diffMin}m geleden`;
      const diffH = Math.round(diffMin / 60);
      if (diffH < 24) return `${diffH}u geleden`;
      return d.toLocaleString('nl-NL', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso.slice(0, 16).replace('T', ' ');
    }
  };

  // ── Header (always shown) ─────────────────────────────────────────────
  const Header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: 4,
        gap: 6,
      }}
    >
      <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, flex: 1 }}>
        Laatste watermerk-bakes
      </Text>
      <TouchableOpacity
        onPress={load}
        disabled={loading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ opacity: loading ? 0.4 : 1 }}
      >
        <Ionicons name="refresh" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ paddingBottom: spacing.sm }}>
      {Header}

      <View style={{ paddingHorizontal: spacing.md, paddingTop: 4 }}>
        {loading && files === null && (
          <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {error && (
          <View
            style={{
              padding: spacing.sm,
              borderRadius: borderRadius.sm,
              backgroundColor: colors.error + '12',
              borderWidth: 1,
              borderColor: colors.error + '30',
              marginBottom: spacing.xs,
            }}
          >
            <Text style={{ fontSize: fontSize.xs, color: colors.error }}>
              {error}
            </Text>
          </View>
        )}

        {files && files.length === 0 && !loading && (
          <View
            style={{
              padding: spacing.sm,
              borderRadius: borderRadius.sm,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Ionicons name="image-outline" size={18} color={colors.textSecondary} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.text, fontWeight: fontWeight.semibold }}>
                Nog geen baked images
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 16 }}>
                Zet je tier op "Free" hierboven, publiceer een post naar Snapchat (handmatig — geen live API), en tik dan op het refresh-icoon.
              </Text>
            </View>
          </View>
        )}

        {files && files.length > 0 && (
          <>
            {files.map((f, idx) => (
              <View
                key={f.name}
                style={{
                  marginBottom: idx === files.length - 1 ? 0 : spacing.sm,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: 'hidden',
                  backgroundColor: colors.background,
                }}
              >
                <Pressable onPress={() => setZoomedUrl(f.signedUrl)}>
                  <Image
                    source={{ uri: f.signedUrl }}
                    style={{
                      width: '100%',
                      aspectRatio: 1,
                      backgroundColor: '#000',
                    }}
                    resizeMode="contain"
                  />
                </Pressable>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 6,
                    gap: 6,
                  }}
                >
                  <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                    {formatWhen(f.createdAt)}
                  </Text>
                  {f.sizeKb !== null && (
                    <>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary }}>·</Text>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                        {f.sizeKb < 1024 ? `${f.sizeKb} KB` : `${(f.sizeKb / 1024).toFixed(1)} MB`}
                      </Text>
                    </>
                  )}
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    onPress={() => Linking.openURL(f.signedUrl)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="open-outline" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4, fontStyle: 'italic' }}>
              Signed URLs verlopen na 5 minuten — refresh om nieuwe te krijgen.
            </Text>
          </>
        )}
      </View>

      {/* ── Zoom modal ─────────────────────────────────────────────── */}
      <Modal
        visible={!!zoomedUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomedUrl(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.92)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.md,
          }}
          onPress={() => setZoomedUrl(null)}
        >
          {zoomedUrl && (
            <Image
              source={{ uri: zoomedUrl }}
              style={{ width: '100%', height: '85%' }}
              resizeMode="contain"
            />
          )}
          <View style={{ position: 'absolute', top: 50, right: 20 }}>
            <Ionicons name="close-circle" size={32} color="#ffffff" />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
