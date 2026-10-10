import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

type FilterChipProps = {
  label: string;
  isSelected: boolean;
  isDisabled?: boolean;
  onPress: () => void;
};

export function FilterChip({ label, isSelected, isDisabled = false, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isSelected && styles.chipSelected,
        pressed && styles.chipPressed,
        isDisabled && styles.chipDisabled,
      ]}
    >
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
