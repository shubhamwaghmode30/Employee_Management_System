import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { EmployeeActions } from './EmployeeActions';
import { employmentTypeLabels, getFullName } from './employee-labels';
import type { Employee } from './employee-schemas';
import { StatusBadge } from './StatusBadge';

type EmployeeTableProps = {
  employees: readonly Employee[];
  canEdit: boolean;
  canDelete: boolean;
  onViewEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
};

export function EmployeeTable({
  employees,
  canEdit,
  canDelete,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeeTableProps) {
  const hasActions = canEdit || canDelete;

  return (
    <View role="table" aria-label="Employees" style={styles.table}>
      <View role="row" style={[styles.row, styles.headerRow]}>
        <Text role="columnheader" style={[styles.headerCell, styles.nameColumn]}>Name</Text>
        <Text role="columnheader" style={[styles.headerCell, styles.emailColumn]}>Email</Text>
        <Text role="columnheader" style={[styles.headerCell, styles.column]}>Department</Text>
        <Text role="columnheader" style={[styles.headerCell, styles.column]}>Title</Text>
        <Text role="columnheader" style={[styles.headerCell, styles.typeColumn]}>Type</Text>
        <Text role="columnheader" style={[styles.headerCell, styles.statusColumn]}>Status</Text>
        {hasActions && (
          <Text role="columnheader" style={[styles.headerCell, styles.actionsColumn]}>Actions</Text>
        )}
      </View>
      {employees.map((employee) => {
        const fullName = getFullName(employee);
        return (
          <View key={employee.id} role="row" style={styles.row}>
            <View role="cell" style={styles.nameColumn}>
              <Pressable accessibilityRole="link" onPress={() => onViewEmployee(employee)}>
                <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
              </Pressable>
              <Text style={styles.secondary}>{employee.employee_code}</Text>
            </View>
            <Text role="cell" style={[styles.cell, styles.emailColumn]} numberOfLines={1}>
              {employee.email}
            </Text>
            <Text role="cell" style={[styles.cell, styles.column]} numberOfLines={1}>
              {employee.department}
            </Text>
            <Text role="cell" style={[styles.cell, styles.column]} numberOfLines={2}>
              {employee.job_title}
            </Text>
            <Text role="cell" style={[styles.cell, styles.typeColumn]}>
              {employmentTypeLabels[employee.employment_type]}
            </Text>
            <View role="cell" style={styles.statusColumn}>
              <StatusBadge isActive={employee.is_active} />
            </View>
            {hasActions && (
              <View role="cell" style={styles.actionsColumn}>
                <EmployeeActions
                  employeeName={fullName}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => onEditEmployee(employee)}
                  onDelete={() => onDeleteEmployee(employee)}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: {
    backgroundColor: colors.background,
  },
  headerCell: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  cell: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  name: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  secondary: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  nameColumn: {
    flex: 1.4,
  },
  emailColumn: {
    flex: 1.8,
  },
  column: {
    flex: 1.2,
  },
  typeColumn: {
    flex: 0.8,
  },
  statusColumn: {
    flex: 0.8,
  },
  actionsColumn: {
    flex: 1,
  },
});
