import { fireEvent, render, screen } from '@testing-library/react-native';

import { RoleCatalogProvider } from '../src/auth/role-catalog-context';
import { SessionUserProvider } from '../src/auth/session-user-context';
import { EmployeeDataSourceProvider } from '../src/features/employees/employee-data-source-context';
import { createMockEmployeeDataSource } from '../src/features/employees/mock-employee-data-source';
import { ProfilePage } from '../src/features/profile/ProfilePage';
import { type SubmitPasswordChange, validatePasswordChange } from '../src/features/profile/use-password-change';
import { testRoleCatalog } from '../test-fixtures/role-catalog';
import { buildSessionUser } from '../test-fixtures/session-users';

const priyaId = '05b12d14-6099-4228-9c6b-35294501d132';

async function renderProfile(submitPasswordChange: SubmitPasswordChange) {
  const onOpenRecord = jest.fn();
  await render(
    <SessionUserProvider user={buildSessionUser('HR_MANAGER', priyaId)}>
      <RoleCatalogProvider catalog={testRoleCatalog}>
        <EmployeeDataSourceProvider dataSource={createMockEmployeeDataSource()}>
          <ProfilePage submitPasswordChange={submitPasswordChange} onOpenRecord={onOpenRecord} />
        </EmployeeDataSourceProvider>
      </RoleCatalogProvider>
    </SessionUserProvider>,
  );
  return { onOpenRecord };
}

async function changePassword(current: string, next: string, confirm = next) {
  await fireEvent.changeText(screen.getByLabelText('Current password'), current);
  await fireEvent.changeText(screen.getByLabelText('New password'), next);
  await fireEvent.changeText(screen.getByLabelText('Confirm new password'), confirm);
  await fireEvent.press(screen.getByRole('button', { name: 'Update password' }));
}

describe('validatePasswordChange', () => {
  it.each([
    ['a short new password', 'Welcome@2026', 'short', 'short', 'newPassword', 'New password must be at least 8 characters'],
    ['a mismatched confirmation', 'Welcome@2026', 'Fresh@Pass27', 'Fresh@Pass28', 'confirmPassword', 'Passwords do not match'],
    [
      'reusing the current password',
      'Welcome@2026',
      'Welcome@2026',
      'Welcome@2026',
      'newPassword',
      'New password must differ from the current password',
    ],
  ] as const)('rejects %s', (_case, currentPassword, newPassword, confirmPassword, field, message) => {
    const errors = validatePasswordChange({ currentPassword, newPassword, confirmPassword });

    expect(errors?.[field]).toBe(message);
  });

  it('accepts a valid change', () => {
    expect(
      validatePasswordChange({
        currentPassword: 'Welcome@2026',
        newPassword: 'Fresh@Pass27',
        confirmPassword: 'Fresh@Pass27',
      }),
    ).toBeNull();
  });
});

describe('ProfilePage', () => {
  it('shows the signed-in user, their employee record and what they can do', async () => {
    const { onOpenRecord } = await renderProfile(jest.fn());

    expect(screen.getByRole('header', { name: 'My profile' })).toBeTruthy();
    expect(screen.getByText('Kavya Reddy')).toBeTruthy();
    expect(await screen.findByLabelText('Employee code: FT0001')).toBeTruthy();
    expect(screen.getByText('Edit employees')).toBeTruthy();
    expect(screen.queryByText('Delete employees')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'View full record' }));
    expect(onOpenRecord).toHaveBeenCalledTimes(1);
  });

  it('changes the password and clears the form', async () => {
    const submit = jest.fn<ReturnType<SubmitPasswordChange>, Parameters<SubmitPasswordChange>>(async () => ({
      ok: true,
      value: null,
    }));
    await renderProfile(submit);

    await changePassword('Welcome@2026', 'Fresh@Pass27');

    expect(submit).toHaveBeenCalledWith('Welcome@2026', 'Fresh@Pass27');
    expect(await screen.findByText('Your password has been changed.')).toBeTruthy();
    expect(screen.getByLabelText('Current password').props.value).toBe('');
  });

  it('shows a wrong current password under that field', async () => {
    await renderProfile(async () => ({
      ok: false,
      error: { kind: 'validation', status: 422, code: 'INVALID_EMPLOYEE_DATA', message: 'Current password is incorrect' },
    }));

    await changePassword('Wrong@Pass1', 'Fresh@Pass27');

    expect(await screen.findByText('Current password is incorrect')).toBeTruthy();
    expect(screen.queryByText('Your password has been changed.')).toBeNull();
  });

  it('does not submit when the confirmation does not match', async () => {
    const submit = jest.fn<ReturnType<SubmitPasswordChange>, Parameters<SubmitPasswordChange>>();
    await renderProfile(submit);

    await changePassword('Welcome@2026', 'Fresh@Pass27', 'Fresh@Pass28');

    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
  });
});
