import { createContext, type ReactNode, useContext } from 'react';

import type { EmployeeDataSource } from './employee-data-source';

const EmployeeDataSourceContext = createContext<EmployeeDataSource | null>(null);

type EmployeeDataSourceProviderProps = {
  dataSource: EmployeeDataSource;
  children: ReactNode;
};

export function EmployeeDataSourceProvider({ dataSource, children }: EmployeeDataSourceProviderProps) {
  return (
    <EmployeeDataSourceContext.Provider value={dataSource}>{children}</EmployeeDataSourceContext.Provider>
  );
}

export function useEmployeeDataSource(): EmployeeDataSource {
  const dataSource = useContext(EmployeeDataSourceContext);
  if (dataSource === null) {
    throw new Error('useEmployeeDataSource must be used inside an EmployeeDataSourceProvider');
  }
  return dataSource;
}
