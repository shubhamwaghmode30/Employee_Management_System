import type { RoleName } from '../types/role-name';

export const roleNames: readonly RoleName[] = ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'];

export const roleLabels: Record<RoleName, string> = {
  ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  EMPLOYEE: 'Employee',
};

/**
 * Role ids as the backend seed script creates them; employees reference roles
 * by role_id. Confirm against the seed script once it is merged.
 */
export const roleIdsByName: Record<RoleName, number> = {
  ADMIN: 1,
  HR_MANAGER: 2,
  EMPLOYEE: 3,
};

export function getRoleName(roleId: number): RoleName | null {
  return roleNames.find((roleName) => roleIdsByName[roleName] === roleId) ?? null;
}
