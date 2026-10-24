import { useRouter } from 'expo-router';

import { hasPermission } from '../../../auth/permissions';
import { useSessionUser } from '../../../auth/session-user-context';
import { StatusMessage } from '../../../components/StatusMessage';
import { DeletedEmployees } from '../../../features/employees/DeletedEmployees';

export default function DeletedEmployeesScreen() {
  const router = useRouter();
  const user = useSessionUser();

  if (!hasPermission(user, 'EMPLOYEE_RESTORE')) {
    return (
      <StatusMessage
        title="You cannot view deleted employees"
        description="Ask an admin if a deleted record needs restoring."
        actionLabel="Back to employees"
        onAction={() => router.navigate('/employees')}
      />
    );
  }

  return (
    <DeletedEmployees
      onBack={() => router.navigate('/employees')}
      onRestored={(employee) => router.push(`/employees/${employee.id}`)}
    />
  );
}
