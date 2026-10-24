import type { RoleName } from '../types/role-name';

/** Role names, most privileged first. Ids are not fixed: they come from GET /roles. */
export const roleNames = ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'] as const satisfies readonly RoleName[];

export const roleLabels: Record<RoleName, string> = {
  ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  EMPLOYEE: 'Employee',
};
