import { z } from 'zod';

import type { Result } from '../types/result';
import type { ApiClient } from './api-client';
import type { ApiError } from './api-error';
import {
  type CurrentUser,
  currentUserSchema,
  type LoginResponse,
  loginResponseSchema,
  refreshResponseSchema,
} from './schemas/auth';

export function logIn(
  apiClient: ApiClient,
  email: string,
  password: string,
): Promise<Result<LoginResponse, ApiError>> {
  return apiClient.request('/auth/login', {
    schema: loginResponseSchema,
    method: 'POST',
    body: { email, password },
  });
}

export async function refreshAccessToken(
  apiClient: ApiClient,
  refreshToken: string,
): Promise<Result<string, ApiError>> {
  const result = await apiClient.request('/auth/refresh', {
    schema: refreshResponseSchema,
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
  return result.ok ? { ok: true, value: result.value.access_token } : result;
}

export function getCurrentUser(apiClient: ApiClient): Promise<Result<CurrentUser, ApiError>> {
  return apiClient.request('/auth/me', { schema: currentUserSchema });
}

export function changePassword(
  apiClient: ApiClient,
  currentPassword: string,
  newPassword: string,
): Promise<Result<null, ApiError>> {
  return apiClient.request('/auth/change-password', {
    schema: z.null(),
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  });
}
