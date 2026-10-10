import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

type ActiveRateMeterProps = {
  active: number;
  total: number;
};

/** Share of the workforce that is active; the icon and label carry the status, not colour alone. */
export function ActiveRateMeter({ active, total }: ActiveRateMeterProps) {
  const rate = total === 0 ? 0 : Math.round((active / total) * 100);

  return (
    <View accessible accessibilityLabel={`${rate}% of employees are active`} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active workforce</Text>
        <View style={styles.rate}>
          <Ionicons name="checkmark-circle" size={16} color={colors.successMark} />
          <Text style={styles.rateText}>{rate}% active</Text>
        </View>
      </View>
      <View aria-hidden style={styles.track}>
        <View style={[styles.fill, { width: `${rate}%` }]} />
      </View>
      <Text style={styles.caption}>
        {active} of {total} employees can sign in and appear as active.
      </Text>
    </View>
  );
}

const meterHeight = 8;

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  rate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rateText: {
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  track: {
    height: meterHeight,
    borderRadius: radius.sm,
    backgroundColor: colors.successSubtle,
    overflow: 'hidden',
  },
  fill: {
    height: meterHeight,
    backgroundColor: colors.successMark,
  },
  caption: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
