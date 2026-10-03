import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

type StatusBadgeProps = {
  isActive: boolean;
};

export function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, isActive ? styles.active : styles.inactive]}>
      <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
        {isActive ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: spacing.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  active: {
    borderColor: colors.success,
  },
  inactive: {
    borderColor: colors.border,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  activeLabel: {
    color: colors.success,
  },
  inactiveLabel: {
    color: colors.textSecondary,
  },
});
