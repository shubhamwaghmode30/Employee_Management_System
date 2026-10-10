import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { hasPermission } from '../../auth/permissions';
import { roleIdsByName, roleLabels, roleNames } from '../../auth/roles';
import { useSessionUser } from '../../auth/session-user-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { TextField } from '../../components/TextField';
import { colors, radius, spacing, typography } from '../../theme';
import { ChoiceField } from './ChoiceField';
import { useEmployeeDataSource } from './employee-data-source-context';
import { employmentTypeLabels, formatDate } from './employee-labels';
import type { Employee } from './employee-schemas';
import { FilterChip } from './FilterChip';
import { useDepartments } from './use-departments';
import { type EmployeeFormMode, useEmployeeForm } from './use-employee-form';

type EmployeeFormProps = {
  mode: EmployeeFormMode;
  onSaved: (employee: Employee) => void;
  onCancel: () => void;
};

const employmentTypeOptions = [
  { value: 'FULL_TIME', label: employmentTypeLabels.FULL_TIME },
  { value: 'CONTRACT', label: employmentTypeLabels.CONTRACT },
] as const;

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export function EmployeeForm({ mode, onSaved, onCancel }: EmployeeFormProps) {
  const user = useSessionUser();
  const dataSource = useEmployeeDataSource();
  const form = useEmployeeForm(dataSource, mode, onSaved);
  const departments = useDepartments(dataSource);
  const { values, fieldErrors } = form;
  const isCreating = mode.kind === 'create';
  const isEditingSelf = mode.kind === 'edit' && mode.employee.id === user.id;

  // Only admins may grant the admin role; an existing admin keeps the option so it stays visible.
  const isAdminOptionAvailable =
    hasPermission(user, 'ROLE_ASSIGN') || (mode.kind === 'edit' && mode.employee.role_id === roleIdsByName.ADMIN);
  const roleOptions = roleNames
    .filter((roleName) => roleName !== 'ADMIN' || isAdminOptionAvailable)
    .map((roleName) => ({ value: roleName, label: roleLabels[roleName] }));

  const departmentSuggestions = departments.filter(
    (name) => name.toLowerCase() !== values.department.trim().toLowerCase(),
  );

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title={isCreating ? 'Add employee' : `Edit ${values.firstName} ${values.lastName}`}
        subtitle={
          isCreating
            ? 'Create the record and a sign-in account for a new team member.'
            : 'Update contact, job and pay details.'
        }
      />

      {form.submitError !== null && (
        <View role="alert" style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
          <Text style={styles.errorBannerText}>{form.submitError.message}</Text>
        </View>
      )}

      <Card title="Personal details">
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <TextField
              label="First name"
              value={values.firstName}
              onChangeText={(text) => form.changeValue('firstName', text)}
              error={fieldErrors.firstName}
              autoComplete="given-name"
            />
          </View>
          <View style={styles.field}>
            <TextField
              label="Last name"
              value={values.lastName}
              onChangeText={(text) => form.changeValue('lastName', text)}
              error={fieldErrors.lastName}
              autoComplete="family-name"
            />
          </View>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <TextField
              label="Email"
              value={values.email}
              onChangeText={(text) => form.changeValue('email', text)}
              error={fieldErrors.email}
              placeholder="e.g. priya.sharma@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          <View style={styles.field}>
            <TextField
              label="Phone (optional)"
              value={values.phone}
              onChangeText={(text) => form.changeValue('phone', text)}
              error={fieldErrors.phone}
              placeholder="e.g. +91 98765 43210"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>
        </View>
      </Card>

      <Card title="Job">
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <TextField
              label="Department"
              value={values.department}
              onChangeText={(text) => form.changeValue('department', text)}
              error={fieldErrors.department}
              placeholder="e.g. Engineering"
            />
            {departmentSuggestions.length > 0 && (
              <View style={styles.suggestions} accessibilityLabel="Existing departments">
                {departmentSuggestions.map((name) => (
                  <FilterChip
                    key={name}
                    label={name}
                    isSelected={false}
                    onPress={() => form.changeValue('department', name)}
                  />
                ))}
              </View>
            )}
          </View>
          <View style={styles.field}>
            <TextField
              label="Job title"
              value={values.jobTitle}
              onChangeText={(text) => form.changeValue('jobTitle', text)}
              error={fieldErrors.jobTitle}
              placeholder="e.g. Senior Software Engineer"
            />
          </View>
        </View>
        {isCreating ? (
          <TextField
            label="Hire date"
            value={values.hireDate}
            onChangeText={(text) => form.changeValue('hireDate', text)}
            error={fieldErrors.hireDate}
            hint="Format: YYYY-MM-DD"
            placeholder="e.g. 2026-10-09"
            autoCapitalize="none"
          />
        ) : (
          <ReadOnlyField label="Hire date" value={formatDate(`${values.hireDate}T00:00:00Z`)} />
        )}
        <ChoiceField
          label="Role"
          options={roleOptions}
          selectedValue={values.role}
          onChange={(role) => form.changeValue('role', role)}
          error={fieldErrors.role}
        />
        {!isCreating &&
          (isEditingSelf ? (
            <ReadOnlyField label="Status" value="Active · you cannot deactivate your own account" />
          ) : (
            <ChoiceField
              label="Status"
              options={statusOptions}
              selectedValue={values.isActive ? 'active' : 'inactive'}
              onChange={(status) => form.changeValue('isActive', status === 'active')}
            />
          ))}
      </Card>

      <Card title="Employment and pay">
        {isCreating ? (
          <ChoiceField
            label="Employment type"
            options={employmentTypeOptions}
            selectedValue={values.employmentType}
            onChange={(employmentType) => form.changeValue('employmentType', employmentType)}
          />
        ) : (
          <ReadOnlyField label="Employment type" value={employmentTypeLabels[values.employmentType]} />
        )}
        {values.employmentType === 'FULL_TIME' ? (
          <TextField
            label="Annual salary"
            value={values.annualSalary}
            onChangeText={(text) => form.changeValue('annualSalary', text)}
            error={fieldErrors.annualSalary}
            placeholder="e.g. 95000.00"
            keyboardType="decimal-pad"
          />
        ) : (
          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <TextField
                label="Hourly rate"
                value={values.hourlyRate}
                onChangeText={(text) => form.changeValue('hourlyRate', text)}
                error={fieldErrors.hourlyRate}
                placeholder="e.g. 62.50"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.field}>
              <TextField
                label="Contract end date (optional)"
                value={values.contractEndDate}
                onChangeText={(text) => form.changeValue('contractEndDate', text)}
                error={fieldErrors.contractEndDate}
                hint="Format: YYYY-MM-DD"
                placeholder="e.g. 2026-12-31"
                autoCapitalize="none"
              />
            </View>
          </View>
        )}
      </Card>

      <Card title="Account">
        {isCreating ? (
          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <TextField
                label="Employee code"
                value={values.employeeCode}
                onChangeText={(text) => form.changeValue('employeeCode', text)}
                error={fieldErrors.employeeCode}
                placeholder="e.g. FT0025"
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.field}>
              <TextField
                label="Temporary password"
                value={values.password}
                onChangeText={(text) => form.changeValue('password', text)}
                error={fieldErrors.password}
                hint="At least 8 characters. Share it with the employee securely."
                isSecure
                autoCapitalize="none"
                autoComplete="new-password"
              />
            </View>
          </View>
        ) : (
          <ReadOnlyField label="Employee code" value={values.employeeCode} />
        )}
      </Card>

      <View style={styles.actions}>
        <Button label="Cancel" variant="secondary" isDisabled={form.isSubmitting} onPress={onCancel} />
        <Button
          label={isCreating ? 'Create employee' : 'Save changes'}
          icon={isCreating ? 'person-add-outline' : 'checkmark'}
          isLoading={form.isSubmitting}
          onPress={() => void form.submit()}
        />
      </View>
    </ScrollView>
  );
}

type ReadOnlyFieldProps = {
  label: string;
  value: string;
};

function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.readOnly}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={styles.readOnlyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 880,
    alignSelf: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.dangerSubtle,
  },
  errorBannerText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.fontSize.md,
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  field: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 260,
    gap: spacing.sm,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  readOnly: {
    gap: spacing.xs,
  },
  readOnlyLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  readOnlyValue: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
