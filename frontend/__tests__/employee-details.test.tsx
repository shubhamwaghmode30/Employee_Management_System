import { fireEvent, render, screen } from '@testing-library/react-native';

import { SessionUserProvider } from '../src/auth/session-user-context';
import { EmployeeDataSourceProvider } from '../src/features/employees/employee-data-source-context';
import { EmployeeDetails } from '../src/features/employees/EmployeeDetails';
import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';
import mockEmployees from '../src/features/employees/mock-employees.json';
import type { RoleName } from '../src/types/role-name';

const priyaId = mockEmployees[0]?.id ?? '';
const sofiaId = mockEmployees[4]?.id ?? '';

async function renderDetails(employeeId: string, role: RoleName = 'ADMIN') {
  const dataSource = createMockEmployeeDataSource();
  const deleteEmployee = jest.fn(dataSource.deleteEmployee);
  const handlers = { onBack: jest.fn(), onEdit: jest.fn(), onDeleted: jest.fn() };
  await render(
    <SessionUserProvider user={{ fullName: 'Arjun Mehta', email: 'arjun.mehta@company.com', role }}>
      <EmployeeDataSourceProvider dataSource={{ ...dataSource, deleteEmployee }}>
        <EmployeeDetails employeeId={employeeId} {...handlers} />
      </EmployeeDataSourceProvider>
    </SessionUserProvider>,
  );
  return { deleteEmployee, ...handlers };
}

describe('EmployeeDetails', () => {
  it('shows a full-time employee with their salary', async () => {
    await renderDetails(priyaId);

    expect(await screen.findByRole('header', { name: 'Priya Sharma' })).toBeTruthy();
    expect(screen.getByText('HR Manager · Human Resources')).toBeTruthy();
    expect(screen.getByLabelText('Annual salary: $95,000.00')).toBeTruthy();
    expect(screen.getByLabelText('Hire date: Apr 15, 2019')).toBeTruthy();
    expect(screen.getByLabelText('Employment type: Full time')).toBeTruthy();
    expect(screen.getByLabelText('Role: HR Manager')).toBeTruthy();
    expect(screen.queryByLabelText(/^Hourly rate:/)).toBeNull();
  });

  it('shows a contract employee with their rate and end date', async () => {
    await renderDetails(sofiaId);

    expect(await screen.findByRole('header', { name: 'Sofia Rossi' })).toBeTruthy();
    expect(screen.getByLabelText('Hourly rate: $62.50/hr')).toBeTruthy();
    expect(screen.getByLabelText('Contract end date: Dec 31, 2026')).toBeTruthy();
    expect(screen.getByLabelText('Phone: Not provided')).toBeTruthy();
    expect(screen.queryByLabelText(/^Annual salary:/)).toBeNull();
  });

  it.each<[RoleName, boolean, boolean]>([
    ['ADMIN', true, true],
    ['HR_MANAGER', true, false],
    ['EMPLOYEE', false, false],
  ])('for %s shows edit: %s, delete: %s', async (role, canEdit, canDelete) => {
    await renderDetails(priyaId, role);
    await screen.findByRole('header', { name: 'Priya Sharma' });

    expect(screen.queryByRole('button', { name: 'Edit' }) !== null).toBe(canEdit);
    expect(screen.queryByRole('button', { name: 'Delete' }) !== null).toBe(canDelete);
  });

  it('passes the employee to onEdit', async () => {
    const { onEdit } = await renderDetails(priyaId);
    await screen.findByRole('header', { name: 'Priya Sharma' });

    await fireEvent.press(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: priyaId }));
  });

  it('deletes after confirmation and reports it', async () => {
    const { deleteEmployee, onDeleted } = await renderDetails(priyaId);
    await screen.findByRole('header', { name: 'Priya Sharma' });

    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete Priya Sharma?')).toBeTruthy();
    expect(deleteEmployee).not.toHaveBeenCalled();

    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    if (confirmButton === undefined) {
      throw new Error('Expected the dialog to show a Delete button');
    }
    await fireEvent.press(confirmButton);

    expect(deleteEmployee).toHaveBeenCalledWith(priyaId);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('explains when the employee does not exist', async () => {
    const { onBack } = await renderDetails('7f3c2a10-0000-4000-8000-000000000000');

    expect(await screen.findByText('Employee not found')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Back to employees' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
