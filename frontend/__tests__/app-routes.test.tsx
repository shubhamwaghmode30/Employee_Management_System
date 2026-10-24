import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { mockRoles } from '../src/features/employees/mock-employee-data-source';
import mockEmployees from '../src/features/employees/mock-employees.json';
import type { StoredTokens } from '../src/storage/token-storage';

const priya = mockEmployees[0];
const priyaId = priya?.id ?? '';

let mockStoredTokens: StoredTokens | null = null;

jest.mock('../src/storage/token-storage', () => ({
  tokenStorage: {
    getTokens: async () => mockStoredTokens,
    saveTokens: async (tokens: StoredTokens) => {
      mockStoredTokens = tokens;
    },
    clearTokens: async () => {
      mockStoredTokens = null;
    },
  },
}));

const signedInTokens: StoredTokens = { accessToken: 'access-neha', refreshToken: 'refresh-neha' };

const currentUser = {
  id: 'c1a2b3d4-0000-4000-8000-000000000001',
  email: 'neha.kapoor@company.com',
  first_name: 'Neha',
  last_name: 'Kapoor',
  role: 'ADMIN',
  permissions: ['EMPLOYEE_CREATE', 'EMPLOYEE_DELETE', 'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'ROLE_ASSIGN'],
};

function json(status: number, body: object): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** A tiny stand-in for the backend, enough to drive each screen. */
async function fakeBackend(input: string, init?: RequestInit): Promise<Response> {
  const url = new URL(input);
  const path = url.pathname.replace('/api/v1', '');
  const isAuthorised = new Headers(init?.headers).get('Authorization') === 'Bearer access-neha';

  if (path === '/auth/login') {
    return json(200, { access_token: 'access-neha', refresh_token: 'refresh-neha', token_type: 'bearer' });
  }
  if (!isAuthorised) {
    return json(401, { code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (path === '/auth/me') {
    return json(200, currentUser);
  }
  if (path === '/roles') {
    return json(200, mockRoles);
  }
  if (path === '/employees/departments') {
    return json(200, [...new Set(mockEmployees.map((employee) => employee.department))].sort());
  }
  if (path === '/employees') {
    return json(200, { items: mockEmployees.slice(0, 10), total: mockEmployees.length, page: 1, page_size: 10 });
  }
  const employee = mockEmployees.find((candidate) => path === `/employees/${candidate.id}`);
  return employee === undefined
    ? json(404, { code: 'NOT_FOUND', message: 'Employee not found' })
    : json(200, employee);
}

beforeEach(() => {
  mockStoredTokens = null;
  jest.spyOn(globalThis, 'fetch').mockImplementation((input, init) => fakeBackend(String(input), init));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('app routes when signed out', () => {
  it('sends the root URL to the login screen', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });

    expect(await screen.findByRole('header', { name: 'Sign in' })).toBeTruthy();
  });

  it('guards app pages behind the login screen', async () => {
    await renderRouter('./src/app', { initialUrl: `/employees/${priyaId}` });

    expect(await screen.findByRole('header', { name: 'Sign in' })).toBeTruthy();
    expect(screen.queryByText('Priya Sharma')).toBeNull();
  });

  it('signs in and lands on the dashboard', async () => {
    await renderRouter('./src/app', { initialUrl: '/login' });

    await fireEvent.changeText(await screen.findByLabelText('Email'), 'neha.kapoor@company.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Admin@12345');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('header', { name: /, Neha$/ })).toBeTruthy();
    expect(mockStoredTokens).toEqual(signedInTokens);
  });
});

describe('app routes when signed in', () => {
  beforeEach(() => {
    mockStoredTokens = signedInTokens;
  });

  it('restores the session and opens the dashboard from the root URL', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });

    expect(await screen.findByRole('header', { name: /, Neha$/ })).toBeTruthy();
    // The test window is phone-sized, so navigation lives in the drawer.
    await fireEvent.press(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(screen.getByRole('link', { name: 'Dashboard', selected: true })).toBeTruthy();
  });

  it('opens an employee from a direct link', async () => {
    await renderRouter('./src/app', { initialUrl: `/employees/${priyaId}` });

    expect(await screen.findByRole('header', { name: 'Priya Sharma' })).toBeTruthy();
  });

  it('opens the create form from a direct link', async () => {
    await renderRouter('./src/app', { initialUrl: '/employees/new' });

    expect(await screen.findByRole('header', { name: 'Add employee' })).toBeTruthy();
  });

  it('opens the edit form pre-filled from a direct link', async () => {
    await renderRouter('./src/app', { initialUrl: `/employees/${priyaId}/edit` });

    expect(await screen.findByRole('header', { name: 'Edit Priya Sharma' })).toBeTruthy();
  });

  it('opens the profile page', async () => {
    await renderRouter('./src/app', { initialUrl: '/profile' });

    expect(await screen.findByRole('header', { name: 'My profile' })).toBeTruthy();
    expect(screen.getByText('neha.kapoor@company.com', { exact: false })).toBeTruthy();
  });

  it('signs out from the user menu and returns to the login screen', async () => {
    await renderRouter('./src/app', { initialUrl: '/dashboard' });

    await fireEvent.press(await screen.findByRole('button', { name: 'Open navigation menu' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('header', { name: 'Sign in' })).toBeTruthy();
    expect(mockStoredTokens).toBeNull();
  });
});
