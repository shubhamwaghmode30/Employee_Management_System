import { useRef, useState } from 'react';
import { z } from 'zod';

import type { ApiError } from '../../api/api-error';
import type { RoleCatalog } from '../../auth/role-catalog';
import type { Result } from '../../types/result';
import type { EmployeeDataSource } from './employee-data-source';
import {
  type EmployeeFormField,
  type EmployeeFormValues,
  emptyEmployeeFormValues,
  type FieldErrors,
  formValuesFromEmployee,
  hasChanges,
  validateCreateForm,
  validateUpdateForm,
} from './employee-form-values';
import type { Employee } from './employee-schemas';

export type EmployeeFormMode = { kind: 'create' } | { kind: 'edit'; employee: Employee };

/** Backend conflict codes that belong to a single form field. */
const conflictFields: Record<string, EmployeeFormField> = {
  DUPLICATE_EMAIL: 'email',
  DUPLICATE_EMPLOYEE_CODE: 'employeeCode',
};

const emailInUseMessage = 'Another employee already uses this email';

const checkableEmailSchema = z.email();

/** Controller for the create and edit employee form. */
export function useEmployeeForm(
  dataSource: EmployeeDataSource,
  roleCatalog: RoleCatalog,
  mode: EmployeeFormMode,
  onSaved: (employee: Employee) => void,
) {
  const [values, setValues] = useState<EmployeeFormValues>(() =>
    mode.kind === 'edit' ? formValuesFromEmployee(mode.employee, roleCatalog) : emptyEmployeeFormValues,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Only the newest email check may set an error, however the responses arrive.
  const latestEmailCheck = useRef(0);

  async function save(): Promise<Result<Employee, ApiError> | null> {
    if (mode.kind === 'create') {
      const validation = validateCreateForm(values, roleCatalog);
      if (!validation.ok) {
        setFieldErrors(validation.error);
        return null;
      }
      return dataSource.createEmployee(validation.value);
    }
    const validation = validateUpdateForm(values, roleCatalog, mode.employee);
    if (!validation.ok) {
      setFieldErrors(validation.error);
      return null;
    }
    // Nothing changed, so there is nothing worth sending.
    if (!hasChanges(validation.value)) {
      return { ok: true, value: mode.employee };
    }
    return dataSource.updateEmployee(mode.employee.id, validation.value);
  }

  return {
    values,
    fieldErrors,
    submitError,
    isSubmitting,
    changeValue<Field extends EmployeeFormField>(field: Field, value: EmployeeFormValues[Field]) {
      setValues((current) => ({ ...current, [field]: value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    },
    /** Checks just the email with the backend when the field loses focus, before the form is sent. */
    async checkEmail() {
      const email = values.email.trim().toLowerCase();
      const originalEmail = mode.kind === 'edit' ? mode.employee.email.toLowerCase() : null;
      if (!checkableEmailSchema.safeParse(email).success || email === originalEmail) {
        return;
      }
      latestEmailCheck.current += 1;
      const checkNumber = latestEmailCheck.current;
      const result = await dataSource.checkEmailAvailability(email, mode.kind === 'edit' ? mode.employee.id : null);
      // A failed check is not shown: submitting still reports a clash from the server.
      if (checkNumber === latestEmailCheck.current && result.ok && !result.value) {
        setFieldErrors((current) => ({ ...current, email: emailInUseMessage }));
      }
    },
    async submit() {
      setSubmitError(null);
      setIsSubmitting(true);
      const result = await save();
      setIsSubmitting(false);
      if (result === null) {
        return;
      }
      if (result.ok) {
        onSaved(result.value);
        return;
      }
      const conflictField =
        result.error.kind === 'conflict' && result.error.code !== null
          ? conflictFields[result.error.code]
          : undefined;
      if (conflictField === undefined) {
        setSubmitError(result.error);
      } else {
        setFieldErrors((current) => ({ ...current, [conflictField]: result.error.message }));
      }
    },
  };
}
