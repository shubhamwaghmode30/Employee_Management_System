import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmployeeDetails } from '../../../../features/employees/EmployeeDetails';

export default function EmployeeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <EmployeeDetails
      key={id}
      employeeId={id}
      onBack={() => router.navigate('/employees')}
      onEdit={(employee) => router.push(`/employees/${employee.id}/edit`)}
      onDeleted={() => router.replace('/employees')}
    />
  );
}
