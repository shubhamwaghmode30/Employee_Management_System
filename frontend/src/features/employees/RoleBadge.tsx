import { useRoleCatalog } from '../../auth/role-catalog-context';
import { roleLabels } from '../../auth/roles';
import { Badge } from '../../components/Badge';

type RoleBadgeProps = {
  roleId: number;
};

export function RoleBadge({ roleId }: RoleBadgeProps) {
  const roleName = useRoleCatalog().getRoleName(roleId);
  return <Badge label={roleName === null ? 'Unknown role' : roleLabels[roleName]} tone="neutral" />;
}
