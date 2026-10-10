import type { Href } from 'expo-router';

export type NavigationItem = {
  label: string;
  path: Extract<Href, string>;
};

export const navigationItems: readonly NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Employees', path: '/employees' },
  { label: 'My profile', path: '/profile' },
];
