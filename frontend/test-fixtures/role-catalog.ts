import { createRoleCatalog } from '../src/auth/role-catalog';
import { mockRoles } from '../src/features/employees/mock-employee-data-source';

/** The roles a migrated database holds, matching the role_ids in mock-employees.json. */
export const testRoleCatalog = createRoleCatalog(mockRoles);
