import { getRoleName, roleLabels } from '../../auth/roles';
import { Badge, type BadgeTone } from '../../components/Badge';
import type { RoleName } from '../../types/role-name';

type RoleBadgeProps = {
  roleId: number;
};

const roleTones: Record<RoleName, BadgeTone> = {
  ADMIN: 'violet',
  HR_MANAGER: 'blue',
  EMPLOYEE: 'neutral',
};

export function RoleBadge({ roleId }: RoleBadgeProps) {
  const roleName = getRoleName(roleId);
  return roleName === null ? (
    <Badge label="Unknown role" tone="neutral" />
  ) : (
    <Badge label={roleLabels[roleName]} tone={roleTones[roleName]} />
  );
}
