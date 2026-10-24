import { createContext, type ReactNode, useContext } from 'react';

import type { RoleCatalog } from './role-catalog';

const RoleCatalogContext = createContext<RoleCatalog | null>(null);

type RoleCatalogProviderProps = {
  catalog: RoleCatalog;
  children: ReactNode;
};

export function RoleCatalogProvider({ catalog, children }: RoleCatalogProviderProps) {
  return <RoleCatalogContext.Provider value={catalog}>{children}</RoleCatalogContext.Provider>;
}

export function useRoleCatalog(): RoleCatalog {
  const catalog = useContext(RoleCatalogContext);
  if (catalog === null) {
    throw new Error('useRoleCatalog must be used inside a RoleCatalogProvider');
  }
  return catalog;
}
