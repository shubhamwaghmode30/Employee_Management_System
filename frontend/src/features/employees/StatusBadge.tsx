import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

type StatusBadgeProps = {
  isActive: boolean;
};

export function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, isActive ? styles.active : styles.inactive]}>
      <View aria-hidden style={[styles.dot, isActive ? styles.activeDot : styles.inactiveDot]} />
      <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
        {isActive ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
}

const dotSize = 6;

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  active: {
    backgroundColor: colors.successSubtle,
  },
  inactive: {
    backgroundColor: colors.background,
  },
  dot: {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
  },
  activeDot: {
    backgroundColor: colors.success,
  },
  inactiveDot: {
    backgroundColor: colors.textMuted,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  activeLabel: {
    color: colors.success,
  },
  inactiveLabel: {
    color: colors.textSecondary,
  },
});
