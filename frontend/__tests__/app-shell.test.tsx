import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '../src/components/AppShell';
import { useBreakpoint } from '../src/hooks/use-breakpoint';
import type { SessionUser } from '../src/types/session-user';

const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  usePathname: () => '/employees',
  useRouter: () => ({ navigate: mockNavigate }),
}));

jest.mock('../src/hooks/use-breakpoint');

const mockedUseBreakpoint = jest.mocked(useBreakpoint);

const user: SessionUser = {
  fullName: 'Priya Sharma',
  email: 'priya.sharma@company.com',
  role: 'HR_MANAGER',
};

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderShell() {
  const onLogout = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <AppShell user={user} onLogout={onLogout}>
        <Text>Employee directory</Text>
      </AppShell>
    </SafeAreaProvider>,
  );
  return { onLogout };
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('AppShell on desktop', () => {
  beforeEach(() => {
    mockedUseBreakpoint.mockReturnValue('desktop');
  });

  it('shows a persistent sidebar with navigation, user menu and page content', async () => {
    await renderShell();

    expect(screen.getByRole('link', { name: 'Employees' })).toBeTruthy();
    expect(screen.getByText('Priya Sharma')).toBeTruthy();
    expect(screen.getByText('HR Manager')).toBeTruthy();
    expect(screen.getByText('PS', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('PS')).toBeNull();
    expect(screen.getByText('Employee directory')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open navigation menu' })).toBeNull();
  });

  it('marks the current section as selected', async () => {
    await renderShell();

    expect(screen.getByRole('link', { name: 'Employees', selected: true })).toBeTruthy();
  });

  it('navigates when a section is pressed', async () => {
    await renderShell();

    await fireEvent.press(screen.getByRole('link', { name: 'Employees' }));

    expect(mockNavigate).toHaveBeenCalledWith('/employees');
  });

  it('calls onLogout from the user menu', async () => {
    const { onLogout } = await renderShell();

    await fireEvent.press(screen.getByRole('button', { name: 'Log out' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe.each(['mobile', 'tablet'] as const)('AppShell on %s', (breakpoint) => {
  beforeEach(() => {
    mockedUseBreakpoint.mockReturnValue(breakpoint);
  });

  it('shows a top bar and keeps navigation hidden until the menu is opened', async () => {
    await renderShell();

    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeTruthy();
    expect(screen.getByText('Employee directory')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Employees' })).toBeNull();
  });

  it('opens the drawer with navigation and the user menu', async () => {
    await renderShell();

    await fireEvent.press(screen.getByRole('button', { name: 'Open navigation menu' }));

    expect(screen.getByRole('link', { name: 'Employees', selected: true })).toBeTruthy();
    expect(screen.getByText('priya.sharma@company.com')).toBeTruthy();
  });

  it('navigates and closes the drawer when a section is pressed', async () => {
    await renderShell();
    await fireEvent.press(screen.getByRole('button', { name: 'Open navigation menu' }));

    await fireEvent.press(screen.getByRole('link', { name: 'Employees' }));

    expect(mockNavigate).toHaveBeenCalledWith('/employees');
    expect(screen.queryByRole('link', { name: 'Employees' })).toBeNull();
  });

  it('closes the drawer when the backdrop is pressed', async () => {
    await renderShell();
    await fireEvent.press(screen.getByRole('button', { name: 'Open navigation menu' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Close navigation menu' }));

    expect(screen.queryByRole('link', { name: 'Employees' })).toBeNull();
  });

  it('closes the drawer and calls onLogout when logging out', async () => {
    const { onLogout } = await renderShell();
    await fireEvent.press(screen.getByRole('button', { name: 'Open navigation menu' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Log out' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
  });
});
