import { useState } from 'react';

import type { ApiError } from '../../api/api-error';
import type { Result } from '../../types/result';
import type { EmployeeDataSource } from './employee-data-source';
import {
  type EmployeeFormField,
  type EmployeeFormValues,
  emptyEmployeeFormValues,
  type FieldErrors,
  formValuesFromEmployee,
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

/** Controller for the create and edit employee form. */
export function useEmployeeForm(
  dataSource: EmployeeDataSource,
  mode: EmployeeFormMode,
  onSaved: (employee: Employee) => void,
) {
  const [values, setValues] = useState<EmployeeFormValues>(() =>
    mode.kind === 'edit' ? formValuesFromEmployee(mode.employee) : emptyEmployeeFormValues,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function save(): Promise<Result<Employee, ApiError> | null> {
    if (mode.kind === 'create') {
      const validation = validateCreateForm(values);
      if (!validation.ok) {
        setFieldErrors(validation.error);
        return null;
      }
      return dataSource.createEmployee(validation.value);
    }
    const validation = validateUpdateForm(values);
    if (!validation.ok) {
      setFieldErrors(validation.error);
      return null;
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
