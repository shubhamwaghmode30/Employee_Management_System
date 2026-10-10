import { Badge } from '../../components/Badge';
import { employmentTypeLabels } from './employee-labels';
import type { EmploymentType } from './employee-schemas';

type EmploymentTypeBadgeProps = {
  employmentType: EmploymentType;
};

export function EmploymentTypeBadge({ employmentType }: EmploymentTypeBadgeProps) {
  return <Badge label={employmentTypeLabels[employmentType]} tone="neutral" />;
}
