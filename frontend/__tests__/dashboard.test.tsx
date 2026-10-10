import { fireEvent, render, screen } from '@testing-library/react-native';

import { SessionUserProvider } from '../src/auth/session-user-context';
import { Dashboard } from '../src/features/dashboard/Dashboard';
import type { EmployeeDataSource } from '../src/features/employees/employee-data-source';
import { EmployeeDataSourceProvider } from '../src/features/employees/employee-data-source-context';
import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';
import type { RoleName } from '../src/types/role-name';
import { buildSessionUser } from '../test-fixtures/session-users';

async function renderDashboard(role: RoleName = 'ADMIN', dataSource: EmployeeDataSource = createMockEmployeeDataSource()) {
  const handlers = { onAddEmployee: jest.fn(), onOpenDirectory: jest.fn(), onOpenProfile: jest.fn() };
  await render(
    <SessionUserProvider user={buildSessionUser(role)}>
      <EmployeeDataSourceProvider dataSource={dataSource}>
        <Dashboard {...handlers} />
      </EmployeeDataSourceProvider>
    </SessionUserProvider>,
  );
  return handlers;
}

describe('Dashboard', () => {
  it('greets the user and shows headcount figures', async () => {
    await renderDashboard();

    expect(screen.getByRole('header', { name: /, Kavya$/ })).toBeTruthy();
    expect(await screen.findByLabelText('Total employees: 24')).toBeTruthy();
    expect(screen.getByLabelText('Active: 21')).toBeTruthy();
    expect(screen.getByLabelText('Inactive: 3')).toBeTruthy();
    expect(screen.getByLabelText('Departments: 6')).toBeTruthy();
  });

  it('breaks the headcount down by department, largest first', async () => {
    await renderDashboard();

    const rows = await screen.findAllByRole('listitem');

    expect(rows.map((row) => row.props.accessibilityLabel)).toEqual([
      'Engineering: 8 employees, 33%',
      'Sales: 4 employees, 17%',
      'Finance: 3 employees, 13%',
      'Human Resources: 3 employees, 13%',
      'Marketing: 3 employees, 13%',
      'Operations: 3 employees, 13%',
    ]);
  });

  it.each<[RoleName, boolean]>([
    ['HR_MANAGER', true],
    ['EMPLOYEE', false],
  ])('offers Add employee to %s: %s', async (role, isOffered) => {
    const { onAddEmployee } = await renderDashboard(role);
    await screen.findByLabelText('Total employees: 24');

    const addButton = screen.queryByRole('button', { name: 'Add employee' });
    expect(addButton !== null).toBe(isOffered);
    if (addButton !== null) {
      await fireEvent.press(addButton);
      expect(onAddEmployee).toHaveBeenCalledTimes(1);
    }
  });

  it('shows an error with a retry when the figures cannot load', async () => {
    const workingSource = createMockEmployeeDataSource();
    const listDepartments = jest
      .fn(workingSource.listDepartments)
      .mockResolvedValueOnce({ ok: false, error: { kind: 'network', message: 'Unable to reach the server.' } });
    await renderDashboard('ADMIN', { ...workingSource, listDepartments });

    expect(await screen.findByText('Dashboard could not be loaded')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByLabelText('Total employees: 24')).toBeTruthy();
  });
});
