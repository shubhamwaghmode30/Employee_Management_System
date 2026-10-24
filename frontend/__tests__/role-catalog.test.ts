import { createRoleCatalog } from '../src/auth/role-catalog';

describe('createRoleCatalog', () => {
  // Ids as a PostgreSQL database might assign them, not the 1, 2, 3 of a fresh SQLite file.
  const catalog = createRoleCatalog([
    { id: 14, name: 'EMPLOYEE', description: 'Employee with read-only access' },
    { id: 12, name: 'ADMIN', description: 'Administrator with full access' },
    { id: 13, name: 'HR_MANAGER', description: 'HR Manager with read/create/update access' },
  ]);

  it('maps role names to the ids the database assigned', () => {
    expect(catalog.getRoleId('ADMIN')).toBe(12);
    expect(catalog.getRoleName(14)).toBe('EMPLOYEE');
  });

  it('lists roles most privileged first, whatever order they arrive in', () => {
    expect(catalog.roleNames).toEqual(['ADMIN', 'HR_MANAGER', 'EMPLOYEE']);
  });

  it('returns null for roles the database does not hold', () => {
    const partialCatalog = createRoleCatalog([{ id: 3, name: 'EMPLOYEE', description: 'Employee' }]);

    expect(partialCatalog.getRoleId('ADMIN')).toBeNull();
    expect(partialCatalog.getRoleName(99)).toBeNull();
    expect(partialCatalog.roleNames).toEqual(['EMPLOYEE']);
  });
});
