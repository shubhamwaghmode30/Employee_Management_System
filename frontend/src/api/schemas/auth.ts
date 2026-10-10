import { z } from 'zod';

/** Mirrors LoginResponse and RefreshTokenResponse in backend app/schemas/auth.py. */
export const loginResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_type: z.literal('bearer'),
});

export const refreshResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.literal('bearer'),
});

/** Mirrors CurrentUserResponse; permissions are the backend Permission names. */
export const currentUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'EMPLOYEE']),
  permissions: z.array(
    z.enum(['EMPLOYEE_READ', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE', 'ROLE_ASSIGN']),
  ),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
