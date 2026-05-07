import React from 'react';
import { View, Text } from 'react-native';
import { spacing, fontSize, fontWeight } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import type { WizardStep } from '../../hooks/useSocialWizard';

const STEP_LABELS: Record<WizardStep, string> = {
  goal: 'Doel',
  status: 'Status',
  connect: 'Verbinden',
  verify: 'Verifiëren',
  brandVoice: 'Merkstem',
  firstPost: 'Klaar',
  done: 'Klaar',
};

const STEP_ORDER: WizardStep[] = ['goal', 'status', 'connect', 'verify', 'brandVoice', 'firstPost'];

type Props = {
  currentStep: WizardStep;
};

export default function WizardProgress({ currentStep }: Props) {
  const { colors } = useTheme();
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length;

  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      {/* Step counter */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium }}>
          Stap {Math.max(1, currentIdx + 1)} van {totalSteps}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold }}>
          {STEP_LABELS[currentStep]}
        </Text>
      </View>

      {/* Progress dots */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {STEP_ORDER.map((s, i) => {
          const filled = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <View
              key={s}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: active ? colors.primary : filled ? colors.primary + '80' : colors.border,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
