import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import type { DepartmentHeadcount } from './use-dashboard-stats';

type DepartmentBreakdownProps = {
  departments: readonly DepartmentHeadcount[];
  total: number;
};

/** One labelled bar per department, scaled to the largest department. */
export function DepartmentBreakdown({ departments, total }: DepartmentBreakdownProps) {
  if (departments.length === 0) {
    return <Text style={styles.empty}>No departments yet.</Text>;
  }
  const largest = Math.max(...departments.map((entry) => entry.count), 1);

  return (
    <View role="list" aria-label="Headcount by department" style={styles.list}>
      {departments.map(({ department, count }) => {
        const share = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <View
            key={department}
            role="listitem"
            accessible
            accessibilityLabel={`${department}: ${count} employees, ${share}%`}
            style={styles.row}
          >
            <View style={styles.labels}>
              <Text style={styles.department} numberOfLines={1}>
                {department}
              </Text>
              <Text style={styles.count}>
                {count} · {share}%
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${(count / largest) * 100}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const barHeight = 8;

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs + 2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  department: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  count: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  track: {
    height: barHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  bar: {
    height: barHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
});
