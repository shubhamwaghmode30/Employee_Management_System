import { createApiClient, type FetchFunction } from '../src/api/api-client';
import { createApiEmployeeDataSource } from '../src/features/employees/api-employee-data-source';
import type { EmployeeCreateInput } from '../src/features/employees/employee-inputs';
import mockEmployees from '../src/features/employees/mock-employees.json';

const baseUrl = 'http://localhost:8000/api/v1';

function setup(status: number, body: string | null) {
  const fetchFunction = jest
    .fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>()
    .mockResolvedValue(
      new Response(body, { status, headers: { 'Content-Type': 'application/json' } }),
    );
  const apiClient = createApiClient({ baseUrl, getAccessToken: () => null, fetchFunction });
  return { dataSource: createApiEmployeeDataSource(apiClient), fetchFunction };
}

describe('createApiEmployeeDataSource', () => {
  it('requests GET /employees with the list params and validates the page', async () => {
    const responseBody = { items: mockEmployees.slice(0, 2), total: 24, page: 1, page_size: 2 };
    const { dataSource, fetchFunction } = setup(200, JSON.stringify(responseBody));

    const result = await dataSource.listEmployees({
      page: 1,
      page_size: 2,
      department: 'Human Resources',
      is_active: true,
    });

    expect(fetchFunction).toHaveBeenCalledWith(
      `${baseUrl}/employees?page=1&page_size=2&department=Human+Resources&is_active=true`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual({ ok: true, value: responseBody });
  });

  it('gets one employee by id', async () => {
    const { dataSource, fetchFunction } = setup(200, JSON.stringify(mockEmployees[0]));

    const result = await dataSource.getEmployee('05b12d14-6099-4228-9c6b-35294501d132');

    expect(result.ok).toBe(true);
    expect(fetchFunction).toHaveBeenCalledWith(
      `${baseUrl}/employees/05b12d14-6099-4228-9c6b-35294501d132`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('creates with POST and a JSON body', async () => {
    const { dataSource, fetchFunction } = setup(201, JSON.stringify(mockEmployees[0]));
    const input: EmployeeCreateInput = {
      employee_code: 'FT0025',
      password: 'Welcome@2026',
      first_name: 'Zara',
      last_name: 'Ahmed',
      email: 'zara.ahmed@company.com',
      phone: null,
      department: 'Marketing',
      job_title: 'Brand Manager',
      hire_date: '2026-10-01T00:00:00Z',
      role_id: 3,
      employment_type: 'FULL_TIME',
      annual_salary: '88000.00',
    };

    await dataSource.createEmployee(input);

    expect(fetchFunction).toHaveBeenCalledWith(
      `${baseUrl}/employees`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    );
  });

  it('updates with PATCH', async () => {
    const { dataSource, fetchFunction } = setup(200, JSON.stringify(mockEmployees[0]));

    await dataSource.updateEmployee('05b12d14-6099-4228-9c6b-35294501d132', {
      first_name: 'Priya',
      last_name: 'Sharma',
      email: 'priya.sharma@company.com',
      phone: null,
      department: 'Human Resources',
      job_title: 'Head of People',
      hire_date: '2019-04-15T09:00:00Z',
      role_id: 2,
      is_active: true,
      employment_type: 'FULL_TIME',
      annual_salary: null,
    });

    expect(fetchFunction).toHaveBeenCalledWith(
      `${baseUrl}/employees/05b12d14-6099-4228-9c6b-35294501d132`,
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('deletes with DELETE and accepts 204 No Content', async () => {
    const { dataSource, fetchFunction } = setup(204, null);

    const result = await dataSource.deleteEmployee('05b12d14-6099-4228-9c6b-35294501d132');

    expect(result).toEqual({ ok: true, value: null });
    expect(fetchFunction).toHaveBeenCalledWith(
      `${baseUrl}/employees/05b12d14-6099-4228-9c6b-35294501d132`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
