import { hasPermission } from '../src/auth/permissions';
import { buildSessionUser } from '../test-fixtures/session-users';

describe('hasPermission', () => {
  it('grants what the backend reported for the user', () => {
    const hrManager = buildSessionUser('HR_MANAGER');

    expect(hasPermission(hrManager, 'EMPLOYEE_UPDATE')).toBe(true);
    expect(hasPermission(hrManager, 'EMPLOYEE_DELETE')).toBe(false);
  });

  it('gives a read-only employee no write permissions', () => {
    const employee = buildSessionUser('EMPLOYEE');

    expect(hasPermission(employee, 'EMPLOYEE_READ')).toBe(true);
    expect(hasPermission(employee, 'EMPLOYEE_CREATE')).toBe(false);
  });
});
