import { hasPermission } from '../src/auth/role-permissions';
import type { Permission } from '../src/types/permission';
import type { RoleName } from '../src/types/role-name';

const allPermissions: readonly Permission[] = [
  'EMPLOYEE_READ',
  'EMPLOYEE_CREATE',
  'EMPLOYEE_UPDATE',
  'EMPLOYEE_DELETE',
  'ROLE_ASSIGN',
];

describe('hasPermission', () => {
  it.each<[RoleName, readonly Permission[]]>([
    ['ADMIN', allPermissions],
    ['HR_MANAGER', ['EMPLOYEE_READ', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE']],
    ['EMPLOYEE', ['EMPLOYEE_READ']],
  ])('grants %s exactly the backend policy permissions', (role, grantedPermissions) => {
    const granted = allPermissions.filter((permission) => hasPermission(role, permission));

    expect(granted).toEqual(grantedPermissions);
  });
});
