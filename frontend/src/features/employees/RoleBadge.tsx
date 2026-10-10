import { getRoleName, roleLabels } from '../../auth/roles';
import { Badge } from '../../components/Badge';

type RoleBadgeProps = {
  roleId: number;
};

export function RoleBadge({ roleId }: RoleBadgeProps) {
  const roleName = getRoleName(roleId);
  return <Badge label={roleName === null ? 'Unknown role' : roleLabels[roleName]} tone="neutral" />;
}
