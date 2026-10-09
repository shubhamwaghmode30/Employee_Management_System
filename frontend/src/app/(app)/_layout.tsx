import { Slot } from 'expo-router';

import { SessionUserProvider } from '../../auth/session-user-context';
import { AppShell } from '../../components/AppShell';
import { EmployeeDataSourceProvider } from '../../features/employees/employee-data-source-context';
import { createMockEmployeeDataSource } from '../../features/employees/mock-employee-data-source';
import type { SessionUser } from '../../types/session-user';

// Mock data until the employee API is merged. To switch to the real backend, replace this with
// createApiEmployeeDataSource(apiClient) from features/employees/api-employee-data-source.
const employeeDataSource = createMockEmployeeDataSource({ latencyMs: 400 });

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
      <EmployeeDataSourceProvider dataSource={employeeDataSource}>
        <AppShell user={previewUser} onLogout={handleLogout}>
          <Slot />
        </AppShell>
      </EmployeeDataSourceProvider>
    </SessionUserProvider>
  );
}
