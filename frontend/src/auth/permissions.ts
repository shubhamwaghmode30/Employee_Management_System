import type { Permission } from '../types/permission';
import type { SessionUser } from '../types/session-user';

/**
 * Hides actions the signed-in user cannot perform, using the permissions the
 * backend reported for them. The backend still enforces every permission.
 */
export function hasPermission(user: SessionUser, permission: Permission): boolean {
  return user.permissions.includes(permission);
}
