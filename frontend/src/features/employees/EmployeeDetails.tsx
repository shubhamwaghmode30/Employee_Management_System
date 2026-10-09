import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { hasPermission } from '../../auth/role-permissions';
import { getRoleName, roleLabels } from '../../auth/roles';
import { useSessionUser } from '../../auth/session-user-context';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusMessage } from '../../components/StatusMessage';
import { colors, spacing, typography } from '../../theme';
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

  const canEdit = hasPermission(user.role, 'EMPLOYEE_UPDATE');
  const canDelete = hasPermission(user.role, 'EMPLOYEE_DELETE');

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

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="link" onPress={onBack} style={styles.backLink}>
        <Text style={styles.backLabel}>← Back to employees</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={styles.identity}>
          <Text accessibilityRole="header" style={styles.title}>
            {fullName}
          </Text>
          <Text style={styles.subtitle}>
            {employee.job_title} · {employee.department}
          </Text>
          <StatusBadge isActive={employee.is_active} />
        </View>
        {(canEdit || canDelete) && (
          <View style={styles.headerActions}>
            {canEdit && (
              <Pressable
                accessibilityRole="button"
                onPress={() => onEdit(employee)}
                style={({ pressed }) => [styles.button, styles.editButton, pressed && styles.pressed]}
              >
                <Text style={styles.editLabel}>Edit</Text>
              </Pressable>
            )}
            {canDelete && (
              <Pressable
                accessibilityRole="button"
                onPress={() => deletion.requestDeletion(employee)}
                style={({ pressed }) => [styles.button, styles.deleteButton, pressed && styles.pressed]}
              >
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <DetailSection title="Contact">
        <DetailRow label="Email" value={employee.email} />
        <DetailRow label="Phone" value={employee.phone ?? 'Not provided'} />
      </DetailSection>

      <DetailSection title="Employment">
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
      </DetailSection>

      <DetailSection title="Record">
        <DetailRow label="Created" value={formatDate(employee.created_at)} />
        <DetailRow label="Last updated" value={formatDate(employee.updated_at)} />
      </DetailSection>

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

type DetailSectionProps = {
  title: string;
  children: ReactNode;
};

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  // One accessibility element per row so screen readers announce the label with its value.
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 720,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  backLink: {
    alignSelf: 'flex-start',
  },
  backLabel: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  identity: {
    flexShrink: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
  editLabel: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  deleteLabel: {
    color: colors.danger,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  section: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  rowValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
});
