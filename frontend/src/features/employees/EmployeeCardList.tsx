import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { EmployeeActions } from './EmployeeActions';
import { employmentTypeLabels, getFullName } from './employee-labels';
import type { Employee } from './employee-schemas';
import { StatusBadge } from './StatusBadge';

type EmployeeCardListProps = {
  employees: readonly Employee[];
  canEdit: boolean;
  canDelete: boolean;
  onViewEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
};

export function EmployeeCardList({
  employees,
  canEdit,
  canDelete,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeeCardListProps) {
  return (
    <View role="list" aria-label="Employees" style={styles.list}>
      {employees.map((employee) => {
        const fullName = getFullName(employee);
        return (
          <View key={employee.id} role="listitem" style={styles.card}>
            <View style={styles.header}>
              <View style={styles.identity}>
                <Pressable accessibilityRole="link" onPress={() => onViewEmployee(employee)}>
                  <Text style={styles.name}>{fullName}</Text>
                </Pressable>
                <Text style={styles.secondary}>
                  {employee.job_title} · {employee.department}
                </Text>
              </View>
              <StatusBadge isActive={employee.is_active} />
            </View>
            <Text style={styles.secondary}>{employee.email}</Text>
            <View style={styles.footer}>
              <Text style={styles.secondary}>
                {employmentTypeLabels[employee.employment_type]} · {employee.employee_code}
              </Text>
              <EmployeeActions
                employeeName={fullName}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={() => onEditEmployee(employee)}
                onDelete={() => onDeleteEmployee(employee)}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  secondary: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
