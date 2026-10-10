import type { Permission } from './permission';
import type { RoleName } from './role-name';

/** The signed-in employee, as GET /api/v1/auth/me describes them. */
export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: RoleName;
  permissions: readonly Permission[];
};
