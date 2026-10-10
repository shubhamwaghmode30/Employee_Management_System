import { Badge } from '../../components/Badge';

type StatusBadgeProps = {
  isActive: boolean;
};

export function StatusBadge({ isActive }: StatusBadgeProps) {
  return <Badge label={isActive ? 'Active' : 'Inactive'} tone={isActive ? 'green' : 'neutral'} hasDot />;
}
