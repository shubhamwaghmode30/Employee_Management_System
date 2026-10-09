import { useRouter } from 'expo-router';

import { hasPermission } from '../../../auth/role-permissions';
import { useSessionUser } from '../../../auth/session-user-context';
import { StatusMessage } from '../../../components/StatusMessage';
import { EmployeeForm } from '../../../features/employees/EmployeeForm';

export default function NewEmployeeScreen() {
  const router = useRouter();
  const user = useSessionUser();

  if (!hasPermission(user.role, 'EMPLOYEE_CREATE')) {
    return (
      <StatusMessage
        title="You cannot add employees"
        description="Ask an admin or HR manager if you need someone added."
        actionLabel="Back to employees"
        onAction={() => router.navigate('/employees')}
      />
    );
  }

  return (
    <EmployeeForm
      mode={{ kind: 'create' }}
      onSaved={(employee) => router.replace(`/employees/${employee.id}`)}
      onCancel={() => router.navigate('/employees')}
    />
  );
}
