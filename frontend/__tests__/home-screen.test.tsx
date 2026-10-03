import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../src/app/index';

describe('HomeScreen', () => {
  it('renders the application title as a header', async () => {
    await render(<HomeScreen />);

    expect(
      screen.getByRole('header', { name: 'Employee Management System' }),
    ).toBeTruthy();
  });
});
