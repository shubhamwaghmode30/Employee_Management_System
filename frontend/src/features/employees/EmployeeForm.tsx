import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { roleLabels, roleNames } from '../../auth/roles';
import { useSessionUser } from '../../auth/session-user-context';
import { TextField } from '../../components/TextField';
import { colors, spacing, typography } from '../../theme';
import { ChoiceField } from './ChoiceField';
import { departments } from './departments';
import { useEmployeeDataSource } from './employee-data-source-context';
import { employmentTypeLabels } from './employee-labels';
import type { Employee } from './employee-schemas';
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
  const form = useEmployeeForm(useEmployeeDataSource(), mode, onSaved);
  const { values, fieldErrors } = form;
  const isCreating = mode.kind === 'create';

  // Only an admin may assign the admin role; an existing admin keeps the option so it stays visible.
  const isAdminOptionAvailable =
    user.role === 'ADMIN' || (mode.kind === 'edit' && values.role === 'ADMIN');
  const roleOptions = roleNames
    .filter((roleName) => roleName !== 'ADMIN' || isAdminOptionAvailable)
    .map((roleName) => ({ value: roleName, label: roleLabels[roleName] }));

  const departmentNames: readonly string[] =
    values.department === '' || departments.some((name) => name === values.department)
      ? departments
      : [...departments, values.department];

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>
        {isCreating ? 'Add employee' : `Edit ${values.firstName} ${values.lastName}`}
      </Text>

      {form.submitError !== null && (
        <View role="alert" style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{form.submitError.message}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Employment
        </Text>
        {isCreating ? (
          <ChoiceField
            label="Employment type"
            options={employmentTypeOptions}
            selectedValue={values.employmentType}
            onChange={(employmentType) => form.changeValue('employmentType', employmentType)}
          />
        ) : (
          <View style={styles.readOnly}>
            <Text style={styles.readOnlyLabel}>Employment type</Text>
            <Text style={styles.readOnlyValue}>{employmentTypeLabels[values.employmentType]}</Text>
          </View>
        )}
        {values.employmentType === 'FULL_TIME' ? (
          <TextField
            label="Annual salary (optional)"
            value={values.annualSalary}
            onChangeText={(text) => form.changeValue('annualSalary', text)}
            error={fieldErrors.annualSalary}
            placeholder="e.g. 95000.00"
            keyboardType="decimal-pad"
          />
        ) : (
          <>
            <TextField
              label="Hourly rate (optional)"
              value={values.hourlyRate}
              onChangeText={(text) => form.changeValue('hourlyRate', text)}
              error={fieldErrors.hourlyRate}
              placeholder="e.g. 62.50"
              keyboardType="decimal-pad"
            />
            <TextField
              label="Contract end date (optional)"
              value={values.contractEndDate}
              onChangeText={(text) => form.changeValue('contractEndDate', text)}
              error={fieldErrors.contractEndDate}
              hint="Format: YYYY-MM-DD"
              placeholder="e.g. 2026-12-31"
              autoCapitalize="none"
            />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Personal details
        </Text>
        <TextField
          label="First name"
          value={values.firstName}
          onChangeText={(text) => form.changeValue('firstName', text)}
          error={fieldErrors.firstName}
          autoComplete="given-name"
        />
        <TextField
          label="Last name"
          value={values.lastName}
          onChangeText={(text) => form.changeValue('lastName', text)}
          error={fieldErrors.lastName}
          autoComplete="family-name"
        />
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

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Job
        </Text>
        <ChoiceField
          label="Department"
          options={departmentNames.map((name) => ({ value: name, label: name }))}
          selectedValue={values.department}
          onChange={(department) => form.changeValue('department', department)}
          error={fieldErrors.department}
        />
        <TextField
          label="Job title"
          value={values.jobTitle}
          onChangeText={(text) => form.changeValue('jobTitle', text)}
          error={fieldErrors.jobTitle}
          placeholder="e.g. Senior Software Engineer"
        />
        <TextField
          label="Hire date"
          value={values.hireDate}
          onChangeText={(text) => form.changeValue('hireDate', text)}
          error={fieldErrors.hireDate}
          hint="Format: YYYY-MM-DD"
          placeholder="e.g. 2026-10-09"
          autoCapitalize="none"
        />
        <ChoiceField
          label="Role"
          options={roleOptions}
          selectedValue={values.role}
          onChange={(role) => form.changeValue('role', role)}
          error={fieldErrors.role}
        />
        {!isCreating && (
          <ChoiceField
            label="Status"
            options={statusOptions}
            selectedValue={values.isActive ? 'active' : 'inactive'}
            onChange={(status) => form.changeValue('isActive', status === 'active')}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Account
        </Text>
        {isCreating ? (
          <>
            <TextField
              label="Employee code"
              value={values.employeeCode}
              onChangeText={(text) => form.changeValue('employeeCode', text)}
              error={fieldErrors.employeeCode}
              placeholder="e.g. FT0025"
              autoCapitalize="characters"
            />
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
          </>
        ) : (
          <View style={styles.readOnly}>
            <Text style={styles.readOnlyLabel}>Employee code</Text>
            <Text style={styles.readOnlyValue}>{values.employeeCode}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: form.isSubmitting }}
          disabled={form.isSubmitting}
          onPress={onCancel}
          style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryLabel}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: form.isSubmitting, busy: form.isSubmitting }}
          disabled={form.isSubmitting}
          onPress={() => void form.submit()}
          style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}
        >
          {form.isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryLabel}>{isCreating ? 'Create employee' : 'Save changes'}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 720,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: typography.fontSize.md,
  },
  section: {
    gap: spacing.md,
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
  button: {
    minWidth: 120,
    alignItems: 'center',
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  secondaryLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  primaryLabel: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
