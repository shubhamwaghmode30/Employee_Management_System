import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { chartSeries, colors, radius, spacing, typography } from '../../theme';

type DepartmentBarChartProps = {
  departments: readonly { department: string; count: number }[];
  total: number;
};

function shareOf(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

/**
 * One series, so one hue and no legend: the title names it. Bars grow from a
 * shared baseline, scaled to the largest department, value at the tip.
 */
export function DepartmentBarChart({ departments, total }: DepartmentBarChartProps) {
  const [hoveredDepartment, setHoveredDepartment] = useState<string | null>(null);

  if (departments.length === 0) {
    return <Text style={styles.empty}>No departments yet.</Text>;
  }
  const largest = Math.max(...departments.map((entry) => entry.count), 1);

  return (
    <View role="list" accessibilityLabel="Headcount by department" style={styles.chart}>
      {departments.map(({ department, count }) => {
        const share = shareOf(count, total);
        const isHovered = hoveredDepartment === department;
        return (
          <Pressable
            key={department}
            role="listitem"
            accessible
            accessibilityLabel={`${department}: ${count} employees, ${share}%`}
            onHoverIn={() => setHoveredDepartment(department)}
            onHoverOut={() => setHoveredDepartment(null)}
            style={[styles.row, isHovered && styles.rowHovered]}
          >
            <Text style={styles.department} numberOfLines={1}>
              {department}
            </Text>
            <View style={styles.plot}>
              <View
                style={[
                  styles.bar,
                  { width: `${(count / largest) * 100}%` },
                  hoveredDepartment !== null && !isHovered && styles.barDimmed,
                ]}
              />
              <Text style={styles.value}>{count}</Text>
            </View>
            <Text style={styles.share}>{isHovered ? `${share}% of total` : `${share}%`}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const barThickness = 16;

const styles = StyleSheet.create({
  chart: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  rowHovered: {
    backgroundColor: colors.surfaceHover,
  },
  department: {
    width: 128,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  plot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderStrong,
  },
  bar: {
    height: barThickness,
    maxWidth: '85%',
    // Square at the baseline, a small rounded data end.
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundColor: chartSeries[0],
  },
  barDimmed: {
    opacity: 0.45,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  share: {
    width: 76,
    textAlign: 'right',
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
});
