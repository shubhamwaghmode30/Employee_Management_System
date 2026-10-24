import { useEffect, useState } from 'react';

import type { ApiError } from '../../api/api-error';
import { createRoleCatalog, type RoleCatalog } from '../../auth/role-catalog';
import type { EmployeeDataSource } from './employee-data-source';

export type RoleCatalogState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; catalog: RoleCatalog };

/** Loads the roles once per data source, so role ids never have to be hard-coded. */
export function useRoleCatalogLoader(dataSource: EmployeeDataSource) {
  const [state, setState] = useState<RoleCatalogState>({ status: 'loading' });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;
    setState({ status: 'loading' });
    void dataSource.listRoles().then((result) => {
      if (!isCurrentRequest) {
        return;
      }
      setState(
        result.ok
          ? { status: 'success', catalog: createRoleCatalog(result.value) }
          : { status: 'error', error: result.error },
      );
    });
    return () => {
      isCurrentRequest = false;
    };
  }, [dataSource, reloadCount]);

  return {
    state,
    reload() {
      setReloadCount((count) => count + 1);
    },
  };
}
