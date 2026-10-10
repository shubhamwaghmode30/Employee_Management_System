import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { colors, elevation, radius, spacing, typography } from '../../theme';
import { EmployeeActions } from './EmployeeActions';
import { employmentTypeLabels, getFullName } from './employee-labels';
import type { Employee } from './employee-schemas';
import { StatusBadge } from './StatusBadge';

type EmployeeTableProps = {
  employees: readonly Employee[];
  canEdit: boolean;
  canDelete: (employee: Employee) => boolean;
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
  const hasActions = canEdit || employees.some(canDelete);

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
      {employees.map((employee, index) => {
        const fullName = getFullName(employee);
        const isLastRow = index === employees.length - 1;
        return (
          <View key={employee.id} role="row" style={[styles.row, isLastRow && styles.lastRow]}>
            <View role="cell" style={[styles.nameColumn, styles.nameCell]}>
              <Avatar name={fullName} size={34} />
              <View style={styles.nameText}>
                <Pressable accessibilityRole="link" onPress={() => onViewEmployee(employee)}>
                  <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
                </Pressable>
                <Text style={styles.secondary}>{employee.employee_code}</Text>
              </View>
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
                  canDelete={canDelete(employee)}
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
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  headerRow: {
    backgroundColor: colors.surfaceMuted,
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
    gap: spacing.sm + spacing.xs,
  },
  nameText: {
    flexShrink: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  secondary: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  nameColumn: {
    flex: 1.6,
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
    flex: 0.7,
  },
});
