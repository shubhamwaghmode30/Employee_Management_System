import { StyleSheet, Text, View } from 'react-native';

import { chartSeries, colors, radius, spacing, typography } from '../../theme';

type CompositionBarProps = {
  title: string;
  segments: readonly { label: string; count: number }[];
};

/**
 * A 100% stacked bar with a legend that always carries the values, so identity
 * never rests on colour alone. Segments take the categorical slots in order.
 */
export function CompositionBar({ title, segments }: CompositionBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const visibleSegments = segments.filter((segment) => segment.count > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View aria-hidden style={styles.bar}>
        {total === 0 ? (
          <View style={styles.emptyBar} />
        ) : (
          visibleSegments.map((segment) => (
            <View
              key={segment.label}
              style={[
                styles.segment,
                {
                  flexGrow: segment.count,
                  backgroundColor: chartSeries[segments.indexOf(segment)] ?? colors.neutralMark,
                },
              ]}
            />
          ))
        )}
      </View>
      <View role="list" aria-label={title} style={styles.legend}>
        {segments.map((segment, index) => {
          const share = total === 0 ? 0 : Math.round((segment.count / total) * 100);
          return (
            <View
              key={segment.label}
              role="listitem"
              accessible
              accessibilityLabel={`${segment.label}: ${segment.count}, ${share}%`}
              style={styles.legendItem}
            >
              <View
                aria-hidden
                style={[styles.swatch, { backgroundColor: chartSeries[index] ?? colors.neutralMark }]}
              />
              <Text style={styles.legendLabel}>{segment.label}</Text>
              <Text style={styles.legendValue}>
                {segment.count} · {share}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const barHeight = 14;

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  bar: {
    height: barHeight,
    flexDirection: 'row',
    // The 2px surface gap separates segments instead of a stroke.
    gap: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  segment: {
    flexBasis: 0,
  },
  emptyBar: {
    flex: 1,
    backgroundColor: colors.neutralSubtle,
  },
  legend: {
    gap: spacing.xs + 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: radius.sm,
  },
  legendLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  legendValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
