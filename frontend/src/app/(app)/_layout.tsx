import { Slot } from 'expo-router';

import { SessionUserProvider } from '../../auth/session-user-context';
import { AppShell } from '../../components/AppShell';
import type { SessionUser } from '../../types/session-user';

// Preview identity for building screens before login exists. The auth session
// replaces this user and the logout handler when the login task is merged.
const previewUser: SessionUser = {
  fullName: 'Priya Sharma',
  email: 'priya.sharma@company.com',
  role: 'HR_MANAGER',
};

export default function AppLayout() {
  function handleLogout() {
    // Intentionally empty until the auth session provides sign-out.
  }

  return (
    <SessionUserProvider user={previewUser}>
      <AppShell user={previewUser} onLogout={handleLogout}>
        <Slot />
      </AppShell>
    </SessionUserProvider>
  );
}
