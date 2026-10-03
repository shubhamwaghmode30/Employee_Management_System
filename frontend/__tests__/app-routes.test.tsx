import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

describe('app routes', () => {
  it('redirects the root URL to the employees screen inside the app shell', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });

    expect(screen.getByRole('header', { name: 'Employees' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Employee Management System' })).toBeTruthy();
  });
});
