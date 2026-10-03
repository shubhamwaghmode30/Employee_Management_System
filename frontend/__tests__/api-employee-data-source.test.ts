import { createApiClient, type FetchFunction } from '../src/api/api-client';
import { createApiEmployeeDataSource } from '../src/features/employees/api-employee-data-source';
import mockEmployees from '../src/features/employees/mock-employees.json';

describe('createApiEmployeeDataSource', () => {
  it('requests GET /employees with the list params and validates the page', async () => {
    const responseBody = { items: mockEmployees.slice(0, 2), total: 24, page: 1, page_size: 2 };
    const fetchFunction = jest
      .fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>()
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const apiClient = createApiClient({
      baseUrl: 'http://localhost:8000/api/v1',
      getAccessToken: () => null,
      fetchFunction,
    });

    const result = await createApiEmployeeDataSource(apiClient).listEmployees({
      page: 1,
      page_size: 2,
      department: 'Human Resources',
      is_active: true,
    });

    expect(fetchFunction).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/employees?page=1&page_size=2&department=Human+Resources&is_active=true',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual({ ok: true, value: responseBody });
  });
});
