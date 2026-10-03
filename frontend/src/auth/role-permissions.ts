import type { Permission } from '../types/permission';
import type { RoleName } from '../types/role-name';

/**
 * Mirrors the backend role policies so the UI can hide actions a role cannot
 * perform. The backend still enforces every permission.
 */
const rolePermissions: Record<RoleName, ReadonlySet<Permission>> = {
  ADMIN: new Set<Permission>([
    'EMPLOYEE_READ',
    'EMPLOYEE_CREATE',
    'EMPLOYEE_UPDATE',
    'EMPLOYEE_DELETE',
    'ROLE_ASSIGN',
  ]),
  HR_MANAGER: new Set<Permission>(['EMPLOYEE_READ', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE']),
  EMPLOYEE: new Set<Permission>(['EMPLOYEE_READ']),
};

export function hasPermission(role: RoleName, permission: Permission): boolean {
  return rolePermissions[role].has(permission);
}
