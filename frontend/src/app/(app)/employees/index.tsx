import { useRouter } from 'expo-router';

import { EmployeeDirectory } from '../../../features/employees/EmployeeDirectory';

export default function EmployeesScreen() {
  const router = useRouter();

  return (
    <EmployeeDirectory
      onCreateEmployee={() => router.push('/employees/new')}
      onViewEmployee={(employee) => router.push(`/employees/${employee.id}`)}
      onEditEmployee={(employee) => router.push(`/employees/${employee.id}/edit`)}
    />
  );
}
