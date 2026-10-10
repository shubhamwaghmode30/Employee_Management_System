import { StyleSheet, Text, View } from 'react-native';

import { chartSeries, colors, radius, spacing, typography } from '../../theme';

type ActiveRateMeterProps = {
  active: number;
  total: number;
};

/** Share of the workforce that is active, with the figure written out beside the meter. */
export function ActiveRateMeter({ active, total }: ActiveRateMeterProps) {
  const rate = total === 0 ? 0 : Math.round((active / total) * 100);

  return (
    <View accessible accessibilityLabel={`${rate}% of employees are active`} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active workforce</Text>
        <Text style={styles.rate}>{rate}% active</Text>
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
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  // A lighter step of the same hue as the fill, so the whole bar reads as one meter.
  track: {
    height: meterHeight,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySubtle,
    overflow: 'hidden',
  },
  fill: {
    height: meterHeight,
    backgroundColor: chartSeries[0],
  },
  caption: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
