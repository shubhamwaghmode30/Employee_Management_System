import { useState } from 'react';
import { z } from 'zod';

import type { ApiError } from '../../api/api-error';
import type { Result } from '../../types/result';
import type { SessionUser } from '../../types/session-user';

export type SignIn = (email: string, password: string) => Promise<Result<SessionUser, ApiError>>;

type LoginFieldErrors = {
  email?: string | undefined;
  password?: string | undefined;
};

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Enter your password'),
});

/** Messages for sign-in failures, worded for someone at the login screen. */
function describeLoginError(error: ApiError): string {
  if (error.kind === 'unauthorized') {
    return 'Incorrect email or password, or the account is inactive.';
  }
  return error.message;
}

export function useLoginForm(signIn: SignIn) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return {
    email,
    password,
    fieldErrors,
    submitError,
    isSubmitting,
    changeEmail(text: string) {
      setEmail(text);
      setFieldErrors((current) => ({ ...current, email: undefined }));
    },
    changePassword(text: string) {
      setPassword(text);
      setFieldErrors((current) => ({ ...current, password: undefined }));
    },
    async submit() {
      setSubmitError(null);
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        const errors: LoginFieldErrors = {};
        for (const issue of parsed.error.issues) {
          if (issue.path[0] === 'email') {
            errors.email ??= issue.message;
          } else if (issue.path[0] === 'password') {
            errors.password ??= issue.message;
          }
        }
        setFieldErrors(errors);
        return;
      }
      setIsSubmitting(true);
      const result = await signIn(parsed.data.email, parsed.data.password);
      if (!result.ok) {
        setIsSubmitting(false);
        setSubmitError(describeLoginError(result.error));
      }
    },
  };
}
