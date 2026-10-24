import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { colors, spacing, typography } from '../../theme';
import { EmployeeActions } from './EmployeeActions';
import { getFullName } from './employee-labels';
import type { EmployeeSummary } from './employee-schemas';
import { employeeTableStyles } from './employee-table-styles';
import { EmploymentTypeBadge } from './EmploymentTypeBadge';
import { StatusBadge } from './StatusBadge';

export type EmployeeRowProps = {
  employee: EmployeeSummary;
  hasActions: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onViewEmployee: (employee: EmployeeSummary) => void;
  onEditEmployee: (employee: EmployeeSummary) => void;
  onDeleteEmployee: (employee: EmployeeSummary) => void;
};

/** One table row. Memoised so scrolling a long page re-renders only rows that changed. */
export const EmployeeTableRow = memo(function EmployeeTableRow({
  employee,
  hasActions,
  canEdit,
  canDelete,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeeRowProps) {
  const fullName = getFullName(employee);
  return (
    <View role="row" style={employeeTableStyles.row}>
      <View role="cell" style={[employeeTableStyles.nameColumn, styles.nameCell]}>
        <Avatar name={fullName} size={32} />
        <View style={styles.nameText}>
          <Pressable accessibilityRole="link" onPress={() => onViewEmployee(employee)}>
            <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
          </Pressable>
          <Text style={styles.secondary}>{employee.employee_code}</Text>
        </View>
      </View>
      <Text role="cell" style={[styles.cell, employeeTableStyles.emailColumn]} numberOfLines={1}>
        {employee.email}
      </Text>
      <Text role="cell" style={[styles.cell, employeeTableStyles.column]} numberOfLines={1}>
        {employee.department}
      </Text>
      <Text role="cell" style={[styles.cell, employeeTableStyles.column]} numberOfLines={2}>
        {employee.job_title}
      </Text>
      <View role="cell" style={employeeTableStyles.typeColumn}>
        <EmploymentTypeBadge employmentType={employee.employment_type} />
      </View>
      <View role="cell" style={employeeTableStyles.statusColumn}>
        <StatusBadge isActive={employee.is_active} />
      </View>
      {hasActions && (
        <View role="cell" style={employeeTableStyles.actionsColumn}>
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
});

const styles = StyleSheet.create({
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
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  secondary: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
