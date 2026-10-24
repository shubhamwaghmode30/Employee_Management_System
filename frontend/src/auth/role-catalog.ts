import type { Role } from '../api/schemas/role';
import type { RoleName } from '../types/role-name';
import { roleNames } from './roles';

/** Maps between role names and the ids the backend database assigned them. */
export type RoleCatalog = {
  /** Roles that exist in the database, most privileged first. */
  roleNames: readonly RoleName[];
  getRoleId(roleName: RoleName): number | null;
  getRoleName(roleId: number): RoleName | null;
};

export function createRoleCatalog(roles: readonly Role[]): RoleCatalog {
  const idsByName = new Map(roles.map((role) => [role.name, role.id]));
  const namesById = new Map(roles.map((role) => [role.id, role.name]));
  return {
    roleNames: roleNames.filter((roleName) => idsByName.has(roleName)),
    getRoleId: (roleName) => idsByName.get(roleName) ?? null,
    getRoleName: (roleId) => namesById.get(roleId) ?? null,
  };
}
