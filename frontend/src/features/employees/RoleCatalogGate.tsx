import type { ReactNode } from 'react';

import { RoleCatalogProvider } from '../../auth/role-catalog-context';
import { StatusMessage } from '../../components/StatusMessage';
import { useEmployeeDataSource } from './employee-data-source-context';
import { useRoleCatalogLoader } from './use-role-catalog-loader';

type RoleCatalogGateProps = {
  children: ReactNode;
};

/** Renders its children once the roles have loaded from the backend. */
export function RoleCatalogGate({ children }: RoleCatalogGateProps) {
  const { state, reload } = useRoleCatalogLoader(useEmployeeDataSource());

  if (state.status === 'loading') {
    return <StatusMessage title="Loading…" isLoading />;
  }
  if (state.status === 'error') {
    return (
      <StatusMessage
        title="Roles could not be loaded"
        description={state.error.message}
        actionLabel="Try again"
        onAction={reload}
      />
    );
  }
  return <RoleCatalogProvider catalog={state.catalog}>{children}</RoleCatalogProvider>;
}
