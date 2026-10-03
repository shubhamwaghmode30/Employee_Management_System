import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';
import type { EmployeeListParams } from '../src/features/employees/employee-data-source';

async function listEmployees(params: EmployeeListParams) {
  const result = await createMockEmployeeDataSource().listEmployees(params);
  if (!result.ok) {
    throw new Error(`Expected success but got ${result.error.kind}: ${result.error.message}`);
  }
  return result.value;
}

describe('createMockEmployeeDataSource', () => {
  it('serves mock JSON that matches the employee schema', async () => {
    const page = await listEmployees({ page: 1, page_size: 100 });

    expect(page.total).toBe(24);
    expect(page.items).toHaveLength(24);
  });

  it('paginates like the API', async () => {
    const lastPage = await listEmployees({ page: 3, page_size: 10 });

    expect(lastPage).toMatchObject({ total: 24, page: 3, page_size: 10 });
    expect(lastPage.items).toHaveLength(4);
  });

  it.each([
    ['name', 'priya sharma', 'Priya'],
    ['email', 'kenji.tanaka@', 'Kenji'],
    ['employee code', 'ct0005', 'Sofia'],
  ])('searches by %s, ignoring case', async (_field, q, expectedFirstName) => {
    const page = await listEmployees({ page: 1, page_size: 10, q });

    expect(page.items.map((employee) => employee.first_name)).toEqual([expectedFirstName]);
  });

  it('filters by department and active status together', async () => {
    const page = await listEmployees({
      page: 1,
      page_size: 10,
      department: 'Engineering',
      is_active: false,
    });

    expect(page.items.map((employee) => `${employee.first_name} ${employee.last_name}`)).toEqual([
      'Ananya Iyer',
    ]);
  });

  it('returns an empty page when nothing matches', async () => {
    const page = await listEmployees({ page: 1, page_size: 10, q: 'no such employee' });

    expect(page).toMatchObject({ items: [], total: 0 });
  });
});
