import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { SessionUserProvider } from '../src/auth/session-user-context';
import { Dashboard } from '../src/features/dashboard/Dashboard';
import type { EmployeeDataSource } from '../src/features/employees/employee-data-source';
import { EmployeeDataSourceProvider } from '../src/features/employees/employee-data-source-context';
import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';
import type { RoleName } from '../src/types/role-name';
import { buildSessionUser } from '../test-fixtures/session-users';

async function renderDashboard(role: RoleName = 'ADMIN', dataSource: EmployeeDataSource = createMockEmployeeDataSource()) {
  const handlers = { onAddEmployee: jest.fn(), onOpenDirectory: jest.fn(), onViewEmployee: jest.fn() };
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
  it('greets the user and shows headcount figures from one stats request', async () => {
    const dataSource = createMockEmployeeDataSource();
    const getStats = jest.fn(dataSource.getStats);
    await renderDashboard('ADMIN', { ...dataSource, getStats });

    expect(screen.getByRole('header', { name: /, Kavya$/ })).toBeTruthy();
    expect(await screen.findByLabelText(/^Total employees: 24\. 18 full time · 6 contract/)).toBeTruthy();
    expect(screen.getByLabelText(/^Active: 21\. 88% of the workforce/)).toBeTruthy();
    expect(screen.getByLabelText(/^Inactive: 3\./)).toBeTruthy();
    expect(screen.getByLabelText(/^Departments: 6\. Largest: Engineering/)).toBeTruthy();
    expect(getStats).toHaveBeenCalledTimes(1);
  });

  it('breaks the headcount down by department, largest first', async () => {
    await renderDashboard();

    const chart = await screen.findByLabelText('Headcount by department');
    const rows = within(chart).getAllByRole('listitem');

    expect(rows.map((row) => row.props.accessibilityLabel)).toEqual([
      'Engineering: 8 employees, 33%',
      'Sales: 4 employees, 17%',
      'Finance: 3 employees, 13%',
      'Human Resources: 3 employees, 13%',
      'Marketing: 3 employees, 13%',
      'Operations: 3 employees, 13%',
    ]);
  });

  it('labels every composition segment with its value, not colour alone', async () => {
    await renderDashboard();

    expect(await screen.findByLabelText('Full time: 18, 75%')).toBeTruthy();
    expect(screen.getByLabelText('Contract: 6, 25%')).toBeTruthy();
    expect(screen.getByLabelText('HR Manager: 2, 8%')).toBeTruthy();
    expect(screen.getByLabelText('88% of employees are active')).toBeTruthy();
  });

  it('lists the most recent hires and opens one', async () => {
    const { onViewEmployee } = await renderDashboard();

    const recentHires = await screen.findByLabelText('Recent hires');
    const links = within(recentHires).getAllByRole('link');
    expect(links).toHaveLength(5);

    await fireEvent.press(links[0] ?? recentHires);
    expect(onViewEmployee).toHaveBeenCalledWith(expect.objectContaining({ first_name: expect.any(String) }));
  });

  it.each<[RoleName, boolean]>([
    ['HR_MANAGER', true],
    ['EMPLOYEE', false],
  ])('offers Add employee to %s: %s', async (role, isOffered) => {
    const { onAddEmployee } = await renderDashboard(role);
    await screen.findByLabelText(/^Total employees: 24/);

    const addButton = screen.queryByRole('button', { name: 'Add employee' });
    expect(addButton !== null).toBe(isOffered);
    if (addButton !== null) {
      await fireEvent.press(addButton);
      expect(onAddEmployee).toHaveBeenCalledTimes(1);
    }
  });

  it('shows an error with a retry when the figures cannot load', async () => {
    const workingSource = createMockEmployeeDataSource();
    const getStats = jest
      .fn(workingSource.getStats)
      .mockResolvedValueOnce({ ok: false, error: { kind: 'network', message: 'Unable to reach the server.' } });
    await renderDashboard('ADMIN', { ...workingSource, getStats });

    expect(await screen.findByText('Dashboard could not be loaded')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByLabelText(/^Total employees: 24/)).toBeTruthy();
  });
});
