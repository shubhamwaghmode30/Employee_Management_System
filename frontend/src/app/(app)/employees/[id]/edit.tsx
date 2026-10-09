import { useLocalSearchParams, useRouter } from 'expo-router';

import { hasPermission } from '../../../../auth/role-permissions';
import { useSessionUser } from '../../../../auth/session-user-context';
import { StatusMessage } from '../../../../components/StatusMessage';
import { EditEmployee } from '../../../../features/employees/EditEmployee';

export default function EditEmployeeScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!hasPermission(user.role, 'EMPLOYEE_UPDATE')) {
    return (
      <StatusMessage
        title="You cannot edit employees"
        description="Ask an admin or HR manager if a record needs changing."
        actionLabel="Back to employee"
        onAction={() => router.navigate(`/employees/${id}`)}
      />
    );
  }

  return (
    <EditEmployee
      key={id}
      employeeId={id}
      onSaved={(employee) => router.replace(`/employees/${employee.id}`)}
      onCancel={() => router.navigate(`/employees/${id}`)}
    />
  );
}
