import type { Permission } from '../src/types/permission';
import type { RoleName } from '../src/types/role-name';
import type { SessionUser } from '../src/types/session-user';

/** Permissions per role, as the backend migrations grant them in role_permissions. */
export const permissionsByRole: Record<RoleName, readonly Permission[]> = {
  ADMIN: ['EMPLOYEE_CREATE', 'EMPLOYEE_DELETE', 'EMPLOYEE_READ', 'EMPLOYEE_RESTORE', 'EMPLOYEE_UPDATE', 'ROLE_ASSIGN'],
  HR_MANAGER: ['EMPLOYEE_CREATE', 'EMPLOYEE_READ', 'EMPLOYEE_UPDATE'],
  EMPLOYEE: ['EMPLOYEE_READ'],
};

/** A signed-in user who is not in the mock directory, unless an id is given. */
export function buildSessionUser(role: RoleName, id = 'b7f3c0de-4a1e-4d2b-9f00-5e6a7c8d9e01'): SessionUser {
  return {
    id,
    firstName: 'Kavya',
    lastName: 'Reddy',
    fullName: 'Kavya Reddy',
    email: 'kavya.reddy@company.com',
    role,
    permissions: permissionsByRole[role],
  };
}
