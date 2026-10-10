import { useState } from 'react';
import { z } from 'zod';

import type { ApiError } from '../../api/api-error';
import type { Result } from '../../types/result';

export type PasswordChangeValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordField = keyof PasswordChangeValues;

export type PasswordFieldErrors = { [Field in PasswordField]?: string | undefined };

export type SubmitPasswordChange = (
  currentPassword: string,
  newPassword: string,
) => Promise<Result<null, ApiError>>;

const emptyValues: PasswordChangeValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Matches PasswordChange in backend app/schemas/auth.py.
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password must be at most 128 characters'),
    confirmPassword: z.string(),
  })
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(({ currentPassword, newPassword }) => currentPassword !== newPassword, {
    message: 'New password must differ from the current password',
    path: ['newPassword'],
  });

function isPasswordField(key: PropertyKey): key is PasswordField {
  return typeof key === 'string' && Object.hasOwn(emptyValues, key);
}

export function validatePasswordChange(values: PasswordChangeValues): PasswordFieldErrors | null {
  const parsed = passwordChangeSchema.safeParse(values);
  if (parsed.success) {
    return null;
  }
  const errors: PasswordFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (field !== undefined && isPasswordField(field) && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

/** Controller for the change-password form on the profile page. */
export function usePasswordChange(submitPasswordChange: SubmitPasswordChange) {
  const [values, setValues] = useState<PasswordChangeValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({});
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  return {
    values,
    fieldErrors,
    submitError,
    isSubmitting,
    isSaved,
    changeValue(field: PasswordField, value: string) {
      setValues((current) => ({ ...current, [field]: value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
      setIsSaved(false);
    },
    async submit() {
      setSubmitError(null);
      const errors = validatePasswordChange(values);
      if (errors !== null) {
        setFieldErrors(errors);
        return;
      }
      setIsSubmitting(true);
      const result = await submitPasswordChange(values.currentPassword, values.newPassword);
      setIsSubmitting(false);
      if (!result.ok) {
        // A wrong current password is the one failure that belongs to a field.
        if (result.error.kind === 'validation') {
          setFieldErrors({ currentPassword: result.error.message });
        } else {
          setSubmitError(result.error);
        }
        return;
      }
      setValues(emptyValues);
      setIsSaved(true);
    },
  };
}
