import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { RoleCatalogProvider } from '../src/auth/role-catalog-context';
import { SessionUserProvider } from '../src/auth/session-user-context';
import type { EmployeeDataSource } from '../src/features/employees/employee-data-source';
import { EmployeeDataSourceProvider } from '../src/features/employees/employee-data-source-context';
import { EmployeeDirectory } from '../src/features/employees/EmployeeDirectory';
import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';
import { useBreakpoint } from '../src/hooks/use-breakpoint';
import type { Breakpoint } from '../src/types/breakpoint';
import type { RoleName } from '../src/types/role-name';
import { testRoleCatalog } from '../test-fixtures/role-catalog';
import { buildSessionUser } from '../test-fixtures/session-users';

jest.mock('../src/hooks/use-breakpoint');

const mockedUseBreakpoint = jest.mocked(useBreakpoint);

type RenderOptions = {
  role?: RoleName;
  breakpoint?: Breakpoint;
  dataSource?: EmployeeDataSource;
  userId?: string;
};

async function renderDirectory({
  role = 'ADMIN',
  breakpoint = 'desktop',
  dataSource = createMockEmployeeDataSource(),
  userId,
}: RenderOptions = {}) {
  mockedUseBreakpoint.mockReturnValue(breakpoint);
  const listEmployees = jest.fn(dataSource.listEmployees);
  const deleteEmployee = jest.fn(dataSource.deleteEmployee);
  const handlers = {
    onCreateEmployee: jest.fn(),
    onViewEmployee: jest.fn(),
    onEditEmployee: jest.fn(),
    onOpenDeletedEmployees: jest.fn(),
  };
  await render(
    <SessionUserProvider user={buildSessionUser(role, userId)}>
      <RoleCatalogProvider catalog={testRoleCatalog}>
        <EmployeeDataSourceProvider dataSource={{ ...dataSource, listEmployees, deleteEmployee }}>
          <EmployeeDirectory {...handlers} />
        </EmployeeDataSourceProvider>
      </RoleCatalogProvider>
    </SessionUserProvider>,
  );
  return { listEmployees, deleteEmployee, ...handlers };
}

describe('EmployeeDirectory layouts', () => {
  it.each<Breakpoint>(['desktop', 'tablet'])('shows a data table on %s', async (breakpoint) => {
    await renderDirectory({ breakpoint });

    expect(await screen.findByText('Emily Carter')).toBeTruthy();
    for (const column of ['Name', 'Email', 'Department', 'Title', 'Type', 'Status']) {
      expect(screen.getByRole('columnheader', { name: column })).toBeTruthy();
    }
    expect(screen.queryByText('Senior Software Engineer · Engineering')).toBeNull();
  });

  it('shows a card list on mobile', async () => {
    await renderDirectory({ breakpoint: 'mobile' });

    expect(await screen.findByText('Senior Software Engineer · Engineering')).toBeTruthy();
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

    expect(await screen.findByText('Emily Carter')).toBeTruthy();
    expect(screen.queryByText('Loading employees…')).toBeNull();
  });
});

describe('EmployeeDirectory role-based controls', () => {
  it('shows create, edit and delete controls to an admin', async () => {
    await renderDirectory({ role: 'ADMIN' });
    await screen.findByText('Emily Carter');

    expect(screen.getByRole('button', { name: 'Add employee' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit Emily Carter' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete Emily Carter' })).toBeTruthy();
  });

  it('offers deleted employees only to roles granted EMPLOYEE_RESTORE', async () => {
    const { onOpenDeletedEmployees } = await renderDirectory({ role: 'ADMIN' });
    await screen.findByText('Emily Carter');

    await fireEvent.press(screen.getByRole('button', { name: 'Deleted employees' }));

    expect(onOpenDeletedEmployees).toHaveBeenCalledTimes(1);
  });

  it('shows create and edit but not delete to an HR manager', async () => {
    await renderDirectory({ role: 'HR_MANAGER' });
    await screen.findByText('Emily Carter');

    expect(screen.queryByRole('button', { name: 'Deleted employees' })).toBeNull();

    expect(screen.getByRole('button', { name: 'Add employee' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit Emily Carter' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Delete Emily Carter' })).toBeNull();
  });

  it.each<Breakpoint>(['desktop', 'mobile'])('shows no controls to an employee on %s', async (breakpoint) => {
    await renderDirectory({ role: 'EMPLOYEE', breakpoint });
    await screen.findByText('Emily Carter');

    expect(screen.queryByRole('button', { name: 'Add employee' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^(Edit|Delete) / })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).toBeNull();
  });

  it('does not offer to delete the signed-in admin themselves', async () => {
    await renderDirectory({ role: 'ADMIN', userId: 'f7e04095-ac52-40da-be94-5fac4fc77a97' });
    await screen.findByText('Emily Carter');

    expect(screen.getByRole('button', { name: 'Edit Emily Carter' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Delete Emily Carter' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Delete Thomas Becker' })).toBeTruthy();
  });

  it('passes the chosen employee to the view and edit handlers', async () => {
    const { onCreateEmployee, onViewEmployee, onEditEmployee } = await renderDirectory();
    await screen.findByText('Emily Carter');

    await fireEvent.press(screen.getByRole('button', { name: 'Add employee' }));
    await fireEvent.press(screen.getByRole('link', { name: 'Emily Carter' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Edit Emily Carter' }));

    expect(onCreateEmployee).toHaveBeenCalledTimes(1);
    const emily = expect.objectContaining({ email: 'emily.carter@company.com' });
    expect(onViewEmployee).toHaveBeenCalledWith(emily);
    expect(onEditEmployee).toHaveBeenCalledWith(emily);
  });
});

describe('EmployeeDirectory deletion', () => {
  it('deletes only after confirmation and refreshes the list', async () => {
    const { deleteEmployee } = await renderDirectory({ role: 'ADMIN' });
    await screen.findByText('Showing 1–10 of 24 employees');

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Emily Carter' }));
    expect(screen.getByText('Delete Emily Carter?')).toBeTruthy();
    expect(deleteEmployee).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Showing 1–10 of 23 employees')).toBeTruthy();
    expect(screen.queryByText('Emily Carter')).toBeNull();
    expect(deleteEmployee).toHaveBeenCalledTimes(1);
  });

  it('keeps the employee when the dialog is cancelled', async () => {
    const { deleteEmployee } = await renderDirectory({ role: 'ADMIN' });
    await screen.findByText('Emily Carter');

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Emily Carter' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Delete Emily Carter?')).toBeNull();
    expect(screen.getByText('Emily Carter')).toBeTruthy();
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
            code: 'SELF_ACTION_FORBIDDEN',
            message: 'You cannot delete your own account',
          },
        }),
      },
    });
    await screen.findByText('Emily Carter');

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Emily Carter' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('You cannot delete your own account')).toBeTruthy();
    expect(screen.getByText('Delete Emily Carter?')).toBeTruthy();
  });
});

describe('EmployeeDirectory pagination', () => {
  it('moves between pages and disables buttons at the ends', async () => {
    const { listEmployees } = await renderDirectory();
    await screen.findByText('Showing 1–10 of 24 employees');

    expect(screen.getByRole('button', { name: 'Previous page', disabled: true })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Showing 11–20 of 24 employees')).toBeTruthy();
    expect(listEmployees).toHaveBeenLastCalledWith({ page: 2, page_size: 10 });

    await fireEvent.press(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Showing 21–24 of 24 employees')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next page', disabled: true })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Previous page' }));
    expect(await screen.findByText('Showing 11–20 of 24 employees')).toBeTruthy();
  });
});

describe('EmployeeDirectory heavy pages', () => {
  it('requests a bigger page when the user picks more rows per page', async () => {
    const { listEmployees } = await renderDirectory();
    await screen.findByText('Showing 1–10 of 24 employees');

    await fireEvent.press(screen.getByRole('button', { name: '25' }));

    expect(await screen.findByText('Showing 1–24 of 24 employees')).toBeTruthy();
    expect(listEmployees).toHaveBeenLastCalledWith({ page: 1, page_size: 25 });
    expect(screen.getByText('Page 1 of 1')).toBeTruthy();
  });

  it('mounts only the rows near the viewport of a 100-row page', async () => {
    const workingSource = createMockEmployeeDataSource();
    const hundredRows = Array.from({ length: 100 }, (_, index) => ({
      id: `0d6f4c2a-0000-4000-8000-${String(index).padStart(12, '0')}`,
      employee_code: `FT${String(index).padStart(4, '0')}`,
      first_name: 'Arjun',
      last_name: `Mehta ${index}`,
      email: `arjun.mehta${index}@company.com`,
      department: 'Engineering',
      job_title: 'Backend Engineer',
      hire_date: '2024-01-15T00:00:00Z',
      is_active: true,
      role_id: 3,
      employment_type: 'FULL_TIME' as const,
    }));
    await renderDirectory({
      breakpoint: 'mobile',
      dataSource: {
        ...workingSource,
        listEmployees: async () => ({
          ok: true,
          value: { items: hundredRows, total: 100, page: 1, page_size: 100 },
        }),
      },
    });
    // The pagination footer only mounts once the list is scrolled to its end.
    await screen.findByText('100 total records');

    const mountedRows = screen.getAllByRole('link', { name: /^Arjun Mehta / }).length;
    expect(mountedRows).toBeGreaterThan(0);
    expect(mountedRows).toBeLessThan(100);
  });
});

describe('EmployeeDirectory filters', () => {
  it('searches after the user stops typing', async () => {
    const { listEmployees } = await renderDirectory();
    await screen.findByText('Emily Carter');

    await fireEvent.changeText(screen.getByLabelText('Search employees'), 'kenji');

    expect(await screen.findByText('Showing 1–1 of 1 employee')).toBeTruthy();
    expect(screen.getByText('Kenji Tanaka')).toBeTruthy();
    expect(listEmployees).toHaveBeenLastCalledWith({ page: 1, page_size: 10, q: 'kenji' });
  });

  it('filters by department and status', async () => {
    const { listEmployees } = await renderDirectory();
    await screen.findByText('Emily Carter');

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
    await screen.findByText('Emily Carter');

    await fireEvent.changeText(screen.getByLabelText('Search employees'), 'no such employee');
    expect(await screen.findByText('No employees match your filters')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));

    expect(await screen.findByText('Emily Carter')).toBeTruthy();
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

    expect(await screen.findByText('Emily Carter')).toBeTruthy();
    expect(listEmployees).toHaveBeenCalledTimes(2);
  });
});
