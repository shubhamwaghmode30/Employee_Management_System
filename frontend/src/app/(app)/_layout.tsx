import { Redirect, Slot } from 'expo-router';
import { useMemo } from 'react';

import { useAuth } from '../../auth/auth-session';
import { SessionUserProvider } from '../../auth/session-user-context';
import { AppShell } from '../../components/AppShell';
import { StatusMessage } from '../../components/StatusMessage';
import { createApiEmployeeDataSource } from '../../features/employees/api-employee-data-source';
import { EmployeeDataSourceProvider } from '../../features/employees/employee-data-source-context';
import { RoleCatalogGate } from '../../features/employees/RoleCatalogGate';

/** Route guard: everything under (app) needs a signed-in user. */
export default function AppLayout() {
  const { state, apiClient, signOut } = useAuth();
  const employeeDataSource = useMemo(() => createApiEmployeeDataSource(apiClient), [apiClient]);

  if (state.status === 'restoring') {
    return <StatusMessage title="Loading…" isLoading />;
  }
  if (state.status === 'signed_out') {
    return <Redirect href="/login" />;
  }

  return (
    <SessionUserProvider user={state.user}>
      <EmployeeDataSourceProvider dataSource={employeeDataSource}>
        <AppShell user={state.user} onLogout={() => void signOut()}>
          <RoleCatalogGate>
            <Slot />
          </RoleCatalogGate>
        </AppShell>
      </EmployeeDataSourceProvider>
    </SessionUserProvider>
  );
}
