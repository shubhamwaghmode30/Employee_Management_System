import { createMockEmployeeDataSource } from '../../../features/employees/mock-employee-data-source';
import { EmployeeDirectory } from '../../../features/employees/EmployeeDirectory';

// Mock data until the employee API is merged. To switch to the real backend, replace this with
// createApiEmployeeDataSource(apiClient) from features/employees/api-employee-data-source.
const employeeDataSource = createMockEmployeeDataSource({ latencyMs: 400 });

export default function EmployeesScreen() {
  // Create, edit and delete flows arrive with the employee form and delete dialog (task 3c).
  function handleCreateEmployee() {}
  function handleEditEmployee() {}
  function handleDeleteEmployee() {}

  return (
    <EmployeeDirectory
      dataSource={employeeDataSource}
      onCreateEmployee={handleCreateEmployee}
      onEditEmployee={handleEditEmployee}
      onDeleteEmployee={handleDeleteEmployee}
    />
  );
}
