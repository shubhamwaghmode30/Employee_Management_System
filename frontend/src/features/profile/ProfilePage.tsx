import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { roleLabels } from '../../auth/roles';
import { useSessionUser } from '../../auth/session-user-context';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import type { Permission } from '../../types/permission';
import { colors, elevation, radius, spacing, typography } from '../../theme';
import { DetailRow } from '../employees/DetailRow';
import { useEmployeeDataSource } from '../employees/employee-data-source-context';
import { employmentTypeLabels, formatDate } from '../employees/employee-labels';
import { useEmployeeDetails } from '../employees/use-employee-details';
import { ChangePasswordForm } from './ChangePasswordForm';
import type { SubmitPasswordChange } from './use-password-change';

type ProfilePageProps = {
  submitPasswordChange: SubmitPasswordChange;
  onOpenRecord: () => void;
};

const permissionLabels: Record<Permission, string> = {
  EMPLOYEE_READ: 'View employees',
  EMPLOYEE_CREATE: 'Add employees',
  EMPLOYEE_UPDATE: 'Edit employees',
  EMPLOYEE_DELETE: 'Delete employees',
  ROLE_ASSIGN: 'Assign the admin role',
};

const permissionOrder: readonly Permission[] = [
  'EMPLOYEE_READ',
  'EMPLOYEE_CREATE',
  'EMPLOYEE_UPDATE',
  'EMPLOYEE_DELETE',
  'ROLE_ASSIGN',
];

export function ProfilePage({ submitPasswordChange, onOpenRecord }: ProfilePageProps) {
  const user = useSessionUser();
  const record = useEmployeeDetails(useEmployeeDataSource(), user.id);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PageHeader title="My profile" subtitle="Your account, access and password." />

      <View style={styles.identity}>
        <Avatar name={user.fullName} size={64} />
        <View style={styles.identityText}>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.role}>{roleLabels[user.role]}</Text>
        </View>
      </View>

      <View style={styles.columns}>
        <View style={styles.column}>
          <Card title="Employment">
            {record.state.status === 'loading' && <Text style={styles.meta}>Loading your record…</Text>}
            {record.state.status === 'error' && (
              <Text style={styles.meta}>Your employee record could not be loaded.</Text>
            )}
            {record.state.status === 'success' && (
              <>
                <DetailRow label="Employee code" value={record.state.employee.employee_code} />
                <DetailRow label="Department" value={record.state.employee.department} />
                <DetailRow label="Job title" value={record.state.employee.job_title} />
                <DetailRow
                  label="Employment type"
                  value={employmentTypeLabels[record.state.employee.employment_type]}
                />
                <DetailRow label="Hire date" value={formatDate(record.state.employee.hire_date)} />
                <Button label="View full record" variant="ghost" onPress={onOpenRecord} />
              </>
            )}
          </Card>
          <Card title="What you can do">
            <View role="list" style={styles.permissions}>
              {permissionOrder
                .filter((permission) => user.permissions.includes(permission))
                .map((permission) => (
                  <Text key={permission} role="listitem" style={styles.permission}>
                    {permissionLabels[permission]}
                  </Text>
                ))}
            </View>
          </Card>
        </View>
        <View style={styles.column}>
          <ChangePasswordForm submitPasswordChange={submitPasswordChange} />
        </View>
      </View>
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
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  role: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    overflow: 'hidden',
    backgroundColor: colors.primarySubtle,
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  columns: {
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
  permissions: {
    gap: spacing.sm,
  },
  permission: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
});
