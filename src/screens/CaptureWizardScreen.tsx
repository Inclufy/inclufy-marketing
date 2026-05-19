// src/screens/CaptureWizardScreen.tsx
// ──────────────────────────────────────────────────────────────────────────
// Top-level 5-step wizard: Capture → Edit → Channels → Per-channel → Publish.
//
// Replaces the loose "capture-then-PostReview" flow with an explicit guided
// wizard. The old PostReviewScreen is still reachable via the "Skip to
// PostReview" link in the header for power users who prefer free-form edit.
//
// Routes the 5 step components based on wizard state (useWizardState). The
// step indicator at the top shows progress + lets you tap-jump back to
// already-completed steps.
//
// Premium-feel UI:
//   - Phosphor icons (multi-weight, Apple-aesthetic)
//   - Pink→orange brand gradient on active progress dots
//   - Smooth slide transitions between steps (RN Animated)
//   - Translucent header that blurs over scroll content
// ──────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform, Animated, Easing, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CaretLeft, X, SkipForward, Camera, Sparkle, ShareNetwork, Sliders, Rocket,
} from 'phosphor-react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight, brandGradient } from '../theme';
import { useThemedStyles } from '../utils/themedStyles';
import type { RootStackParamList } from '../types';
import {
  WizardProvider,
  useWizardState,
  type WizardStep,
} from '../hooks/useWizardState';
import Step1Capture from '../components/wizard/Step1Capture';
import Step2Edit from '../components/wizard/Step2Edit';
import Step3Channels from '../components/wizard/Step3Channels';
import Step4PerChannel from '../components/wizard/Step4PerChannel';
import Step5Confirm from '../components/wizard/Step5Confirm';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STEP_META: Array<{
  key: WizardStep;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; weight?: any }>;
}> = [
  { key: 1, label: 'Capture',     Icon: Camera },
  { key: 2, label: 'Edit',        Icon: Sparkle },
  { key: 3, label: 'Channels',    Icon: ShareNetwork },
  { key: 4, label: 'Tweak',       Icon: Sliders },
  { key: 5, label: 'Publish',     Icon: Rocket },
];

// ── Outer screen — owns the Provider, mounts the body ───────────────────

export default function CaptureWizardScreen() {
  const nav = useNavigation<Nav>();
  return (
    <WizardProvider onExit={() => nav.goBack()}>
      <WizardBody />
    </WizardProvider>
  );
}

// ── Body — has access to wizard context ──────────────────────────────────

function WizardBody() {
  const nav = useNavigation<Nav>();
  const { colors } = useTheme();
  const systemScheme = useColorScheme();
  const wiz = useWizardState();

  const styles = useThemedStyles((c) => ({
    root: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      paddingTop: Platform.OS === 'ios' ? 56 : 24,
      paddingBottom: spacing.sm,
      gap: 8,
      backgroundColor: c.background,
      borderBottomWidth: 1,
      borderBottomColor: c.borderLight,
    },
    iconBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: c.borderLight,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    titleWrap: { flex: 1, alignItems: 'center' as const },
    title: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.text },
    subtitle: { fontSize: fontSize.xs, color: c.textSecondary, marginTop: 2 },
    skipBtn: {
      flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4,
      paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: borderRadius.md,
    },
    skipText: { fontSize: fontSize.xs, color: c.textSecondary, fontWeight: fontWeight.medium },

    // step indicator
    indicator: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: c.background,
    },
    stepWrap: { alignItems: 'center' as const, gap: 4 },
    dot: {
      width: 36, height: 36, borderRadius: 18,
      justifyContent: 'center' as const, alignItems: 'center' as const,
      backgroundColor: c.borderLight,
    },
    dotActive: { backgroundColor: 'transparent' },
    dotLabel: { fontSize: 10, fontWeight: fontWeight.medium, color: c.textSecondary },
    dotLabelActive: { color: c.primary, fontWeight: fontWeight.bold },

    body: { flex: 1 },
  }));

  const current = STEP_META[wiz.step - 1];

  return (
    <View style={styles.root}>
      <StatusBar barStyle={systemScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={wiz.step === 1 ? () => nav.goBack() : wiz.prev}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {wiz.step === 1
            ? <X size={20} color={colors.text} weight="bold" />
            : <CaretLeft size={20} color={colors.text} weight="bold" />}
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Stap {wiz.step} · {current.label}</Text>
          <Text style={styles.subtitle}>Wizard · Capture → Publish</Text>
        </View>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => nav.replace('PostReview', { eventId: wiz.capture.eventId ?? '' } as any)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SkipForward size={14} color={colors.textSecondary} weight="bold" />
          <Text style={styles.skipText}>PostReview</Text>
        </TouchableOpacity>
      </View>

      {/* ── Step indicator ─────────────────────────────────────────── */}
      <View style={styles.indicator}>
        {STEP_META.map(({ key, label, Icon }) => {
          const isActive = key === wiz.step;
          const isPast = key < wiz.step;
          const canTap = isPast; // only allow jumping back, not forward
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={canTap ? 0.7 : 1}
              disabled={!canTap}
              onPress={() => canTap && wiz.setStep(key)}
              style={styles.stepWrap}
            >
              {isActive ? (
                <LinearGradient
                  colors={brandGradient.deep as unknown as [string, string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.dot, styles.dotActive]}
                >
                  <Icon size={18} color="#ffffff" weight="duotone" />
                </LinearGradient>
              ) : (
                <View style={styles.dot}>
                  <Icon
                    size={18}
                    color={isPast ? colors.primary : colors.textTertiary}
                    weight={isPast ? 'bold' : 'regular'}
                  />
                </View>
              )}
              <Text style={[styles.dotLabel, isActive && styles.dotLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Step body ──────────────────────────────────────────────── */}
      <FadeWrap stepKey={wiz.step}>
        <View style={styles.body}>
          {wiz.step === 1 && <Step1Capture />}
          {wiz.step === 2 && <Step2Edit />}
          {wiz.step === 3 && <Step3Channels />}
          {wiz.step === 4 && <Step4PerChannel />}
          {wiz.step === 5 && <Step5Confirm />}
        </View>
      </FadeWrap>
    </View>
  );
}

// ── Cross-fade wrapper for step transitions ─────────────────────────────

function FadeWrap({ stepKey, children }: React.PropsWithChildren<{ stepKey: number }>) {
  const opacity = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [stepKey, opacity]);
  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}
