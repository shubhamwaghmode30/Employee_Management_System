import { StatusMessage } from '../../components/StatusMessage';
import { useEmployeeDataSource } from './employee-data-source-context';
import type { Employee } from './employee-schemas';
import { EmployeeForm } from './EmployeeForm';
import { useEmployeeDetails } from './use-employee-details';

type EditEmployeeProps = {
  employeeId: string;
  onSaved: (employee: Employee) => void;
  onCancel: () => void;
};

/** Loads the employee, then shows the form pre-filled with their details. */
export function EditEmployee({ employeeId, onSaved, onCancel }: EditEmployeeProps) {
  const details = useEmployeeDetails(useEmployeeDataSource(), employeeId);

  if (details.state.status === 'loading') {
    return <StatusMessage title="Loading employee…" isLoading />;
  }
  if (details.state.status === 'error') {
    return details.state.error.kind === 'not_found' ? (
      <StatusMessage
        title="Employee not found"
        description="They may have been deleted, or the link is wrong."
        actionLabel="Back to employees"
        onAction={onCancel}
      />
    ) : (
      <StatusMessage
        title="Employee could not be loaded"
        description={details.state.error.message}
        actionLabel="Try again"
        onAction={details.reload}
      />
    );
  }

  return (
    <EmployeeForm
      key={details.state.employee.id}
      mode={{ kind: 'edit', employee: details.state.employee }}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}
