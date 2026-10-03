import type { Href } from 'expo-router';

export type NavigationItem = {
  label: string;
  path: Extract<Href, string>;
};

export const navigationItems: readonly NavigationItem[] = [
  { label: 'Employees', path: '/employees' },
];
