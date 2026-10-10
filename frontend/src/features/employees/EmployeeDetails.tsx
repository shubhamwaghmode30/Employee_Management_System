import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { hasPermission } from '../../auth/permissions';
import { getRoleName, roleLabels } from '../../auth/roles';
import { useSessionUser } from '../../auth/session-user-context';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusMessage } from '../../components/StatusMessage';
import { colors, elevation, radius, spacing, typography } from '../../theme';
import { DetailRow } from './DetailRow';
import { useEmployeeDataSource } from './employee-data-source-context';
import { employmentTypeLabels, formatDate, formatMoney, getFullName } from './employee-labels';
import type { Employee } from './employee-schemas';
import { StatusBadge } from './StatusBadge';
import { useEmployeeDeletion } from './use-employee-deletion';
import { useEmployeeDetails } from './use-employee-details';

type EmployeeDetailsProps = {
  employeeId: string;
  onBack: () => void;
  onEdit: (employee: Employee) => void;
  onDeleted: () => void;
};

export function EmployeeDetails({ employeeId, onBack, onEdit, onDeleted }: EmployeeDetailsProps) {
  const user = useSessionUser();
  const dataSource = useEmployeeDataSource();
  const details = useEmployeeDetails(dataSource, employeeId);
  const deletion = useEmployeeDeletion(dataSource, onDeleted);

  if (details.state.status === 'loading') {
    return <StatusMessage title="Loading employee…" isLoading />;
  }
  if (details.state.status === 'error') {
    const isMissing = details.state.error.kind === 'not_found';
    return isMissing ? (
      <StatusMessage
        title="Employee not found"
        description="They may have been deleted, or the link is wrong."
        actionLabel="Back to employees"
        onAction={onBack}
      />
    ) : (
      <StatusMessage
        title="Employee could not be loaded"
        description={details.state.error.message}
        actionLabel="Try again"
        onAction={details.reload}
      />
    );
  }

  const { employee } = details.state;
  const fullName = getFullName(employee);
  const roleName = getRoleName(employee.role_id);
  const isSelf = employee.id === user.id;
  const canEdit = hasPermission(user, 'EMPLOYEE_UPDATE');
  const canDelete = hasPermission(user, 'EMPLOYEE_DELETE') && !isSelf;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="link" onPress={onBack} style={styles.backLink}>
        <Ionicons name="arrow-back" size={18} color={colors.primary} />
        <Text style={styles.backLabel}>Back to employees</Text>
      </Pressable>

      <View style={styles.profile}>
        <Avatar name={fullName} size={72} />
        <View style={styles.identity}>
          <Text accessibilityRole="header" style={styles.title}>
            {fullName}
          </Text>
          <Text style={styles.subtitle}>
            {employee.job_title} · {employee.department}
          </Text>
          <View style={styles.badges}>
            <StatusBadge isActive={employee.is_active} />
            {isSelf && <Text style={styles.selfTag}>This is you</Text>}
          </View>
        </View>
        {(canEdit || canDelete) && (
          <View style={styles.actions}>
            {canEdit && <Button label="Edit" icon="create-outline" onPress={() => onEdit(employee)} />}
            {canDelete && (
              <Button
                label="Delete"
                icon="trash-outline"
                variant="dangerOutline"
                onPress={() => deletion.requestDeletion(employee)}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.sections}>
        <View style={styles.column}>
          <Card title="Contact">
            <DetailRow label="Email" value={employee.email} />
            <DetailRow label="Phone" value={employee.phone ?? 'Not provided'} />
          </Card>
          <Card title="Record">
            <DetailRow label="Created" value={formatDate(employee.created_at)} />
            <DetailRow label="Last updated" value={formatDate(employee.updated_at)} />
          </Card>
        </View>
        <View style={styles.column}>
          <Card title="Employment">
            <DetailRow label="Employee code" value={employee.employee_code} />
            <DetailRow label="Employment type" value={employmentTypeLabels[employee.employment_type]} />
            <DetailRow label="Hire date" value={formatDate(employee.hire_date)} />
            <DetailRow label="Role" value={roleName === null ? 'Unknown role' : roleLabels[roleName]} />
            {employee.employment_type === 'FULL_TIME' ? (
              <DetailRow
                label="Annual salary"
                value={employee.annual_salary === null ? 'Not set' : formatMoney(employee.annual_salary)}
              />
            ) : (
              <>
                <DetailRow
                  label="Hourly rate"
                  value={employee.hourly_rate === null ? 'Not set' : `${formatMoney(employee.hourly_rate)}/hr`}
                />
                <DetailRow
                  label="Contract end date"
                  value={employee.contract_end_date === null ? 'Open-ended' : formatDate(employee.contract_end_date)}
                />
              </>
            )}
          </Card>
        </View>
      </View>

      <ConfirmDialog
        isOpen={deletion.pendingEmployee !== null}
        title={`Delete ${fullName}?`}
        message="They will be removed from the employee directory and can no longer sign in."
        confirmLabel="Delete"
        isConfirming={deletion.isDeleting}
        errorMessage={deletion.error?.message ?? null}
        onConfirm={() => void deletion.confirmDeletion()}
        onCancel={deletion.cancelDeletion}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  backLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backLabel: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  profile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
  },
  identity: {
    flex: 1,
    minWidth: 200,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  selfTag: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  column: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 320,
    gap: spacing.lg,
  },
});
