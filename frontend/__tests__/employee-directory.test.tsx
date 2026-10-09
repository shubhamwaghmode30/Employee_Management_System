import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { SessionUserProvider } from '../src/auth/session-user-context';
import type { EmployeeDataSource } from '../src/features/employees/employee-data-source';
import { EmployeeDataSourceProvider } from '../src/features/employees/employee-data-source-context';
import { EmployeeDirectory } from '../src/features/employees/EmployeeDirectory';
import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';
import { useBreakpoint } from '../src/hooks/use-breakpoint';
import type { Breakpoint } from '../src/types/breakpoint';
import type { RoleName } from '../src/types/role-name';

jest.mock('../src/hooks/use-breakpoint');

const mockedUseBreakpoint = jest.mocked(useBreakpoint);

type RenderOptions = {
  role?: RoleName;
  breakpoint?: Breakpoint;
  dataSource?: EmployeeDataSource;
};

async function renderDirectory({
  role = 'ADMIN',
  breakpoint = 'desktop',
  dataSource = createMockEmployeeDataSource(),
}: RenderOptions = {}) {
  mockedUseBreakpoint.mockReturnValue(breakpoint);
  const listEmployees = jest.fn(dataSource.listEmployees);
  const deleteEmployee = jest.fn(dataSource.deleteEmployee);
  const handlers = {
    onCreateEmployee: jest.fn(),
    onViewEmployee: jest.fn(),
    onEditEmployee: jest.fn(),
  };
  await render(
    <SessionUserProvider
      user={{ fullName: 'Arjun Mehta', email: 'arjun.mehta@company.com', role }}
    >
      <EmployeeDataSourceProvider dataSource={{ ...dataSource, listEmployees, deleteEmployee }}>
        <EmployeeDirectory {...handlers} />
      </EmployeeDataSourceProvider>
    </SessionUserProvider>,
  );
  return { listEmployees, deleteEmployee, ...handlers };
}

describe('EmployeeDirectory layouts', () => {
  it.each<Breakpoint>(['desktop', 'tablet'])('shows a data table on %s', async (breakpoint) => {
    await renderDirectory({ breakpoint });

    expect(await screen.findByText('Priya Sharma')).toBeTruthy();
    for (const column of ['Name', 'Email', 'Department', 'Title', 'Type', 'Status']) {
      expect(screen.getByRole('columnheader', { name: column })).toBeTruthy();
    }
    expect(screen.queryByText('HR Manager · Human Resources')).toBeNull();
  });

  it('shows a card list on mobile', async () => {
    await renderDirectory({ breakpoint: 'mobile' });

    expect(await screen.findByText('HR Manager · Human Resources')).toBeTruthy();
    expect(screen.queryByRole('columnheader', { name: 'Department' })).toBeNull();
  });

  it('shows a loading state until data arrives', async () => {
    let releaseResponse = () => {};
    const workingSource = createMockEmployeeDataSource();
    const slowSource: EmployeeDataSource = {
      ...workingSource,
      async listEmployees(params) {
        await new Promise<void>((resolve) => {
          releaseResponse = resolve;
        });
        return workingSource.listEmployees(params);
      },
    };
    await renderDirectory({ dataSource: slowSource });

    expect(screen.getByText('Loading employees…')).toBeTruthy();

    await act(() => {
      releaseResponse();
    });

    expect(await screen.findByText('Priya Sharma')).toBeTruthy();
    expect(screen.queryByText('Loading employees…')).toBeNull();
  });
});

describe('EmployeeDirectory role-based controls', () => {
  it('shows create, edit and delete controls to an admin', async () => {
    await renderDirectory({ role: 'ADMIN' });
    await screen.findByText('Priya Sharma');

    expect(screen.getByRole('button', { name: 'Add employee' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit Priya Sharma' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete Priya Sharma' })).toBeTruthy();
  });

  it('shows create and edit but not delete to an HR manager', async () => {
    await renderDirectory({ role: 'HR_MANAGER' });
    await screen.findByText('Priya Sharma');

    expect(screen.getByRole('button', { name: 'Add employee' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit Priya Sharma' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Delete Priya Sharma' })).toBeNull();
  });

  it.each<Breakpoint>(['desktop', 'mobile'])('shows no controls to an employee on %s', async (breakpoint) => {
    await renderDirectory({ role: 'EMPLOYEE', breakpoint });
    await screen.findByText('Priya Sharma');

    expect(screen.queryByRole('button', { name: 'Add employee' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^(Edit|Delete) / })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).toBeNull();
  });

  it('passes the chosen employee to the view and edit handlers', async () => {
    const { onCreateEmployee, onViewEmployee, onEditEmployee } = await renderDirectory();
    await screen.findByText('Priya Sharma');

    await fireEvent.press(screen.getByRole('button', { name: 'Add employee' }));
    await fireEvent.press(screen.getByRole('link', { name: 'Priya Sharma' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Edit Priya Sharma' }));

    expect(onCreateEmployee).toHaveBeenCalledTimes(1);
    const priya = expect.objectContaining({ email: 'priya.sharma@company.com' });
    expect(onViewEmployee).toHaveBeenCalledWith(priya);
    expect(onEditEmployee).toHaveBeenCalledWith(priya);
  });
});

describe('EmployeeDirectory deletion', () => {
  it('deletes only after confirmation and refreshes the list', async () => {
    const { deleteEmployee } = await renderDirectory({ role: 'ADMIN' });
    await screen.findByText('Page 1 of 3 · 24 employees');

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Priya Sharma' }));
    expect(screen.getByText('Delete Priya Sharma?')).toBeTruthy();
    expect(deleteEmployee).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Page 1 of 3 · 23 employees')).toBeTruthy();
    expect(screen.queryByText('Priya Sharma')).toBeNull();
    expect(deleteEmployee).toHaveBeenCalledTimes(1);
  });

  it('keeps the employee when the dialog is cancelled', async () => {
    const { deleteEmployee } = await renderDirectory({ role: 'ADMIN' });
    await screen.findByText('Priya Sharma');

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Priya Sharma' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Delete Priya Sharma?')).toBeNull();
    expect(screen.getByText('Priya Sharma')).toBeTruthy();
    expect(deleteEmployee).not.toHaveBeenCalled();
  });

  it('shows the error in the dialog when deletion fails', async () => {
    const workingSource = createMockEmployeeDataSource();
    await renderDirectory({
      role: 'ADMIN',
      dataSource: {
        ...workingSource,
        deleteEmployee: async () => ({
          ok: false,
          error: {
            kind: 'forbidden',
            status: 403,
            code: 'SELF_DELETE_FORBIDDEN',
            message: 'You cannot delete your own account',
          },
        }),
      },
    });
    await screen.findByText('Priya Sharma');

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Priya Sharma' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('You cannot delete your own account')).toBeTruthy();
    expect(screen.getByText('Delete Priya Sharma?')).toBeTruthy();
  });
});

describe('EmployeeDirectory pagination', () => {
  it('moves between pages and disables buttons at the ends', async () => {
    const { listEmployees } = await renderDirectory();
    await screen.findByText('Page 1 of 3 · 24 employees');

    expect(screen.getByRole('button', { name: 'Previous page', disabled: true })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Page 2 of 3 · 24 employees')).toBeTruthy();
    expect(listEmployees).toHaveBeenLastCalledWith({ page: 2, page_size: 10 });

    await fireEvent.press(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Page 3 of 3 · 24 employees')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next page', disabled: true })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Previous page' }));
    expect(await screen.findByText('Page 2 of 3 · 24 employees')).toBeTruthy();
  });
});

describe('EmployeeDirectory filters', () => {
  it('searches after the user stops typing', async () => {
    const { listEmployees } = await renderDirectory();
    await screen.findByText('Priya Sharma');

    await fireEvent.changeText(screen.getByLabelText('Search employees'), 'kenji');

    expect(await screen.findByText('Page 1 of 1 · 1 employee')).toBeTruthy();
    expect(screen.getByText('Kenji Tanaka')).toBeTruthy();
    expect(listEmployees).toHaveBeenLastCalledWith({ page: 1, page_size: 10, q: 'kenji' });
  });

  it('filters by department and status', async () => {
    const { listEmployees } = await renderDirectory();
    await screen.findByText('Priya Sharma');

    await fireEvent.press(screen.getByRole('button', { name: 'Engineering' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Inactive' }));

    expect(await screen.findByText('Ananya Iyer')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Engineering', selected: true })).toBeTruthy();
    expect(listEmployees).toHaveBeenLastCalledWith({
      page: 1,
      page_size: 10,
      department: 'Engineering',
      is_active: false,
    });
  });

  it('shows an empty state that clears the filters', async () => {
    await renderDirectory();
    await screen.findByText('Priya Sharma');

    await fireEvent.changeText(screen.getByLabelText('Search employees'), 'no such employee');
    expect(await screen.findByText('No employees match your filters')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));

    expect(await screen.findByText('Priya Sharma')).toBeTruthy();
    expect(screen.getByLabelText('Search employees').props.value).toBe('');
  });
});

describe('EmployeeDirectory errors', () => {
  it('shows the error and retries on request', async () => {
    const workingSource = createMockEmployeeDataSource();
    const listEmployees = jest
      .fn(workingSource.listEmployees)
      .mockResolvedValueOnce({
        ok: false,
        error: {
          kind: 'network',
          message: 'Unable to reach the server. Check your connection and try again.',
        },
      });
    await renderDirectory({ dataSource: { ...workingSource, listEmployees } });

    expect(await screen.findByText('Employees could not be loaded')).toBeTruthy();
    expect(
      screen.getByText('Unable to reach the server. Check your connection and try again.'),
    ).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Priya Sharma')).toBeTruthy();
    expect(listEmployees).toHaveBeenCalledTimes(2);
  });
});
