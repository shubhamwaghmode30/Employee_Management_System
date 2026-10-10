import { fireEvent, render, screen } from '@testing-library/react-native';

import { LoginScreen } from '../src/features/auth/LoginScreen';
import type { SignIn } from '../src/features/auth/use-login-form';
import { buildSessionUser } from '../test-fixtures/session-users';

async function renderLogin(signIn: SignIn, notice: string | null = null) {
  await render(<LoginScreen signIn={signIn} notice={notice} />);
}

async function submit(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginScreen', () => {
  it('validates the fields before calling the server', async () => {
    const signIn = jest.fn<ReturnType<SignIn>, Parameters<SignIn>>();
    await renderLogin(signIn);

    await submit('priya.sharma', '');

    expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('signs in with a trimmed email', async () => {
    const signIn = jest.fn<ReturnType<SignIn>, Parameters<SignIn>>(async () => ({
      ok: true,
      value: buildSessionUser('HR_MANAGER'),
    }));
    await renderLogin(signIn);

    await submit('  priya.sharma@company.com ', 'Welcome@2026');

    expect(signIn).toHaveBeenCalledWith('priya.sharma@company.com', 'Welcome@2026');
  });

  it('explains a rejected sign-in without revealing which part was wrong', async () => {
    const signIn: SignIn = async () => ({
      ok: false,
      error: { kind: 'unauthorized', status: 401, code: 'UNAUTHORIZED', message: 'Invalid email or password' },
    });
    await renderLogin(signIn);

    await submit('priya.sharma@company.com', 'Wrong@Pass1');

    expect(await screen.findByText('Incorrect email or password, or the account is inactive.')).toBeTruthy();
  });

  it('shows why the user was signed out', async () => {
    await renderLogin(jest.fn(), 'Your session has expired. Please sign in again.');

    expect(screen.getByText('Your session has expired. Please sign in again.')).toBeTruthy();
  });
});
