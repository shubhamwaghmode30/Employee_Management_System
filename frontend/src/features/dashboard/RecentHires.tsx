import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { colors, spacing, typography } from '../../theme';
import { formatDate, getFullName } from '../employees/employee-labels';
import type { EmployeeSummary } from '../employees/employee-schemas';
import { EmploymentTypeBadge } from '../employees/EmploymentTypeBadge';

type RecentHiresProps = {
  employees: readonly EmployeeSummary[];
  isCompact: boolean;
  onViewEmployee: (employee: EmployeeSummary) => void;
};

export function RecentHires({ employees, isCompact, onViewEmployee }: RecentHiresProps) {
  if (employees.length === 0) {
    return <Text style={styles.empty}>Nobody has been hired yet.</Text>;
  }

  return (
    <View role="table" accessibilityLabel="Recent hires">
      {!isCompact && (
        <View role="row" style={[styles.row, styles.headerRow]}>
          <Text role="columnheader" style={[styles.headerCell, styles.nameColumn]}>Employee</Text>
          <Text role="columnheader" style={[styles.headerCell, styles.column]}>Department</Text>
          <Text role="columnheader" style={[styles.headerCell, styles.typeColumn]}>Type</Text>
          <Text role="columnheader" style={[styles.headerCell, styles.dateColumn]}>Hired</Text>
        </View>
      )}
      {employees.map((employee) => {
        const fullName = getFullName(employee);
        return (
          <View key={employee.id} role="row" style={styles.row}>
            <View role="cell" style={[styles.nameColumn, styles.nameCell]}>
              <Avatar name={fullName} size={32} />
              <View style={styles.nameText}>
                <Pressable accessibilityRole="link" onPress={() => onViewEmployee(employee)}>
                  <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
                </Pressable>
                <Text style={styles.secondary} numberOfLines={1}>{employee.job_title}</Text>
              </View>
            </View>
            {!isCompact && (
              <>
                <Text role="cell" style={[styles.cell, styles.column]} numberOfLines={1}>
                  {employee.department}
                </Text>
                <View role="cell" style={styles.typeColumn}>
                  <EmploymentTypeBadge employmentType={employee.employment_type} />
                </View>
              </>
            )}
            <Text role="cell" style={[styles.cell, styles.dateColumn]}>
              {formatDate(employee.hire_date)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg - spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.sm,
  },
  headerCell: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cell: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  nameText: {
    flexShrink: 1,
  },
  name: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  secondary: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  nameColumn: {
    flex: 2,
  },
  column: {
    flex: 1.2,
  },
  typeColumn: {
    flex: 0.9,
  },
  dateColumn: {
    flex: 0.9,
    textAlign: 'right',
  },
  empty: {
    padding: spacing.lg,
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
});
