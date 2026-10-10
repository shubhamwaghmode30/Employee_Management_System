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
        pressed && !isSelected && styles.chipPressed,
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
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySubtle,
  },
  chipPressed: {
    backgroundColor: colors.surfaceHover,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: typography.fontWeight.medium,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
