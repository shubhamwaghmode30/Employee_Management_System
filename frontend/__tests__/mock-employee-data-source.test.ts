import type {
  EmployeeDataSource,
  EmployeeListParams,
} from '../src/features/employees/employee-data-source';
import type {
  EmployeeCreateInput,
  EmployeeUpdateInput,
} from '../src/features/employees/employee-inputs';
import type { Employee } from '../src/features/employees/employee-schemas';
import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';

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
    ['first name', 'PRIYA', 'Priya'],
    ['last name', 'tanaka', 'Kenji'],
    ['email', 'sofia.rossi@', 'Sofia'],
  ])('searches by %s, ignoring case', async (_field, q, expectedFirstName) => {
    const page = await listEmployees({ page: 1, page_size: 10, q });

    expect(page.items.map((employee) => employee.first_name)).toEqual([expectedFirstName]);
  });

  it.each([
    ['employee code', 'CT0005'],
    ['full name', 'priya sharma'],
  ])('does not match on %s, like the backend search', async (_field, q) => {
    const page = await listEmployees({ page: 1, page_size: 10, q });

    expect(page.total).toBe(0);
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

const newContractor: EmployeeCreateInput = {
  employee_code: 'CT0025',
  password: 'Welcome@2026',
  first_name: 'Zara',
  last_name: 'Ahmed',
  email: 'zara.ahmed@company.com',
  phone: '+44 20 7946 0123',
  department: 'Marketing',
  job_title: 'Social Media Specialist',
  hire_date: '2026-10-01T00:00:00Z',
  role_id: 3,
  employment_type: 'CONTRACT',
  hourly_rate: '45.00',
  contract_end_date: '2027-03-31T00:00:00Z',
};

function detailsOf(employee: Employee) {
  return {
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    job_title: employee.job_title,
    hire_date: employee.hire_date,
    role_id: employee.role_id,
    is_active: employee.is_active,
  };
}

function toUpdateInput(employee: Employee): EmployeeUpdateInput {
  return employee.employment_type === 'FULL_TIME'
    ? { ...detailsOf(employee), employment_type: 'FULL_TIME', annual_salary: employee.annual_salary }
    : {
        ...detailsOf(employee),
        employment_type: 'CONTRACT',
        hourly_rate: employee.hourly_rate,
        contract_end_date: employee.contract_end_date,
      };
}

async function firstEmployee(dataSource: EmployeeDataSource): Promise<Employee> {
  const result = await dataSource.listEmployees({ page: 1, page_size: 1 });
  const employee = result.ok ? result.value.items[0] : undefined;
  if (employee === undefined) {
    throw new Error('Expected the mock data to contain employees');
  }
  return employee;
}

describe('createMockEmployeeDataSource writes', () => {
  it('creates an active employee that list and lookup then return, without the password', async () => {
    const dataSource = createMockEmployeeDataSource();

    const created = await dataSource.createEmployee(newContractor);
    if (!created.ok) {
      throw new Error(created.error.message);
    }

    expect(created.value).toMatchObject({
      employee_code: 'CT0025',
      email: 'zara.ahmed@company.com',
      employment_type: 'CONTRACT',
      hourly_rate: '45.00',
      is_active: true,
    });
    expect(created.value).not.toHaveProperty('password');
    expect(await dataSource.getEmployee(created.value.id)).toEqual({ ok: true, value: created.value });
    const search = await dataSource.listEmployees({ page: 1, page_size: 10, q: 'zara' });
    expect(search.ok && search.value.total).toBe(1);
  });

  it.each([
    ['email', { email: 'PRIYA.SHARMA@company.com' }, 'DUPLICATE_EMAIL'],
    ['employee code', { employee_code: 'FT0001' }, 'DUPLICATE_EMPLOYEE_CODE'],
  ])('rejects a duplicate %s with 409', async (_field, override, code) => {
    const result = await createMockEmployeeDataSource().createEmployee({
      ...newContractor,
      ...override,
    });

    expect(result).toMatchObject({ ok: false, error: { kind: 'conflict', status: 409, code } });
  });

  it('updates an employee and keeps their id, code and creation time', async () => {
    const dataSource = createMockEmployeeDataSource();
    const priya = await firstEmployee(dataSource);

    const result = await dataSource.updateEmployee(priya.id, {
      ...toUpdateInput(priya),
      job_title: 'Head of People',
      is_active: false,
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        id: priya.id,
        employee_code: priya.employee_code,
        created_at: priya.created_at,
        job_title: 'Head of People',
        is_active: false,
      },
    });
  });

  it('lets an employee keep their own email but not take another one', async () => {
    const dataSource = createMockEmployeeDataSource();
    const priya = await firstEmployee(dataSource);

    const keepsOwnEmail = await dataSource.updateEmployee(priya.id, toUpdateInput(priya));
    const takesOtherEmail = await dataSource.updateEmployee(priya.id, {
      ...toUpdateInput(priya),
      email: 'arjun.mehta@company.com',
    });

    expect(keepsOwnEmail.ok).toBe(true);
    expect(takesOtherEmail).toMatchObject({ ok: false, error: { code: 'DUPLICATE_EMAIL' } });
  });

  it('rejects changing the employment type', async () => {
    const dataSource = createMockEmployeeDataSource();
    const priya = await firstEmployee(dataSource);

    const result = await dataSource.updateEmployee(priya.id, {
      ...detailsOf(priya),
      employment_type: 'CONTRACT',
      hourly_rate: '50.00',
      contract_end_date: null,
    });

    expect(result).toMatchObject({ ok: false, error: { kind: 'validation', status: 422 } });
  });

  it('deletes an employee so they can no longer be found', async () => {
    const dataSource = createMockEmployeeDataSource();
    const priya = await firstEmployee(dataSource);

    expect(await dataSource.deleteEmployee(priya.id)).toEqual({ ok: true, value: null });
    expect(await dataSource.getEmployee(priya.id)).toMatchObject({
      ok: false,
      error: { kind: 'not_found', status: 404, code: 'EMPLOYEE_NOT_FOUND' },
    });
    expect(await dataSource.deleteEmployee(priya.id)).toMatchObject({
      ok: false,
      error: { kind: 'not_found' },
    });
  });

  it('keeps changes separate between data source instances', async () => {
    const first = createMockEmployeeDataSource();
    const second = createMockEmployeeDataSource();
    const priya = await firstEmployee(first);

    await first.deleteEmployee(priya.id);

    expect((await second.getEmployee(priya.id)).ok).toBe(true);
  });
});
