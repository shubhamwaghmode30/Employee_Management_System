import { fireEvent, render, screen } from '@testing-library/react-native';

import { SessionUserProvider } from '../src/auth/session-user-context';
import { DeletedEmployees } from '../src/features/employees/DeletedEmployees';
import type { EmployeeDataSource } from '../src/features/employees/employee-data-source';
import { EmployeeDataSourceProvider } from '../src/features/employees/employee-data-source-context';
import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';
import { buildSessionUser } from '../test-fixtures/session-users';

const emilyId = 'f7e04095-ac52-40da-be94-5fac4fc77a97';

async function renderDeletedEmployees(dataSource: EmployeeDataSource) {
  const handlers = { onBack: jest.fn(), onRestored: jest.fn() };
  await render(
    <SessionUserProvider user={buildSessionUser('ADMIN')}>
      <EmployeeDataSourceProvider dataSource={dataSource}>
        <DeletedEmployees {...handlers} />
      </EmployeeDataSourceProvider>
    </SessionUserProvider>,
  );
  return handlers;
}

describe('DeletedEmployees', () => {
  it('says so when nobody has been deleted', async () => {
    await renderDeletedEmployees(createMockEmployeeDataSource());

    expect(await screen.findByText('No deleted employees')).toBeTruthy();
  });

  it('lists a soft-deleted employee and restores them', async () => {
    const dataSource = createMockEmployeeDataSource();
    await dataSource.deleteEmployee(emilyId);
    const { onRestored } = await renderDeletedEmployees(dataSource);

    await fireEvent.press(await screen.findByRole('button', { name: 'Restore Emily Carter' }));

    expect(onRestored).toHaveBeenCalledWith(expect.objectContaining({ id: emilyId }));
    expect(await dataSource.getEmployee(emilyId)).toMatchObject({ ok: true });
  });

  it('shows why a restore was refused', async () => {
    const dataSource = createMockEmployeeDataSource();
    await dataSource.deleteEmployee(emilyId);
    await renderDeletedEmployees({
      ...dataSource,
      restoreEmployee: async () => ({
        ok: false,
        error: {
          kind: 'conflict',
          status: 409,
          code: 'DUPLICATE_EMAIL',
          message: "Employee with email 'emily.carter@company.com' already exists",
        },
      }),
    });

    await fireEvent.press(await screen.findByRole('button', { name: 'Restore Emily Carter' }));

    expect(await screen.findByText("Employee with email 'emily.carter@company.com' already exists")).toBeTruthy();
  });
});
