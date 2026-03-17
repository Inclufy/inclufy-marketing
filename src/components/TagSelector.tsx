import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface Props {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}

export default function TagSelector({ tags, selected, onToggle }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tags.map((tag) => {
        const isSelected = selected.includes(tag);
        return (
          <TouchableOpacity
            key={tag}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(tag)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{tag}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  chipTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.semibold,
  },
});
