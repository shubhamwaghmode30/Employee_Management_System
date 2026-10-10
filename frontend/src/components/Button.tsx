import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
  isDisabled?: boolean;
  isCompact?: boolean;
  accessibilityLabel?: string;
};

const labelColors: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  secondary: colors.textPrimary,
  danger: colors.onPrimary,
  dangerOutline: colors.danger,
  ghost: colors.primary,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  isLoading = false,
  isDisabled = false,
  isCompact = false,
  accessibilityLabel,
}: ButtonProps) {
  const isInactive = isDisabled || isLoading;
  const labelColor = labelColors[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: isLoading }}
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isCompact && styles.compact,
        styles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <>
          {icon !== undefined && <Ionicons name={icon} size={isCompact ? 16 : 18} color={labelColor} />}
          <Text style={[styles.label, isCompact && styles.compactLabel, { color: labelColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.md,
  },
  compact: {
    minHeight: 32,
    paddingHorizontal: spacing.sm + spacing.xs,
    borderRadius: radius.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  dangerOutline: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  compactLabel: {
    fontSize: typography.fontSize.sm,
  },
});
