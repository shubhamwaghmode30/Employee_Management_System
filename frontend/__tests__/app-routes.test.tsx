import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import mockEmployees from '../src/features/employees/mock-employees.json';

const priyaId = mockEmployees[0]?.id ?? '';

describe('app routes', () => {
  it('redirects the root URL to the employees screen inside the app shell', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });

    expect(await screen.findByRole('header', { name: 'Employees' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Employee Management System' })).toBeTruthy();
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
});
