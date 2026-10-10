import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

export type NavigationItem = {
  label: string;
  path: Extract<Href, string>;
  icon: keyof typeof Ionicons.glyphMap;
};

export const navigationItems: readonly NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'grid-outline' },
  { label: 'Employees', path: '/employees', icon: 'people-outline' },
  { label: 'My profile', path: '/profile', icon: 'person-circle-outline' },
];
