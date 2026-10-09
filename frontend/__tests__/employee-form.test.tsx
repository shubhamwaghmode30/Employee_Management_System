import { fireEvent, render, screen } from '@testing-library/react-native';

import { SessionUserProvider } from '../src/auth/session-user-context';
import type { EmployeeDataSource } from '../src/features/employees/employee-data-source';
import { EmployeeDataSourceProvider } from '../src/features/employees/employee-data-source-context';
import { EmployeeForm } from '../src/features/employees/EmployeeForm';
import { employeeSchema } from '../src/features/employees/employee-schemas';
import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';
import mockEmployees from '../src/features/employees/mock-employees.json';
import type { EmployeeFormMode } from '../src/features/employees/use-employee-form';
import type { RoleName } from '../src/types/role-name';

type RenderOptions = {
  mode?: EmployeeFormMode;
  role?: RoleName;
  dataSource?: EmployeeDataSource;
};

async function renderForm({
  mode = { kind: 'create' },
  role = 'HR_MANAGER',
  dataSource = createMockEmployeeDataSource(),
}: RenderOptions = {}) {
  const createEmployee = jest.fn(dataSource.createEmployee);
  const updateEmployee = jest.fn(dataSource.updateEmployee);
  const onSaved = jest.fn();
  const onCancel = jest.fn();
  await render(
    <SessionUserProvider user={{ fullName: 'Priya Sharma', email: 'priya.sharma@company.com', role }}>
      <EmployeeDataSourceProvider dataSource={{ ...dataSource, createEmployee, updateEmployee }}>
        <EmployeeForm mode={mode} onSaved={onSaved} onCancel={onCancel} />
      </EmployeeDataSourceProvider>
    </SessionUserProvider>,
  );
  return { createEmployee, updateEmployee, onSaved, onCancel };
}

async function fillRequiredFields() {
  await fireEvent.changeText(screen.getByLabelText('First name'), 'Zara');
  await fireEvent.changeText(screen.getByLabelText('Last name'), 'Ahmed');
  await fireEvent.changeText(screen.getByLabelText('Email'), 'zara.ahmed@company.com');
  await fireEvent.press(screen.getByRole('button', { name: 'Marketing' }));
  await fireEvent.changeText(screen.getByLabelText('Job title'), 'Brand Manager');
  await fireEvent.changeText(screen.getByLabelText('Hire date'), '2026-10-01');
  await fireEvent.changeText(screen.getByLabelText('Employee code'), 'FT0025');
  await fireEvent.changeText(screen.getByLabelText('Temporary password'), 'Welcome@2026');
}

describe('EmployeeForm when creating', () => {
  it('shows pay fields for the chosen employment type', async () => {
    await renderForm();

    expect(screen.getByLabelText('Annual salary (optional)')).toBeTruthy();
    expect(screen.queryByLabelText('Hourly rate (optional)')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Contract' }));

    expect(screen.queryByLabelText('Annual salary (optional)')).toBeNull();
    expect(screen.getByLabelText('Hourly rate (optional)')).toBeTruthy();
    expect(screen.getByLabelText('Contract end date (optional)')).toBeTruthy();
  });

  it.each<[RoleName, boolean]>([
    ['ADMIN', true],
    ['HR_MANAGER', false],
  ])('offers the Admin role to %s: %s', async (role, isOffered) => {
    await renderForm({ role });

    expect(screen.queryByRole('button', { name: 'Admin' }) !== null).toBe(isOffered);
    expect(screen.getByRole('button', { name: 'HR Manager' })).toBeTruthy();
  });

  it('shows field errors and does not submit an incomplete form', async () => {
    const { createEmployee } = await renderForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Create employee' }));

    expect(screen.getByText('First name is required')).toBeTruthy();
    expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
    expect(createEmployee).not.toHaveBeenCalled();
  });

  it('clears a field error as soon as the field is edited', async () => {
    await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Create employee' }));

    await fireEvent.changeText(screen.getByLabelText('First name'), 'Zara');

    expect(screen.queryByText('First name is required')).toBeNull();
  });

  it('creates the employee and hands the saved record back', async () => {
    const { createEmployee, onSaved } = await renderForm();
    await fillRequiredFields();
    await fireEvent.changeText(screen.getByLabelText('Annual salary (optional)'), '88000');

    await fireEvent.press(screen.getByRole('button', { name: 'Create employee' }));

    expect(createEmployee).toHaveBeenCalledWith(
      expect.objectContaining({
        employee_code: 'FT0025',
        email: 'zara.ahmed@company.com',
        employment_type: 'FULL_TIME',
        annual_salary: '88000',
        role_id: 3,
      }),
    );
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ email: 'zara.ahmed@company.com' }));
  });

  it('shows a duplicate email from the server under the email field', async () => {
    const { onSaved } = await renderForm();
    await fillRequiredFields();
    await fireEvent.changeText(screen.getByLabelText('Email'), 'priya.sharma@company.com');

    await fireEvent.press(screen.getByRole('button', { name: 'Create employee' }));

    expect(
      await screen.findByText("Employee with email 'priya.sharma@company.com' already exists"),
    ).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('shows other server errors in a banner', async () => {
    const workingSource = createMockEmployeeDataSource();
    await renderForm({
      dataSource: {
        ...workingSource,
        createEmployee: async () => ({
          ok: false,
          error: { kind: 'network', message: 'Unable to reach the server. Check your connection and try again.' },
        }),
      },
    });
    await fillRequiredFields();

    await fireEvent.press(screen.getByRole('button', { name: 'Create employee' }));

    expect(
      await screen.findByText('Unable to reach the server. Check your connection and try again.'),
    ).toBeTruthy();
  });

  it('calls onCancel without saving', async () => {
    const { createEmployee, onCancel } = await renderForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(createEmployee).not.toHaveBeenCalled();
  });
});

describe('EmployeeForm when editing', () => {
  const sofia = employeeSchema.parse(mockEmployees[4]);

  it('pre-fills the employee and locks fields that cannot change', async () => {
    await renderForm({ mode: { kind: 'edit', employee: sofia } });

    expect(screen.getByRole('header', { name: 'Edit Sofia Rossi' })).toBeTruthy();
    expect(screen.getByLabelText('Email').props.value).toBe('sofia.rossi@company.com');
    expect(screen.getByLabelText('Hourly rate (optional)').props.value).toBe('62.50');
    expect(screen.getByLabelText('Contract end date (optional)').props.value).toBe('2026-12-31');
    expect(screen.getByText('CT0005')).toBeTruthy();
    expect(screen.queryByLabelText('Temporary password')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Full time' })).toBeNull();
  });

  it('saves changes to the same employee, including deactivation', async () => {
    const { updateEmployee, onSaved } = await renderForm({ mode: { kind: 'edit', employee: sofia } });

    await fireEvent.changeText(screen.getByLabelText('Job title'), 'Senior QA Engineer');
    await fireEvent.press(screen.getByRole('button', { name: 'Inactive' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateEmployee).toHaveBeenCalledWith(
      sofia.id,
      expect.objectContaining({ job_title: 'Senior QA Engineer', is_active: false }),
    );
    expect(updateEmployee.mock.calls[0]?.[1]).not.toHaveProperty('password');
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ job_title: 'Senior QA Engineer' }));
  });
});
